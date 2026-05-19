"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogoWithText } from "@/components/Logo";
import { WhatsAppButton } from "@/components/WhatsAppButton";

type Status = "idle" | "sending" | "sent" | "error";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* ── Hero centré ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo + tagline */}
          <div className="text-center mb-8">
            <div className="inline-block mb-4">
              <LogoWithText size={36} textClassName="text-slate-900 font-bold text-2xl tracking-tight" />
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
            {status === "sent" ? (
              <div className="text-center py-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-slate-900 mb-1">
                  Lien envoyé !
                </h2>
                <p className="text-sm text-slate-600">
                  Ouvre ton mail à <strong>{email}</strong> et clique sur le lien
                  pour te connecter.
                </p>
                <button
                  onClick={() => {
                    setStatus("idle");
                    setEmail("");
                  }}
                  className="mt-6 text-sm text-slate-500 hover:text-slate-900 underline underline-offset-2"
                >
                  Utiliser une autre adresse
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    autoFocus
                    placeholder="ton@email.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    disabled={status === "sending"}
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "sending" || !email}
                  className="w-full rounded-lg bg-blue-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
                >
                  {status === "sending" ? (
                    <>
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      Envoi en cours…
                    </>
                  ) : (
                    "Recevoir le lien de connexion"
                  )}
                </button>
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-xs text-slate-400 mb-3">
              Pas encore de compte ?
            </p>
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
