"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import {
  nomeDoMes,
  parcelamentoEmAndamento,
  parcelamentoEmAndamentoSchema,
  type Data,
  type ParcelamentoEmAndamento,
} from "@financas/core";
import {
  CampoMoeda,
  ChipsCategoria,
  ContadorNumerico,
  LinhaDoTempoParcelas,
  PilulasSelecao,
  ResumoImpacto,
  SecaoCard,
  Valor,
} from "@financas/ui";
import { useRegistrarParcelamento } from "@/hooks/useGastos";
import type { Categoria } from "@/services/categorias";
import { faturasDeReferencia, resumirFaturas, type CartaoCompleto, type FaturaResumo } from "@/services/cartoes-mapeamento";
import { useAvisos } from "@/stores/avisos";

type Entrada = z.input<typeof parcelamentoEmAndamentoSchema>;

const curto = (mes: string) => nomeDoMes(mes, false).slice(0, 3);

export interface FormularioParcelamentoProps {
  cartoes: CartaoCompleto[];
  categorias: Categoria[];
  faturas: FaturaResumo[];
  hoje: Data;
  cartaoInicial?: string;
  /** Sem callback, vai para a fatura do cartão depois de salvar. */
  onSalvo?: (cartaoId: string) => void;
}

export function FormularioParcelamento({ cartoes, categorias, faturas, hoje, cartaoInicial, onSalvo }: FormularioParcelamentoProps) {
  const router = useRouter();
  const registrar = useRegistrarParcelamento();
  const mostrarAviso = useAvisos((s) => s.mostrar);
  const primeiro = cartoes.find((c) => c.id === cartaoInicial) ?? cartoes[0]!;

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Entrada, unknown, ParcelamentoEmAndamento>({
    resolver: zodResolver(parcelamentoEmAndamentoSchema),
    defaultValues: {
      descricao: "",
      cartaoId: primeiro.id,
      categoriaId: null,
      valorParcela: 0,
      totalParcelas: 10,
      parcelaAtual: 1,
      mesFatura: faturasDeReferencia(primeiro, faturas, hoje).aberta,
    },
  });

  const [cartaoId, valorParcela, totalParcelas, parcelaAtual, mesFatura] = useWatch({
    control,
    name: ["cartaoId", "valorParcela", "totalParcelas", "parcelaAtual", "mesFatura"],
  });
  const cartao = cartoes.find((c) => c.id === cartaoId) ?? primeiro;
  const referencia = faturasDeReferencia(cartao, faturas, hoje);

  const total = Number.isInteger(totalParcelas) && totalParcelas >= 2 && totalParcelas <= 48 ? totalParcelas : null;
  const atual = total ? Math.min(Math.max(1, parcelaAtual), total) : 1;

  const previa = useMemo(() => {
    if (!total) return null;
    return parcelamentoEmAndamento({ valorParcela: valorParcela || 0, totalParcelas: total, parcelaAtual: atual, faturaAtual: mesFatura });
  }, [valorParcela, total, atual, mesFatura]);

  const doCartao = faturas.filter((f) => f.cartaoId === cartao.id);
  const { totaisPorMes, comprometido } = resumirFaturas(doCartao);
  const restantes = previa?.filter((p) => !p.historico) ?? [];
  const valorRestante = restantes.reduce((s, p) => s + p.valor, 0);

  function salvar(dados: ParcelamentoEmAndamento) {
    registrar.mutate(dados, {
      onSuccess: () => {
        mostrarAviso(`Parcelamento lançado: ${dados.totalParcelas - dados.parcelaAtual + 1} parcelas a partir de ${nomeDoMes(dados.mesFatura, false)}`);
        if (onSalvo) onSalvo(dados.cartaoId);
        else router.push(`/cartoes?cartao=${dados.cartaoId}`);
      },
    });
  }

  return (
    <Box component="form" onSubmit={handleSubmit(salvar)} noValidate>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "flex-start" }}>
        <Stack spacing={4} sx={{ flex: "1 1 420px", minWidth: 0 }}>
          <SecaoCard titulo="Compra">
            <TextField label="Descrição" placeholder="Ex.: Notebook" error={Boolean(errors.descricao)} helperText={errors.descricao?.message} {...register("descricao")} />
            {cartoes.length > 1 && (
              <Stack spacing={2}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Cartão
                </Typography>
                <Controller
                  control={control}
                  name="cartaoId"
                  render={({ field }) => (
                    <PilulasSelecao
                      rotulo="Cartão"
                      valor={field.value}
                      onChange={(id) => {
                        field.onChange(id);
                        const novo = cartoes.find((c) => c.id === id)!;
                        setValue("mesFatura", faturasDeReferencia(novo, faturas, hoje).aberta);
                      }}
                      opcoes={cartoes.map((c) => ({ valor: c.id, rotulo: c.nome }))}
                    />
                  )}
                />
              </Stack>
            )}
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 3 }}>
              <Controller
                control={control}
                name="valorParcela"
                render={({ field, fieldState }) => (
                  <CampoMoeda
                    label="Valor da parcela"
                    valor={field.value ? field.value : null}
                    onChange={(v) => field.onChange(v ?? 0)}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="totalParcelas"
                render={({ field, fieldState }) => (
                  <TextField
                    label="Total de parcelas"
                    value={Number.isNaN(field.value) ? "" : field.value}
                    onChange={(e) => field.onChange(e.target.value === "" ? Number.NaN : Number(e.target.value))}
                    slotProps={{ htmlInput: { inputMode: "numeric", pattern: "[0-9]*", maxLength: 2 } }}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Box>
            <Stack spacing={2}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Categoria
              </Typography>
              <Controller
                control={control}
                name="categoriaId"
                render={({ field }) => (
                  <ChipsCategoria rotulo="Categoria" opcoes={categorias} valor={field.value ?? null} onChange={field.onChange} />
                )}
              />
            </Stack>
          </SecaoCard>

          <SecaoCard titulo="Onde a compra está hoje">
            {referencia.meses.length > 1 && (
              <Stack spacing={2}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Fatura de referência
                </Typography>
                <Controller
                  control={control}
                  name="mesFatura"
                  render={({ field }) => (
                    <PilulasSelecao
                      rotulo="Fatura de referência"
                      tamanho="pequeno"
                      valor={field.value}
                      onChange={field.onChange}
                      opcoes={referencia.meses.map((m) => ({
                        valor: m,
                        rotulo: `${nomeDoMes(m, false)}${m === referencia.aberta ? " · aberta" : " · fechada"}`,
                      }))}
                    />
                  )}
                />
              </Stack>
            )}
            <Stack spacing={2}>
              <Typography id="rotulo-parcela-atual" variant="body2" sx={{ fontWeight: 700 }}>
                Qual parcela vem na fatura de {nomeDoMes(mesFatura, false)}?
              </Typography>
              <Controller
                control={control}
                name="parcelaAtual"
                render={({ field, fieldState }) => (
                  <>
                    <ContadorNumerico
                      rotulo="Parcela atual"
                      valor={field.value}
                      min={1}
                      max={total ?? 48}
                      onChange={field.onChange}
                      sufixo={total ? `de ${total}` : undefined}
                    />
                    {fieldState.error && (
                      <Typography variant="caption" sx={{ color: "error.main" }}>
                        {fieldState.error.message}
                      </Typography>
                    )}
                  </>
                )}
              />
              <Typography variant="caption">
                Confira na fatura do banco: aparece como &quot;{String(atual).padStart(2, "0")}/{String(total ?? 0).padStart(2, "0")}&quot;.
              </Typography>
            </Stack>
            {previa && (
              <LinhaDoTempoParcelas
                total={previa.length}
                atual={atual}
                meses={previa.map((p) => curto(p.mes))}
                mesesAcessiveis={previa.map((p) => nomeDoMes(p.mes))}
              />
            )}
          </SecaoCard>
        </Stack>

        <Stack spacing={4} sx={{ flex: "1 1 320px", minWidth: 0, position: { md: "sticky" }, top: { md: 24 } }}>
          {previa && valorParcela > 0 && (
            <ResumoImpacto
              titulo="O que será criado"
              linhas={[
                {
                  rotulo: "Parcelas a lançar",
                  valor: `${restantes.length} · ${curto(restantes[0]!.mes)} a ${curto(restantes.at(-1)!.mes)}`,
                },
                { rotulo: "Já pagas (só histórico)", valor: `${previa.length - restantes.length}` },
                { rotulo: "Limite comprometido", valor: <Valor valor={valorRestante} sx={{ font: "inherit" }} /> },
                {
                  rotulo: `Fatura de ${nomeDoMes(mesFatura, false)} passa a`,
                  valor: <Valor valor={(totaisPorMes.get(mesFatura) ?? 0) + valorParcela} sx={{ font: "inherit" }} />,
                },
                {
                  rotulo: "Limite disponível depois",
                  valor: <Valor valor={cartao.limite - comprometido - valorRestante} sx={{ font: "inherit" }} />,
                },
                { rotulo: "Valor total da compra", valor: <Valor valor={valorParcela * previa.length} sx={{ font: "inherit" }} /> },
              ]}
            />
          )}
          {registrar.error && <Alert severity="error">{registrar.error.message}</Alert>}
          <Button type="submit" variant="contained" size="large" disabled={registrar.isPending} sx={{ minHeight: 54, fontSize: 16, fontWeight: 800 }}>
            {registrar.isPending ? "Salvando…" : "Adicionar parcelamento"}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
