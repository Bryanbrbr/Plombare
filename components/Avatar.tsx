type AvatarProps = {
  name?: string | null;
  size?: number;
  className?: string;
};

/**
 * Cercle coloré avec les initiales du nom (ou "?" si vide).
 * Couleur déterministe basée sur le hash du nom (toujours la même par personne).
 */
export function Avatar({ name, size = 36, className = "" }: AvatarProps) {
  const initials = getInitials(name);
  const colorClasses = colorFromName(name);

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full font-semibold ${colorClasses} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-label={name ?? "Anonyme"}
    >
      {initials}
    </div>
  );
}

function getInitials(name?: string | null): string {
  if (!name) return "?";
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-teal-100 text-teal-700",
  "bg-fuchsia-100 text-fuchsia-700",
];

function colorFromName(name?: string | null): string {
  if (!name) return "bg-slate-200 text-slate-500";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}
