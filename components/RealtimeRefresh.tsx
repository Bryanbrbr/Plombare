"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Petit composant invisible qui s'abonne aux INSERT sur la table `messages`
 * via Supabase Realtime et déclenche `router.refresh()` à chaque nouveau
 * message → la page (Server Component) se re-rend automatiquement.
 *
 * Usage :
 *   <RealtimeRefresh />                                ← liste : tous les messages
 *   <RealtimeRefresh filter="conversation_id=eq.xxx" /> ← détail : 1 conv précise
 *
 * RLS s'applique aux abonnements Realtime : un artisan ne reçoit que les
 * events des messages qu'il a le droit de lire.
 *
 * ⚠️ Requiert d'avoir activé la publication Realtime sur la table `messages` :
 *   alter publication supabase_realtime add table messages;
 */
export function RealtimeRefresh({ filter }: { filter?: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    // Nom de channel unique selon le filtre (évite collisions si plusieurs
    // instances montées en même temps).
    const channelName = `messages-rt-${filter ?? "all"}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          ...(filter ? { filter } : {}),
        },
        () => {
          // Un message vient d'être inséré → on re-rend la page côté serveur.
          // Pas d'optimistic UI : on laisse le SSR récupérer la vraie data.
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, filter]);

  return null;
}
