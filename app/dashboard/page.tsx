import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { InboxList } from "./InboxList";
import type { Conversation } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { archive?: string };
}) {
  const showArchive = searchParams.archive === "1";
  const mode = showArchive ? "archive" : "active";

  const supabase = createClient();

  // Liste filtrée selon le mode
  const baseQuery = supabase
    .from("conversations")
    .select("*")
    .order("last_message_at", { ascending: false })
    .limit(100);

  const { data: conversations } = showArchive
    ? await baseQuery.eq("status", "closed")
    : await baseQuery.neq("status", "closed");

  const convs = (conversations ?? []) as Conversation[];

  // Compte des archivées (pour afficher dans l'onglet)
  const { count: archivedCount } = await supabase
    .from("conversations")
    .select("*", { count: "exact", head: true })
    .eq("status", "closed");

  return (
    <>
      <RealtimeRefresh />

      {/* ─── Onglets ─── */}
      <div className="flex items-center gap-5 mb-5 px-1 border-b border-slate-100 pb-3">
        <Tab href="/dashboard" active={!showArchive}>
          Conversations
        </Tab>
        <Tab href="/dashboard?archive=1" active={showArchive}>
          Archive
          {archivedCount && archivedCount > 0 && (
            <span className="ml-1 text-[11px] text-slate-400 tabular-nums">
              ({archivedCount})
            </span>
          )}
        </Tab>
      </div>

      {convs.length === 0 ? (
        <EmptyState archive={showArchive} />
      ) : (
        <InboxList convs={convs} mode={mode} />
      )}
    </>
  );
}

// ────────────────────────────────────────────────────────────

function Tab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`text-sm pb-3 -mb-3 border-b-2 transition-colors ${
        active
          ? "text-slate-900 font-semibold border-slate-900"
          : "text-slate-500 hover:text-slate-900 border-transparent"
      }`}
    >
      {children}
    </Link>
  );
}

function EmptyState({ archive }: { archive: boolean }) {
  return (
    <div className="py-20 text-center">
      <p className="text-sm text-slate-500">
        {archive
          ? "Aucune conversation archivée."
          : "Aucune demande pour l'instant."}
      </p>
      {!archive && (
        <p className="text-xs text-slate-400 mt-1">
          Les messages clients apparaîtront ici.
        </p>
      )}
    </div>
  );
}
