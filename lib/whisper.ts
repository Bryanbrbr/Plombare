/**
 * Transcription audio via OpenAI Whisper API.
 * On utilise fetch natif (Node 18+) pour éviter d'ajouter le SDK OpenAI.
 *
 * Coût Whisper : ~$0.006 / minute audio.
 * Format Twilio WhatsApp voice : généralement audio/ogg (codec OPUS) —
 * Whisper accepte nativement (m4a, mp3, mp4, mpeg, mpga, wav, webm, ogg).
 */

const OPENAI_API = "https://api.openai.com/v1/audio/transcriptions";

/** Mappe un MIME type vers une extension fichier pour Whisper. */
function extensionFor(mimeType: string): string {
  const m = mimeType.toLowerCase();
  if (m.includes("ogg")) return "ogg";
  if (m.includes("mpeg") || m.includes("mp3") || m.includes("mpga")) return "mp3";
  if (m.includes("mp4") || m.includes("m4a")) return "m4a";
  if (m.includes("wav")) return "wav";
  if (m.includes("webm")) return "webm";
  return "ogg"; // défaut raisonnable pour WhatsApp
}

/**
 * Transcrit un fichier audio en texte (français par défaut).
 * Lève une exception si l'API échoue — le webhook attrape et fait fallback.
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string,
  options: { language?: string } = {}
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY manquante");
  }

  const ext = extensionFor(mimeType);
  // Crée un Uint8Array sur un ArrayBuffer frais (non partagé) — requis pour
  // satisfaire le typage strict TS 5.7 de Blob (qui veut un BlobPart
  // adossé à un ArrayBuffer, pas ArrayBufferLike/SharedArrayBuffer).
  const bytes = new Uint8Array(audioBuffer.byteLength);
  bytes.set(audioBuffer);
  const blob = new Blob([bytes], { type: mimeType });

  const form = new FormData();
  form.append("file", blob, `audio.${ext}`);
  form.append("model", "whisper-1");
  form.append("language", options.language ?? "fr");
  // response_format default = json → { text: "..." }

  const res = await fetch(OPENAI_API, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Whisper HTTP ${res.status} : ${errText.slice(0, 200)}`);
  }

  const json = (await res.json()) as { text?: string };
  const text = (json.text ?? "").trim();
  if (!text) throw new Error("Whisper a renvoyé une transcription vide");
  return text;
}
