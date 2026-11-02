"use client";

import EditRounded from "@mui/icons-material/EditRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { formatarDiaMes, nomeDoMes, type DivisaoDaFatura, type SituacaoFatura } from "@financas/core";
import { BarraProgresso, SeloStatus, Valor } from "@financas/ui";
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

function Indicador({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, minWidth: 0 }}>
      <Typography variant="caption">{rotulo}</Typography>
      <Valor valor={valor} sx={{ fontSize: 14, fontWeight: 700 }} />
    </Box>
  );
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

  return (
    <Card component="section" aria-label={`Fatura de ${nomeDoMes(fatura.mes)}`} sx={{ p: { xs: 5, md: 6 }, display: "flex", flexDirection: "column", gap: 5 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 4, md: 8 }, alignItems: "flex-start" }}>
        <Box sx={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
              Fatura de {nomeDoMes(fatura.mes, false)}
            </Typography>
            <Chip size="small" label={s.rotulo} sx={{ height: 22, fontSize: 11, color: s.cor, bgcolor: s.fundo }} />
          </Box>
          <Valor valor={divisao.total} component="p" sx={{ m: 0, fontSize: { xs: 32, md: 34 }, fontWeight: 800, letterSpacing: "-0.5px" }} />
        </Box>

        <Box sx={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="caption">Fechamento</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography sx={{ fontWeight: 800 }}>{formatarDiaMes(fatura.fechamento)}</Typography>
              <SeloStatus status={fatura.status} />
              <IconButton size="small" aria-label="Corrigir datas desta fatura" onClick={onCorrigirDatas} sx={{ color: "primary.main" }}>
                <EditRounded fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="caption">Vencimento</Typography>
            <Typography sx={{ fontWeight: 800, lineHeight: "44px" }}>{formatarDiaMes(fatura.vencimento)}</Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 3 }}>
        <Indicador rotulo="À vista" valor={divisao.aVista} />
        <Indicador rotulo="Parcelas" valor={divisao.parcelas} />
        <Indicador rotulo="Assinaturas" valor={divisao.assinaturas} />
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
        <Box sx={{ flex: "1 1 220px" }}>
          <BarraProgresso
            percentual={pct}
            rotulo="Conferidos com o banco"
            detalhe={`${divisao.conferidos} de ${divisao.quantidade}`}
          />
        </Box>
        {situacao !== "futura" && (
          <Button
            variant={situacao === "paga" ? "outlined" : "contained"}
            onClick={onAlternarPagamento}
            disabled={carregandoPagamento}
            sx={{ flex: { xs: "1 1 100%", sm: "0 0 auto" } }}
          >
            {situacao === "paga" ? "Desmarcar pagamento" : "Marcar como paga"}
          </Button>
        )}
      </Box>
    </Card>
  );
}
