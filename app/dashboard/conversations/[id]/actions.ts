"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsApp } from "@/lib/twilio";

type ActionResult = { ok: true } | { error: string };

/**
 * Vérifie que l'utilisateur connecté est bien propriétaire d'une conv
 * (via RLS). Renvoie son id ou null.
 */
async function assertOwnsConversation(conversationId: string): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // RLS : ce SELECT ne renvoie la conv que si elle appartient à un artisan
  // rattaché à cet utilisateur.
  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .maybeSingle<{ id: string }>();
  return conv?.id ?? null;
}

/**
 * L'artisan répond lui-même au client depuis le dashboard.
 * Le message part en texte BRUT vers le client (aucun préfixe).
 * La conversation passe en "paused" → l'IA arrête de répondre.
 */
export async function sendReply(
  conversationId: string,
  body: string
): Promise<ActionResult> {
  const text = body.trim();
  if (!text) return { error: "Message vide." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { data: conv } = await supabase
    .from("conversations")
    .select("id, client_number, artisan_id")
    .eq("id", conversationId)
    .maybeSingle<{ id: string; client_number: string; artisan_id: string }>();
  if (!conv) return { error: "Conversation introuvable." };

  const { data: artisan } = await supabase
    .from("artisans")
    .select("twilio_number")
    .eq("id", conv.artisan_id)
    .maybeSingle<{ twilio_number: string }>();
  if (!artisan) return { error: "Artisan introuvable." };

  // Vérif fenêtre WhatsApp 24h : on ne peut envoyer un message libre
  // que dans les 24h après le dernier message du client.
  const { data: lastClientMsg } = await supabase
    .from("messages")
    .select("created_at")
    .eq("conversation_id", conversationId)
    .eq("role", "client")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ created_at: string }>();

  if (lastClientMsg) {
    const ageMs = Date.now() - new Date(lastClientMsg.created_at).getTime();
    if (ageMs > 24 * 60 * 60 * 1000) {
      return {
        error:
          "Le client n'a pas écrit depuis plus de 24h. WhatsApp interdit de lui envoyer un message libre — rappelle-le par téléphone (bouton Appeler).",
      };
    }
  }

  // Envoi WhatsApp — texte brut, aucun préfixe
  try {
    await sendWhatsApp({
      from: artisan.twilio_number,
      to: conv.client_number,
      body: text,
    });
  } catch (err) {
    console.error("[sendReply] échec Twilio", err);
    return {
      error:
        "Impossible d'envoyer. Le client n'a peut-être pas écrit depuis +24h (limite WhatsApp).",
    };
  }

  // Enregistrer le message + mettre l'IA en pause + marquer comme vu
  const nowIso = new Date().toISOString();
  const db = createAdminClient();
  await db.from("messages").insert({
    conversation_id: conversationId,
    role: "artisan",
    body: text,
  });
  await db
    .from("conversations")
    .update({
      status: "paused",
      last_message_at: nowIso,
      last_seen_at: nowIso, // l'artisan vient d'agir, donc forcément à jour
    })
    .eq("id", conversationId);

  revalidatePath(`/dashboard/conversations/${conversationId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * Redonne la main à l'IA : la conversation repasse en "open",
 * l'IA recommence à répondre automatiquement aux messages du client.
 */
export async function resumeAI(conversationId: string): Promise<ActionResult> {
  const id = await assertOwnsConversation(conversationId);
  if (!id) return { error: "Non autorisé." };

  const db = createAdminClient();
  await db
    .from("conversations")
    .update({
      status: "open",
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath(`/dashboard/conversations/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * Marque une conversation comme lue (l'artisan vient de l'ouvrir).
 * Appelé automatiquement par <MarkSeen /> au montage de la page détail.
 * Sans erreur si déjà à jour.
 */
export async function markSeen(conversationId: string): Promise<ActionResult> {
  const id = await assertOwnsConversation(conversationId);
  if (!id) return { error: "Non autorisé." };

  const db = createAdminClient();
  await db
    .from("conversations")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", id);

  // Pas de revalidatePath ici — l'update est silencieux, la page
  // courante n'a pas besoin de re-render pour ça.
  return { ok: true };
}

/**
 * Archive une conversation (status = 'closed'). Disparaît de la liste
 * principale, accessible via /dashboard?archive=1.
 * Un nouveau message client la rouvrira automatiquement (logique webhook).
 */
export async function archiveConversation(
  conversationId: string
): Promise<ActionResult> {
  const id = await assertOwnsConversation(conversationId);
  if (!id) return { error: "Non autorisé." };

  const db = createAdminClient();
  await db
    .from("conversations")
    .update({
      status: "closed",
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath(`/dashboard/conversations/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * Rouvre une conversation archivée (status = 'open').
 */
export async function reopenConversation(
  conversationId: string
): Promise<ActionResult> {
  const id = await assertOwnsConversation(conversationId);
  if (!id) return { error: "Non autorisé." };

  const db = createAdminClient();
  await db
    .from("conversations")
    .update({
      status: "open",
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath(`/dashboard/conversations/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
