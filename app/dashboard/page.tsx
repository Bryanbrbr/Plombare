import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { formatRelative, formatPhone } from "@/lib/format";
import type { Conversation } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();

  // RLS : on ne voit que ses propres conversations.
  const { data: conversations } = await supabase
    .from("conversations")
    .select("*")
    .order("last_message_at", { ascending: false })
    .limit(100);

  const convs = (conversations ?? []) as Conversation[];

  return (
    <>
      <RealtimeRefresh />

      <header className="mb-4 px-1">
        <h1 className="text-lg font-semibold text-slate-900">Conversations</h1>
        {convs.length > 0 && (
          <p className="text-xs text-slate-500 mt-0.5">
            {convs.length} demande{convs.length > 1 ? "s" : ""}
          </p>
        )}
      </header>

      {convs.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-1">
          {convs.map((c) => (
            <ConversationRow key={c.id} conv={c} />
          ))}
        </ul>
      )}
    </>
  );
}

// ────────────────────────────────────────────────────────────

function ConversationRow({ conv }: { conv: Conversation }) {
  const isPaused = conv.status === "paused";
  const urgency = conv.urgency ?? 0;

  // Point coloré discret selon l'urgence. Rien en dessous de 3.
  const dot =
    urgency >= 5
      ? "bg-red-500"
      : urgency >= 4
      ? "bg-orange-500"
      : urgency >= 3
      ? "bg-amber-400"
      : null;

  // Texte du problème : on prend le résumé court, sinon le type, sinon fallback.
  const problem = conv.summary ?? conv.problem_type ?? "Nouvelle demande";
  const rdvSuffix = conv.needs_appointment ? " · RDV" : "";

  return (
    <li>
      <Link
        href={`/dashboard/conversations/${conv.id}`}
        className="block px-3 py-3 rounded-lg bg-slate-50 hover:bg-slate-100 active:bg-slate-200 transition-colors"
      >
        <div className="flex items-baseline justify-between gap-3 mb-0.5">
          <span
            className={`text-sm font-medium truncate ${
              isPaused ? "text-slate-500" : "text-slate-900"
            }`}
          >
            {conv.client_name ?? formatPhone(conv.client_number)}
          </span>
          <span className="text-[11px] text-slate-400 shrink-0 tabular-nums">
            {formatRelative(conv.last_message_at)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {dot && (
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${dot} shrink-0`}
              aria-hidden="true"
            />
          )}
          <p className="text-sm text-slate-600 truncate flex-1">
            {problem}
            {rdvSuffix}
          </p>
          {isPaused && (
            <span className="text-[11px] text-slate-400 shrink-0">
              en pause
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="py-20 text-center">
      <p className="text-sm text-slate-500">Aucune demande pour l'instant.</p>
      <p className="text-xs text-slate-400 mt-1">
        Les messages clients apparaîtront ici.
      </p>
    </div>
  );
}
