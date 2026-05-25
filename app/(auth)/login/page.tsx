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

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

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

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });

    if (error) {
      setLoading(false);
      setError("Code incorrect ou expiré.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-white">
      <div className="w-full max-w-sm">
        {/* Logo discret */}
        <div className="text-center mb-10">
          <LogoWithText
            size={24}
            textClassName="text-slate-900 font-semibold text-base tracking-tight"
          />
        </div>

        {step === "email" ? (
          <form onSubmit={sendCode} className="space-y-3">
            <label
              htmlFor="email"
              className="block text-xs text-slate-500 px-1"
            >
              Email
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
              className="w-full bg-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 placeholder:text-slate-400"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full rounded-lg bg-slate-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-slate-800 active:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
            >
              {loading ? "Envoi…" : "Recevoir mon code"}
            </button>
            {error && <ErrorBox message={error} />}
          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-3">
            <p className="text-xs text-slate-500 px-1">
              Code envoyé à{" "}
              <span className="text-slate-900">{email}</span>
            </p>
            <input
              id="code"
              type="text"
              required
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={10}
              placeholder="Code"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              className="w-full bg-slate-100 rounded-lg px-3 py-3 text-center text-xl font-semibold tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-slate-300 placeholder:text-base placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full rounded-lg bg-slate-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-slate-800 active:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
            >
              {loading ? "Connexion…" : "Se connecter"}
            </button>
            {error && <ErrorBox message={error} />}
            <div className="flex items-center justify-between text-[11px] pt-1 px-1">
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError(null);
                }}
                className="text-slate-500 hover:text-slate-900"
              >
                Changer d'email
              </button>
              <button
                type="button"
                onClick={sendCode}
                disabled={loading}
                className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                Renvoyer
              </button>
            </div>
          </form>
        )}

        {/* Footer contact, ultra discret */}
        <div className="text-center mt-10">
          <p className="text-[11px] text-slate-400 mb-2">
            Pas encore de compte ?
          </p>
          <WhatsAppButton
            label="Me contacter"
            variant="secondary"
            className="text-xs"
          />
        </div>
      </div>
    </main>
  );
}

// ────────────────────────────────────────────────────────────

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="text-xs text-red-600 px-1 pt-1">{message}</div>
  );
}
