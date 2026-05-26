import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPhone, formatTime, parisDayKey } from "@/lib/format";
import type { Conversation, Message } from "@/lib/types";
import { ReplyBox } from "./ReplyBox";
import { MarkSeen } from "./MarkSeen";
import { ArchiveButton } from "./ArchiveButton";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";

export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: conv } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", params.id)
    .maybeSingle<Conversation>();

  if (!conv) notFound();

  const { data: messagesData } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conv.id)
    .order("created_at", { ascending: true });

  const messages = (messagesData ?? []) as Message[];

  const phone = formatPhone(conv.client_number);
  const telLink = `tel:${phone.replace(/\s+/g, "")}`;
  const waLink = `https://wa.me/${phone.replace(/\D/g, "")}`;

  // Ligne meta unique : "Fuite sous évier · urgence 5/5 · RDV demandé"
  const metaParts: string[] = [];
  if (conv.summary) metaParts.push(conv.summary);
  else if (conv.problem_type) metaParts.push(conv.problem_type);
  if (conv.urgency)
    metaParts.push(
      `urgence ${conv.urgency}/5${conv.urgency >= 4 ? "" : ""}`
    );
  if (conv.needs_appointment) metaParts.push("RDV demandé");

  const isClosed = conv.status === "closed";

  return (
    <>
      <RealtimeRefresh filter={`conversation_id=eq.${conv.id}`} />
      {/* Marque la conv comme lue dès le montage */}
      <MarkSeen conversationId={conv.id} />

      <Link
        href="/dashboard"
        className="text-base text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 mb-3 transition-colors"
      >
        ← Conversations
      </Link>

      {/* ── Header conversation, compact ── */}
      <header className="mb-5">
        <div className="flex items-baseline justify-between gap-3 mb-0.5">
          <h1 className="text-xl font-semibold text-slate-900 truncate">
            {conv.client_name ?? phone}
          </h1>
          {conv.status === "paused" && (
            <span className="text-sm text-slate-400 shrink-0">
              IA en pause
            </span>
          )}
          {isClosed && (
            <span className="text-sm text-slate-400 shrink-0">
              Archivée
            </span>
          )}
        </div>
        <p className="text-base text-slate-500">
          <a
            href={telLink}
            className="hover:text-slate-900 transition-colors tabular-nums"
          >
            {phone}
          </a>
        </p>

        {/* Meta ligne unique discrète */}
        {metaParts.length > 0 && (
          <p className="mt-3 text-base text-slate-500">
            {metaParts.join(" · ")}
          </p>
        )}
      </header>

      {/* ── Fil de messages ── */}
      <div className="space-y-1.5">
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const showDateSep =
            !prev || parisDayKey(prev.created_at) !== parisDayKey(m.created_at);
          const sameRoleAsPrev = prev?.role === m.role;
          return (
            <div key={m.id}>
              {showDateSep && <DateSeparator iso={m.created_at} />}
              <Bubble message={m} grouped={sameRoleAsPrev && !showDateSep} />
            </div>
          );
        })}
      </div>

      {/* ── Bandeau sticky : actions + zone de réponse ── */}
      <div className="sticky bottom-0 -mx-4 px-4 bg-white border-t border-slate-100 pt-3 pb-2 mt-5">
        <div className="flex gap-2 mb-2">
          <a
            href={telLink}
            className="inline-flex items-center gap-2 text-lg font-medium text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-lg transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Appeler
          </a>
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-lg font-medium text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-lg transition-colors"
          >
            WhatsApp
          </a>
          <div className="ml-auto">
            <ArchiveButton conversationId={conv.id} isClosed={isClosed} />
          </div>
        </div>
        <ReplyBox conversationId={conv.id} status={conv.status} />
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────

function Bubble({
  message,
  grouped,
}: {
  message: Message;
  grouped: boolean;
}) {
  const isClient = message.role === "client";
  const isArtisan = message.role === "artisan";

  // Alignement : client = gauche, IA/artisan = droite.
  const align = isClient ? "justify-start" : "justify-end";

  // Couleurs sobres :
  // - client → gris clair
  // - IA     → gris clair aussi (juste alignement à droite)
  // - artisan → noir sur blanc (= "toi" qui parle)
  const bubble = isClient
    ? "bg-slate-100 text-slate-900"
    : isArtisan
    ? "bg-slate-900 text-white"
    : "bg-slate-100 text-slate-900";

  // Coins arrondis : moins arrondi du côté où la bulle "colle" à la précédente
  // du même expéditeur (effet groupage iMessage).
  let radius = "rounded-2xl";
  if (grouped) {
    radius = isClient
      ? "rounded-2xl rounded-tl-md"
      : "rounded-2xl rounded-tr-md";
  }

  const label = isClient ? "client" : isArtisan ? "toi" : "ia";

  // Heuristique : si le body commence par 🎙️, c'est un vocal transcrit
  // → on affiche un lecteur audio (en plus du texte de la transcription).
  // Sinon si media_url est défini → c'est une image → on affiche la photo.
  const isVoice = message.body?.startsWith("🎙️") ?? false;
  const hasMedia = !!message.media_url;

  return (
    <div className={`flex ${align}`}>
      <div className="max-w-[80%] sm:max-w-[75%]">
        <div
          className={`${radius} px-4 py-2.5 text-lg leading-relaxed whitespace-pre-wrap ${bubble}`}
        >
          {message.body}
          {hasMedia && isVoice && (
            <audio
              controls
              preload="none"
              src={`/api/media/${message.id}`}
              className={`block ${message.body ? "mt-2" : ""} w-full max-w-[240px] h-9`}
            >
              Votre navigateur ne lit pas l'audio.
            </audio>
          )}
          {hasMedia && !isVoice && (
            <a
              href={`/api/media/${message.id}`}
              target="_blank"
              rel="noreferrer"
              className={`block ${message.body ? "mt-2" : ""}`}
              title="Ouvrir la photo en grand"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/media/${message.id}`}
                alt="Photo envoyée par le client"
                className="rounded-lg max-w-[220px] w-full h-auto"
              />
            </a>
          )}
        </div>
        {!grouped && (
          <div
            className={`text-xs text-slate-400 mt-1 px-1 ${
              isClient ? "text-left" : "text-right"
            }`}
          >
            {label} · {formatTime(message.created_at)}
          </div>
        )}
      </div>
    </div>
  );
}

function DateSeparator({ iso }: { iso: string }) {
  const nowIso = new Date().toISOString();
  const yesterdayIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  let label: string;
  if (parisDayKey(iso) === parisDayKey(nowIso)) {
    label = "Aujourd'hui";
  } else if (parisDayKey(iso) === parisDayKey(yesterdayIso)) {
    label = "Hier";
  } else {
    label = new Date(iso).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "Europe/Paris",
    });
  }

  return (
    <div className="flex justify-center my-4">
      <span className="text-[10px] text-slate-400 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}
