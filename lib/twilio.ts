import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;

const client = twilio(accountSid, authToken);

/**
 * Envoie un message WhatsApp.
 * `from` doit être le numéro Twilio de l'artisan (multi-tenant via DB).
 * `to` et `from` doivent être préfixés par "whatsapp:" (ex: "whatsapp:+33...").
 */
export async function sendWhatsApp(opts: {
  from: string;
  to: string;
  body: string;
}) {
  return client.messages.create({
    from: opts.from,
    to: opts.to,
    body: opts.body,
  });
}

/**
 * Vérifie que la requête vient bien de Twilio.
 * `url` doit être l'URL publique exacte que Twilio a appelée (https://).
 */
export function verifyTwilioSignature(opts: {
  url: string;
  params: Record<string, string>;
  signature: string;
}): boolean {
  return twilio.validateRequest(authToken, opts.signature, opts.url, opts.params);
}

/**
 * Télécharge un média Twilio (image, audio…) avec l'auth basic du compte
 * et renvoie son contenu en base64 + son media_type.
 * Utilisé pour passer une image à Claude.
 */
export async function fetchTwilioMedia(
  url: string
): Promise<{ media_type: string; data: string }> {
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const res = await fetch(url, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) {
    throw new Error(`Twilio media fetch failed: ${res.status} ${res.statusText}`);
  }
  const media_type = res.headers.get("content-type") ?? "image/jpeg";
  const buf = Buffer.from(await res.arrayBuffer());
  return { media_type, data: buf.toString("base64") };
}
