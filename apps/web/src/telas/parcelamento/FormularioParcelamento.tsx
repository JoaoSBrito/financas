"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
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
  ContadorNumerico,
  LinhaDoTempoParcelas,
  PilulasSelecao,
  ResumoImpacto,
  Rotulo,
  SecaoCard,
  SeletorCategoria,
  Valor,
} from "@financas/ui";
import { corDoCartao, paleta, tipografia } from "@financas/ui/tokens";
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

  const faturaAntes = totaisPorMes.get(mesFatura) ?? 0;
  const livreAntes = cartao.limite - comprometido;
  const antesDepois = (antes: number, depois: number) => (
    <>
      <Valor valor={antes} sx={{ font: "inherit", color: "text.secondary" }} />
      <span aria-label="passa para"> → </span>
      <Valor valor={depois} sx={{ font: "inherit" }} />
    </>
  );

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(salvar)}
      noValidate
      sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 3fr) minmax(0, 2fr)" }, gap: { xs: 3, md: 6 }, alignItems: "start" }}
    >
      <Stack spacing={3} sx={{ minWidth: 0 }}>
        <SecaoCard titulo="Compra" gap={3}>
          <TextField label="Descrição" placeholder="Ex.: Notebook" error={Boolean(errors.descricao)} helperText={errors.descricao?.message} {...register("descricao")} />
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 2.5 }}>
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
                  slotProps={{ htmlInput: { inputMode: "numeric", pattern: "[0-9]*", maxLength: 2, style: { fontFamily: tipografia.familiaMono } } }}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Box>
          <Controller
            control={control}
            name="categoriaId"
            render={({ field }) => <SeletorCategoria opcoes={categorias} valor={field.value ?? null} onChange={field.onChange} />}
          />
          {cartoes.length > 1 && (
            <Controller
              control={control}
              name="cartaoId"
              render={({ field }) => (
                <Box>
                  <Rotulo component="div" id="rotulo-cartao-parcelamento" sx={{ pb: 1 }}>
                    Cartão
                  </Rotulo>
                  <RadioGroup
                    aria-labelledby="rotulo-cartao-parcelamento"
                    value={field.value}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      const novo = cartoes.find((c) => c.id === e.target.value)!;
                      setValue("mesFatura", faturasDeReferencia(novo, faturas, hoje).aberta);
                    }}
                  >
                    {cartoes.map((c, indice) => (
                      <FormControlLabel
                        key={c.id}
                        value={c.id}
                        control={<Radio />}
                        label={
                          <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 2.5, fontSize: 15 }}>
                            {/* Filete na cor do cartão; o nome ao lado é o sinal principal. */}
                            <Box component="span" aria-hidden sx={{ width: 4, height: 20, borderRadius: "2px", bgcolor: corDoCartao(indice) }} />
                            {c.nome}
                          </Box>
                        }
                        sx={{ m: 0, minHeight: 48, gap: 1, borderBottom: indice < cartoes.length - 1 ? `1px solid ${paleta.divisor}` : "none" }}
                      />
                    ))}
                  </RadioGroup>
                </Box>
              )}
            />
          )}
        </SecaoCard>

        <SecaoCard titulo={`Qual parcela vem na fatura de ${nomeDoMes(mesFatura, false)}?`} gap={3}>
          {referencia.meses.length > 1 && (
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
          )}
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
          <Rotulo component="p" sx={{ m: 0 }}>
            Na fatura do banco aparece como “{String(atual).padStart(2, "0")}/{String(total ?? 0).padStart(2, "0")}”.
          </Rotulo>
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

      {/* Efeito ao vivo: ao lado no desktop, abaixo dos campos no celular. */}
      <Stack spacing={3} sx={{ minWidth: 0, position: { md: "sticky" }, top: { md: 16 } }}>
        {previa && valorParcela > 0 ? (
          <ResumoImpacto
            titulo="O que será criado"
            linhas={[
              {
                rotulo: "Parcelas a lançar",
                valor: `${restantes.length} · ${curto(restantes[0]!.mes)} a ${curto(restantes.at(-1)!.mes)}`,
              },
              { rotulo: "Já pagas (só histórico)", valor: `${previa.length - restantes.length}` },
              { rotulo: "Limite comprometido", valor: <Valor valor={valorRestante} sx={{ font: "inherit" }} /> },
              { rotulo: `Fatura de ${nomeDoMes(mesFatura, false)} · ${cartao.nome}`, valor: antesDepois(faturaAntes, faturaAntes + valorParcela) },
              { rotulo: "Limite livre", valor: antesDepois(livreAntes, livreAntes - valorRestante) },
              { rotulo: "Valor total da compra", valor: <Valor valor={valorParcela * previa.length} sx={{ font: "inherit" }} /> },
            ]}
          />
        ) : (
          <Box sx={{ border: `1px dashed ${paleta.bordaControle}`, borderRadius: "10px", p: 3.5 }}>
            <Rotulo component="div">O que será criado</Rotulo>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
              Informe o valor da parcela para ver as faturas e o limite.
            </Typography>
          </Box>
        )}
        {registrar.error && <Alert severity="error">{registrar.error.message}</Alert>}
        {/* No celular, o botão fica preso ao rodapé enquanto a tela rola. */}
        <Box sx={{ position: { xs: "sticky", md: "static" }, bottom: "var(--altura-barra-inferior, 0px)", bgcolor: { xs: paleta.fundo, md: "transparent" }, py: { xs: 2, md: 0 }, zIndex: 1 }}>
          <Button type="submit" variant="contained" size="large" fullWidth disabled={registrar.isPending}>
            {registrar.isPending ? "Salvando…" : "Adicionar parcelamento"}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
