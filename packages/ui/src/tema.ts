"use client";

import { createTheme } from "@mui/material/styles";
import { breakpoints, camada, espacoBase, estados, movimento, paleta, raio, semantica, tipografia, toqueMinimo } from "./tokens";

const { escala } = tipografia;
const px = (n: number) => `${n}px`;
const em = (n?: number) => (n ? `${n}em` : undefined);
const anelDeFoco = { outline: `2px solid ${paleta.acao}`, outlineOffset: 2 };

/**
 * Tema Lastro: escuro, painéis com borda de 1 px e sem sombra, controles com raio 8,
 * lima só na ação principal (Button contained, Fab) e no foco.
 */
export const tema = createTheme({
  breakpoints: { values: breakpoints },
  spacing: espacoBase,
  palette: {
    mode: "dark",
    primary: { main: paleta.acao, dark: paleta.acaoPressionada, light: paleta.acao, contrastText: paleta.sobreAcao },
    secondary: { main: paleta.elevado, contrastText: paleta.texto },
    success: { main: semantica.receita.texto, contrastText: paleta.sobreAcao },
    warning: { main: semantica.atencao.texto, contrastText: paleta.sobreAcao },
    error: { main: semantica.estouro.texto, contrastText: paleta.sobreAcao },
    info: { main: paleta.textoSecundario, contrastText: paleta.sobreAcao },
    background: { default: paleta.fundo, paper: paleta.painel },
    text: { primary: paleta.texto, secondary: paleta.textoSecundario, disabled: estados.textoDesabilitado },
    divider: paleta.divisor,
    action: {
      hover: estados.hover,
      selected: paleta.elevado,
      focus: estados.foco,
      disabled: estados.desabilitado,
      disabledBackground: paleta.divisor,
    },
  },
  shape: { borderRadius: raio.painel },
  zIndex: { appBar: 1100 + camada.barra, modal: 1300 + camada.sobreposicao, snackbar: 1400 + camada.aviso },
  transitions: {
    duration: { shortest: movimento.rapido, shorter: movimento.rapido, short: movimento.padrao, standard: movimento.padrao },
    easing: { easeInOut: movimento.curva, easeOut: movimento.curva },
  },
  typography: {
    fontFamily: tipografia.familia,
    fontWeightRegular: tipografia.pesos.regular,
    fontWeightMedium: tipografia.pesos.medio,
    fontWeightBold: tipografia.pesos.forte,
    h1: { fontSize: px(escala.titulo.tamanho), fontWeight: 500, lineHeight: escala.titulo.alturaLinha, letterSpacing: em(escala.titulo.espacamento) },
    h2: { fontSize: px(escala.secao.tamanho), fontWeight: 500, lineHeight: escala.secao.alturaLinha },
    h3: { fontSize: px(escala.subsecao.tamanho), fontWeight: 500, lineHeight: escala.subsecao.alturaLinha },
    subtitle1: { fontSize: px(escala.corpo.tamanho), fontWeight: 400, lineHeight: escala.corpo.alturaLinha },
    subtitle2: { fontSize: px(escala.apoio.tamanho), fontWeight: 400, lineHeight: escala.apoio.alturaLinha },
    body1: { fontSize: px(escala.corpo.tamanho), lineHeight: tipografia.alturaLinha },
    body2: { fontSize: px(escala.apoio.tamanho), lineHeight: tipografia.alturaLinha },
    caption: { fontSize: px(escala.legenda.tamanho), lineHeight: tipografia.alturaLinha, color: paleta.textoSecundario },
    // Rótulo do Design System (texto.rotulo): mono, caixa alta.
    overline: {
      fontFamily: tipografia.familiaMono,
      fontSize: px(escala.rotulo.tamanho),
      lineHeight: escala.rotulo.alturaLinha,
      letterSpacing: em(escala.rotulo.espacamento),
      textTransform: "uppercase",
      color: paleta.textoSecundario,
    },
    button: { textTransform: "none", fontWeight: 600, fontSize: px(escala.botao.tamanho) },
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
        "@media (prefers-reduced-motion: reduce)": {
          "*, *::before, *::after": { animationDuration: "0.01ms !important", transitionDuration: "0.01ms !important" },
        },
      },
    },

    // Superfícies: sem sombra; a borda de 1 px separa as camadas.
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundImage: "none" } } },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { borderRadius: raio.painel, backgroundColor: paleta.painel, border: `1px solid ${paleta.divisor}`, boxShadow: "none" },
      },
    },
    MuiDivider: { styleOverrides: { root: { borderColor: paleta.divisor } } },

    // Botões: raio 8; lima só no contained primário.
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          minHeight: toqueMinimo,
          borderRadius: raio.controle,
          paddingInline: 18,
          variants: [
            {
              props: { variant: "contained", color: "primary" },
              style: { "&:hover": { backgroundColor: paleta.acaoPressionada } },
            },
            {
              props: { variant: "contained", color: "secondary" },
              style: { border: `1px solid ${paleta.bordaControle}`, fontWeight: 500, "&:hover": { backgroundColor: paleta.divisor } },
            },
            {
              props: { variant: "outlined", color: "primary" },
              style: {
                color: paleta.texto,
                fontWeight: 500,
                borderColor: paleta.bordaControle,
                "&:hover": { borderColor: paleta.texto, backgroundColor: paleta.elevado },
              },
            },
            {
              props: { variant: "text", color: "primary" },
              style: { color: paleta.texto, fontWeight: 500, "&:hover": { backgroundColor: paleta.elevado, color: paleta.acao } },
            },
            { props: { variant: "outlined", color: "error" }, style: { fontWeight: 500, "&:hover": { backgroundColor: semantica.estouro.fundo } } },
          ],
        },
        sizeLarge: { minHeight: 52 },
        sizeSmall: { minHeight: toqueMinimo, paddingInline: 12 },
      },
    },
    MuiIconButton: { styleOverrides: { root: { minWidth: toqueMinimo, minHeight: toqueMinimo, borderRadius: raio.controle } } },
    MuiFab: { styleOverrides: { root: { boxShadow: "none", borderRadius: raio.icone, "&:active": { boxShadow: "none" } } } },
    MuiButtonBase: { styleOverrides: { root: { "&.Mui-focusVisible": anelDeFoco } } },

    // Campos: raio 8, fundo elevado, borda de controle; foco em lima.
    MuiTextField: { defaultProps: { fullWidth: true } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: raio.controle,
          minHeight: 48,
          backgroundColor: paleta.elevado,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: paleta.bordaControle },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: paleta.texto },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: paleta.acao, borderWidth: 1 },
          "&.Mui-error .MuiOutlinedInput-notchedOutline": { borderColor: semantica.estouro.texto },
          "&.Mui-disabled": { backgroundColor: paleta.painel },
        },
        input: { paddingInline: 12 },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { color: paleta.textoSecundario, "&.Mui-focused": { color: paleta.texto }, "&.Mui-error": { color: semantica.estouro.texto } },
      },
    },
    MuiFormHelperText: { styleOverrides: { root: { color: paleta.textoSecundario, marginInline: 2, "&.Mui-error": { color: semantica.estouro.texto } } } },
    MuiFormLabel: { styleOverrides: { root: { color: paleta.textoSecundario } } },
    MuiSelect: { styleOverrides: { icon: { color: paleta.textoSecundario } } },

    // Seleção: filtro/segmento selecionado = pílula clara com texto escuro.
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: raio.controle,
          fontWeight: 400,
          variants: [
            { props: { variant: "outlined" }, style: { borderColor: paleta.bordaControle, color: paleta.textoSecundario } },
            { props: { variant: "filled", color: "default" }, style: { backgroundColor: paleta.elevado, color: paleta.texto } },
            {
              props: { variant: "filled", color: "primary" },
              style: {
                backgroundColor: paleta.texto,
                color: paleta.sobreAcao,
                fontWeight: 500,
                "&:hover, &.MuiChip-clickable:hover": { backgroundColor: paleta.texto },
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
          borderRadius: raio.controle,
          color: paleta.textoSecundario,
          borderColor: paleta.bordaControle,
          "&.Mui-selected, &.Mui-selected:hover": { backgroundColor: paleta.texto, color: paleta.sobreAcao, fontWeight: 500 },
        },
      },
    },
    // Grupos de botões separados (filtros, meses, parcelas): cada botão com raio próprio.
    MuiToggleButtonGroup: {
      styleOverrides: {
        grouped: {
          margin: "0 !important",
          borderRadius: `${raio.controle}px !important`,
          border: `1px solid ${paleta.bordaControle} !important`,
          "&.Mui-selected": { borderColor: `${paleta.texto} !important` },
        },
      },
    },
    MuiCheckbox: { styleOverrides: { root: { color: paleta.textoSecundario, "&.Mui-checked": { color: paleta.acao } } } },
    MuiRadio: { styleOverrides: { root: { color: paleta.textoSecundario, "&.Mui-checked": { color: paleta.acao } } } },
    MuiSwitch: {
      styleOverrides: {
        switchBase: { color: paleta.textoSecundario, "&.Mui-checked": { color: paleta.sobreAcao } },
        track: { backgroundColor: paleta.bordaControle, opacity: 1, ".Mui-checked.Mui-checked + &": { backgroundColor: paleta.acao, opacity: 1 } },
      },
    },

    // Diálogos e folhas: painel, borda de contorno, véu escuro.
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: raio.painel, backgroundColor: paleta.painel, backgroundImage: "none", border: `1px solid ${paleta.contorno}` },
        paperFullScreen: { borderRadius: 0, border: "none" },
      },
    },
    MuiDialogTitle: { styleOverrides: { root: { fontSize: px(escala.secao.tamanho), fontWeight: 500 } } },
    MuiBackdrop: { styleOverrides: { root: { "&:not(.MuiBackdrop-invisible)": { backgroundColor: paleta.veu } } } },
    MuiDrawer: { styleOverrides: { paper: { backgroundColor: paleta.painel, backgroundImage: "none", borderColor: paleta.contorno } } },

    MuiBottomNavigation: { styleOverrides: { root: { backgroundColor: paleta.painel, height: "auto" } } },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: { minWidth: 56, minHeight: 56, color: paleta.textoSecundario, "&.Mui-selected": { color: paleta.texto } },
        label: { fontSize: px(escala.mini.tamanho), "&.Mui-selected": { fontSize: px(escala.mini.tamanho) } },
      },
    },

    // Barras retas de 4 px sobre o trilho do divisor; a barra "primária" é neutra.
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 4,
          borderRadius: raio.barraFina,
          variants: (["primary", "success", "warning", "error"] as const).map((color) => ({
            props: { color },
            style: { backgroundColor: paleta.divisor },
          })),
        },
        bar: {
          borderRadius: raio.barraFina,
          variants: [{ props: { color: "primary" }, style: { backgroundColor: paleta.texto } }],
        },
      },
    },
    // Esqueletos retos, como as barras.
    MuiSkeleton: { styleOverrides: { root: { backgroundColor: paleta.divisor, borderRadius: raio.barra } } },

    MuiSnackbarContent: {
      styleOverrides: { root: { backgroundColor: paleta.texto, color: paleta.sobreAcao, borderRadius: raio.controle, boxShadow: "none" } },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: raio.controle,
          color: paleta.texto,
          border: `1px solid ${paleta.divisor}`,
          variants: [
            { props: { variant: "standard", severity: "info" }, style: { backgroundColor: paleta.painel, "& .MuiAlert-icon": { color: paleta.textoSecundario } } },
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
        head: {
          color: paleta.textoSecundario,
          fontWeight: 400,
          fontFamily: tipografia.familiaMono,
          fontSize: px(escala.rotulo.tamanho),
          letterSpacing: em(escala.rotulo.espacamento),
          textTransform: "uppercase",
        },
      },
    },
    MuiTooltip: { styleOverrides: { tooltip: { backgroundColor: paleta.elevado, color: paleta.texto, borderRadius: raio.selo, border: `1px solid ${paleta.contorno}` } } },
    MuiLink: { styleOverrides: { root: { color: paleta.texto, "&:hover": { color: paleta.acao } } } },
  },
});
