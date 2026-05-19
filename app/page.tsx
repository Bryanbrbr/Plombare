import { redirect } from "next/navigation";

// Pas de landing. / redirige direct vers /dashboard.
// Si pas authentifié, le middleware redirigera vers /login.
export default function Home() {
  redirect("/dashboard");
}
