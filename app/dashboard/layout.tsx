import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Artisan } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: artisan } = await supabase
    .from("artisans")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<Artisan>();

  if (!artisan) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-white border border-slate-200 rounded-2xl p-8">
          <h1 className="text-xl font-semibold mb-2">Compte non configuré</h1>
          <p className="text-slate-600 text-sm mb-6">
            Ton compte <code className="bg-slate-100 px-1 rounded">{user.email}</code> est créé
            mais aucun profil artisan n'y est rattaché.
            <br />
            Contacte l'admin Plombare pour finaliser ta configuration.
          </p>
          <form action="/api/auth/signout" method="post">
            <button className="text-sm text-slate-500 hover:text-slate-900 underline">
              Se déconnecter
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="font-semibold text-slate-900">
            Plombare
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-600 hidden sm:inline">{artisan.name}</span>
            <form action="/api/auth/signout" method="post">
              <button className="text-slate-500 hover:text-slate-900">
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4 py-6">{children}</div>
    </div>
  );
}
