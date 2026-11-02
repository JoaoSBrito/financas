"use client";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import { formatarData, type Centavos, type Data } from "@financas/core";
import { cores } from "../tokens";
import { BarraProgresso } from "./BarraProgresso";
import { Valor } from "./Valor";

export interface CardCaixinhaProps {
  nome: string;
  /** Ex.: "Vinculada ao cartão XP · 102% do CDI". */
  detalhe?: string;
  saldo: Centavos;
  meta?: Centavos | null;
  dataMeta?: Data | null;
  /** Ex.: "Guarde R$ 80,00 por semana para cobrir a fatura". */
  dica?: string;
  onAbrir?: () => void;
}

/** Caixinha com saldo, meta e progresso. */
export function CardCaixinha({ nome, detalhe, saldo, meta, dataMeta, dica, onAbrir }: CardCaixinhaProps) {
  const pct = meta ? Math.floor((saldo / meta) * 100) : null;
  const conteudo = (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2.5, textAlign: "left" }}>
      <Box>
        <Typography variant="subtitle1" sx={{ fontSize: 15, fontWeight: 800 }}>
          {nome}
        </Typography>
        {detalhe && <Typography variant="caption">{detalhe}</Typography>}
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 2, flexWrap: "wrap" }}>
        <Valor valor={saldo} sx={{ fontSize: 22, fontWeight: 800 }} />
        {meta ? (
          <Typography variant="caption">
            meta <Valor valor={meta} sx={{ font: "inherit" }} />
            {dataMeta ? ` · ${formatarData(dataMeta)}` : ""}
          </Typography>
        ) : null}
      </Box>
      {pct !== null && <BarraProgresso compacta tom="investimento" percentual={pct} rotulo={`${nome}: ${pct}% da meta`} />}
      {dica && (
        <Typography variant="caption" sx={{ color: cores.investimento, fontWeight: 700 }}>
          {dica}
        </Typography>
      )}
    </Box>
  );
  return (
    <Card component="article" aria-label={nome} sx={{ display: "flex" }}>
      {onAbrir ? (
        <ButtonBase onClick={onAbrir} sx={{ flex: 1, p: 5, borderRadius: 5, alignItems: "stretch" }}>
          {conteudo}
        </ButtonBase>
      ) : (
        <Box sx={{ p: 5, flex: 1 }}>{conteudo}</Box>
      )}
    </Card>
  );
}
