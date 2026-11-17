import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "./providers";

// Inter substitui a fonte do Mercury; o tema lê a variável --fonte-inter.
const inter = Inter({ subsets: ["latin"], variable: "--fonte-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Finanças", template: "%s · Finanças" },
  appleWebApp: { capable: true, title: "Finanças", statusBarStyle: "black-translucent" },
  icons: { apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#171721",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
