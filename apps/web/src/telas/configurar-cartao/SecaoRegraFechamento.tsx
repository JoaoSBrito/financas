"use client";

import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useRef, type ReactNode } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import type { CartaoForm, RegraFechamento } from "@financas/core";
import { ContadorNumerico, ControleSegmentado, SecaoCard } from "@financas/ui";
import { paleta, raio } from "@financas/ui/tokens";
import { REGRA_PADRAO } from "./valores";

const OPCOES: { tipo: RegraFechamento["tipo"]; titulo: string; descricao: string }[] = [
  { tipo: "dia_fixo", titulo: "Dia fixo do mês", descricao: "Fecha sempre no mesmo dia" },
  { tipo: "dias_antes", titulo: "Dias antes do vencimento", descricao: "A data muda conforme o mês" },
  {
    tipo: "manual",
    titulo: "Informar mês a mês",
    descricao: "Estimamos 7 dias antes; você confirma cada fatura",
  },
];

function OpcaoRegra({ selecionada, titulo, descricao, valor, children }: {
  selecionada: boolean;
  titulo: string;
  descricao: string;
  valor: string;
  children?: ReactNode;
}) {
  return (
    <Box
      sx={{
        // Selecionada: borda lima sobre o tom elevado (é a regra que gera as datas).
        border: `1px solid ${selecionada ? paleta.acao : paleta.divisor}`,
        bgcolor: selecionada ? paleta.elevado : "transparent",
        borderRadius: `${raio.controle}px`,
        px: 3.5,
        py: 3,
      }}
    >
      <FormControlLabel
        value={valor}
        control={<Radio />}
        sx={{ m: 0, width: "100%", alignItems: "flex-start", "& .MuiRadio-root": { mt: -1 } }}
        label={
          <Box sx={{ display: "flex", flexDirection: "column", pt: 1 }}>
            <Typography sx={{ fontSize: 15 }}>{titulo}</Typography>
            <Typography variant="caption">{descricao}</Typography>
          </Box>
        }
      />
      {selecionada && children && <Box sx={{ pl: 8, pt: 3, pb: 1 }}>{children}</Box>}
    </Box>
  );
}

export function SecaoRegraFechamento() {
  const { control, setValue, getValues, formState } = useFormContext<CartaoForm>();
  const regra = useWatch({ control, name: "fechamento" });
  // Lembra os valores de cada tipo para não perder o que foi digitado ao alternar.
  const memoria = useRef<Partial<Record<RegraFechamento["tipo"], RegraFechamento>>>({});

  function trocarTipo(tipo: RegraFechamento["tipo"]) {
    const atual = getValues("fechamento");
    memoria.current[atual.tipo] = atual;
    setValue("fechamento", memoria.current[tipo] ?? REGRA_PADRAO[tipo], { shouldDirty: true, shouldValidate: true });
  }

  const erroDia = (formState.errors.fechamento as { dia?: { message?: string } } | undefined)?.dia?.message;

  return (
    <SecaoCard titulo="Regra de fechamento" gap={3}>
      <RadioGroup
        aria-label="Regra de fechamento"
        value={regra.tipo}
        onChange={(e) => trocarTipo(e.target.value as RegraFechamento["tipo"])}
        sx={{ gap: 2 }}
      >
        {OPCOES.map((o) => (
          <OpcaoRegra key={o.tipo} valor={o.tipo} titulo={o.titulo} descricao={o.descricao} selecionada={regra.tipo === o.tipo}>
            {o.tipo === "dia_fixo" && regra.tipo === "dia_fixo" && (
              <Controller
                control={control}
                name="fechamento.dia"
                render={({ field }) => (
                  <TextField
                    label="Dia do fechamento"
                    value={Number.isNaN(field.value) ? "" : field.value}
                    onChange={(e) => field.onChange(e.target.value === "" ? Number.NaN : Number(e.target.value))}
                    slotProps={{ htmlInput: { inputMode: "numeric", pattern: "[0-9]*", maxLength: 2 } }}
                    error={Boolean(erroDia)}
                    helperText={erroDia}
                    sx={{ maxWidth: 200 }}
                  />
                )}
              />
            )}
            {o.tipo === "dias_antes" && regra.tipo === "dias_antes" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Controller
                  control={control}
                  name="fechamento.dias"
                  render={({ field }) => (
                    <ContadorNumerico
                      rotulo="Dias antes do vencimento"
                      valor={field.value}
                      min={1}
                      max={20}
                      onChange={field.onChange}
                      sufixo={field.value === 1 ? "dia" : "dias"}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="fechamento.contagem"
                  render={({ field }) => (
                    <Box sx={{ maxWidth: 320 }}>
                      <ControleSegmentado
                        rotulo="Tipo de contagem"
                        valor={field.value}
                        onChange={field.onChange}
                        opcoes={[
                          { valor: "uteis", rotulo: "Úteis" },
                          { valor: "corridos", rotulo: "Corridos" },
                        ]}
                      />
                    </Box>
                  )}
                />
              </Box>
            )}
          </OpcaoRegra>
        ))}
      </RadioGroup>
    </SecaoCard>
  );
}
