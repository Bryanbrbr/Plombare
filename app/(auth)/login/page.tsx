"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-semibold mb-1">Plombare</h1>
        <p className="text-slate-500 text-sm mb-6">
          Connecte-toi pour voir tes conversations clients.
        </p>

        {status === "sent" ? (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
            ✉️ Lien magique envoyé à <strong>{email}</strong>.
            <br />
            Ouvre ton mail pour te connecter.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="ton@email.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              disabled={status === "sending"}
            />
            <button
              type="submit"
              disabled={status === "sending" || !email}
              className="w-full rounded-lg bg-slate-900 text-white px-3 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "sending" ? "Envoi…" : "Recevoir le lien magique"}
            </button>
            {error && (
              <div className="text-sm text-red-600 pt-1">{error}</div>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
