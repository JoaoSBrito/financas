"use client";

import { paleta, tipografia } from "../tokens";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import { NumericFormat } from "react-number-format";
import type { Centavos } from "@financas/core";

export interface CampoMoedaProps
  extends Omit<TextFieldProps, "value" | "onChange" | "type" | "defaultValue"> {
  valor: Centavos | null;
  onChange: (valor: Centavos | null) => void;
  /** Valor grande e centralizado (tela de novo gasto). */
  destaque?: boolean;
}

/** Campo em R$ com máscara pt-BR. Sempre entrega centavos inteiros. */
export function CampoMoeda({ valor, onChange, destaque = false, sx, ...props }: CampoMoedaProps) {
  return (
    <NumericFormat
      customInput={TextField}
      value={valor === null ? "" : valor / 100}
      valueIsNumericString={false}
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={2}
      fixedDecimalScale
      allowNegative={false}
      prefix="R$ "
      inputMode="decimal"
      onValueChange={(v) => onChange(v.value === "" ? null : Math.round(Number(v.value) * 100))}
      {...(props as Record<string, unknown>)}
      sx={[
        // Todos os valores em mono.
        { "& input": { fontFamily: tipografia.familiaMono, fontVariantNumeric: "tabular-nums" } },
        // Destaque (valor do gasto): sem caixa, só a linha lima embaixo.
        destaque && {
          "& .MuiOutlinedInput-root": { bgcolor: "transparent", borderRadius: 0 },
          "& .MuiOutlinedInput-notchedOutline": { border: "none", borderBottom: `1px solid ${paleta.acao}`, borderRadius: 0 },
          "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderWidth: 0, borderBottomWidth: 2 },
          "& input": { fontSize: 38, fontWeight: 500, letterSpacing: "-0.03em", py: 1, px: 0 },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}
