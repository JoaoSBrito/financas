"use client";

import Typography, { type TypographyProps } from "@mui/material/Typography";
import { estiloRotulo } from "./estilos";

/** Rótulo do Design System (texto.rotulo): mono, caixa alta. O texto fica normal no DOM. */
export function Rotulo({ sx, ...props }: TypographyProps) {
  return <Typography component="span" {...props} sx={[estiloRotulo, ...(Array.isArray(sx) ? sx : [sx])]} />;
}
