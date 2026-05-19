"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoWithText } from "@/components/Logo";
import { WhatsAppButton } from "@/components/WhatsAppButton";

type Step = "email" | "code";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Étape 1 : envoyer le code ──────────────────────────
  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ email });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setStep("code");
    }
  }

  // ── Étape 2 : vérifier le code ─────────────────────────
  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });

    setLoading(false);
    if (error) {
      setError("Code incorrect ou expiré. Réessaie.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo + tagline */}
          <div className="text-center mb-8">
            <div className="inline-block mb-4">
              <LogoWithText
                size={36}
                textClassName="text-slate-900 font-bold text-2xl tracking-tight"
              />
            </div>
            <p className="text-slate-600 text-sm max-w-xs mx-auto">
              Ta secrétaire IA WhatsApp.
              <br />
              <span className="text-slate-500">
                Réponds à tes clients 24/7 sans lever le petit doigt.
              </span>
            </p>
          </div>

          {/* Carte login */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
            {step === "email" ? (
              /* ── ÉTAPE 1 : EMAIL ── */
              <form onSubmit={sendCode} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Ton email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    autoFocus
                    inputMode="email"
                    placeholder="ton@email.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full rounded-lg bg-blue-600 text-white px-4 py-3 text-base font-semibold hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Spinner />
                      Envoi…
                    </>
                  ) : (
                    "Recevoir mon code"
                  )}
                </button>
                {error && <ErrorBox message={error} />}
                <p className="text-xs text-slate-400 text-center pt-1">
                  On t'envoie un code à 6 chiffres par email.
                </p>
              </form>
            ) : (
              /* ── ÉTAPE 2 : CODE ── */
              <form onSubmit={verifyCode} className="space-y-4">
                <div className="text-center mb-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-700 mb-3">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-10 5L2 7" />
                    </svg>
                  </div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Vérifie tes emails
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    On a envoyé un code à 6 chiffres à
                    <br />
                    <strong className="text-slate-700">{email}</strong>
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="code"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Code reçu
                  </label>
                  <input
                    id="code"
                    type="text"
                    required
                    autoFocus
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-3 text-center text-2xl font-bold tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full rounded-lg bg-blue-600 text-white px-4 py-3 text-base font-semibold hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Spinner />
                      Connexion…
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </button>

                {error && <ErrorBox message={error} />}

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setCode("");
                      setError(null);
                    }}
                    className="text-slate-500 hover:text-slate-900 underline underline-offset-2"
                  >
                    Changer d'email
                  </button>
                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={loading}
                    className="text-blue-600 hover:text-blue-700 underline underline-offset-2 disabled:opacity-50"
                  >
                    Renvoyer le code
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-xs text-slate-400 mb-3">Pas encore de compte ?</p>
            <WhatsAppButton
              label="Me contacter pour activer Plombare"
              variant="secondary"
              className="text-xs"
            />
          </div>
        </div>
      </div>
    </main>
  );
}

// ────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
      {message}
    </div>
  );
}
