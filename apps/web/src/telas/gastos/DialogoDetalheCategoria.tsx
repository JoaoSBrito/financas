"use client";

import CloseRounded from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useState } from "react";
import { formatarDiaMes } from "@financas/core";
import { ItemLancamento, Valor } from "@financas/ui";
import type { GastoDetalhado } from "@/hooks/useGastosDoMes";
import type { Categoria } from "@/services/categorias";
import type { CartaoCompleto } from "@/services/cartoes-mapeamento";
import type { Conta } from "@/services/contas";
import { DialogoMovimento } from "@/telas/contas/Dialogos";
import { DialogoEditarLancamento } from "@/telas/faturas/DialogoEditarLancamento";

export interface DialogoDetalheCategoriaProps {
  titulo: string;
  itens: GastoDetalhado[];
  cartoes: CartaoCompleto[];
  contas: Conta[];
  categorias: Categoria[];
  onFechar: () => void;
}

function detalhe(i: GastoDetalhado, cartoes: CartaoCompleto[], contas: Conta[]): string {
  const data = i.data ? formatarDiaMes(i.data) : null;
  if (i.origem === "cartao" && i.lancamento) {
    const cartao = cartoes.find((c) => c.id === i.lancamento!.cartaoId)?.nome ?? "Cartão";
    const parcela = i.lancamento.totalParcelas > 1 ? `${i.lancamento.numero} de ${i.lancamento.totalParcelas}` : "à vista";
    return [data, cartao, parcela].filter(Boolean).join(" · ");
  }
  const conta = contas.find((c) => c.id === i.movimento?.contaId)?.nome ?? "Conta";
  return [data, conta].filter(Boolean).join(" · ");
}

/** Lançamentos de uma categoria no mês; tocar abre a edição (inclusive para trocar a categoria). */
export function DialogoDetalheCategoria({ titulo, itens, cartoes, contas, categorias, onFechar }: DialogoDetalheCategoriaProps) {
  const tema = useTheme();
  const celular = useMediaQuery(tema.breakpoints.down("sm"));
  const [editando, setEditando] = useState<GastoDetalhado | null>(null);
  const total = itens.reduce((s, i) => s + i.valor, 0);

  return (
    <>
      <Dialog open onClose={onFechar} fullScreen={celular} fullWidth maxWidth="sm" aria-labelledby="titulo-detalhe-categoria">
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: 3, pt: 3, pb: 1 }}>
          <IconButton aria-label="Fechar" onClick={onFechar}>
            <CloseRounded />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography id="titulo-detalhe-categoria" component="h2" sx={{ fontSize: 16, fontWeight: 800 }}>
              {titulo}
            </Typography>
            <Typography variant="caption">
              {itens.length} {itens.length === 1 ? "lançamento" : "lançamentos"} · <Valor valor={total} sx={{ font: "inherit" }} />
            </Typography>
          </Box>
        </Box>
        <DialogContent sx={{ px: { xs: 5, sm: 6 } }}>
          {itens.map((i, n) => (
            <Box key={i.chave}>
              {n > 0 && <Divider />}
              <ItemLancamento
                descricao={i.descricao}
                detalhe={`${i.origem === "cartao" ? "Cartão" : "Conta"} · ${detalhe(i, cartoes, contas)}`}
                valor={i.valor}
                onAbrir={() => setEditando(i)}
              />
            </Box>
          ))}
        </DialogContent>
      </Dialog>

      {editando?.lancamento && (
        <DialogoEditarLancamento lancamento={editando.lancamento} categorias={categorias} onFechar={() => setEditando(null)} />
      )}
      {editando?.movimento && (
        <DialogoMovimento tipo="saida" contas={contas} movimento={editando.movimento} onFechar={() => setEditando(null)} />
      )}
    </>
  );
}
