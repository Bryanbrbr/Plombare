import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendWhatsApp,
  verifyTwilioSignature,
  fetchTwilioMedia,
} from "@/lib/twilio";
import { analyze } from "@/lib/claude";
import { transcribeAudio } from "@/lib/whisper";
import type { Conversation } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Mots-clés client → mise en pause de l'IA
const PAUSE_REGEX = /\b(humain|parler.*plombier|parle.*plombier|stop)\b/i;
// Mot-clé artisan (depuis son notify_number) → relance l'IA sur la dernière conv paused
const RESUME_REGEX = /^\s*reprendre\s*$/i;

// Nb de messages d'historique passés à Claude (inclut le nouveau)
const HISTORY_LIMIT = 12;

/** Réponse XML vide pour Twilio (200 OK). */
function twimlOk(): NextResponse {
  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response/>', {
    status: 200,
    headers: { "content-type": "text/xml" },
  });
}

export async function POST(req: NextRequest) {
  // ─── 1. Parse form-encoded body ──────────────────────────
  const raw = await req.text();
  const params = Object.fromEntries(new URLSearchParams(raw)) as Record<string, string>;

  // ─── 2. Vérification signature Twilio ────────────────────
  // En dev (ngrok / local), on saute. En prod, on bloque toute requête non signée.
  if (process.env.NODE_ENV === "production") {
    const signature = req.headers.get("x-twilio-signature") ?? "";
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/twilio`;
    if (!verifyTwilioSignature({ url, params, signature })) {
      console.warn("[webhook] signature Twilio invalide");
      return new NextResponse("forbidden", { status: 403 });
    }
  }

  // ─── 3. Extraction champs Twilio ─────────────────────────
  const from = params.From;                 // expéditeur (client OU artisan)
  const to = params.To;                     // numéro Twilio business
  let body = (params.Body ?? "").trim();    // mutable : enrichi par la transcription vocale
  const profileName = params.ProfileName;   // nom WhatsApp éventuel
  const numMedia = parseInt(params.NumMedia ?? "0", 10);
  const mediaUrls: string[] = [];
  const mediaTypes: string[] = [];          // MIME type de chaque média (image/jpeg, audio/ogg…)
  for (let i = 0; i < numMedia; i++) {
    const u = params[`MediaUrl${i}`];
    const t = params[`MediaContentType${i}`];
    if (u) {
      mediaUrls.push(u);
      mediaTypes.push(t ?? "");
    }
  }

  // Variables remplies par le tri audio/image (étape 6.5 ci-dessous)
  let storedMediaUrl: string | null = null;
  const imageMediaUrls: string[] = [];

  if (!from || !to) {
    console.warn("[webhook] champs From/To manquants");
    return twimlOk();
  }

  const db = createAdminClient();

  // ─── 4. Trouver l'artisan via To ─────────────────────────
  const { data: artisan } = await db
    .from("artisans")
    .select("*")
    .eq("twilio_number", to)
    .single();

  if (!artisan) {
    console.warn("[webhook] artisan inconnu pour To:", to);
    return twimlOk();
  }

  // ─── 5. Commande artisan : "reprendre" depuis son notify_number ──
  if (from === artisan.notify_number) {
    if (RESUME_REGEX.test(body)) {
      const { data: pausedConv } = await db
        .from("conversations")
        .select("id, client_number")
        .eq("artisan_id", artisan.id)
        .eq("status", "paused")
        .order("last_message_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pausedConv) {
        await db
          .from("conversations")
          .update({ status: "open" })
          .eq("id", pausedConv.id);

        await sendWhatsApp({
          from: artisan.twilio_number,
          to: artisan.notify_number,
          body: `✅ IA réactivée pour ${pausedConv.client_number.replace("whatsapp:", "")}`,
        });
      } else {
        await sendWhatsApp({
          from: artisan.twilio_number,
          to: artisan.notify_number,
          body: "ℹ️ Aucune conversation en pause.",
        });
      }
    }
    // Toute autre intervention de l'artisan sur sa propre ligne biz : on ignore.
    return twimlOk();
  }

  // ─── 6. Upsert conversation (côté client) ─────────────────
  const nowIso = new Date().toISOString();
  const { data: conv, error: convErr } = await db
    .from("conversations")
    .upsert(
      {
        artisan_id: artisan.id,
        client_number: from,
        last_message_at: nowIso,
      },
      { onConflict: "artisan_id,client_number" }
    )
    .select("*")
    .single<Conversation>();

  if (convErr || !conv) {
    console.error("[webhook] upsert conversation échoué", convErr);
    return twimlOk();
  }

  // ─── 6.5. Tri des médias : audio → transcription, image → vision Claude ──
  if (mediaUrls.length > 0) {
    const firstType = (mediaTypes[0] ?? "").toLowerCase();

    if (firstType.startsWith("audio/")) {
      // Message vocal → Whisper. On stocke uniquement la transcription
      // (pas le fichier audio — la version texte suffit).
      try {
        const audio = await fetchTwilioMedia(mediaUrls[0]);
        const audioBuf = Buffer.from(audio.data, "base64");
        const transcription = await transcribeAudio(audioBuf, audio.media_type);
        body = body
          ? `${body}\n\n🎙️ ${transcription}`
          : `🎙️ ${transcription}`;
      } catch (err) {
        console.error("[webhook] transcription Whisper échouée", err);
        body = body || "🎙️ (message vocal — transcription indisponible)";
      }
    } else {
      // Image / autre média visuel → on garde l'URL pour l'affichage
      // dashboard ET on la passe à Claude pour qu'il analyse l'image.
      storedMediaUrl = mediaUrls[0];
      for (let i = 0; i < mediaUrls.length; i++) {
        if ((mediaTypes[i] ?? "").toLowerCase().startsWith("image/")) {
          imageMediaUrls.push(mediaUrls[i]);
        }
      }
    }
  }

  // ─── 7. Insert message client ─────────────────────────────
  await db.from("messages").insert({
    conversation_id: conv.id,
    role: "client",
    body: body || null,
    media_url: storedMediaUrl,
  });

  // ─── 8. Détection mot-clé pause ──────────────────────────
  if (PAUSE_REGEX.test(body)) {
    await db
      .from("conversations")
      .update({ status: "paused" })
      .eq("id", conv.id);

    // Notif artisan
    await sendWhatsApp({
      from: artisan.twilio_number,
      to: artisan.notify_number,
      body: `⏸️ Pause demandée par un client.
Numéro : ${from.replace("whatsapp:", "")}
Résumé : ${conv.summary ?? "n/a"}

Réponds "reprendre" pour relancer l'IA.`,
    });

    // Acquittement client
    await sendWhatsApp({
      from: artisan.twilio_number,
      to: from,
      body: `Bien noté, je préviens ${artisan.name} qui vous recontacte personnellement très vite. Bonne journée.`,
    });

    return twimlOk();
  }

  // ─── 9. Conv en pause → l'artisan gère cette conversation manuellement ──
  // On n'invoque pas l'IA, MAIS on prévient l'artisan que le client a
  // écrit — sinon il raterait les messages d'une conv qu'il a reprise.
  if (conv.status === "paused") {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const link = appUrl
      ? `${appUrl}/dashboard/conversations/${conv.id}`
      : conv.id;
    const clientLabel = conv.client_name ?? from.replace("whatsapp:", "");
    const preview = body
      ? `"${body.length > 200 ? body.slice(0, 200) + "…" : body}"`
      : storedMediaUrl
      ? "📷 (photo)"
      : "(message vide)";

    try {
      await sendWhatsApp({
        from: artisan.twilio_number,
        to: artisan.notify_number,
        body: `💬 ${clientLabel} vous a répondu :
${preview}

${link}`,
      });
    } catch (err) {
      // Une notif ratée ne doit jamais faire échouer le webhook :
      // le message client est déjà enregistré en base (étape 7).
      console.error("[webhook] notif conv en pause échouée", err);
    }

    return twimlOk();
  }

  // ─── 10. Charger historique (chronologique, sans le dernier msg = celui qu'on vient d'insérer) ──
  const { data: historyRows } = await db
    .from("messages")
    .select("role, body, media_url")
    .eq("conversation_id", conv.id)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  const history = (historyRows ?? []).reverse().slice(0, -1);

  // ─── 11. Appel Claude ─────────────────────────────────────
  let qualification;
  try {
    qualification = await analyze({
      artisanName: artisan.name,
      history,
      newMessage: { body, mediaUrls: imageMediaUrls },
    });
  } catch (err) {
    console.error("[webhook] Claude a échoué", err);
    // Fallback : on ne laisse pas le client sans réponse
    await sendWhatsApp({
      from: artisan.twilio_number,
      to: from,
      body: `Merci pour votre message, ${artisan.name} vous recontacte rapidement.`,
    });
    return twimlOk();
  }

  // ─── 12. MAJ conversation avec la qualification ──────────
  await db
    .from("conversations")
    .update({
      problem_type: qualification.problem_type,
      urgency: qualification.urgency,
      needs_appointment: qualification.needs_appointment,
      summary: qualification.summary,
      client_name:
        qualification.client_name ?? conv.client_name ?? profileName ?? null,
      status: "open",
    })
    .eq("id", conv.id);

  // ─── 13. Insert message IA ───────────────────────────────
  await db.from("messages").insert({
    conversation_id: conv.id,
    role: "ai",
    body: qualification.reply_to_client,
  });

  // ─── 14. Envoi réponse au client ─────────────────────────
  await sendWhatsApp({
    from: artisan.twilio_number,
    to: from,
    body: qualification.reply_to_client,
  });

  // ─── 15. Notification urgente artisan ────────────────────
  if (qualification.urgency >= 4 || qualification.needs_appointment) {
    const flag = qualification.urgency >= 4 ? "🔔 URGENT" : "📅 Demande RDV";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const link = appUrl
      ? `${appUrl}/dashboard/conversations/${conv.id}`
      : conv.id;

    await sendWhatsApp({
      from: artisan.twilio_number,
      to: artisan.notify_number,
      body: `${flag} — urgence ${qualification.urgency}/5
Client : ${qualification.client_name ?? from.replace("whatsapp:", "")}
Type : ${qualification.problem_type}
${qualification.summary}

${link}`,
    });
  }

  return twimlOk();
}
