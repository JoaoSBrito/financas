"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import type { z } from "zod";
import { cartaoFormSchema, type CartaoForm } from "@financas/core";
import { CampoMoeda, ControleSegmentado, SecaoCard } from "@financas/ui";
import { useSalvarCartao } from "@/hooks/useCartoes";
import type { Fatura } from "@/services/cartoes-mapeamento";
import { PreviaFechamentos } from "./PreviaFechamentos";
import { SecaoRegraFechamento } from "./SecaoRegraFechamento";

type Entrada = z.input<typeof cartaoFormSchema>;

export interface FormularioCartaoProps {
  cartaoId?: string;
  inicial: CartaoForm;
  faturas: Fatura[];
  /** Sem callback, um cartão novo leva à lista de cartões depois de salvo. */
  onSalvo?: (cartaoId: string) => void;
}

export function FormularioCartao({ cartaoId, inicial, faturas, onSalvo }: FormularioCartaoProps) {
  const router = useRouter();
  const salvar = useSalvarCartao(cartaoId);
  const [aviso, setAviso] = useState<string | null>(null);

  const form = useForm<Entrada, unknown, CartaoForm>({
    resolver: zodResolver(cartaoFormSchema),
    defaultValues: inicial,
    mode: "onTouched",
  });
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  function enviar(dados: CartaoForm) {
    salvar.mutate(dados, {
      onSuccess: (id) => {
        if (onSalvo) onSalvo(id);
        else if (cartaoId) {
          reset(dados);
          setAviso("Cartão salvo. As faturas futuras foram atualizadas.");
        } else {
          router.push("/cartoes");
        }
      },
    });
  }

  return (
    <FormProvider {...form}>
      <Box component="form" onSubmit={handleSubmit(enviar)} noValidate>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "flex-start" }}>
          <Stack spacing={4} sx={{ flex: "1 1 420px", minWidth: 0 }}>
            <SecaoCard titulo="Dados do cartão">
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 3 }}>
                <TextField
                  label="Apelido"
                  placeholder="Ex.: XP"
                  error={Boolean(errors.nome)}
                  helperText={errors.nome?.message}
                  {...register("nome")}
                />
                <TextField
                  label="Final"
                  placeholder="4821"
                  slotProps={{ htmlInput: { inputMode: "numeric", pattern: "[0-9]*", maxLength: 4 } }}
                  error={Boolean(errors.final)}
                  helperText={errors.final?.message}
                  {...register("final")}
                />
              </Box>
              <Controller
                control={control}
                name="limite"
                render={({ field, fieldState }) => (
                  <CampoMoeda
                    label="Limite"
                    valor={field.value ? field.value : null}
                    onChange={(v) => field.onChange(v ?? 0)}
                    onBlur={field.onBlur}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </SecaoCard>

            <SecaoCard titulo="Vencimento">
              <Controller
                control={control}
                name="diaVencimento"
                render={({ field, fieldState }) => (
                  <TextField
                    label="Dia de vencimento"
                    value={Number.isNaN(field.value) ? "" : field.value}
                    onChange={(e) => field.onChange(e.target.value === "" ? Number.NaN : Number(e.target.value))}
                    onBlur={field.onBlur}
                    slotProps={{ htmlInput: { inputMode: "numeric", pattern: "[0-9]*", maxLength: 2 } }}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    sx={{ maxWidth: 200 }}
                  />
                )}
              />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  Se cair em fim de semana ou feriado
                </Typography>
                <Controller
                  control={control}
                  name="vencimentoNaoUtil"
                  render={({ field }) => (
                    <ControleSegmentado
                      rotulo="Se o vencimento cair em fim de semana ou feriado"
                      valor={field.value}
                      onChange={field.onChange}
                      opcoes={[
                        { valor: "proximo_dia_util", rotulo: "Próximo dia útil" },
                        { valor: "mantem", rotulo: "Mantém a data" },
                      ]}
                    />
                  )}
                />
              </Box>
            </SecaoCard>

            <SecaoRegraFechamento />
          </Stack>

          <Stack spacing={4} sx={{ flex: "1 1 320px", minWidth: 0, position: { md: "sticky" }, top: { md: 24 } }}>
            <PreviaFechamentos cartaoId={cartaoId} faturas={faturas} />

            <SecaoCard titulo="Avisos" gap={1}>
              <Controller
                control={control}
                name="avisarAntesDoFechamento"
                render={({ field }) => (
                  <FormControlLabel
                    labelPlacement="start"
                    control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                    label="Avisar 1 dia antes do fechamento"
                    sx={{ m: 0, minHeight: 48, justifyContent: "space-between" }}
                  />
                )}
              />
              <Controller
                control={control}
                name="pedirConfirmacaoMensal"
                render={({ field }) => (
                  <FormControlLabel
                    labelPlacement="start"
                    control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                    label="Pedir confirmação da data todo mês"
                    sx={{ m: 0, minHeight: 48, justifyContent: "space-between" }}
                  />
                )}
              />
            </SecaoCard>

            {salvar.error && <Alert severity="error">{salvar.error.message}</Alert>}
            {Object.keys(errors).length > 0 && (
              <Alert severity="warning">Confira os campos destacados antes de salvar.</Alert>
            )}

            <Button type="submit" variant="contained" size="large" disabled={salvar.isPending} sx={{ minHeight: 54, fontSize: 16, fontWeight: 800 }}>
              {salvar.isPending ? "Salvando…" : "Salvar cartão"}
            </Button>
          </Stack>
        </Box>
      </Box>

      <Snackbar
        open={Boolean(aviso)}
        autoHideDuration={4000}
        onClose={() => setAviso(null)}
        message={aviso}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ bottom: { xs: 96, sm: 24 } }}
      />
    </FormProvider>
  );
}
