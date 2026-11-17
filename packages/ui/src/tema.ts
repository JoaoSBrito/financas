"use client";

import { createTheme } from "@mui/material/styles";
import { breakpoints, espacoBase, paleta, raio, semantica, tipografia, toqueMinimo } from "./tokens";

const { escala } = tipografia;
const px = (n: number) => `${n}px`;
const em = (n?: number) => (n ? `${n}em` : undefined);

/** Fundo de hover discreto (texto a 6%). */
const hover = "rgba(237, 237, 243, 0.06)";

/**
 * Tema escuro "Mercury": sem sombras, cards de raio 12, controles em pílula,
 * cobalto só na ação principal (Button contained, Fab).
 */
export const tema = createTheme({
  breakpoints: { values: breakpoints },
  spacing: espacoBase,
  palette: {
    mode: "dark",
    primary: { main: paleta.cobalto, dark: paleta.cobaltoPressionado, light: paleta.cobalto, contrastText: paleta.sobreCobalto },
    secondary: { main: paleta.interativo, contrastText: paleta.texto },
    success: { main: semantica.receita.texto, contrastText: paleta.sobreClaro },
    warning: { main: semantica.atencao.texto, contrastText: paleta.sobreClaro },
    error: { main: semantica.estouro.texto, contrastText: paleta.sobreClaro },
    info: { main: paleta.textoSecundario, contrastText: paleta.sobreClaro },
    background: { default: paleta.fundo, paper: paleta.card },
    text: { primary: paleta.texto, secondary: paleta.textoSecundario, disabled: "rgba(237, 237, 243, 0.4)" },
    divider: paleta.divisor,
    action: {
      hover,
      selected: paleta.interativo,
      focus: "rgba(237, 237, 243, 0.12)",
      disabled: "rgba(237, 237, 243, 0.38)",
      disabledBackground: paleta.interativo,
    },
  },
  shape: { borderRadius: raio.card },
  typography: {
    fontFamily: tipografia.familia,
    fontWeightRegular: tipografia.pesos.regular,
    fontWeightMedium: tipografia.pesos.medio,
    fontWeightBold: tipografia.pesos.medio,
    h1: { fontSize: px(escala.titulo.tamanho), fontWeight: 500, lineHeight: escala.titulo.alturaLinha, letterSpacing: em(escala.titulo.espacamento) },
    h2: { fontSize: px(escala.secao.tamanho), fontWeight: 500, lineHeight: escala.secao.alturaLinha },
    h3: { fontSize: px(escala.subsecao.tamanho), fontWeight: 500, lineHeight: escala.subsecao.alturaLinha },
    subtitle1: { fontSize: px(escala.corpo.tamanho), fontWeight: 400, lineHeight: escala.corpo.alturaLinha },
    subtitle2: { fontSize: px(escala.apoio.tamanho), fontWeight: 400, lineHeight: escala.apoio.alturaLinha },
    body1: { fontSize: px(escala.corpo.tamanho), lineHeight: tipografia.alturaLinha },
    body2: { fontSize: px(escala.apoio.tamanho), lineHeight: tipografia.alturaLinha },
    caption: { fontSize: px(escala.legenda.tamanho), lineHeight: tipografia.alturaLinha, color: paleta.textoSecundario },
    button: { textTransform: "none", fontWeight: 500, fontSize: px(escala.corpo.tamanho) },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: { colorScheme: "dark" },
        body: {
          backgroundColor: paleta.fundo,
          color: paleta.texto,
          lineHeight: tipografia.alturaLinha,
          fontVariantNumeric: tipografia.numeros,
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        },
      },
    },

    // Superfícies: sem sombra e sem o gradiente que o modo escuro do MUI aplica ao Paper.
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundImage: "none" } } },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { borderRadius: raio.card, backgroundColor: paleta.card, boxShadow: "none" } },
    },
    MuiDivider: { styleOverrides: { root: { borderColor: paleta.divisor } } },

    // Botões em pílula. O cobalto fica só no contained primário.
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          minHeight: toqueMinimo,
          borderRadius: raio.pilula,
          paddingInline: 20,
          variants: [
            { props: { variant: "contained", color: "primary" }, style: { "&:hover": { backgroundColor: paleta.cobaltoPressionado } } },
            {
              props: { variant: "outlined", color: "primary" },
              style: {
                color: paleta.texto,
                borderColor: paleta.bordaCampo,
                "&:hover": { borderColor: paleta.bordaSelecionada, backgroundColor: hover },
              },
            },
            { props: { variant: "text", color: "primary" }, style: { color: paleta.texto, "&:hover": { backgroundColor: hover } } },
          ],
        },
        sizeLarge: { minHeight: 52 },
        sizeSmall: { minHeight: toqueMinimo, paddingInline: 14 },
      },
    },
    MuiIconButton: { styleOverrides: { root: { minWidth: toqueMinimo, minHeight: toqueMinimo } } },
    MuiFab: { styleOverrides: { root: { boxShadow: "none", "&:active": { boxShadow: "none" } } } },
    MuiButtonBase: { styleOverrides: { root: { "&.Mui-focusVisible": { outline: `2px solid ${paleta.bordaSelecionada}`, outlineOffset: 2 } } } },

    // Campos em pílula; multilinha volta ao raio do card.
    MuiTextField: { defaultProps: { fullWidth: true } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: raio.pilula,
          minHeight: 48,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: paleta.bordaCampo },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: paleta.bordaSelecionada },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: paleta.bordaSelecionada, borderWidth: 1 },
          "&.Mui-error .MuiOutlinedInput-notchedOutline": { borderColor: semantica.estouro.texto },
        },
        input: { paddingInline: 20 },
        multiline: { borderRadius: raio.card },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { color: paleta.textoSecundario, "&.Mui-focused": { color: paleta.texto }, "&.Mui-error": { color: semantica.estouro.texto } },
        outlined: { marginLeft: 6 },
      },
    },
    MuiFormHelperText: { styleOverrides: { root: { color: paleta.textoSecundario, marginInline: 20 } } },
    MuiFormLabel: { styleOverrides: { root: { color: paleta.textoSecundario } } },

    // Seleção: chip e segmento selecionados não usam cobalto.
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: raio.chip,
          fontWeight: 400,
          variants: [
            { props: { variant: "outlined" }, style: { borderColor: paleta.bordaCampo, color: paleta.textoSecundario } },
            { props: { variant: "filled", color: "default" }, style: { backgroundColor: paleta.interativo, color: paleta.texto } },
            {
              props: { variant: "filled", color: "primary" },
              style: {
                backgroundColor: paleta.interativo,
                color: paleta.texto,
                border: `1px solid ${paleta.bordaSelecionada}`,
                "&:hover, &.MuiChip-clickable:hover": { backgroundColor: paleta.interativo },
              },
            },
          ],
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 400,
          minHeight: toqueMinimo,
          borderRadius: raio.pilula,
          color: paleta.textoSecundario,
          borderColor: paleta.bordaCampo,
          "&.Mui-selected, &.Mui-selected:hover": { backgroundColor: paleta.texto, color: paleta.sobreClaro, fontWeight: 500 },
        },
      },
    },
    // Grupos de pílulas separadas (segmentos, meses, parcelas): cada botão com raio próprio.
    MuiToggleButtonGroup: {
      styleOverrides: {
        grouped: {
          margin: "0 !important",
          borderRadius: `${raio.pilula}px !important`,
          border: `1px solid ${paleta.bordaCampo} !important`,
          "&.Mui-selected": { borderColor: `${paleta.texto} !important` },
        },
      },
    },
    MuiCheckbox: { styleOverrides: { root: { color: paleta.textoSecundario, "&.Mui-checked": { color: paleta.texto } } } },
    MuiRadio: { styleOverrides: { root: { color: paleta.textoSecundario, "&.Mui-checked": { color: paleta.texto } } } },
    MuiSwitch: {
      styleOverrides: {
        switchBase: { color: paleta.textoSecundario, "&.Mui-checked": { color: paleta.texto } },
        track: { backgroundColor: paleta.bordaCampo, opacity: 1, ".Mui-checked.Mui-checked + &": { backgroundColor: paleta.textoSecundario, opacity: 1 } },
      },
    },

    // Diálogos e gavetas: tom do card, raio 12, véu escuro.
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: raio.card, backgroundColor: paleta.card, backgroundImage: "none" },
        paperFullScreen: { borderRadius: 0 },
      },
    },
    MuiDialogTitle: { styleOverrides: { root: { fontSize: px(escala.secao.tamanho), fontWeight: 500 } } },
    MuiBackdrop: { styleOverrides: { root: { "&:not(.MuiBackdrop-invisible)": { backgroundColor: paleta.veu } } } },
    MuiDrawer: {
      styleOverrides: { paper: { backgroundColor: paleta.fundo, backgroundImage: "none", borderColor: paleta.divisor } },
    },

    // Navegação inferior: item ativo na cor do texto.
    MuiBottomNavigation: { styleOverrides: { root: { backgroundColor: paleta.card, height: "auto" } } },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: { minWidth: 56, minHeight: 56, color: paleta.textoSecundario, "&.Mui-selected": { color: paleta.texto } },
        label: { fontSize: px(escala.mini.tamanho), "&.Mui-selected": { fontSize: px(escala.mini.tamanho) } },
      },
    },

    // Barras finas; a cor primária vira o tom neutro (cobalto não marca progresso).
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 4,
          borderRadius: raio.barraFina,
          // O trilho é sempre o tom interativo, qualquer que seja a cor da barra.
          variants: (["primary", "success", "warning", "error"] as const).map((color) => ({
            props: { color },
            style: { backgroundColor: paleta.interativo },
          })),
        },
        bar: {
          borderRadius: raio.barraFina,
          variants: [{ props: { color: "primary" }, style: { backgroundColor: paleta.textoSecundario } }],
        },
      },
    },
    MuiSkeleton: { styleOverrides: { root: { backgroundColor: paleta.interativo } } },

    MuiSnackbarContent: {
      styleOverrides: { root: { backgroundColor: paleta.texto, color: paleta.sobreClaro, borderRadius: raio.pilula, boxShadow: "none" } },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: raio.card,
          color: paleta.texto,
          // Fundo suave da semântica + ícone na cor dela; o texto fica na cor normal.
          variants: [
            { props: { variant: "standard", severity: "info" }, style: { backgroundColor: paleta.interativo, "& .MuiAlert-icon": { color: paleta.textoSecundario } } },
            { props: { variant: "standard", severity: "success" }, style: { backgroundColor: semantica.receita.fundo, "& .MuiAlert-icon": { color: semantica.receita.texto } } },
            { props: { variant: "standard", severity: "warning" }, style: { backgroundColor: semantica.atencao.fundo, "& .MuiAlert-icon": { color: semantica.atencao.texto } } },
            { props: { variant: "standard", severity: "error" }, style: { backgroundColor: semantica.estouro.fundo, "& .MuiAlert-icon": { color: semantica.estouro.texto } } },
          ],
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottomColor: paleta.divisor },
        head: { color: paleta.textoSecundario, fontWeight: 400, fontSize: px(escala.legenda.tamanho) },
      },
    },
    MuiTooltip: { styleOverrides: { tooltip: { backgroundColor: paleta.interativo, color: paleta.texto, borderRadius: raio.card } } },
    MuiLink: { styleOverrides: { root: { color: paleta.texto } } },
  },
});
