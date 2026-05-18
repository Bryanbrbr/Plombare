type LogoProps = {
  size?: number;
  className?: string;
};

/**
 * Logo Plombare — une goutte d'eau stylisée avec un reflet.
 * La couleur est contrôlée via `currentColor` → applique text-* depuis le parent.
 */
export function Logo({ size = 24, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M16 3 C16 3, 5 15, 5 22 A11 11 0 0 0 27 22 C27 15, 16 3, 16 3 Z"
        fill="currentColor"
      />
      <path
        d="M11 20 C11 22.5, 12.5 24, 14.5 24"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
    </svg>
  );
}

/**
 * Logo + nom de marque, pour les en-têtes et la page login.
 */
export function LogoWithText({
  size = 28,
  textClassName = "text-slate-900 font-semibold text-lg tracking-tight",
}: {
  size?: number;
  textClassName?: string;
}) {
  return (
    <div className="inline-flex items-center gap-2">
      <Logo size={size} className="text-blue-600" />
      <span className={textClassName}>Plombare</span>
    </div>
  );
}
