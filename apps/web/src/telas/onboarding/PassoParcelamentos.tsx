"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import type { Data } from "@financas/core";
import { CarregandoLista, EstadoErro, SecaoCard, Valor } from "@financas/ui";
import { useExcluirCompra } from "@/hooks/useFaturas";
import { useComprasDoInicio } from "@/hooks/useGastos";
import type { Categoria } from "@/services/categorias";
import type { CartaoCompleto, FaturaResumo } from "@/services/cartoes-mapeamento";
import { useAvisos } from "@/stores/avisos";
import { FormularioParcelamento } from "@/telas/parcelamento/FormularioParcelamento";

export interface PassoParcelamentosProps {
  cartoes: CartaoCompleto[];
  categorias: Categoria[];
  faturas: FaturaResumo[];
  hoje: Data;
  onContinuar: () => void;
}

export function PassoParcelamentos({ cartoes, categorias, faturas, hoje, onContinuar }: PassoParcelamentosProps) {
  const lista = useComprasDoInicio("anterior_ao_app");
  const excluir = useExcluirCompra();
  const mostrarAviso = useAvisos((s) => s.mostrar);
  const [adicionando, setAdicionando] = useState(false);
  const nomeCartao = new Map(cartoes.map((c) => [c.id, c.nome]));

  if (adicionando) {
    return (
      <Stack spacing={3}>
        <FormularioParcelamento
          cartoes={cartoes}
          categorias={categorias}
          faturas={faturas}
          hoje={hoje}
          onSalvo={() => setAdicionando(false)}
        />
        <Button onClick={() => setAdicionando(false)} sx={{ alignSelf: "center" }}>
          Cancelar
        </Button>
      </Stack>
    );
  }

  const itens = lista.data ?? [];
  const comprometido = itens.reduce((s, c) => s + c.restante, 0);

  return (
    <Stack spacing={4}>
      {lista.isPending ? (
        <SecaoCard>
          <CarregandoLista linhas={2} />
        </SecaoCard>
      ) : lista.isError ? (
        <EstadoErro mensagem="Não foi possível carregar os parcelamentos." onTentarNovamente={() => void lista.refetch()} />
      ) : (
        itens.length > 0 && (
          <SecaoCard titulo="Parcelamentos lançados" gap={1}>
            {itens.map((c, i) => (
              <Box key={c.id}>
                {i > 0 && <Divider />}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, minHeight: 64 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" noWrap>
                      {c.descricao}
                    </Typography>
                    <Typography variant="caption">
                      {nomeCartao.get(c.cartaoId)} · {c.parcelaAtual ? `parcela ${c.parcelaAtual} de ${c.totalParcelas}` : "só histórico"}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                    faltam <Valor valor={c.restante} sx={{ font: "inherit" }} />
                  </Typography>
                  <IconButton
                    aria-label={`Excluir ${c.descricao}`}
                    disabled={excluir.isPending}
                    onClick={() => excluir.mutate(c.id, { onSuccess: () => mostrarAviso("Parcelamento excluído") })}
                  >
                    <DeleteOutlineRounded fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ))}
            <Divider />
            <Box sx={{ display: "flex", justifyContent: "space-between", pt: 3 }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Comprometido nas próximas faturas
              </Typography>
              <Valor valor={comprometido} sx={{ fontWeight: 800 }} />
            </Box>
          </SecaoCard>
        )
      )}

      <Button
        variant="outlined"
        startIcon={<AddRounded />}
        onClick={() => setAdicionando(true)}
        sx={{ minHeight: 52, borderStyle: "dashed", borderWidth: 1.5, fontWeight: 800 }}
      >
        Adicionar parcelamento
      </Button>
      <Button variant="contained" size="large" onClick={onContinuar} sx={{ minHeight: 54, fontWeight: 800 }}>
        {itens.length === 0 ? "Não tenho parcelamentos" : "Continuar"}
      </Button>
    </Stack>
  );
}
