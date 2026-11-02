"use client";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { nomeDoMes, type ParcelamentoAtivo } from "@financas/core";
import { BarraParcelas, ItemFaturaFutura, SecaoCard, Valor } from "@financas/ui";
import type { FaturaResumo } from "@/services/cartoes-mapeamento";
import { maiuscula, mesCurto } from "./textos";

export function ProximasFaturas({
  faturas,
  cartaoId,
  onCorrigir,
}: {
  faturas: FaturaResumo[];
  cartaoId: string;
  onCorrigir: (f: FaturaResumo) => void;
}) {
  return (
    <SecaoCard
      titulo="Próximas faturas"
      gap={1}
      acao={
        <Typography component={Link} href={`/cartoes/${cartaoId}/configurar`} variant="body2" sx={{ fontWeight: 700, textDecoration: "none", color: "primary.main" }}>
          Ajustar regra
        </Typography>
      }
    >
      {faturas.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary", py: 2 }}>
          Nenhuma fatura futura gerada.
        </Typography>
      ) : (
        faturas.map((f, i) => (
          <Box key={f.id}>
            {i > 0 && <Divider />}
            <ItemFaturaFutura
              titulo={maiuscula(nomeDoMes(f.mes, false))}
              fechamento={f.fechamento}
              vencimento={f.vencimento}
              status={f.status}
              valor={f.total}
              nomeMes={nomeDoMes(f.mes)}
              onCorrigir={() => onCorrigir(f)}
            />
          </Box>
        ))
      )}
      <Typography variant="caption" component="p" sx={{ pt: 2 }}>
        Valores futuros são parcelas já lançadas.
      </Typography>
    </SecaoCard>
  );
}

export function ParcelamentosAtivos({ itens, cartaoId }: { itens: ParcelamentoAtivo[]; cartaoId: string }) {
  return (
    <SecaoCard
      titulo="Parcelamentos ativos"
      acao={
        <Typography
          component={Link}
          href={`/parcelamentos/em-andamento?cartao=${cartaoId}`}
          variant="body2"
          sx={{ fontWeight: 700, textDecoration: "none", color: "primary.main" }}
        >
          + Em andamento
        </Typography>
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
