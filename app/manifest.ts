import type { MetadataRoute } from "next";

/**
 * Manifest PWA — permet aux utilisateurs d'installer Plombare
 * sur leur écran d'accueil (iOS & Android) comme une vraie app.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Plombare — Secrétaire IA WhatsApp",
    short_name: "Plombare",
    description:
      "Ta secrétaire IA WhatsApp. Réponds à tes clients 24/7 sans lever le petit doigt.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8fafc",
    theme_color: "#2563EB",
    lang: "fr-FR",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/apple-icon.svg",
        sizes: "180x180",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
