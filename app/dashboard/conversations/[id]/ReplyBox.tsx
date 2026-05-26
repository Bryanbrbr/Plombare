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
    <div>
      {status === "paused" && (
        <div className="flex justify-between items-center mb-2 px-1">
          <span className="text-sm text-slate-400">IA en pause</span>
          <button
            onClick={handleResume}
            disabled={pending}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            Réactiver l'IA
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-end gap-2"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Écris au client…"
          rows={1}
          disabled={pending}
          className="flex-1 resize-none text-lg bg-slate-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50 placeholder:text-slate-400 max-h-36"
          style={{ minHeight: "48px" }}
        />
        <button
          type="submit"
          disabled={pending || !text.trim()}
          aria-label="Envoyer"
          className="shrink-0 w-12 h-12 rounded-full bg-slate-900 text-white hover:bg-slate-800 active:bg-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center"
        >
          {pending ? (
            <svg
              className="animate-spin"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </form>

      {error && (
        <div className="mt-2 text-sm text-red-600 px-1">{error}</div>
      )}
    </div>
  );
}
