import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import { formatPhone, formatTime, formatRelative } from "@/lib/format";
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

  return (
    <>
      <Link
        href="/dashboard"
        className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 mb-4"
      >
        ← Conversations
      </Link>

      {/* ── En-tête conversation ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              {conv.client_name ?? formatPhone(conv.client_number)}
            </h1>
            <p className="text-sm text-slate-500">
              {formatPhone(conv.client_number)}
              {conv.client_name ? "" : ""}
              {" · "}
              {formatRelative(conv.last_message_at)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <UrgencyBadge urgency={conv.urgency} />
            {conv.status === "paused" && (
              <span className="text-[10px] uppercase tracking-wide bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                IA en pause
              </span>
            )}
          </div>
        </div>

        {(conv.problem_type || conv.summary) && (
          <div className="border-t border-slate-100 pt-3 space-y-1 text-sm">
            {conv.problem_type && (
              <div>
                <span className="text-slate-500">Type : </span>
                <span className="text-slate-900 capitalize">{conv.problem_type}</span>
              </div>
            )}
            {conv.summary && (
              <div>
                <span className="text-slate-500">Résumé IA : </span>
                <span className="text-slate-900">{conv.summary}</span>
              </div>
            )}
            {conv.needs_appointment && (
              <div className="text-amber-700 font-medium">
                📅 Rendez-vous demandé
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Fil de messages ── */}
      <div className="space-y-3">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </div>

      {/* ── Footer info ── */}
      <p className="text-xs text-slate-400 mt-6 text-center">
        Pour répondre, écris directement depuis WhatsApp sur ton téléphone.
        <br />
        Pour mettre l'IA en pause sur cette conversation, le client peut écrire
        « humain » ou « stop ».
      </p>
    </>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isClient = message.role === "client";
  const isArtisan = message.role === "artisan";

  // Alignement : client = gauche, IA = droite (couleur primaire), artisan = droite (vert)
  const align = isClient ? "justify-start" : "justify-end";

  const bubble = isClient
    ? "bg-white border border-slate-200 text-slate-900"
    : isArtisan
    ? "bg-emerald-600 text-white"
    : "bg-slate-900 text-white";

  const label = isClient ? "Client" : isArtisan ? "Toi" : "IA";

  return (
    <div className={`flex ${align}`}>
      <div className="max-w-[80%]">
        <div className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${bubble}`}>
          {message.body}
          {message.media_url && (
            <div className="mt-2">
              {/* Note : URL Twilio nécessite l'auth basic, ne s'affichera pas
                  directement dans le navigateur. Lien cliquable pour info. */}
              <a
                href={message.media_url}
                target="_blank"
                rel="noreferrer"
                className={`text-xs underline ${isClient ? "text-slate-500" : "text-white/70"}`}
              >
                📎 Photo jointe
              </a>
            </div>
          )}
        </div>
        <div
          className={`text-[10px] text-slate-400 mt-1 ${
            isClient ? "text-left" : "text-right"
          }`}
        >
          {label} · {formatTime(message.created_at)}
        </div>
      </div>
    </div>
  );
}
