import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LogoWithText } from "@/components/Logo";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Si déjà connecté, on file direct sur le dashboard
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen">
      {/* ── Topbar ── */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <LogoWithText size={26} />
          <Link
            href="/login"
            className="text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            Se connecter →
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="px-4 pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-medium mb-6 border border-blue-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
            </span>
            En bêta — 30 jours gratuits
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight tracking-tight">
            Ne perds plus jamais
            <br />
            <span className="text-blue-600">un client WhatsApp</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Plombare répond automatiquement à tes clients sur WhatsApp,
            qualifie leur problème et te prévient en direct quand c'est urgent.
            Pendant que tu bosses sous un évier.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <WhatsAppButton
              label="Tester gratuitement"
              variant="primary"
              className="text-base px-5 py-3"
            />
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 px-5 py-3 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              J'ai déjà un compte
            </Link>
          </div>

          <p className="mt-4 text-xs text-slate-400">
            Pas de carte bancaire · Configuré en 10 min
          </p>
        </div>
      </section>

      {/* ── 3 benefits ── */}
      <section className="px-4 py-12 bg-white border-y border-slate-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-sm font-semibold text-slate-500 uppercase tracking-wide mb-10">
            Comment ça marche
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <Benefit
              emoji="💬"
              title="Le client écrit"
              text="Ton client envoie un WhatsApp à ton numéro pro. Peu importe l'heure : 22h, dimanche, pendant un chantier."
            />
            <Benefit
              emoji="🤖"
              title="L'IA répond"
              text="En quelques secondes, l'IA comprend le problème (fuite, WC, chauffe-eau…), évalue l'urgence et demande une photo si besoin."
            />
            <Benefit
              emoji="🔔"
              title="Tu es prévenu"
              text="Si c'est urgent, tu reçois une notif WhatsApp avec le résumé. Sinon, tu rappelles quand tu peux."
            />
          </div>
        </div>
      </section>

      {/* ── Prix + CTA ── */}
      <section className="px-4 py-14">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
            Combien ça coûte&nbsp;?
          </h2>
          <p className="text-slate-600 mb-6">
            <span className="text-3xl font-bold text-slate-900">49&nbsp;€</span>
            <span className="text-slate-500"> /mois · sans engagement</span>
            <br />
            <span className="text-sm text-slate-500">
              30 jours d'essai, puis tu décides.
            </span>
          </p>

          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 text-left">
            <p className="text-sm text-slate-700 mb-4">
              <strong className="text-slate-900">L'idée concrète :</strong> tu perds
              en moyenne 1 client par mois parce que tu n'as pas répondu à temps
              (300-800 € de chiffre). Plombare coûte 49 € pour récupérer
              ce client. Reste 250 € minimum dans ta poche.
            </p>
            <WhatsAppButton
              label="Je veux essayer"
              variant="primary"
              className="w-full justify-center"
            />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-4 py-8 border-t border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <LogoWithText
            size={20}
            textClassName="text-slate-500 font-medium text-sm"
          />
          <p className="text-xs text-slate-400">
            Une question ? <a href="https://wa.me/33768435131" target="_blank" rel="noreferrer" className="text-emerald-600 hover:text-emerald-700 underline underline-offset-2">Écris-moi sur WhatsApp</a>
          </p>
        </div>
      </footer>
    </main>
  );
}

function Benefit({
  emoji,
  title,
  text,
}: {
  emoji: string;
  title: string;
  text: string;
}) {
  return (
    <div className="text-center sm:text-left">
      <div className="text-3xl mb-3" aria-hidden="true">
        {emoji}
      </div>
      <h3 className="font-semibold text-slate-900 mb-1.5">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
    </div>
  );
}
