"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Link from "next/link";
import { hojeEmSaoPaulo } from "@financas/core";
import { EstadoErro, EstadoVazio } from "@financas/ui";
import { useCartoes } from "@/hooks/useCartoes";
import { useCategorias, useFaturasResumo } from "@/hooks/useGastos";
import { FormularioGasto } from "./FormularioGasto";

/** Conteúdo da tela de novo gasto, usado na página e no modal. */
export function TelaNovoGasto({ onConcluir }: { onConcluir: () => void }) {
  const cartoes = useCartoes();
  const categorias = useCategorias();
  const faturas = useFaturasResumo();

  if (cartoes.isPending || categorias.isPending || faturas.isPending) {
    return (
      <Box aria-busy="true" aria-label="Carregando" sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Skeleton variant="rounded" height={72} sx={{ mx: "auto", width: 220 }} />
        <Skeleton variant="rounded" height={52} />
        <Skeleton variant="rounded" height={68} />
        <Skeleton variant="rounded" height={88} />
      </Box>
    );
  }

  if (cartoes.isError || categorias.isError || faturas.isError) {
    return (
      <EstadoErro
        mensagem="Não foi possível carregar seus cartões."
        onTentarNovamente={() => {
          void cartoes.refetch();
          void categorias.refetch();
          void faturas.refetch();
        }}
      />
    );
  }

  if (cartoes.data.length === 0) {
    return (
      <EstadoVazio
        titulo="Cadastre um cartão primeiro"
        descricao="O gasto precisa de um cartão com a regra de fechamento para cair na fatura certa."
        acao={
          <Button component={Link} href="/cartoes/novo" variant="contained" startIcon={<AddRounded />}>
            Cadastrar cartão
          </Button>
        }
      />
    );
  }

  return (
    <FormularioGasto
      cartoes={cartoes.data}
      categorias={categorias.data}
      faturas={faturas.data}
      hoje={hojeEmSaoPaulo()}
      onConcluir={onConcluir}
    />
  );
}
