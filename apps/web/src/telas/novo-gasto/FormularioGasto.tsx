"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import {
  faturaDaCompra,
  formatarDiaMes,
  melhorCartaoParaHoje,
  nomeDoMes,
  novoGastoSchema,
  simularCompra,
  type Data,
  type NovoGasto,
} from "@financas/core";
import { CampoMoeda, ChipsCategoria, ResumoImpacto, SeletorCartao, SeletorParcelas, Valor } from "@financas/ui";
import { useRegistrarGasto } from "@/hooks/useGastos";
import type { Categoria } from "@/services/categorias";
import { confirmadasDe, resumirFaturas, type CartaoCompleto, type FaturaResumo } from "@/services/cartoes-mapeamento";
import { useAvisos } from "@/stores/avisos";

type Entrada = z.input<typeof novoGastoSchema>;

export interface FormularioGastoProps {
  cartoes: CartaoCompleto[];
  categorias: Categoria[];
  faturas: FaturaResumo[];
  hoje: Data;
  onConcluir: () => void;
}

const abreviar = (mes: string) => nomeDoMes(mes, false).slice(0, 3);

function Rotulo({ children, id }: { children: string; id?: string }) {
  return (
    <Typography id={id} variant="body2" sx={{ fontWeight: 700 }}>
      {children}
    </Typography>
  );
}

export function FormularioGasto({ cartoes, categorias, faturas, hoje, onConcluir }: FormularioGastoProps) {
  const registrar = useRegistrarGasto();
  const mostrarAviso = useAvisos((s) => s.mostrar);

  const faturasPorCartao = useMemo(() => {
    const mapa = new Map<string, FaturaResumo[]>();
    for (const f of faturas) mapa.set(f.cartaoId, [...(mapa.get(f.cartaoId) ?? []), f]);
    return mapa;
  }, [faturas]);

  const melhorHoje = useMemo(
    () =>
      melhorCartaoParaHoje(
        cartoes.map((c) => ({ cartao: c, confirmadas: confirmadasDe(faturasPorCartao.get(c.id) ?? []) })),
        hoje,
      ),
    [cartoes, faturasPorCartao, hoje],
  );

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Entrada, unknown, NovoGasto>({
    resolver: zodResolver(novoGastoSchema),
    defaultValues: {
      valor: 0,
      descricao: "",
      cartaoId: melhorHoje?.cartaoId ?? cartoes[0]?.id ?? "",
      categoriaId: null,
      dataCompra: hoje,
      parcelas: 1,
    },
  });

  const [cartaoId, valor, parcelas, dataCompra] = useWatch({
    control,
    name: ["cartaoId", "valor", "parcelas", "dataCompra"],
  });

  const opcoesCartao = cartoes.map((c) => {
    const ciclo = faturaDaCompra(c, dataCompra || hoje, confirmadasDe(faturasPorCartao.get(c.id) ?? []));
    return {
      id: c.id,
      nome: c.nome,
      detalhe: `Paga em ${formatarDiaMes(ciclo.vencimento)}`,
      recomendado: cartoes.length > 1 && dataCompra === hoje && melhorHoje?.cartaoId === c.id,
    };
  });

  const cartao = cartoes.find((c) => c.id === cartaoId);
  const simulacao = useMemo(() => {
    if (!cartao || !valor || valor <= 0 || !dataCompra) return null;
    const doCartao = faturasPorCartao.get(cartao.id) ?? [];
    const { totaisPorMes, comprometido } = resumirFaturas(doCartao);
    return simularCompra({
      cartao,
      confirmadas: confirmadasDe(doCartao),
      dataCompra,
      valor,
      parcelas: Number(parcelas) || 1,
      totaisPorMes,
      limite: cartao.limite,
      comprometido,
    });
  }, [cartao, valor, parcelas, dataCompra, faturasPorCartao]);

  function salvar(gasto: NovoGasto) {
    registrar.mutate(gasto, {
      onSuccess: () => {
        const mes = simulacao ? nomeDoMes(simulacao.ciclo.mes, false) : null;
        mostrarAviso(mes ? `Gasto salvo na fatura de ${mes}` : "Gasto salvo");
        onConcluir();
      },
    });
  }

  return (
    <Box component="form" onSubmit={handleSubmit(salvar)} noValidate sx={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <Controller
        control={control}
        name="valor"
        render={({ field, fieldState }) => (
          <CampoMoeda
            label="Valor total"
            destaque
            autoFocus
            valor={field.value ? field.value : null}
            onChange={(v) => field.onChange(v ?? 0)}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
            slotProps={{ inputLabel: { shrink: true, sx: { position: "static", transform: "none", textAlign: "center", width: "100%" } } }}
          />
        )}
      />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" }, gap: 3 }}>
        <TextField
          label="Descrição"
          placeholder="Ex.: Mercado"
          error={Boolean(errors.descricao)}
          helperText={errors.descricao?.message}
          {...register("descricao")}
        />
        <TextField
          label="Data da compra"
          type="date"
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: hoje } }}
          error={Boolean(errors.dataCompra)}
          helperText={errors.dataCompra?.message}
          {...register("dataCompra")}
        />
      </Box>

      <Stack spacing={2}>
        <Rotulo>Cartão</Rotulo>
        <Controller
          control={control}
          name="cartaoId"
          render={({ field }) => (
            <SeletorCartao rotulo="Cartão" opcoes={opcoesCartao} valor={field.value} onChange={field.onChange} />
          )}
        />
      </Stack>

      <Stack spacing={2}>
        <Rotulo>Categoria</Rotulo>
        <Controller
          control={control}
          name="categoriaId"
          render={({ field }) => (
            <ChipsCategoria
              rotulo="Categoria"
              opcoes={categorias}
              valor={field.value ?? null}
              onChange={field.onChange}
            />
          )}
        />
      </Stack>

      <Stack spacing={2}>
        <Rotulo>Parcelas</Rotulo>
        <Controller
          control={control}
          name="parcelas"
          render={({ field }) => <SeletorParcelas valor={field.value} onChange={field.onChange} />}
        />
      </Stack>

      {simulacao && (
        <ResumoImpacto
          titulo="Impacto nas faturas"
          linhas={[
            simulacao.parcelas.length > 1
              ? {
                  rotulo: `${simulacao.parcelas.length}x de`,
                  valor: (
                    <>
                      <Valor valor={simulacao.parcelas.at(-1)!.valor} sx={{ font: "inherit" }} /> ·{" "}
                      {abreviar(simulacao.ciclo.mes)} a {abreviar(simulacao.ultimoMes)}
                    </>
                  ),
                }
              : {
                  rotulo: "Entra na fatura de",
                  valor: `${nomeDoMes(simulacao.ciclo.mes, false)} · vence ${formatarDiaMes(simulacao.ciclo.vencimento)}`,
                },
            {
              rotulo: `Fatura de ${nomeDoMes(simulacao.ciclo.mes, false)} passa a`,
              valor: <Valor valor={simulacao.primeiraFaturaDepois} sx={{ font: "inherit" }} />,
            },
            {
              rotulo: "Limite disponível depois",
              valor: <Valor valor={simulacao.limiteDisponivelDepois} sx={{ font: "inherit" }} />,
            },
          ]}
        />
      )}

      {simulacao && simulacao.limiteDisponivelDepois < 0 && (
        <Alert severity="warning">Este gasto passa do limite disponível do cartão.</Alert>
      )}
      {registrar.error && <Alert severity="error">{registrar.error.message}</Alert>}

      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={registrar.isPending}
        sx={{ minHeight: 54, fontSize: 16, fontWeight: 800 }}
      >
        {registrar.isPending ? "Salvando…" : "Salvar gasto"}
      </Button>
    </Box>
  );
}
