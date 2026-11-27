"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Fab from "@mui/material/Fab";
import Paper from "@mui/material/Paper";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { paleta, raio } from "@financas/ui/tokens";
import { estaAtivo, ITENS_NAVEGACAO, type ItemNavegacao } from "./itens";

function ItemBarra({ item, ativo }: { item: ItemNavegacao; ativo: boolean }) {
  return (
    <ButtonBase
      component={Link}
      href={item.href}
      aria-current={ativo ? "page" : undefined}
      sx={{ flexDirection: "column", gap: 1, minHeight: 56, borderRadius: `${raio.controle}px`, fontSize: 11, color: ativo ? paleta.texto : paleta.textoSecundario }}
    >
      {item.icone}
      {/* Item ativo: sublinhado lima no rótulo (além da cor e do aria-current). */}
      <Box component="span" sx={{ borderBottom: `2px solid ${ativo ? paleta.acao : "transparent"}`, lineHeight: 1.4 }}>
        {item.rotulo}
      </Box>
    </ButtonBase>
  );
}

/** Barra inferior do celular, com o botão de novo gasto no centro (alcance do polegar). */
export function BottomNav() {
  const pathname = usePathname();
  const itens = ITENS_NAVEGACAO.filter((i) => i.noCelular);
  const [esquerda, direita] = [itens.slice(0, 2), itens.slice(2)];

  return (
    <Paper
      component="nav"
      aria-label="Navegação principal"
      square
      sx={{
        display: { xs: "block", sm: "none" },
        position: "fixed",
        insetInline: 0,
        bottom: 0,
        zIndex: (t) => t.zIndex.appBar,
        bgcolor: paleta.painel,
        borderTop: `1px solid ${paleta.divisor}`,
        pt: 1,
        pb: "calc(8px + env(safe-area-inset-bottom))",
        px: 2,
      }}
    >
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", alignItems: "center" }}>
        {esquerda.map((i) => (
          <ItemBarra key={i.href} item={i} ativo={estaAtivo(pathname, i.href, i.exato)} />
        ))}
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Fab component={Link} href="/gastos/novo" color="primary" aria-label="Novo gasto" sx={{ mt: -5 }}>
            <AddRounded sx={{ fontSize: 28 }} />
          </Fab>
        </Box>
        {direita.map((i) => (
          <ItemBarra key={i.href} item={i} ativo={estaAtivo(pathname, i.href, i.exato)} />
        ))}
      </Box>
    </Paper>
  );
}
