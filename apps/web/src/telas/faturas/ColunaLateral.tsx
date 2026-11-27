"use client";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { LinkDiscreto } from "@/componentes/LinkDiscreto";
import type { ParcelamentoAtivo } from "@financas/core";
import { BarraParcelas, SecaoCard, Valor } from "@financas/ui";
import { mesCurto } from "./textos";

export function ParcelamentosAtivos({ itens, cartaoId }: { itens: ParcelamentoAtivo[]; cartaoId: string }) {
  return (
    <SecaoCard
      titulo="Parcelamentos ativos"
      acao={
        <LinkDiscreto href={`/parcelamentos/em-andamento?cartao=${cartaoId}`}>+ Em andamento</LinkDiscreto>
      }
    >
      {itens.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Nenhuma compra parcelada em andamento.
        </Typography>
      ) : (
        itens.map((p, i) => (
          <Box key={p.compraId} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {i > 0 && <Divider sx={{ mb: 2 }} />}
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
              <Typography variant="subtitle1" noWrap>
                {p.descricao}
              </Typography>
              <Typography variant="subtitle1" component="span" sx={{ whiteSpace: "nowrap" }}>
                <Valor valor={p.valorParcela} sx={{ font: "inherit" }} />
                /mês
              </Typography>
            </Box>
            <BarraParcelas total={p.total} atual={p.atual} />
            <Typography variant="caption" component="p">
              {p.atual} de {p.total} · termina em {mesCurto(p.ultimoMes, 0)} · faltam <Valor valor={p.restante} sx={{ font: "inherit" }} />
            </Typography>
          </Box>
        ))
      )}
    </SecaoCard>
  );
}
