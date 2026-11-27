"use client";

import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type ReactNode } from "react";
import { CabecalhoTela, estiloPainel, Rotulo } from "@financas/ui";
import { paleta } from "@financas/ui/tokens";
import { BotaoVoltar } from "@/componentes/BotaoVoltar";
import { supabaseNavegador } from "@/lib/supabase/client";
import { usePreferencias } from "@/stores/preferencias";

/** Painel com rótulo de seção (Conta, Preferências, Organização). */
function Secao({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <Box component="section" aria-label={rotulo} sx={{ ...estiloPainel, px: 4, pt: 2.5, display: "flex", flexDirection: "column" }}>
      <Rotulo>{rotulo}</Rotulo>
      {children}
    </Box>
  );
}

function Textos({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <Box component="span" sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Box component="span" sx={{ fontSize: 15 }}>
        {titulo}
      </Box>
      <Box component="span" sx={{ fontSize: 13, color: "text.secondary" }}>
        {descricao}
      </Box>
    </Box>
  );
}

function ItemLink({ href, titulo, descricao, primeiro = false }: { href: string; titulo: string; descricao: string; primeiro?: boolean }) {
  return (
    <ButtonBase
      component={Link}
      href={href}
      sx={{ display: "flex", alignItems: "center", gap: 3, minHeight: 64, textAlign: "left", borderTop: primeiro ? "none" : `1px solid ${paleta.divisor}`, mt: primeiro ? 1 : 0 }}
    >
      <Textos titulo={titulo} descricao={descricao} />
      <ChevronRightRounded aria-hidden sx={{ color: "text.secondary" }} />
    </ButtonBase>
  );
}

export function TelaAjustes({ email }: { email: string | null }) {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);
  const { ocultarValores, alternarOcultarValores } = usePreferencias();
  const idOcultar = useId();

  async function sair() {
    setSaindo(true);
    await supabaseNavegador().auth.signOut();
    router.replace("/entrar");
    router.refresh();
  }

  return (
    <Box sx={{ maxWidth: { sm: 720 }, mx: { sm: "auto" } }}>
      <CabecalhoTela titulo="Ajustes" voltar={<BotaoVoltar href="/" rotulo="Voltar para o início" soNoCelular />} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Secao rotulo="Conta">
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, pt: 1, pb: 3.5 }}>
            <Typography sx={{ fontSize: 15, overflowWrap: "anywhere" }}>{email ?? "E-mail não disponível"}</Typography>
            <Typography sx={{ fontSize: 13, color: "text.secondary" }}>Entrada com e-mail e senha</Typography>
          </Box>
        </Secao>

        <Secao rotulo="Preferências">
          <Box component="label" htmlFor={idOcultar} sx={{ display: "flex", alignItems: "center", gap: 3, minHeight: 64, cursor: "pointer" }}>
            <Textos titulo="Ocultar valores" descricao="Mostra R$ •••• em todas as telas" />
            <Switch id={idOcultar} checked={ocultarValores} onChange={alternarOcultarValores} />
          </Box>
        </Secao>

        <Secao rotulo="Organização">
          <ItemLink primeiro href="/ajustes/categorias" titulo="Categorias e orçamento" descricao="Nomes e quanto gastar em cada uma" />
          <ItemLink href="/cartoes" titulo="Cartões" descricao="Limites, vencimentos e regras de fechamento" />
          <ItemLink href="/primeiros-passos/parcelamentos" titulo="Primeiros passos" descricao="Parcelamentos em andamento e saldo inicial das faturas" />
        </Secao>

        <Button
          variant="outlined"
          color="error"
          onClick={sair}
          disabled={saindo}
          startIcon={<LogoutRounded />}
          sx={{ alignSelf: "flex-start", minHeight: 48, px: 4.5 }}
        >
          {saindo ? "Saindo…" : "Sair"}
        </Button>
        <Rotulo component="p" sx={{ m: 0 }}>
          Lastro · v1
        </Rotulo>
      </Box>
    </Box>
  );
}
