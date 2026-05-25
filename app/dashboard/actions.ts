"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionResult = { ok: true; updated: number } | { error: string };

/**
 * Action en masse : archive (status='closed') ou réouvre (status='open')
 * plusieurs conversations d'un coup.
 *
 * Sécurité : on filtre via le client utilisateur (RLS) pour ne traiter que
 * les convs appartenant à l'artisan connecté, puis on update via le client
 * admin (bypass RLS pour l'UPDATE en masse).
 */
export async function bulkSetStatus(
  ids: string[],
  status: "open" | "closed"
): Promise<ActionResult> {
  if (ids.length === 0) {
    return { error: "Aucune conversation sélectionnée." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  // RLS : ne renvoie que les ids appartenant à cet artisan
  const { data: ownedConvs } = await supabase
    .from("conversations")
    .select("id")
    .in("id", ids);

  const ownedIds = (ownedConvs ?? []).map((c) => c.id);
  if (ownedIds.length === 0) {
    return { error: "Aucune conversation autorisée." };
  }

  const db = createAdminClient();
  await db
    .from("conversations")
    .update({
      status,
      last_seen_at: new Date().toISOString(),
    })
    .in("id", ownedIds);

  revalidatePath("/dashboard");
  return { ok: true, updated: ownedIds.length };
}
