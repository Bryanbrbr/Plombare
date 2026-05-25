"use client";

import { useTransition } from "react";
import { archiveConversation, reopenConversation } from "./actions";

export function ArchiveButton({
  conversationId,
  isClosed,
}: {
  conversationId: string;
  isClosed: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function handle() {
    if (pending) return;
    startTransition(async () => {
      if (isClosed) {
        await reopenConversation(conversationId);
      } else {
        await archiveConversation(conversationId);
      }
    });
  }

  return (
    <button
      onClick={handle}
      disabled={pending}
      className="text-xs text-slate-500 hover:text-slate-900 disabled:opacity-50 transition-colors px-2 py-1"
    >
      {pending
        ? "…"
        : isClosed
        ? "Rouvrir"
        : "✓ Terminé"}
    </button>
  );
}
