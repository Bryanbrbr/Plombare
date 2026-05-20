import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import { Avatar } from "@/components/Avatar";
import { formatPhone, formatTime, formatRelative } from "@/lib/format";
import { problemMeta } from "@/lib/problemType";
import type { Conversation, Message } from "@/lib/types";

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
  const { emoji, label } = problemMeta(conv.problem_type);
  const phone = formatPhone(conv.client_number);
  const telLink = `tel:${phone.replace(/\s+/g, "")}`;

  return (
    <>
      <Link
        href="/dashboard"
        className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 mb-4 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Conversations
      </Link>

      {/* ── En-tête conversation ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <Avatar name={conv.client_name ?? phone} size={48} />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-slate-900 truncate">
              {conv.client_name ?? phone}
            </h1>
            <p className="text-sm text-slate-500">
              <a
                href={telLink}
                className="hover:text-blue-600 transition-colors"
              >
                {phone}
              </a>
              <span className="mx-1.5 text-slate-300">·</span>
              {formatRelative(conv.last_message_at)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <UrgencyBadge urgency={conv.urgency} />
            {conv.status === "paused" && (
              <span className="text-[10px] uppercase tracking-wide bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                IA en pause
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-4">
          <a
            href={telLink}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Appeler
          </a>
          <a
            href={`https://wa.me/${phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
            </svg>
            WhatsApp
          </a>
        </div>

        {/* Infos qualifiées par l'IA */}
        {(conv.problem_type || conv.summary || conv.needs_appointment) && (
          <div className="border-t border-slate-100 pt-4 space-y-2">
            {conv.problem_type && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-base">{emoji}</span>
                <span className="text-slate-500">Type :</span>
                <span className="font-medium text-slate-900">{label}</span>
              </div>
            )}
            {conv.summary && (
              <div className="text-sm">
                <span className="text-slate-500">Résumé IA :</span>
                <p className="text-slate-900 mt-0.5">{conv.summary}</p>
              </div>
            )}
            {conv.needs_appointment && (
              <div className="inline-flex items-center gap-1.5 text-sm text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Rendez-vous demandé
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Fil de messages ── */}
      <div className="space-y-3">
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const showDateSep =
            !prev || !sameDay(prev.created_at, m.created_at);
          return (
            <div key={m.id}>
              {showDateSep && <DateSeparator iso={m.created_at} />}
              <MessageBubble message={m} />
            </div>
          );
        })}
      </div>

      {/* ── Footer info ── */}
      <div className="mt-8 mb-4 rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-500 text-center">
        <p className="mb-1">
          💬 Pour répondre, écris directement au client depuis WhatsApp sur ton téléphone.
        </p>
        <p>
          ⏸️ Le client peut écrire « <strong>humain</strong> » ou « <strong>stop</strong> » pour mettre l'IA en pause.
        </p>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isClient = message.role === "client";
  const isArtisan = message.role === "artisan";

  const align = isClient ? "justify-start" : "justify-end";
  const bubble = isClient
    ? "bg-white border border-slate-200 text-slate-900"
    : isArtisan
    ? "bg-emerald-600 text-white"
    : "bg-blue-600 text-white";
  const label = isClient ? "Client" : isArtisan ? "Toi" : "IA";

  return (
    <div className={`flex ${align}`}>
      <div className="max-w-[85%] sm:max-w-[75%]">
        <div className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${bubble}`}>
          {message.body}
          {message.media_url && (
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
                className="rounded-lg max-w-[240px] w-full h-auto border border-black/10"
              />
            </a>
          )}
        </div>
        <div
          className={`text-[10px] text-slate-400 mt-1 px-1 ${
            isClient ? "text-left" : "text-right"
          }`}
        >
          {label} · {formatTime(message.created_at)}
        </div>
      </div>
    </div>
  );
}

function DateSeparator({ iso }: { iso: string }) {
  const d = new Date(iso);
  const now = new Date();
  let label: string;
  if (sameDay(iso, now.toISOString())) {
    label = "Aujourd'hui";
  } else {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (sameDay(iso, yesterday.toISOString())) {
      label = "Hier";
    } else {
      label = d.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    }
  }
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">
        {label}
      </span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

function sameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}
