"use client";

import EditRounded from "@mui/icons-material/EditRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
  formatarDiaMes,
  gerarCiclos,
  hojeEmSaoPaulo,
  mesDe,
  nomeDoMes,
  regraFechamentoSchema,
  type CartaoForm,
  type Ciclo,
} from "@financas/core";
import { estiloMono, SecaoCard, SeloStatus } from "@financas/ui";
import { paleta } from "@financas/ui/tokens";
import { DialogoCorrigirData } from "@/componentes/DialogoCorrigirData";
import { useCorrigirFatura } from "@/hooks/useCartoes";
import { confirmadasDe, type Fatura } from "@/services/cartoes-mapeamento";

const QUANTIDADE = 4;

export interface PreviaFechamentosProps {
  /** Só cartões já salvos podem ter datas corrigidas. */
  cartaoId?: string;
  faturas: Fatura[];
}

/** Próximos fechamentos calculados pela regra que está sendo editada, ao vivo. */
export function PreviaFechamentos({ cartaoId, faturas }: PreviaFechamentosProps) {
  const { control, formState } = useFormContext<CartaoForm>();
  const [diaVencimento, vencimentoNaoUtil, fechamento] = useWatch({
    control,
    name: ["diaVencimento", "vencimentoNaoUtil", "fechamento"],
  });
  const [corrigindo, setCorrigindo] = useState<Ciclo | null>(null);
  const corrigir = useCorrigirFatura(cartaoId ?? "");

  const ciclos = useMemo(() => {
    const diaOk = Number.isInteger(diaVencimento) && diaVencimento >= 1 && diaVencimento <= 31;
    const regra = regraFechamentoSchema.safeParse(fechamento);
    if (!diaOk || !regra.success) return null;
    return gerarCiclos(
      { id: cartaoId ?? "novo", diaVencimento, vencimentoNaoUtil, fechamento: regra.data },
      mesDe(hojeEmSaoPaulo()),
      QUANTIDADE,
      confirmadasDe(faturas),
    );
  }, [cartaoId, diaVencimento, vencimentoNaoUtil, fechamento, faturas]);

  const podeCorrigir = Boolean(cartaoId) && !formState.isDirty;

  const linha = { display: "grid", gridTemplateColumns: "40px minmax(0, 1fr) auto 44px", gap: 2, alignItems: "center", minHeight: 52, borderTop: `1px solid ${paleta.divisor}` } as const;

  return (
    <SecaoCard
      titulo="Próximos fechamentos"
      gap={2}
      acao={
        <Box component="span" aria-hidden sx={{ ...estiloMono, fontSize: 10, textTransform: "uppercase", color: "text.secondary" }}>
          Fecha → vence
        </Box>
      }
    >
      {!ciclos ? (
        <Typography variant="body2" sx={{ color: "text.secondary", py: 2 }}>
          Preencha o vencimento e a regra para ver as datas.
        </Typography>
      ) : (
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
          {ciclos.map((c) => {
            const dia = Number(c.vencimento.slice(8, 10));
            const deslocado = dia !== diaVencimento;
            return (
              <Box component="li" key={c.mes} aria-label={`Fatura de ${nomeDoMes(c.mes)}`} sx={linha}>
                <Box component="span" sx={{ ...estiloMono, fontSize: 12, textTransform: "uppercase" }}>
                  {nomeDoMes(c.mes, false).slice(0, 3)}
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <Box component="span" sx={{ ...estiloMono, fontSize: 13 }}>
                    {formatarDiaMes(c.fechamento)} → {formatarDiaMes(c.vencimento)}
                  </Box>
                  {deslocado && (
                    <Box component="span" sx={{ ...estiloMono, fontSize: 11, color: "text.secondary" }}>
                      dia {diaVencimento} não é dia útil
                    </Box>
                  )}
                </Box>
                <SeloStatus status={c.status} />
                {podeCorrigir ? (
                  <IconButton aria-label={`Corrigir datas da fatura de ${nomeDoMes(c.mes)}`} onClick={() => setCorrigindo(c)} sx={{ color: "text.primary" }}>
                    <EditRounded fontSize="small" />
                  </IconButton>
                ) : (
                  <span />
                )}
              </Box>
            );
          })}
        </Box>
      )}
      <Typography variant="caption" component="p">
        {cartaoId
          ? podeCorrigir
            ? "Corrigir uma data muda só aquela fatura. A regra continua valendo para as seguintes."
            : "Salve as alterações para poder corrigir datas."
          : "Depois de salvar, você pode corrigir a data de cada fatura."}
      </Typography>

      {corrigindo && (
        <DialogoCorrigirData
          aberto
          nomeMes={nomeDoMes(corrigindo.mes)}
          fechamento={corrigindo.fechamento}
          vencimento={corrigindo.vencimento}
          salvando={corrigir.isPending}
          erro={corrigir.error?.message}
          onFechar={() => {
            corrigir.reset();
            setCorrigindo(null);
          }}
          onConfirmar={(datas) =>
            corrigir.mutate({ mes: corrigindo.mes, ...datas }, { onSuccess: () => setCorrigindo(null) })
          }
        />
      )}
    </SecaoCard>
  );
}
