import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Plombare — Secrétaire IA WhatsApp pour plombiers",
    template: "%s · Plombare",
  },
  description:
    "Ne perds plus jamais un client. Plombare répond à tes WhatsApp 24/7, qualifie les demandes et te prévient quand c'est urgent.",
  applicationName: "Plombare",
  authors: [{ name: "Plombare" }],
  openGraph: {
    title: "Plombare — Secrétaire IA WhatsApp",
    description:
      "Réponds à tes clients WhatsApp 24/7 sans lever le petit doigt.",
    locale: "fr_FR",
    type: "website",
  },
  // ── Métadonnées PWA / iOS Web App ─────────────────
  appleWebApp: {
    capable: true,
    title: "Plombare",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false, // Désactive l'auto-détection iOS sur les numéros (on a déjà nos liens tel: contrôlés)
  },
};

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
