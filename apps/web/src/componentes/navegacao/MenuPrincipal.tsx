"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { layout, paleta, raio } from "@financas/ui/tokens";
import { BotaoOcultarValores } from "./BotaoOcultarValores";
import { estaAtivo, ITENS_NAVEGACAO } from "./itens";

/**
 * Menu do tablet e do desktop.
 * No desktop (md+) é lateral; em janelas médias (sm) sobe para o topo e quebra linha.
 */
export function MenuPrincipal() {
  const pathname = usePathname();
  return (
    <Box
      component="nav"
      aria-label="Navegação principal"
      sx={{
        display: { xs: "none", sm: "flex" },
        flexDirection: { sm: "row", md: "column" },
        flexWrap: { sm: "wrap", md: "nowrap" },
        alignItems: { sm: "center", md: "stretch" },
        gap: 1.5,
        bgcolor: paleta.fundo,
        borderRight: { md: `1px solid ${paleta.divisor}` },
        borderBottom: { sm: `1px solid ${paleta.divisor}`, md: "none" },
        px: 4,
        py: { sm: 3, md: 8 },
        width: { md: layout.larguraMenuLateral },
        boxSizing: "border-box",
        flexShrink: 0,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, pb: { md: 5 }, mr: { sm: 2, md: 0 } }}>
        <Typography component="span" sx={{ fontSize: 16, fontWeight: 600, letterSpacing: "0.08em" }}>
          LASTRO
        </Typography>
        <Box sx={{ display: { sm: "none", md: "block" } }}>
          <BotaoOcultarValores />
        </Box>
      </Box>
      {ITENS_NAVEGACAO.map((item) => {
        const ativo = estaAtivo(pathname, item.href, item.exato);
        return (
          <ButtonBase
            key={item.href}
            component={Link}
            href={item.href}
            aria-current={ativo ? "page" : undefined}
            sx={{
              justifyContent: "flex-start",
              gap: 3,
              minHeight: 44,
              px: 4,
              borderRadius: `${raio.pilula}px`,
              fontSize: 14,
              color: ativo ? paleta.texto : paleta.textoSecundario,
              bgcolor: ativo ? paleta.interativo : "transparent",
              "&:hover": { bgcolor: paleta.interativo, color: paleta.texto },
            }}
          >
            {item.icone}
            {item.rotuloLongo}
          </ButtonBase>
        );
      })}
      <Box sx={{ display: { sm: "flex", md: "none" }, ml: "auto", gap: 2 }}>
        <BotaoOcultarValores />
      </Box>
      {/* Cobalto só no Início, onde "Novo gasto" é a ação principal; nas demais telas ela é secundária. */}
      <Button
        component={Link}
        href="/gastos/novo"
        variant="contained"
        color={pathname === "/" ? "primary" : "secondary"}
        startIcon={<AddRounded />}
        sx={{ mt: { md: 5 }, minHeight: 48 }}
      >
        Novo gasto
      </Button>
    </Box>
  );
}
