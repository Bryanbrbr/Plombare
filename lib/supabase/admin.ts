import { createClient } from "@supabase/supabase-js";

// Client admin (service_role) — bypass RLS.
// ⚠️ N'utiliser QUE côté serveur dans le webhook Twilio (pas authentifié).
// Ne jamais importer depuis un Client Component.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
