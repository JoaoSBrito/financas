"use client";

import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { EstadoErro, EstadoVazio } from "@financas/ui";
import { useCartao, useFaturasDoCartao } from "@/hooks/useCartoes";
import { cartaoParaFormulario } from "@/services/cartoes-mapeamento";
import { FormularioCartao } from "./FormularioCartao";
import { CARTAO_NOVO } from "./valores";

function Cabecalho({ titulo }: { titulo: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 5, ml: -2 }}>
      <IconButton component={Link} href="/cartoes" aria-label="Voltar para cartões">
        <ArrowBackRounded />
      </IconButton>
      <Typography variant="h1">{titulo}</Typography>
    </Box>
  );
}

function Carregando() {
  return (
    <Box aria-busy="true" aria-label="Carregando cartão" sx={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      <Skeleton variant="rounded" height={420} sx={{ flex: "1 1 420px", borderRadius: 5 }} />
      <Skeleton variant="rounded" height={320} sx={{ flex: "1 1 320px", borderRadius: 5 }} />
    </Box>
  );
}

/** Cadastro (sem cartaoId) ou edição (com cartaoId) do cartão e da regra de fechamento. */
export function TelaConfigurarCartao({ cartaoId }: { cartaoId?: string }) {
  const cartao = useCartao(cartaoId);
  const faturas = useFaturasDoCartao(cartaoId);

  if (!cartaoId) {
    return (
      <>
        <Cabecalho titulo="Novo cartão" />
        <FormularioCartao inicial={CARTAO_NOVO} faturas={[]} />
      </>
    );
  }

  if (cartao.isPending || faturas.isPending) {
    return (
      <>
        <Cabecalho titulo="Cartão" />
        <Carregando />
      </>
    );
  }

  if (cartao.isError || faturas.isError) {
    return (
      <>
        <Cabecalho titulo="Cartão" />
        <EstadoErro
          mensagem="Não foi possível carregar o cartão."
          onTentarNovamente={() => {
            void cartao.refetch();
            void faturas.refetch();
          }}
        />
      </>
    );
  }

  if (!cartao.data) {
    return (
      <>
        <Cabecalho titulo="Cartão" />
        <EstadoVazio
          titulo="Cartão não encontrado"
          descricao="Ele pode ter sido removido."
          acao={
            <Button component={Link} href="/cartoes" variant="contained">
              Ver meus cartões
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <Cabecalho titulo={`Cartão ${cartao.data.nome}`} />
      <FormularioCartao
        key={cartao.data.id}
        cartaoId={cartao.data.id}
        inicial={cartaoParaFormulario(cartao.data)}
        faturas={faturas.data}
      />
    </>
  );
}
