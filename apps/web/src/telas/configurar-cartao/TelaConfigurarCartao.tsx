"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Link from "next/link";
import { CabecalhoTela, EstadoErro, EstadoVazio } from "@financas/ui";
import { BotaoVoltar } from "@/componentes/BotaoVoltar";
import { useCartao, useCartoes, useFaturasDoCartao } from "@/hooks/useCartoes";
import { cartaoParaFormulario } from "@/services/cartoes-mapeamento";
import { FormularioCartao } from "./FormularioCartao";
import { CARTAO_NOVO } from "./valores";

function Cabecalho({ titulo }: { titulo: string }) {
  return <CabecalhoTela titulo={titulo} voltar={<BotaoVoltar href="/cartoes" rotulo="Voltar para cartões" />} />;
}

function Carregando() {
  return (
    <Box aria-busy="true" aria-label="Carregando cartão" sx={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      <Skeleton variant="rounded" height={420} sx={{ flex: "1 1 420px" }} />
      <Skeleton variant="rounded" height={320} sx={{ flex: "1 1 320px" }} />
    </Box>
  );
}

/** Cadastro (sem cartaoId) ou edição (com cartaoId) do cartão e da regra de fechamento. */
export function TelaConfigurarCartao({ cartaoId }: { cartaoId?: string }) {
  const cartao = useCartao(cartaoId);
  const faturas = useFaturasDoCartao(cartaoId);
  // A cor segue a ordem de cadastro (a mesma de Cartões); um cartão novo pega a próxima.
  const lista = useCartoes();
  const posicao = lista.data?.findIndex((c) => c.id === cartaoId) ?? -1;
  const indiceCor = posicao >= 0 ? posicao : (lista.data?.length ?? 0);

  if (!cartaoId) {
    return (
      <>
        <Cabecalho titulo="Novo cartão" />
        <FormularioCartao inicial={CARTAO_NOVO} faturas={[]} indiceCor={indiceCor} />
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
        indiceCor={indiceCor}
      />
    </>
  );
}
