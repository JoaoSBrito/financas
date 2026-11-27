"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { hojeEmSaoPaulo } from "@financas/core";
import { CabecalhoTela, EstadoErro, EstadoVazio } from "@financas/ui";
import { BotaoVoltar } from "@/componentes/BotaoVoltar";
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
    <>
      <CabecalhoTela titulo="Parcelamento em andamento" voltar={<BotaoVoltar rotulo="Voltar" onClick={() => router.back()} />} />
      <Typography variant="body2" sx={{ color: "text.secondary", mb: { xs: 3, md: 4 }, mt: { sm: -3 } }}>
        Para compras parceladas antes de usar o app. Só as parcelas que faltam entram nas faturas.
      </Typography>
    </>
  );

  if (cartoes.isPending || categorias.isPending || faturas.isPending) {
    return (
      <>
        {cabecalho}
        <Box aria-busy="true" aria-label="Carregando" sx={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          <Skeleton variant="rounded" height={420} sx={{ flex: "1 1 420px" }} />
          <Skeleton variant="rounded" height={260} sx={{ flex: "1 1 320px" }} />
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
