"use client";

import { useEffect } from "react";
import { markSeen } from "./actions";

/**
 * Composant invisible qui marque la conversation comme lue
 * dès que la page détail est montée. Mis à jour aussi si l'id change
 * (navigation entre 2 convs sans démonter la page).
 */
export function MarkSeen({ conversationId }: { conversationId: string }) {
  useEffect(() => {
    // Fire-and-forget : si ça échoue, ce n'est pas grave (silencieux).
    markSeen(conversationId).catch(() => {});
  }, [conversationId]);

  return null;
}
