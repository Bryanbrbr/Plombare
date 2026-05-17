import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plombare",
  description: "Secrétaire IA WhatsApp pour plombiers",
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
