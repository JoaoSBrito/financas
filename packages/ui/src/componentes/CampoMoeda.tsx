"use client";

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
        destaque && {
          "& .MuiOutlinedInput-notchedOutline": { border: "none" },
          "& input": { textAlign: "center", fontSize: 40, fontWeight: 800, py: 1 },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}
