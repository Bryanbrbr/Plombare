import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Artisan } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { WhatsAppButton } from "@/components/WhatsAppButton";

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
      <main className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-sm text-center">
          <h1 className="text-base font-semibold mb-2 text-slate-900">
            Compte non configuré
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            Ton compte{" "}
            <code className="text-slate-900">{user.email}</code> est créé
            mais aucun profil n'y est rattaché.
          </p>

          <WhatsAppButton
            message={`Bonjour Bryan, je viens de créer mon compte Plombare avec l'email ${user.email}. Peux-tu finaliser ma configuration s'il te plaît ?`}
            label="Me contacter pour activer"
            variant="primary"
            className="w-full justify-center mb-4"
          />

          <form action="/api/auth/signout" method="post">
            <button className="text-xs text-slate-400 hover:text-slate-700 underline underline-offset-2">
              Se déconnecter
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-base font-semibold text-slate-900 hover:opacity-80 transition-opacity"
          >
            <Logo size={20} className="text-blue-600" />
            Plombare
          </Link>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="hidden sm:inline truncate max-w-[180px]">
              {artisan.name}
            </span>
            <form action="/api/auth/signout" method="post">
              <button className="hover:text-slate-900 transition-colors">
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-5">{children}</div>
    </div>
  );
}
