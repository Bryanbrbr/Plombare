"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsApp } from "@/lib/twilio";

type ActionResult = { ok: true } | { error: string };

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

  // 1. Auth + vérif que la conv appartient bien à cet artisan (RLS)
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

  // 2. Envoi WhatsApp — texte brut, aucun préfixe
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

  // 3. Enregistrer le message + mettre l'IA en pause
  const db = createAdminClient();
  await db.from("messages").insert({
    conversation_id: conversationId,
    role: "artisan",
    body: text,
  });
  await db
    .from("conversations")
    .update({ status: "paused", last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  revalidatePath(`/dashboard/conversations/${conversationId}`);
  return { ok: true };
}

/**
 * Redonne la main à l'IA : la conversation repasse en "open",
 * l'IA recommence à répondre automatiquement aux messages du client.
 */
export async function resumeAI(conversationId: string): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  // RLS : ne renvoie la conv que si elle appartient à cet artisan
  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .maybeSingle<{ id: string }>();
  if (!conv) return { error: "Conversation introuvable." };

  const db = createAdminClient();
  await db
    .from("conversations")
    .update({ status: "open" })
    .eq("id", conversationId);

  revalidatePath(`/dashboard/conversations/${conversationId}`);
  return { ok: true };
}
