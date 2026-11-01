"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ProvedorOcultarValores, tema } from "@financas/ui";
import { usePreferencias } from "@/stores/preferencias";

function OcultarValores({ children }: { children: ReactNode }) {
  const oculto = usePreferencias((s) => s.ocultarValores);
  return <ProvedorOcultarValores oculto={oculto}>{children}</ProvedorOcultarValores>;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true },
        },
      }),
  );

  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={tema}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>
          <OcultarValores>{children}</OcultarValores>
        </QueryClientProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
