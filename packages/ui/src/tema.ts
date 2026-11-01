"use client";

import { createTheme } from "@mui/material/styles";
import { breakpoints, cores, espacoBase, fonte, raios, toqueMinimo } from "./tokens";

export const tema = createTheme({
  breakpoints: { values: breakpoints },
  spacing: espacoBase,
  palette: {
    mode: "light",
    primary: { main: cores.primaria, dark: cores.primariaEscura, light: cores.primariaMedia, contrastText: "#FFFFFF" },
    secondary: { main: cores.destaque, contrastText: "#FFFFFF" },
    success: { main: cores.investimento, dark: cores.investimentoEscuro, light: cores.investimentoClaro, contrastText: "#FFFFFF" },
    warning: { main: cores.alerta, light: cores.alertaClaro, contrastText: "#FFFFFF" },
    error: { main: cores.erro },
    background: { default: cores.fundo, paper: cores.superficie },
    text: { primary: cores.texto, secondary: cores.textoSuave },
    divider: cores.borda,
  },
  shape: { borderRadius: raios.medio },
  typography: {
    fontFamily: fonte.familia,
    h1: { fontSize: "1.75rem", fontWeight: fonte.pesos.extra, lineHeight: 1.2 },
    h2: { fontSize: "1.0625rem", fontWeight: fonte.pesos.extra },
    h3: { fontSize: "1rem", fontWeight: fonte.pesos.extra },
    subtitle1: { fontSize: "0.875rem", fontWeight: fonte.pesos.negrito },
    subtitle2: { fontSize: "0.8125rem", fontWeight: fonte.pesos.semi },
    body1: { fontSize: "0.9375rem" },
    body2: { fontSize: "0.8125rem" },
    caption: { fontSize: "0.75rem", color: cores.textoSuave },
    button: { textTransform: "none", fontWeight: fonte.pesos.negrito, fontSize: "0.875rem" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          fontVariantNumeric: "tabular-nums",
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { minHeight: toqueMinimo, borderRadius: raios.medio, paddingInline: 18 } },
    },
    MuiIconButton: {
      styleOverrides: { root: { minWidth: toqueMinimo, minHeight: toqueMinimo } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { borderRadius: raios.card } },
    },
    MuiPaper: { defaultProps: { elevation: 0 } },
    MuiChip: {
      styleOverrides: { root: { fontWeight: fonte.pesos.negrito, borderRadius: raios.pilula } },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: fonte.pesos.semi, minHeight: 40, borderRadius: 10 },
      },
    },
    MuiTextField: { defaultProps: { fullWidth: true } },
    MuiOutlinedInput: {
      styleOverrides: { root: { borderRadius: raios.medio, minHeight: 48 } },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { height: 8, borderRadius: 4, backgroundColor: cores.borda },
        bar: { borderRadius: 4 },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: { root: { minWidth: 56, minHeight: 56 } },
    },
  },
});
