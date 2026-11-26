"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoLastro } from "@financas/ui";
import { layout, paleta } from "@financas/ui/tokens";
import { BotaoOcultarValores } from "./BotaoOcultarValores";
import { estaAtivo, ITENS_NAVEGACAO } from "./itens";

/** Ajustes fica no ícone de engrenagem, não nas abas. */
const ABAS = ITENS_NAVEGACAO.filter((i) => i.href !== "/ajustes");

/**
 * Barra superior a partir de 600 px (tablet e desktop): logotipo, abas, ocultar valores,
 * Ajustes e "Novo gasto". No celular, quem navega é a barra inferior.
 */
export function MenuPrincipal() {
  const pathname = usePathname();
  const emAjustes = estaAtivo(pathname, "/ajustes");
  return (
    <Box
      component="header"
      sx={{
        display: { xs: "none", sm: "block" },
        position: "sticky",
        top: 0,
        zIndex: (t) => t.zIndex.appBar,
        bgcolor: paleta.fundo,
        borderBottom: `1px solid ${paleta.divisor}`,
      }}
    >
      <Box
        sx={{
          maxWidth: layout.larguraConteudo + 2 * layout.margemDesktop,
          mx: "auto",
          px: { sm: 6, md: 8 },
          minHeight: layout.alturaBarraTopo,
          display: "flex",
          alignItems: "center",
          gap: { sm: 3, md: 6 },
        }}
      >
        <Box component={Link} href="/" aria-label="Lastro, início" sx={{ display: "flex", alignItems: "center", minHeight: 44, textDecoration: "none" }}>
          <LogoLastro tamanho={22} />
        </Box>
        <Box
          component="nav"
          aria-label="Navegação principal"
          sx={{ flex: 1, minWidth: 0, alignSelf: "stretch", display: "flex", flexDirection: "row", gap: 1, overflowX: "auto", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}
        >
          {ABAS.map((item) => {
            const ativo = estaAtivo(pathname, item.href, item.exato);
            return (
              <ButtonBase
                key={item.href}
                component={Link}
                href={item.href}
                aria-current={ativo ? "page" : undefined}
                sx={{
                  px: 3,
                  minHeight: 44,
                  whiteSpace: "nowrap",
                  fontSize: 14,
                  color: ativo ? paleta.texto : paleta.textoSecundario,
                  // Aba ativa: sublinhado lima (além da cor e do aria-current).
                  borderBottom: `2px solid ${ativo ? paleta.acao : "transparent"}`,
                  "&:hover": { color: paleta.texto, bgcolor: paleta.painel },
                }}
              >
                {item.rotuloLongo}
              </ButtonBase>
            );
          })}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <BotaoOcultarValores />
          <IconButton
            component={Link}
            href="/ajustes"
            aria-label="Ajustes"
            aria-current={emAjustes ? "page" : undefined}
            sx={{ border: `1px solid ${emAjustes ? paleta.acao : paleta.divisor}`, color: emAjustes ? paleta.texto : paleta.textoSecundario }}
          >
            <SettingsOutlined fontSize="small" />
          </IconButton>
          {/* Lima só no Início, onde "Novo gasto" é a ação principal; nas demais telas ela é secundária. */}
          <Button
            component={Link}
            href="/gastos/novo"
            variant={pathname === "/" ? "contained" : "outlined"}
            startIcon={<AddRounded />}
            sx={{ whiteSpace: "nowrap" }}
          >
            Novo gasto
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
