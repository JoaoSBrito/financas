import type { MetadataRoute } from "next";
import { paleta } from "@financas/ui/tokens";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Finanças",
    short_name: "Finanças",
    start_url: "/",
    display: "standalone",
    background_color: paleta.fundo,
    theme_color: paleta.fundo,
    lang: "pt-BR",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
