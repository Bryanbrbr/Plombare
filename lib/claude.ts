import Anthropic from "@anthropic-ai/sdk";
import { fetchTwilioMedia } from "./twilio";
import type { Message, Qualification } from "./types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `Tu es la secrétaire virtuelle de {ARTISAN}, un plombier indépendant en France.

Ton rôle à chaque message WhatsApp d'un client :
- Réponds en français, ton chaleureux mais bref (2-4 phrases max, jamais plus).
- Comprends le problème (fuite, bouché, chauffe-eau, WC, robinet, gaz, etc.).
- Si une photo serait vraiment utile (fuite visible, pièce cassée, raccord, dégât) et qu'il n'y en a pas encore : demande-la gentiment.
- Si le client donne son prénom/nom ou son adresse, note-le.
- Évalue l'urgence sur 1-5 :
  • 5 = fuite active non maîtrisée, plus d'eau du tout, odeur de gaz, dégât en cours
  • 4 = WC unique HS, chauffe-eau HS en hiver, fuite contenue
  • 3 = problème gênant mais pas critique (robinet qui goutte fort)
  • 2 = demande planifiée (installation, devis)
  • 1 = simple renseignement
- Détermine si un rendez-vous physique est nécessaire (presque toujours oui, sauf info pure).
- Rédige un résumé court (1 phrase) à destination du plombier.
- Si urgence ≥ 4, dis au client que tu préviens immédiatement l'artisan.
- Ne donne JAMAIS de tarif, ne promets PAS de créneau précis. Dis "l'artisan vous recontacte rapidement".

Tu DOIS appeler l'outil qualify_request à chaque message. Aucune réponse texte directe.`;

const QUALIFY_TOOL: Anthropic.Tool = {
  name: "qualify_request",
  description: "Qualify the plumbing request and craft the next WhatsApp reply.",
  input_schema: {
    type: "object",
    properties: {
      problem_type: {
        type: "string",
        description:
          "Catégorie courte en français: fuite, bouché, chauffe-eau, WC, robinet, gaz, autre, info",
      },
      urgency: {
        type: "integer",
        minimum: 1,
        maximum: 5,
        description: "Urgence de 1 (info) à 5 (critique en cours)",
      },
      needs_appointment: {
        type: "boolean",
        description: "Vrai si un rendez-vous physique est nécessaire",
      },
      client_name: {
        type: ["string", "null"],
        description: "Prénom ou nom du client si mentionné, sinon null",
      },
      summary: {
        type: "string",
        description:
          "Résumé ULTRA court (5-8 mots max), juste le problème nu, sans contexte ni urgence. Exemples : 'Fuite sous évier cuisine', 'WC bouché', 'Plus d'eau chaude', 'Robinet salle de bain qui goutte', 'Devis remplacement chauffe-eau'. Pas de verbe conjugué long, pas de 'le client a une...', juste le pb.",
      },
      reply_to_client: {
        type: "string",
        description: "Message WhatsApp à envoyer au client. Français, 2-4 phrases max.",
      },
    },
    required: [
      "problem_type",
      "urgency",
      "needs_appointment",
      "summary",
      "reply_to_client",
    ],
  },
};

type HistoryMessage = Pick<Message, "role" | "body" | "media_url">;

type MessageContent = Anthropic.MessageParam["content"];

/**
 * Construit l'historique au format Claude.
 * - client → user
 * - ai / artisan → assistant
 * - Fusionne les messages consécutifs de même rôle (Claude exige une alternance).
 * - On n'embarque pas les anciennes images (coût) : on les remplace par un marqueur texte.
 */
function buildHistory(history: HistoryMessage[]): Anthropic.MessageParam[] {
  const messages: Anthropic.MessageParam[] = [];

  for (const m of history) {
    const role: "user" | "assistant" = m.role === "client" ? "user" : "assistant";

    const parts: string[] = [];
    if (m.body) parts.push(m.body);
    if (m.media_url && m.role === "client") parts.push("[photo envoyée précédemment]");
    if (parts.length === 0) continue;

    const text = parts.join("\n");
    const last = messages[messages.length - 1];

    if (last && last.role === role && typeof last.content === "string") {
      last.content = `${last.content}\n${text}`;
    } else {
      messages.push({ role, content: text });
    }
  }

  return messages;
}

/**
 * Appelle Claude pour qualifier le nouveau message + générer la réponse.
 * Les images du nouveau message sont téléchargées depuis Twilio
 * et passées en base64 (les URL Twilio nécessitent une auth basic).
 */
export async function analyze(opts: {
  artisanName: string;
  history: HistoryMessage[];
  newMessage: { body: string; mediaUrls: string[] };
  /**
   * true si c'est la TOUTE PREMIÈRE réponse de l'IA dans cette conversation.
   * Active la mention RGPD (obligatoire en France/UE depuis l'AI Act).
   */
  isFirstReply: boolean;
}): Promise<Qualification> {
  const messages = buildHistory(opts.history);

  // Construire le nouveau message client (texte + images)
  const newContent: Exclude<MessageContent, string> = [];

  for (const url of opts.newMessage.mediaUrls) {
    try {
      const { media_type, data } = await fetchTwilioMedia(url);
      if (media_type.startsWith("image/")) {
        newContent.push({
          type: "image",
          source: {
            type: "base64",
            media_type: media_type as
              | "image/jpeg"
              | "image/png"
              | "image/gif"
              | "image/webp",
            data,
          },
        });
      }
    } catch (err) {
      console.error("[claude] image fetch failed", url, err);
    }
  }

  if (opts.newMessage.body) {
    newContent.push({ type: "text", text: opts.newMessage.body });
  }

  if (newContent.length === 0) {
    newContent.push({ type: "text", text: "(message vide)" });
  }

  // Fusion si le dernier message d'historique est aussi user
  const last = messages[messages.length - 1];
  if (last && last.role === "user") {
    const lastContent = Array.isArray(last.content)
      ? last.content
      : [{ type: "text" as const, text: last.content }];
    last.content = [...lastContent, ...newContent];
  } else {
    messages.push({ role: "user", content: newContent });
  }

  const systemBase = SYSTEM_PROMPT.replace("{ARTISAN}", opts.artisanName);
  // Mention RGPD : forcée UNIQUEMENT pour la 1re réponse de la conversation.
  // Garantit la transparence sur le fait que c'est une IA (AI Act 2026, RGPD).
  const system = opts.isFirstReply
    ? `${systemBase}\n\n⚠️ MENTION LÉGALE — c'est ta TOUTE première réponse à ce client dans cette conversation. Tu DOIS commencer ton message par cette phrase exacte, sans rien la modifier : "Bonjour, je suis l'assistant automatique de ${opts.artisanName}." Puis va à la ligne et enchaîne naturellement ta réponse normale (empathie, conseils, demande de photo si pertinent…). Cette mention est non négociable.`
    : systemBase;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system,
    tools: [QUALIFY_TOOL],
    tool_choice: { type: "tool", name: "qualify_request" },
    messages,
  });

  const toolBlock = response.content.find((b) => b.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("Claude n'a pas appelé qualify_request");
  }
  return toolBlock.input as Qualification;
}
