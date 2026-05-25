"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { bulkSetStatus } from "./actions";
import { formatRelative, formatPhone } from "@/lib/format";
import type { Conversation } from "@/lib/types";

export function InboxList({
  convs,
  mode,
}: {
  convs: Conversation[];
  mode: "active" | "archive";
}) {
  const router = useRouter();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function enterSelection() {
    setSelectionMode(true);
    setSelected(new Set());
  }

  function cancelSelection() {
    setSelectionMode(false);
    setSelected(new Set());
  }

  function selectAll() {
    setSelected(new Set(convs.map((c) => c.id)));
  }

  function handleBulkAction() {
    if (selected.size === 0 || pending) return;
    const targetStatus = mode === "archive" ? "open" : "closed";
    const ids = Array.from(selected);
    startTransition(async () => {
      const res = await bulkSetStatus(ids, targetStatus);
      if ("ok" in res) {
        cancelSelection();
        router.refresh();
      }
    });
  }

  const actionLabel = mode === "archive" ? "Désarchiver" : "Archiver";

  return (
    <>
      {/* ─── Barre du haut : compteur + actions ─── */}
      <div className="flex items-center justify-between gap-3 mb-3 px-1 min-h-[28px]">
        {selectionMode ? (
          <>
            <button
              onClick={cancelSelection}
              className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              Annuler
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                {selected.size > 0
                  ? `${selected.size} sélectionnée${selected.size > 1 ? "s" : ""}`
                  : "Aucune"}
              </span>
              <button
                onClick={selected.size === convs.length ? cancelSelection : selectAll}
                className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
              >
                {selected.size === convs.length ? "Aucune" : "Tout"}
              </button>
              <button
                onClick={handleBulkAction}
                disabled={selected.size === 0 || pending}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {pending ? "…" : actionLabel}
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="text-xs text-slate-500">
              {convs.length} demande{convs.length > 1 ? "s" : ""}
            </span>
            <button
              onClick={enterSelection}
              className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
            >
              Sélectionner
            </button>
          </>
        )}
      </div>

      {/* ─── Liste ─── */}
      <ul className="space-y-1">
        {convs.map((c) => (
          <Row
            key={c.id}
            conv={c}
            selectionMode={selectionMode}
            checked={selected.has(c.id)}
            onToggle={() => toggle(c.id)}
          />
        ))}
      </ul>
    </>
  );
}

// ────────────────────────────────────────────────────────────

function Row({
  conv,
  selectionMode,
  checked,
  onToggle,
}: {
  conv: Conversation;
  selectionMode: boolean;
  checked: boolean;
  onToggle: () => void;
}) {
  const isPaused = conv.status === "paused";
  const urgency = conv.urgency ?? 0;

  const urgencyDot =
    urgency >= 5
      ? "bg-red-500"
      : urgency >= 4
      ? "bg-orange-500"
      : urgency >= 3
      ? "bg-amber-400"
      : null;

  const isUnread =
    conv.last_seen_at === null ||
    new Date(conv.last_message_at).getTime() >
      new Date(conv.last_seen_at).getTime();

  const problem = conv.summary ?? conv.problem_type ?? "Nouvelle demande";
  const rdvSuffix = conv.needs_appointment ? " · RDV" : "";

  const innerContent = (
    <div className="flex items-center gap-3">
      {selectionMode && (
        <div
          className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
            checked
              ? "bg-blue-600 border-blue-600"
              : "bg-white border-slate-300"
          }`}
          aria-hidden="true"
        >
          {checked && (
            <svg
              className="w-3 h-3 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3 mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {isUnread && !selectionMode && (
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
      </div>
    </div>
  );

  // En mode sélection : la row entière est un bouton qui toggle la case.
  // Sinon : Link vers le détail.
  const rowClass =
    "block w-full text-left px-3.5 py-3 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors";

  return (
    <li>
      {selectionMode ? (
        <button onClick={onToggle} className={rowClass}>
          {innerContent}
        </button>
      ) : (
        <Link href={`/dashboard/conversations/${conv.id}`} className={rowClass}>
          {innerContent}
        </Link>
      )}
    </li>
  );
}
