"use client";

import EditRounded from "@mui/icons-material/EditRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { formatarDiaMes, type Centavos, type Data } from "@financas/core";
import { SeloStatus, type StatusData } from "./SeloStatus";
import { Valor } from "./Valor";

export interface ItemFaturaFuturaProps {
  /** Ex.: "Dezembro". Sem título, a linha destaca a data de fechamento. */
  titulo?: string;
  fechamento: Data;
  vencimento: Data;
  status: StatusData;
  valor?: Centavos;
  /** Observação curta após o vencimento (ex.: "dia 10 é domingo"). */
  observacao?: string;
  onCorrigir?: () => void;
  /** Nome do mês para o rótulo acessível do botão de correção. */
  nomeMes?: string;
}

/** Linha de fatura futura: datas, selo Estimado/Confirmado e correção da data. */
export function ItemFaturaFutura({
  titulo,
  fechamento,
  vencimento,
  status,
  valor,
  observacao,
  onCorrigir,
  nomeMes,
}: ItemFaturaFuturaProps) {
  const principal = titulo ?? `Fecha ${formatarDiaMes(fechamento)}`;
  const secundario = titulo
    ? `Fecha ${formatarDiaMes(fechamento)} · vence ${formatarDiaMes(vencimento)}`
    : `Vence ${formatarDiaMes(vencimento)}`;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, minHeight: 58 }}>
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Typography variant="subtitle1">{principal}</Typography>
        <Typography variant="caption" component="div">
          {observacao ? `${secundario} · ${observacao}` : secundario}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
        {valor !== undefined && <Valor valor={valor} sx={{ fontSize: 14, fontWeight: 700 }} />}
        <SeloStatus status={status} />
      </Box>
      {onCorrigir && (
        <IconButton
          onClick={onCorrigir}
          aria-label={`Corrigir datas da fatura${nomeMes ? ` de ${nomeMes}` : ""}`}
          sx={{ color: "primary.main", mr: -2 }}
        >
          <EditRounded fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
}
