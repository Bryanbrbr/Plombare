import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

// Exclut : assets statiques, favicon, images, ET le webhook Twilio
// (Twilio n'envoie pas de cookie Supabase, inutile de tourner l'auth dessus).
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
