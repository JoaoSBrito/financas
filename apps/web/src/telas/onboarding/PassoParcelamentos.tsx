"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import type { Data } from "@financas/core";
import { CarregandoLista, EstadoErro, estiloMono, estiloPainel, SecaoCard, Valor } from "@financas/ui";
import { corDoCartao, paleta } from "@financas/ui/tokens";
import { useExcluirCompra } from "@/hooks/useFaturas";
import { useComprasDoInicio } from "@/hooks/useGastos";
import type { Categoria } from "@/services/categorias";
import type { CartaoCompleto, FaturaResumo } from "@/services/cartoes-mapeamento";
import { useAvisos } from "@/stores/avisos";
import { FormularioParcelamento } from "@/telas/parcelamento/FormularioParcelamento";
import { RodapePasso } from "./RodapePasso";

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

  const indiceCartao = new Map(cartoes.map((c, i) => [c.id, i]));

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
          <Box component="section" aria-label="Parcelamentos lançados" sx={{ ...estiloPainel, px: 4, display: "flex", flexDirection: "column" }}>
            {itens.map((c, i) => (
              <Box key={c.id} sx={{ display: "flex", flexDirection: "column", gap: 2, py: 3, borderTop: i > 0 ? `1px solid ${paleta.divisor}` : "none" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                  <Box aria-hidden sx={{ width: 4, height: 28, borderRadius: "2px", bgcolor: corDoCartao(indiceCartao.get(c.cartaoId) ?? 0), flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                    <Typography noWrap sx={{ fontSize: 15 }}>
                      {c.descricao}
                    </Typography>
                    <Box component="span" sx={{ ...estiloMono, fontSize: 11, color: "text.secondary" }}>
                      {nomeCartao.get(c.cartaoId)} ·{" "}
                      {c.parcelaAtual ? `${String(c.parcelaAtual).padStart(2, "0")}/${String(c.totalParcelas).padStart(2, "0")}` : "só histórico"}
                    </Box>
                  </Box>
                  <Box component="span" sx={{ ...estiloMono, fontSize: 12, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    Faltam <Valor valor={c.restante} semSimbolo sx={{ font: "inherit" }} />
                  </Box>
                  <IconButton
                    aria-label={`Excluir ${c.descricao}`}
                    disabled={excluir.isPending}
                    onClick={() => excluir.mutate(c.id, { onSuccess: () => mostrarAviso("Parcelamento excluído") })}
                    sx={{ mr: -2 }}
                  >
                    <DeleteOutlineRounded fontSize="small" />
                  </IconButton>
                </Box>
                {c.parcelaAtual && (
                  // Pagas no trilho, as que faltam (a partir da atual) em claro.
                  <Box
                    role="img"
                    aria-label={`Parcela ${c.parcelaAtual} de ${c.totalParcelas}`}
                    sx={{ display: "grid", gridTemplateColumns: `repeat(${c.totalParcelas}, minmax(0, 1fr))`, gap: "2px" }}
                  >
                    {Array.from({ length: c.totalParcelas }, (_, n) => (
                      <Box key={n} sx={{ height: 6, bgcolor: n + 1 < c.parcelaAtual! ? paleta.divisor : paleta.texto }} />
                    ))}
                  </Box>
                )}
              </Box>
            ))}
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 3, borderTop: `1px solid ${paleta.divisor}` }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Comprometido nas próximas faturas
              </Typography>
              <Valor valor={comprometido} semSimbolo sx={{ fontWeight: 500 }} />
            </Box>
          </Box>
        )
      )}

      <Button variant="outlined" startIcon={<AddRounded />} onClick={() => setAdicionando(true)} sx={{ minHeight: 52, borderStyle: "dashed" }}>
        Adicionar parcelamento
      </Button>
      <RodapePasso>
        <Button variant="contained" size="large" onClick={onContinuar}>
          {itens.length === 0 ? "Não tenho parcelamentos" : "Continuar"}
        </Button>
      </RodapePasso>
    </Stack>
  );
}
