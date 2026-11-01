"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cores } from "@financas/ui/tokens";
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
        bgcolor: "background.paper",
        borderRight: { md: `1px solid ${cores.borda}` },
        borderBottom: { sm: `1px solid ${cores.borda}`, md: "none" },
        px: 4,
        py: { sm: 3, md: 7 },
        width: { md: 248 },
        flexShrink: 0,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, pb: { md: 5 }, mr: { sm: 2, md: 0 } }}>
        <Typography component="span" sx={{ fontSize: 20, fontWeight: 800 }}>
          Finanças
        </Typography>
        <Box sx={{ display: { sm: "none", md: "block" } }}>
          <BotaoOcultarValores />
        </Box>
      </Box>
      {ITENS_NAVEGACAO.map((item) => {
        const ativo = estaAtivo(pathname, item.href);
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
              px: 3,
              borderRadius: 3,
              fontSize: 14,
              fontWeight: ativo ? 700 : 600,
              color: ativo ? cores.primaria : "#374151",
              bgcolor: ativo ? cores.primariaClara : "transparent",
              "&:hover": { bgcolor: ativo ? cores.primariaClara : cores.fundo },
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
      <Button
        component={Link}
        href="/gastos/novo"
        variant="contained"
        startIcon={<AddRounded />}
        sx={{ mt: { md: 5 }, minHeight: 48 }}
      >
        Novo gasto
      </Button>
    </Box>
  );
}
