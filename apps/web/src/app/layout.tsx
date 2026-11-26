import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import { paleta } from "@financas/ui/tokens";
import { Providers } from "./providers";

// Lastro: Space Grotesk na interface e JetBrains Mono em valores, datas e rótulos.
// O tema lê as variáveis --fonte-grotesk e --fonte-mono.
const grotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--fonte-grotesk", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--fonte-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Lastro", template: "%s · Lastro" },
  applicationName: "Lastro",
  appleWebApp: { capable: true, title: "Lastro", statusBarStyle: "black-translucent" },
  icons: { apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: paleta.fundo,
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${grotesk.variable} ${mono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
