import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { formatRelative, formatPhone } from "@/lib/format";
import { problemMeta } from "@/lib/problemType";
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

  // Stats NON-OVERLAPPANTES : chaque conv tombe dans UN seul bucket par priorité.
  // pause > urgent > à planifier > (autre, pas dans les stats).
  let urgentCount = 0;
  let toPlanCount = 0;
  let pausedCount = 0;

  for (const c of convs) {
    if (c.status === "paused") {
      pausedCount++;
    } else if ((c.urgency ?? 0) >= 4) {
      urgentCount++;
    } else if (c.needs_appointment) {
      toPlanCount++;
    }
  }

  const actionableCount = urgentCount + toPlanCount + pausedCount;

  return (
    <>
      {/* Abonnement temps réel : refresh auto à chaque nouveau message */}
      <RealtimeRefresh />

      {/* ── En-tête + stats ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">
          Conversations
        </h1>
        <p className="text-sm text-slate-500">
          {convs.length === 0
            ? "Pas encore de demande client."
            : actionableCount === 0
            ? `${convs.length} conversation${convs.length > 1 ? "s" : ""} · rien d'action immédiate ✨`
            : `${convs.length} conversation${convs.length > 1 ? "s" : ""} · ${actionableCount} demande${actionableCount > 1 ? "s" : ""} à traiter`}
        </p>
      </div>

      {actionableCount > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
          <StatCard
            emoji="📞"
            label="À rappeler"
            value={urgentCount}
            tone="rose"
            sub={urgentCount > 0 ? "agir maintenant" : "rien d'urgent"}
          />
          <StatCard
            emoji="📅"
            label="À planifier"
            value={toPlanCount}
            tone="amber"
            sub={toPlanCount > 0 ? "caler un RDV" : "tout est calé"}
          />
          <StatCard
            emoji="💬"
            label="En pause"
            value={pausedCount}
            tone="slate"
            sub={pausedCount > 0 ? "à toi de jouer" : "IA active"}
          />
        </div>
      )}

      {/* ── Liste / empty state ── */}
      {convs.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-2">
          {convs.map((c) => (
            <ConversationRow key={c.id} conv={c} />
          ))}
        </ul>
      )}
    </>
  );
}

// ────────────────────────────────────────────────────────────

function StatCard({
  emoji,
  label,
  value,
  sub,
  tone,
}: {
  emoji: string;
  label: string;
  value: number;
  sub: string;
  tone: "rose" | "amber" | "slate";
}) {
  const isZero = value === 0;

  const tones = {
    rose: {
      bg: "bg-rose-50",
      border: "border-rose-100",
      number: "text-rose-600",
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-100",
      number: "text-amber-600",
    },
    slate: {
      bg: "bg-slate-50",
      border: "border-slate-200",
      number: "text-slate-600",
    },
  };
  const t = tones[tone];

  return (
    <div
      className={`rounded-2xl border ${t.border} ${t.bg} p-4 sm:p-5 text-center transition-opacity ${
        isZero ? "opacity-60" : ""
      }`}
    >
      <div className="text-2xl sm:text-3xl mb-1 leading-none" aria-hidden="true">
        {emoji}
      </div>
      <div
        className={`text-3xl sm:text-4xl font-bold leading-none mb-2 ${
          isZero ? "text-slate-300" : t.number
        }`}
      >
        {value}
      </div>
      <div className="text-xs sm:text-sm font-semibold text-slate-900">
        {label}
      </div>
      <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}

function ConversationRow({ conv }: { conv: Conversation }) {
  const { emoji, label } = problemMeta(conv.problem_type);
  return (
    <li>
      <Link
        href={`/dashboard/conversations/${conv.id}`}
        className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3 hover:border-blue-300 hover:shadow-sm transition-all"
      >
        <div
          className="shrink-0 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl"
          aria-hidden="true"
        >
          {emoji}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium text-slate-900 truncate">
              {conv.client_name ?? formatPhone(conv.client_number)}
            </span>
            {conv.status === "paused" && (
              <span className="text-[10px] uppercase tracking-wide bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                pause
              </span>
            )}
            {conv.needs_appointment && (
              <span className="text-[10px] uppercase tracking-wide bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                RDV
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 truncate">
            <span className="text-slate-400">{label}</span>
            {conv.summary && <span> · {conv.summary}</span>}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <UrgencyBadge urgency={conv.urgency} />
          <span className="text-xs text-slate-400">
            {formatRelative(conv.last_message_at)}
          </span>
        </div>
      </Link>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 sm:p-14 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 text-blue-600 mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
      </div>
      <h2 className="text-base font-semibold text-slate-900 mb-1">
        Aucune conversation pour le moment
      </h2>
      <p className="text-sm text-slate-500 max-w-sm mx-auto">
        Dès qu'un client t'écrira sur WhatsApp,
        <br />
        sa demande apparaîtra ici, qualifiée par l'IA.
      </p>
    </div>
  );
}
