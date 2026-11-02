"use client";

import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { hojeEmSaoPaulo } from "@financas/core";
import { EstadoErro, PassosOnboarding } from "@financas/ui";
import { useCartoes } from "@/hooks/useCartoes";
import { useCategorias, useFaturasResumo } from "@/hooks/useGastos";
import { PassoCartao } from "./PassoCartao";
import { PassoFatura } from "./PassoFatura";
import { PassoParcelamentos } from "./PassoParcelamentos";
import { PassoPronto } from "./PassoPronto";
import { PASSOS, type SlugPasso } from "./passos";

export function TelaOnboarding({ passo }: { passo: SlugPasso }) {
  const router = useRouter();
  const cartoes = useCartoes();
  const categorias = useCategorias();
  const faturas = useFaturasResumo();
  const indice = PASSOS.findIndex((p) => p.slug === passo);
  const info = PASSOS[indice]!;
  const anterior = PASSOS[indice - 1];
  const proximo = PASSOS[indice + 1];
  const continuar = () => router.push(`/primeiros-passos/${proximo?.slug ?? "pronto"}`);
  const hoje = hojeEmSaoPaulo();

  // Sem cartão, os passos seguintes não fazem sentido.
  const semCartao = cartoes.data?.length === 0 && passo !== "cartao";

  let conteudo: React.ReactNode;
  if (cartoes.isPending || categorias.isPending || faturas.isPending) {
    conteudo = <Skeleton variant="rounded" height={320} sx={{ borderRadius: 5 }} aria-label="Carregando" />;
  } else if (cartoes.isError || categorias.isError || faturas.isError) {
    conteudo = (
      <EstadoErro
        mensagem="Não foi possível carregar seus dados."
        onTentarNovamente={() => {
          void cartoes.refetch();
          void categorias.refetch();
          void faturas.refetch();
        }}
      />
    );
  } else if (semCartao) {
    conteudo = (
      <Stack spacing={3} sx={{ alignItems: "flex-start" }}>
        <Typography variant="body2">Cadastre um cartão primeiro.</Typography>
        <Button component={Link} href="/primeiros-passos/cartao" variant="contained">
          Ir para o passo 1
        </Button>
      </Stack>
    );
  } else if (passo === "cartao") {
    conteudo = <PassoCartao cartoes={cartoes.data} onContinuar={continuar} />;
  } else if (passo === "parcelamentos") {
    conteudo = (
      <PassoParcelamentos cartoes={cartoes.data} categorias={categorias.data} faturas={faturas.data} hoje={hoje} onContinuar={continuar} />
    );
  } else if (passo === "fatura") {
    conteudo = <PassoFatura cartoes={cartoes.data} faturas={faturas.data} hoje={hoje} onContinuar={continuar} />;
  } else {
    conteudo = <PassoPronto />;
  }

  return (
    <Box>
      <Stack spacing={4} sx={{ mb: 6 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 44 }}>
          {anterior ? (
            <Button component={Link} href={`/primeiros-passos/${anterior.slug}`} startIcon={<ArrowBackRounded />} sx={{ ml: -2 }}>
              Voltar
            </Button>
          ) : (
            <span />
          )}
          {passo !== "pronto" && (
            <Button component={Link} href="/" sx={{ color: "text.secondary" }}>
              Pular
            </Button>
          )}
        </Box>
        <PassosOnboarding atual={indice + 1} passos={PASSOS.map((p) => p.nome)} />
        <Box>
          <Typography variant="h1">{info.titulo}</Typography>
          <Typography variant="body1" sx={{ color: "text.secondary", mt: 2 }}>
            {info.descricao}
          </Typography>
        </Box>
      </Stack>
      {conteudo}
    </Box>
  );
}
