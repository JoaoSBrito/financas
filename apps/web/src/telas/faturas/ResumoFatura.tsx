"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { formatar, formatarDiaMes, nomeDoMes, type DivisaoDaFatura, type SituacaoFatura } from "@financas/core";
import { BarraProgresso, BarraSegmentada, Rotulo, SeloStatus, Valor } from "@financas/ui";
import { paleta, tipografia } from "@financas/ui/tokens";
import type { FaturaResumo } from "@/services/cartoes-mapeamento";
import { SITUACAO } from "./textos";

export interface ResumoFaturaProps {
  fatura: FaturaResumo;
  divisao: DivisaoDaFatura;
  situacao: SituacaoFatura;
  carregandoPagamento: boolean;
  onCorrigirDatas: () => void;
  onAlternarPagamento: () => void;
}

export function ResumoFatura({
  fatura,
  divisao,
  situacao,
  carregandoPagamento,
  onCorrigirDatas,
  onAlternarPagamento,
}: ResumoFaturaProps) {
  const s = SITUACAO[situacao];
  const pct = divisao.quantidade ? Math.round((divisao.conferidos / divisao.quantidade) * 100) : 0;
  const divisor = `1px solid ${paleta.divisor}`;
  const composicao = [
    { rotulo: "À vista", valor: divisao.aVista, cor: paleta.texto },
    { rotulo: "Parcelas", valor: divisao.parcelas, cor: paleta.textoSecundario },
    { rotulo: "Assinaturas", valor: divisao.assinaturas, cor: paleta.bordaControle },
  ];

  return (
    <Card component="section" aria-label={`Fatura de ${nomeDoMes(fatura.mes)}`} sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "2fr 1fr 1fr" } }}>
      <Box sx={{ gridColumn: { xs: "1 / -1", md: "auto" }, p: { xs: "16px", md: "18px 24px" }, display: "flex", flexDirection: "column", gap: 1.5, borderBottom: { xs: divisor, md: "none" }, borderRight: { md: divisor } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
          <Rotulo>Fatura de {nomeDoMes(fatura.mes, false)}</Rotulo>
          <Chip size="small" label={s.rotulo} sx={{ height: 22, fontSize: 10, fontFamily: tipografia.familiaMono, textTransform: "uppercase", borderRadius: "4px", color: s.cor, bgcolor: s.fundo }} />
        </Box>
        <Valor valor={divisao.total} component="p" sx={{ m: 0, fontSize: { xs: 36, md: 32 }, fontWeight: 500, lineHeight: 1.1, letterSpacing: "-0.03em" }} />
      </Box>
      <Box sx={{ p: { xs: "12px 16px", md: "18px 24px" }, display: "flex", flexDirection: "column", gap: 1, borderRight: divisor }}>
        <Rotulo>Fecha</Rotulo>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <Typography sx={{ fontFamily: tipografia.familiaMono, fontSize: 16 }}>{formatarDiaMes(fatura.fechamento)}</Typography>
          <SeloStatus status={fatura.status} />
        </Box>
      </Box>
      <Box sx={{ p: { xs: "12px 16px", md: "18px 24px" }, display: "flex", flexDirection: "column", gap: 1 }}>
        <Rotulo>Vence</Rotulo>
        <Typography sx={{ fontFamily: tipografia.familiaMono, fontSize: 16 }}>{formatarDiaMes(fatura.vencimento)}</Typography>
      </Box>

      <Box sx={{ gridColumn: "1 / -1", borderTop: divisor, p: { xs: "12px 16px", md: "14px 24px" }, display: "flex", flexDirection: "column", gap: 2 }}>
        <BarraSegmentada
          rotulo={`Composição: ${composicao.map((c) => `${c.rotulo} ${formatar(c.valor)}`).join(", ")}`}
          total={Math.max(1, divisao.total)}
          segmentos={composicao}
        />
        <Box component="dl" sx={{ m: 0, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 1 }}>
          {composicao.map((c) => (
            <Box key={c.rotulo} sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Box component="dt" sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                <Box component="span" aria-hidden sx={{ width: 7, height: 7, bgcolor: c.cor }} />
                <Rotulo>{c.rotulo}</Rotulo>
              </Box>
              <Box component="dd" sx={{ m: 0 }}>
                <Valor valor={c.valor} sx={{ fontSize: 14 }} />
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ gridColumn: "1 / -1", borderTop: divisor, p: { xs: "12px 16px", md: "14px 24px" } }}>
        <BarraProgresso percentual={pct} tom="investimento" rotulo="Conferidos com o banco" detalhe={`${divisao.conferidos} de ${divisao.quantidade}`} />
      </Box>

      <Box sx={{ gridColumn: "1 / -1", borderTop: divisor, p: { xs: "12px 16px 16px", md: "14px 24px" }, display: "grid", gridTemplateColumns: situacao !== "futura" ? "minmax(0, 3fr) minmax(0, 2fr)" : "minmax(0, 1fr)", gap: 2 }}>
        {situacao !== "futura" && (
          <Button variant={situacao === "paga" ? "outlined" : "contained"} onClick={onAlternarPagamento} disabled={carregandoPagamento}>
            {situacao === "paga" ? "Desmarcar pagamento" : "Marcar como paga"}
          </Button>
        )}
        <Button variant="outlined" onClick={onCorrigirDatas} aria-label="Corrigir datas desta fatura">
          Corrigir datas
        </Button>
      </Box>
    </Card>
  );
}
