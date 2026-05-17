type Props = { urgency: number | null };

const STYLES: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: "bg-slate-100", text: "text-slate-600", label: "1 · Info" },
  2: { bg: "bg-sky-100", text: "text-sky-700", label: "2 · Planifié" },
  3: { bg: "bg-amber-100", text: "text-amber-800", label: "3 · Gênant" },
  4: { bg: "bg-orange-100", text: "text-orange-800", label: "4 · Important" },
  5: { bg: "bg-red-100", text: "text-red-800", label: "5 · Critique" },
};

export function UrgencyBadge({ urgency }: Props) {
  if (!urgency) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-xs text-slate-400 border border-slate-200">
        non qualifié
      </span>
    );
  }
  const s = STYLES[urgency] ?? STYLES[1];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}
    >
      {s.label}
    </span>
  );
}
