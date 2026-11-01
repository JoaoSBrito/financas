import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "./providers";

const manrope = Manrope({ subsets: ["latin"], variable: "--fonte-manrope", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Finanças", template: "%s · Finanças" },
  appleWebApp: { capable: true, title: "Finanças", statusBarStyle: "default" },
  icons: { apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1E1B4B",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={manrope.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
