"use client";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { formatarData, type Centavos, type Data } from "@financas/core";
import { paleta, raio, semantica, tipografia } from "../tokens";
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
  /** Destaque curto acima do nome (ex.: "Reserva de emergência"). */
  selo?: string;
  onAbrir?: () => void;
}

/** Caixinha com saldo, meta e progresso. */
export function CardCaixinha({ nome, detalhe, saldo, meta, dataMeta, dica, selo, onAbrir }: CardCaixinhaProps) {
  const pct = meta ? Math.floor((saldo / meta) * 100) : null;
  const conteudo = (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2.5, textAlign: "left" }}>
      <Box>
        {selo && (
          <Chip
            size="small"
            label={selo}
            sx={{ height: 22, fontSize: 10, mb: 1.5, fontFamily: tipografia.familiaMono, textTransform: "uppercase", borderRadius: `${raio.selo}px`, color: semantica.confirmado.texto, bgcolor: semantica.confirmado.fundo }}
          />
        )}
        <Typography variant="subtitle1" sx={{ fontSize: 16, fontWeight: 500 }}>
          {nome}
        </Typography>
        {detalhe && (
          <Typography variant="caption" component="div" sx={{ fontFamily: tipografia.familiaMono, fontSize: 11, textTransform: "uppercase" }}>
            {detalhe}
          </Typography>
        )}
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 2, flexWrap: "wrap" }}>
        <Valor valor={saldo} sx={{ fontSize: 20, fontWeight: 500 }} />
        {meta ? (
          <Typography variant="caption" sx={{ fontFamily: tipografia.familiaMono, fontSize: 11 }}>
            meta <Valor valor={meta} sx={{ font: "inherit" }} />
            {dataMeta ? ` · ${formatarData(dataMeta)}` : ""}
          </Typography>
        ) : null}
      </Box>
      {pct !== null && (
        // Régua em 20 blocos até a meta.
        <Box
          role="progressbar"
          aria-label={`${nome}: ${pct}% da meta`}
          aria-valuenow={Math.min(100, pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          sx={{ display: "grid", gridTemplateColumns: "repeat(20, minmax(0, 1fr))", gap: "2px" }}
        >
          {Array.from({ length: 20 }, (_, i) => (
            <Box key={i} sx={{ height: 6, bgcolor: i < Math.round(Math.min(100, pct) / 5) ? paleta.acao : paleta.divisor }} />
          ))}
        </Box>
      )}
      {dica && (
        <Typography variant="body2" sx={{ fontFamily: tipografia.familiaMono, fontSize: 12, color: semantica.receita.texto }}>
          {dica}
        </Typography>
      )}
    </Box>
  );
  return (
    <Card component="article" aria-label={nome} sx={{ display: "flex" }}>
      {onAbrir ? (
        <ButtonBase onClick={onAbrir} sx={{ flex: 1, p: 4, borderRadius: `${raio.painel}px`, alignItems: "stretch" }}>
          {conteudo}
        </ButtonBase>
      ) : (
        <Box sx={{ p: 4, flex: 1 }}>{conteudo}</Box>
      )}
    </Card>
  );
}
