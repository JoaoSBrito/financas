"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { descreverRegra, faturaDaCompra, formatarDiaMes, hojeEmSaoPaulo } from "@financas/core";
import { CarregandoLista, EstadoErro, EstadoVazio, SecaoCard, Valor } from "@financas/ui";
import { cores } from "@financas/ui/tokens";
import { useCartoes } from "@/hooks/useCartoes";
import type { CartaoCompleto } from "@/services/cartoes-mapeamento";

/**
 * Lista provisória de cartões. Na etapa "Cartões e faturas" esta tela ganha
 * as faturas, os lançamentos e os parcelamentos.
 */
export function TelaCartoes() {
  const cartoes = useCartoes();

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 3, mb: 5 }}>
        <Typography variant="h1">Cartões</Typography>
        {cartoes.data && cartoes.data.length > 0 && (
          <Button component={Link} href="/cartoes/novo" variant="outlined" startIcon={<AddRounded />}>
            Cartão
          </Button>
        )}
      </Box>

      {cartoes.isPending && (
        <SecaoCard>
          <CarregandoLista linhas={2} />
        </SecaoCard>
      )}

      {cartoes.isError && (
        <EstadoErro mensagem="Não foi possível carregar os cartões." onTentarNovamente={() => void cartoes.refetch()} />
      )}

      {cartoes.data?.length === 0 && (
        <SecaoCard>
          <EstadoVazio
            titulo="Nenhum cartão cadastrado"
            descricao="Cadastre seu cartão com a regra de fechamento para o app calcular as faturas."
            acao={
              <Button component={Link} href="/cartoes/novo" variant="contained" startIcon={<AddRounded />}>
                Cadastrar cartão
              </Button>
            }
          />
        </SecaoCard>
      )}

      {cartoes.data && cartoes.data.length > 0 && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 4 }}>
          {cartoes.data.map((c) => (
            <ItemCartao key={c.id} cartao={c} />
          ))}
        </Box>
      )}
    </>
  );
}

function ItemCartao({ cartao }: { cartao: CartaoCompleto }) {
  const atual = faturaDaCompra(cartao, hojeEmSaoPaulo());
  return (
    <Card sx={{ p: 5, display: "flex", flexDirection: "column", gap: 4 }}>
      <Box
        sx={{
          bgcolor: cores.destaque,
          color: "#FFFFFF",
          borderRadius: 4,
          p: 5,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography sx={{ fontSize: 16, fontWeight: 800 }}>{cartao.nome}</Typography>
          {cartao.final && <Typography sx={{ fontSize: 13, color: "#E0E7FF" }}>•••• {cartao.final}</Typography>}
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: "#E0E7FF" }}>
            Limite
          </Typography>
          <Valor valor={cartao.limite} component="div" sx={{ fontSize: 22, fontWeight: 800 }} />
        </Box>
      </Box>
      <Box>
        <Typography variant="body2">{descreverRegra(cartao)}</Typography>
        <Typography variant="caption" component="p">
          Fatura atual: fecha {formatarDiaMes(atual.fechamento)} e vence {formatarDiaMes(atual.vencimento)}
        </Typography>
      </Box>
      <Button component={Link} href={`/cartoes/${cartao.id}/configurar`} variant="outlined">
        Configurar
      </Button>
    </Card>
  );
}
