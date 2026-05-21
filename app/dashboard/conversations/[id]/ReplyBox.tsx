"use client";

import { useState, useTransition } from "react";
import { sendReply, resumeAI } from "./actions";
import type { ConversationStatus } from "@/lib/types";

export function ReplyBox({
  conversationId,
  status,
}: {
  conversationId: string;
  status: ConversationStatus;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSend() {
    const t = text.trim();
    if (!t || pending) return;
    setError(null);
    startTransition(async () => {
      const res = await sendReply(conversationId, t);
      if ("error" in res) {
        setError(res.error);
      } else {
        setText("");
      }
    });
  }

  function handleResume() {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const res = await resumeAI(conversationId);
      if ("error" in res) setError(res.error);
    });
  }

  return (
    <div className="mt-6 mb-4">
      {/* Bandeau état IA */}
      {status === "paused" ? (
        <div className="flex items-center justify-between gap-3 bg-slate-100 border border-slate-200 rounded-t-xl px-4 py-2.5 text-sm">
          <span className="text-slate-600">
            ⏸️ L'IA est en pause — c'est toi qui réponds.
          </span>
          <button
            onClick={handleResume}
            disabled={pending}
            className="shrink-0 text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
          >
            Redonner la main à l'IA
          </button>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-100 rounded-t-xl px-4 py-2.5 text-sm text-blue-800">
          🤖 L'IA répond automatiquement. Si tu écris, elle se met en pause.
        </div>
      )}

      {/* Zone de saisie */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="border border-t-0 border-slate-200 rounded-b-xl bg-white p-3"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Entrée = envoyer, Maj+Entrée = nouvelle ligne
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Écris ta réponse au client…"
          rows={2}
          disabled={pending}
          className="w-full resize-none text-sm px-2 py-1.5 focus:outline-none disabled:opacity-50 placeholder:text-slate-400"
        />
        <div className="flex items-center justify-between gap-3 mt-2">
          <span className="text-[11px] text-slate-400">
            Envoyé au client sur WhatsApp.
          </span>
          <button
            type="submit"
            disabled={pending || !text.trim()}
            className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
          >
            {pending ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Envoi…
              </>
            ) : (
              <>
                Envoyer
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </>
            )}
          </button>
        </div>
        {error && (
          <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
