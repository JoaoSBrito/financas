"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { hojeEmSaoPaulo } from "@financas/core";
import { EstadoErro, EstadoVazio } from "@financas/ui";
import { useCartoes } from "@/hooks/useCartoes";
import { useCategorias, useFaturasResumo } from "@/hooks/useGastos";
import { FormularioParcelamento } from "./FormularioParcelamento";

export function TelaParcelamento() {
  const router = useRouter();
  const params = useSearchParams();
  const cartoes = useCartoes();
  const categorias = useCategorias();
  const faturas = useFaturasResumo();

  const cabecalho = (
    <Box sx={{ mb: 5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, ml: -2 }}>
        <IconButton aria-label="Voltar" onClick={() => router.back()}>
          <ArrowBackRounded />
        </IconButton>
        <Typography variant="h1">Parcelamento em andamento</Typography>
      </Box>
      <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
        Para compras parceladas antes de usar o app. Só as parcelas que faltam entram nas faturas.
      </Typography>
    </Box>
  );

  if (cartoes.isPending || categorias.isPending || faturas.isPending) {
    return (
      <>
        {cabecalho}
        <Box aria-busy="true" aria-label="Carregando" sx={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          <Skeleton variant="rounded" height={420} sx={{ flex: "1 1 420px", borderRadius: 5 }} />
          <Skeleton variant="rounded" height={260} sx={{ flex: "1 1 320px", borderRadius: 5 }} />
        </Box>
      </>
    );
  }
  if (cartoes.isError || categorias.isError || faturas.isError) {
    return (
      <>
        {cabecalho}
        <EstadoErro
          mensagem="Não foi possível carregar seus cartões."
          onTentarNovamente={() => {
            void cartoes.refetch();
            void categorias.refetch();
            void faturas.refetch();
          }}
        />
      </>
    );
  }
  if (cartoes.data.length === 0) {
    return (
      <>
        {cabecalho}
        <EstadoVazio
          titulo="Cadastre um cartão primeiro"
          acao={
            <Button component={Link} href="/cartoes/novo" variant="contained" startIcon={<AddRounded />}>
              Cadastrar cartão
            </Button>
          }
        />
      </>
    );
  }
  return (
    <>
      {cabecalho}
      <FormularioParcelamento
        cartoes={cartoes.data}
        categorias={categorias.data}
        faturas={faturas.data}
        hoje={hojeEmSaoPaulo()}
        cartaoInicial={params.get("cartao") ?? undefined}
      />
    </>
  );
}
