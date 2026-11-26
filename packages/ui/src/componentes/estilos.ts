import type { SxProps, Theme } from "@mui/material/styles";
import { paleta, tipografia } from "../tokens";

const { rotulo, valor } = tipografia.escala;

/** texto.rotulo: mono, 11 px, caixa alta, espaçado. */
export const estiloRotulo = {
  fontFamily: tipografia.familiaMono,
  fontSize: rotulo.tamanho,
  lineHeight: rotulo.alturaLinha,
  letterSpacing: `${rotulo.espacamento}em`,
  textTransform: "uppercase",
  color: paleta.textoSecundario,
  fontWeight: 400,
} as const satisfies SxProps<Theme>;

/** Números em mono com algarismos de largura fixa. */
export const estiloMono = {
  fontFamily: tipografia.familiaMono,
  fontVariantNumeric: tipografia.numeros,
} as const satisfies SxProps<Theme>;

/** texto.valor: valores em listas e tabelas. */
export const estiloValor = { ...estiloMono, fontSize: valor.tamanho, lineHeight: valor.alturaLinha } as const;

/** Painel: fundo, borda de 1 px e raio do Design System. */
export const estiloPainel = {
  bgcolor: paleta.painel,
  border: `1px solid ${paleta.divisor}`,
  borderRadius: "10px",
} as const satisfies SxProps<Theme>;

/** Controle segmentado (opções coladas, uma borda só, divisórias entre elas). */
export const estiloSegmentado = {
  border: `1px solid ${paleta.bordaControle}`,
  borderRadius: "8px",
  overflow: "hidden",
  gap: 0,
  "& .MuiToggleButtonGroup-grouped": {
    border: "none !important",
    borderRadius: "0 !important",
    borderRight: `1px solid ${paleta.bordaControle} !important`,
    color: paleta.textoSecundario,
  },
  "& .MuiToggleButtonGroup-grouped:last-of-type": { borderRight: "none !important" },
} as const satisfies SxProps<Theme>;
