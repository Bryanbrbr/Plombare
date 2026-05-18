import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Artisan } from "@/lib/types";
import { LogoWithText } from "@/components/Logo";
import { Avatar } from "@/components/Avatar";

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
        <div className="max-w-md text-center bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-700 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h1 className="text-xl font-semibold mb-2">Compte non configuré</h1>
          <p className="text-slate-600 text-sm mb-6">
            Ton compte{" "}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-900">
              {user.email}
            </code>{" "}
            est créé mais aucun profil artisan n'y est rattaché.
            <br />
            Contacte l'admin Plombare pour finaliser ta configuration.
          </p>
          <form action="/api/auth/signout" method="post">
            <button className="text-sm text-slate-500 hover:text-slate-900 underline underline-offset-2">
              Se déconnecter
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <LogoWithText
              size={26}
              textClassName="text-slate-900 font-semibold text-base sm:text-lg tracking-tight"
            />
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <Avatar name={artisan.name} size={32} />
              <span className="text-sm font-medium text-slate-700 hidden sm:inline">
                {artisan.name}
              </span>
            </div>
            <form action="/api/auth/signout" method="post">
              <button
                className="text-xs sm:text-sm text-slate-500 hover:text-slate-900 transition-colors"
                title="Se déconnecter"
              >
                <span className="hidden sm:inline">Déconnexion</span>
                <svg
                  className="sm:hidden"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4 py-6">{children}</div>
    </div>
  );
}
