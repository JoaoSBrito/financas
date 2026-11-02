"use client";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
  gerarCiclos,
  hojeEmSaoPaulo,
  mesDe,
  nomeDoMes,
  regraFechamentoSchema,
  type CartaoForm,
  type Ciclo,
} from "@financas/core";
import { ItemFaturaFutura, SecaoCard } from "@financas/ui";
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

  return (
    <SecaoCard titulo="Próximos fechamentos" gap={1}>
      {!ciclos ? (
        <Typography variant="body2" sx={{ color: "text.secondary", py: 2 }}>
          Preencha o vencimento e a regra para ver as datas.
        </Typography>
      ) : (
        ciclos.map((c, i) => {
          const dia = Number(c.vencimento.slice(8, 10));
          const deslocado = dia !== diaVencimento;
          return (
            <Box key={c.mes}>
              {i > 0 && <Divider />}
              <ItemFaturaFutura
                fechamento={c.fechamento}
                vencimento={c.vencimento}
                status={c.status}
                observacao={deslocado ? `dia ${diaVencimento} não é dia útil` : undefined}
                nomeMes={nomeDoMes(c.mes)}
                onCorrigir={podeCorrigir ? () => setCorrigindo(c) : undefined}
              />
            </Box>
          );
        })
      )}
      <Typography variant="caption" component="p" sx={{ pt: 2.5 }}>
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
