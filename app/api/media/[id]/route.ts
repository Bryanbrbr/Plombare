import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Proxy authentifié pour les médias Twilio.
 *
 * Les URL média Twilio nécessitent une auth basic → impossible de les
 * mettre directement dans un <img>. Cette route :
 *  1. Vérifie que l'utilisateur est connecté
 *  2. Récupère le message via RLS (l'artisan ne voit que SES messages)
 *  3. Télécharge le média chez Twilio avec les credentials serveur
 *  4. Le renvoie au navigateur
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // RLS garantit que ce SELECT ne renvoie le message que s'il appartient
  // à une conversation d'un artisan rattaché à cet utilisateur.
  const { data: message } = await supabase
    .from("messages")
    .select("media_url")
    .eq("id", params.id)
    .maybeSingle<{ media_url: string | null }>();

  if (!message?.media_url) {
    return new NextResponse("Not found", { status: 404 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const res = await fetch(message.media_url, {
    headers: { Authorization: `Basic ${auth}` },
  });

  if (!res.ok) {
    return new NextResponse("Média indisponible", { status: 502 });
  }

  const contentType =
    res.headers.get("content-type") ?? "application/octet-stream";
  const body = await res.arrayBuffer();

  return new NextResponse(body, {
    headers: {
      "content-type": contentType,
      // Cache privé navigateur : évite de re-télécharger à chaque vue
      "cache-control": "private, max-age=86400",
    },
  });
}
