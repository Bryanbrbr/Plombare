import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import { formatRelative, formatPhone } from "@/lib/format";
import type { Conversation } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();

  // RLS s'assure qu'on ne voit que nos propres conversations.
  const { data: conversations } = await supabase
    .from("conversations")
    .select("*")
    .order("last_message_at", { ascending: false })
    .limit(100);

  const convs = (conversations ?? []) as Conversation[];

  return (
    <>
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-xl font-semibold">Conversations</h1>
        <span className="text-sm text-slate-500">{convs.length} active{convs.length > 1 ? "s" : ""}</span>
      </div>

      {convs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-500 text-sm">
            Aucune conversation pour le moment.
            <br />
            Dès qu'un client t'écrira sur WhatsApp, elle apparaîtra ici.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {convs.map((c) => (
            <li key={c.id}>
              <Link
                href={`/dashboard/conversations/${c.id}`}
                className="block bg-white rounded-xl border border-slate-200 px-4 py-3 hover:border-slate-400 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-900 truncate">
                        {c.client_name ?? formatPhone(c.client_number)}
                      </span>
                      {c.status === "paused" && (
                        <span className="text-[10px] uppercase tracking-wide bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                          pause
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 truncate">
                      {c.summary ?? c.problem_type ?? "Nouvelle conversation"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <UrgencyBadge urgency={c.urgency} />
                    <span className="text-xs text-slate-400">
                      {formatRelative(c.last_message_at)}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
