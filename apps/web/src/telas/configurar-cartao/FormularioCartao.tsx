"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Snackbar from "@mui/material/Snackbar";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import type { z } from "zod";
import { cartaoFormSchema, type CartaoForm } from "@financas/core";
import { CampoMoeda, CartaoFisico, ControleSegmentado, estiloPainel, Rotulo, SecaoCard, Valor } from "@financas/ui";
import { corDoCartao, fundoDoCartao, paleta, tipografia } from "@financas/ui/tokens";
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
  /** Posição na lista de cartões: define a cor da prévia (cartão novo = o próximo). */
  indiceCor?: number;
}

/** Cartão físico com os dados que estão sendo digitados. */
function PreviaCartao({ indiceCor }: { indiceCor: number }) {
  const { control } = useFormContext<CartaoForm>();
  const [nome, final, limite, diaVencimento] = useWatch({ control, name: ["nome", "final", "limite", "diaVencimento"] });
  const diaOk = Number.isInteger(diaVencimento) && diaVencimento >= 1 && diaVencimento <= 31;
  return (
    <Box sx={{ width: "100%", maxWidth: 340, alignSelf: "center" }}>
      <CartaoFisico
        nome={nome?.trim() || "Novo cartão"}
        final={final && /^\d{4}$/.test(final) ? final : null}
        cor={corDoCartao(indiceCor)}
        fundo={fundoDoCartao(indiceCor)}
        rodape={
          <>
            <span>
              Limite <Valor valor={limite || 0} semSimbolo sx={{ font: "inherit" }} />
            </span>
            {diaOk && <span>Vence dia {diaVencimento}</span>}
          </>
        }
      />
    </Box>
  );
}

export function FormularioCartao({ cartaoId, inicial, faturas, onSalvo, indiceCor = 0 }: FormularioCartaoProps) {
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

  // Celular: uma coluna na ordem do design (prévia, dados, vencimento, regra, fechamentos, avisos).
  // Desktop: campos à esquerda e a prévia fixa à direita. As colunas viram "display: contents"
  // no celular para que a ordem (order) valha entre todos os blocos.
  const coluna = { display: { xs: "contents", md: "flex" }, flexDirection: "column", gap: 3, minWidth: 0 } as const;

  return (
    <FormProvider {...form}>
      <Box
        component="form"
        onSubmit={handleSubmit(enviar)}
        noValidate
        sx={{
          display: { xs: "flex", md: "grid" },
          flexDirection: "column",
          gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)",
          gap: { xs: 3, md: 4 },
          alignItems: "start",
        }}
      >
        <Box sx={coluna}>
          <Box sx={{ order: 1 }}>
            <SecaoCard titulo="Dados" gap={3}>
              <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: 2.5 }}>
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
                  slotProps={{ htmlInput: { inputMode: "numeric", pattern: "[0-9]*", maxLength: 4, style: { fontFamily: tipografia.familiaMono } } }}
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
          </Box>

          <Box sx={{ order: 2 }}>
            <SecaoCard titulo="Vencimento" gap={3}>
              <Controller
                control={control}
                name="diaVencimento"
                render={({ field, fieldState }) => (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 3 }}>
                      <Box component="label" htmlFor="dia-vencimento" sx={{ fontSize: 15 }}>
                        Dia de vencimento
                      </Box>
                      <TextField
                        id="dia-vencimento"
                        value={Number.isNaN(field.value) ? "" : field.value}
                        onChange={(e) => field.onChange(e.target.value === "" ? Number.NaN : Number(e.target.value))}
                        onBlur={field.onBlur}
                        slotProps={{
                          htmlInput: { inputMode: "numeric", pattern: "[0-9]*", maxLength: 2, style: { textAlign: "center", fontFamily: tipografia.familiaMono, fontWeight: 500, fontSize: 16 } },
                        }}
                        error={Boolean(fieldState.error)}
                        sx={{ width: 72, flexShrink: 0 }}
                      />
                    </Box>
                    {fieldState.error && (
                      <Typography variant="caption" sx={{ color: "error.main", textAlign: "right" }}>
                        {fieldState.error.message}
                      </Typography>
                    )}
                  </Box>
                )}
              />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
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
          </Box>

          <Box sx={{ order: 3 }}>
            <SecaoRegraFechamento />
          </Box>

          <Box component="section" aria-label="Avisos" sx={{ order: 5, ...estiloPainel, px: 4, py: 1 }}>
            <Controller
              control={control}
              name="avisarAntesDoFechamento"
              render={({ field }) => (
                <FormControlLabel
                  labelPlacement="start"
                  control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                  label="Avisar 1 dia antes do fechamento"
                  sx={{ m: 0, minHeight: 48, width: "100%", justifyContent: "space-between", gap: 3 }}
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
                  sx={{ m: 0, minHeight: 48, width: "100%", justifyContent: "space-between", gap: 3, borderTop: `1px solid ${paleta.divisor}` }}
                />
              )}
            />
          </Box>
        </Box>

        <Box component="aside" aria-label="Prévia" sx={{ ...coluna, position: { md: "sticky" }, top: { md: 16 } }}>
          <Rotulo sx={{ display: { xs: "none", md: "block" }, order: 0 }}>Prévia ao vivo</Rotulo>
          <Box sx={{ order: 0, display: "flex", justifyContent: "center" }}>
            <PreviaCartao indiceCor={indiceCor} />
          </Box>
          <Box sx={{ order: 4 }}>
            <PreviaFechamentos cartaoId={cartaoId} faturas={faturas} />
          </Box>

          {(salvar.error || Object.keys(errors).length > 0) && (
            <Box sx={{ order: 6, display: "flex", flexDirection: "column", gap: 2 }}>
              {salvar.error && <Alert severity="error">{salvar.error.message}</Alert>}
              {Object.keys(errors).length > 0 && <Alert severity="warning">Confira os campos destacados antes de salvar.</Alert>}
            </Box>
          )}

          {/* No celular, o botão fica preso ao rodapé (logo acima da barra inferior). */}
          <Box
            sx={{
              order: 7,
              position: { xs: "sticky", md: "static" },
              bottom: "var(--altura-barra-inferior, 0px)",
              bgcolor: { xs: paleta.fundo, md: "transparent" },
              py: { xs: 2, md: 0 },
              zIndex: 1,
            }}
          >
            <Button type="submit" variant="contained" size="large" fullWidth disabled={salvar.isPending}>
              {salvar.isPending ? "Salvando…" : "Salvar cartão"}
            </Button>
          </Box>
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
