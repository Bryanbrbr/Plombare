/**
 * Icône emoji + libellé propre pour un problem_type renvoyé par l'IA.
 * Tolérant aux variations ("fuite", "FUITE", "WC", "wc", "chauffe-eau", "chauffeau"…).
 */

type ProblemMeta = {
  emoji: string;
  label: string;
};

const MAPPING: { test: RegExp; meta: ProblemMeta }[] = [
  { test: /^(fuite|fuit|inondat)/i, meta: { emoji: "💧", label: "Fuite" } },
  { test: /^(bouch|engor|d[ée]bouch)/i, meta: { emoji: "🚿", label: "Bouché" } },
  { test: /^(wc|toilette|chasse)/i, meta: { emoji: "🚽", label: "WC" } },
  { test: /^(chauffe[-\s]?eau|cumulus|ballon)/i, meta: { emoji: "🔥", label: "Chauffe-eau" } },
  { test: /^(robinet|mitig)/i, meta: { emoji: "🚰", label: "Robinet" } },
  { test: /^(gaz|odeur)/i, meta: { emoji: "⚠️", label: "Gaz" } },
  { test: /^(install|pos[ée]|remplac)/i, meta: { emoji: "🔧", label: "Installation" } },
  { test: /^(devis|tarif|prix)/i, meta: { emoji: "📋", label: "Devis" } },
  { test: /^(info|renseign|question)/i, meta: { emoji: "ℹ️", label: "Info" } },
];

const FALLBACK: ProblemMeta = { emoji: "🛠️", label: "Autre" };

export function problemMeta(problemType: string | null | undefined): ProblemMeta {
  if (!problemType) return FALLBACK;
  for (const { test, meta } of MAPPING) {
    if (test.test(problemType)) return meta;
  }
  return { ...FALLBACK, label: capitalize(problemType) };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
