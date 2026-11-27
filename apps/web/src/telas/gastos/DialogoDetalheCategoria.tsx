"use client";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { formatarDiaMes } from "@financas/core";
import { estiloPainel, FolhaInferior, ItemLancamento, Rotulo, Valor } from "@financas/ui";
import { corDoCartao, paleta } from "@financas/ui/tokens";
import type { GastoDetalhado } from "@/hooks/useGastosDoMes";
import type { Categoria } from "@/services/categorias";
import type { CartaoCompleto } from "@/services/cartoes-mapeamento";
import type { Conta } from "@/services/contas";
import { DialogoMovimento } from "@/telas/contas/Dialogos";
import { DialogoEditarLancamento } from "@/telas/faturas/DialogoEditarLancamento";

export interface DetalheCategoriaProps {
  titulo: string;
  itens: GastoDetalhado[];
  cartoes: CartaoCompleto[];
  contas: Conta[];
  categorias: Categoria[];
}

function detalhe(i: GastoDetalhado, cartoes: CartaoCompleto[], contas: Conta[]): string {
  const data = i.data ? formatarDiaMes(i.data) : null;
  if (i.origem === "cartao" && i.lancamento) {
    const cartao = cartoes.find((c) => c.id === i.lancamento!.cartaoId)?.nome ?? "Cartão";
    const parcela = i.lancamento.totalParcelas > 1 ? `${i.lancamento.numero} de ${i.lancamento.totalParcelas}` : "à vista";
    return [data, cartao, parcela].filter(Boolean).join(" · ");
  }
  const conta = contas.find((c) => c.id === i.movimento?.contaId)?.nome ?? "Conta";
  return [data, conta].filter(Boolean).join(" · ");
}

/** "3 lançamentos · cartão e conta". */
function resumo(itens: GastoDetalhado[]): string {
  const origens = new Set(itens.map((i) => i.origem));
  const onde = origens.size === 2 ? "cartão e conta" : origens.has("cartao") ? "cartão" : "conta";
  return `${itens.length} ${itens.length === 1 ? "lançamento" : "lançamentos"} · ${onde}`;
}

/** Lançamentos da categoria; tocar abre a edição (inclusive para trocar a categoria). */
function ListaDaCategoria({ itens, cartoes, contas, categorias }: Omit<DetalheCategoriaProps, "titulo">) {
  const [editando, setEditando] = useState<GastoDetalhado | null>(null);
  const indice = new Map(cartoes.map((c, i) => [c.id, i]));
  return (
    <>
      <Box>
        {itens.map((i, n) => (
          <Box key={i.chave}>
            {n > 0 && <Divider />}
            <ItemLancamento
              descricao={i.descricao}
              detalhe={`${i.origem === "cartao" ? "Cartão" : "Conta"} · ${detalhe(i, cartoes, contas)}`}
              valor={i.valor}
              // Filete na cor do cartão; saídas da conta ficam com o filete neutro.
              corFilete={i.lancamento ? corDoCartao(indice.get(i.lancamento.cartaoId) ?? 0) : paleta.divisor}
              onAbrir={() => setEditando(i)}
            />
          </Box>
        ))}
      </Box>
      {editando?.lancamento && (
        <DialogoEditarLancamento lancamento={editando.lancamento} categorias={categorias} onFechar={() => setEditando(null)} />
      )}
      {editando?.movimento && (
        <DialogoMovimento tipo="saida" contas={contas} movimento={editando.movimento} onFechar={() => setEditando(null)} />
      )}
    </>
  );
}

/** Celular: o detalhe da categoria numa folha inferior. */
export function DialogoDetalheCategoria({ onFechar, ...props }: DetalheCategoriaProps & { onFechar: () => void }) {
  const total = props.itens.reduce((s, i) => s + i.valor, 0);
  return (
    <FolhaInferior
      aberta
      onFechar={onFechar}
      titulo={props.titulo}
      contexto={
        <>
          {resumo(props.itens)} · <Valor valor={total} sx={{ font: "inherit" }} />
        </>
      }
    >
      <ListaDaCategoria {...props} />
    </FolhaInferior>
  );
}

/** Desktop: o detalhe fica num painel ao lado da tabela. */
export function PainelDetalheCategoria(props: DetalheCategoriaProps) {
  const total = props.itens.reduce((s, i) => s + i.valor, 0);
  return (
    <Box component="aside" aria-label={props.titulo} sx={{ ...estiloPainel, p: "16px 20px", display: "flex", flexDirection: "column", gap: 1 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 2 }}>
        <Typography component="h2" sx={{ fontSize: 17, fontWeight: 500 }}>
          {props.titulo}
        </Typography>
        <Valor valor={total} semSimbolo sx={{ fontSize: 14 }} />
      </Box>
      <Rotulo>{resumo(props.itens)}</Rotulo>
      <Box sx={{ mt: 1 }}>
        <ListaDaCategoria {...props} />
      </Box>
      <Typography variant="caption" component="p" sx={{ mt: 1 }}>
        Clique num lançamento para editar ou trocar a categoria.
      </Typography>
    </Box>
  );
}
