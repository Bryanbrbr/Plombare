import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { formatRelative, formatPhone } from "@/lib/format";
import type { Conversation } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { archive?: string };
}) {
  const showArchive = searchParams.archive === "1";

  const supabase = createClient();

  // Liste filtrée selon le mode (active vs archive)
  const baseQuery = supabase
    .from("conversations")
    .select("*")
    .order("last_message_at", { ascending: false })
    .limit(100);

  const { data: conversations } = showArchive
    ? await baseQuery.eq("status", "closed")
    : await baseQuery.neq("status", "closed");

  const convs = (conversations ?? []) as Conversation[];

  // Compte des archivées (pour le lien en bas)
  const { count: archivedCount } = await supabase
    .from("conversations")
    .select("*", { count: "exact", head: true })
    .eq("status", "closed");

  return (
    <>
      <RealtimeRefresh />

      <header className="mb-4 px-1 flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            {showArchive ? "Archive" : "Conversations"}
          </h1>
          {convs.length > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">
              {convs.length} demande{convs.length > 1 ? "s" : ""}
            </p>
          )}
        </div>
        {showArchive && (
          <Link
            href="/dashboard"
            className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
          >
            ← Actives
          </Link>
        )}
      </header>

      {convs.length === 0 ? (
        <EmptyState archive={showArchive} />
      ) : (
        <ul className="space-y-1">
          {convs.map((c) => (
            <ConversationRow key={c.id} conv={c} />
          ))}
        </ul>
      )}

      {/* Lien vers archive (uniquement en vue active) */}
      {!showArchive && archivedCount && archivedCount > 0 && (
        <div className="mt-6 text-center">
          <Link
            href="/dashboard?archive=1"
            className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
          >
            Voir l'archive ({archivedCount})
          </Link>
        </div>
      )}
    </>
  );
}

// ────────────────────────────────────────────────────────────

function ConversationRow({ conv }: { conv: Conversation }) {
  const isPaused = conv.status === "paused";
  const urgency = conv.urgency ?? 0;

  // Point coloré discret selon l'urgence. Rien en dessous de 3.
  const urgencyDot =
    urgency >= 5
      ? "bg-red-500"
      : urgency >= 4
      ? "bg-orange-500"
      : urgency >= 3
      ? "bg-amber-400"
      : null;

  // Non lue : jamais ouverte OU nouveau message depuis la dernière ouverture
  const isUnread =
    conv.last_seen_at === null ||
    new Date(conv.last_message_at).getTime() >
      new Date(conv.last_seen_at).getTime();

  const problem = conv.summary ?? conv.problem_type ?? "Nouvelle demande";
  const rdvSuffix = conv.needs_appointment ? " · RDV" : "";

  return (
    <li>
      <Link
        href={`/dashboard/conversations/${conv.id}`}
        className="block px-3.5 py-3 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors"
      >
        <div className="flex items-baseline justify-between gap-3 mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {isUnread && (
              <span
                className="inline-block w-2 h-2 rounded-full bg-blue-500 shrink-0"
                aria-label="Non lue"
              />
            )}
            <span
              className={`text-sm truncate ${
                isUnread
                  ? "font-semibold text-slate-900"
                  : isPaused
                  ? "font-medium text-slate-500"
                  : "font-medium text-slate-900"
              }`}
            >
              {conv.client_name ?? formatPhone(conv.client_number)}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 shrink-0 tabular-nums">
            {formatRelative(conv.last_message_at)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {urgencyDot && (
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${urgencyDot} shrink-0`}
              aria-hidden="true"
            />
          )}
          <p
            className={`text-sm truncate flex-1 ${
              isUnread ? "text-slate-700" : "text-slate-600"
            }`}
          >
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

function EmptyState({ archive }: { archive: boolean }) {
  return (
    <div className="py-20 text-center">
      <p className="text-sm text-slate-500">
        {archive ? "Aucune conversation archivée." : "Aucune demande pour l'instant."}
      </p>
      {!archive && (
        <p className="text-xs text-slate-400 mt-1">
          Les messages clients apparaîtront ici.
        </p>
      )}
    </div>
  );
}
