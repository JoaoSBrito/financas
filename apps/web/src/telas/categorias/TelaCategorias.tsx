"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useState } from "react";
import { gastoPorCategoria, hojeEmSaoPaulo, nomeDoMes, situacaoDoOrcamento } from "@financas/core";
import { BarraProgresso, CardIndicador, CarregandoLista, EstadoErro, EstadoVazio, SecaoCard, Valor } from "@financas/ui";
import { useCartoes } from "@/hooks/useCartoes";
import { useCategorias, useFaturasResumo } from "@/hooks/useGastos";
import { useLancamentosDoMes, useOrcamentos } from "@/hooks/useInicio";
import type { Categoria } from "@/services/categorias";
import { mesDeOrcamento } from "@/telas/inicio/resumo";
import { DialogoCategoria } from "./DialogoCategoria";

type Editando = { categoria?: Categoria & { orcamento: number | null } } | null;

export function TelaCategorias() {
  const hoje = hojeEmSaoPaulo();
  const cartoes = useCartoes();
  const faturas = useFaturasResumo();
  const categorias = useCategorias();
  const mes = cartoes.data && faturas.data ? mesDeOrcamento(cartoes.data, faturas.data, hoje) : undefined;
  const orcamentos = useOrcamentos(mes);
  const doMes = useLancamentosDoMes(mes);
  const [editando, setEditando] = useState<Editando>(null);

  const carregando = cartoes.isPending || faturas.isPending || categorias.isPending || orcamentos.isPending || doMes.isPending;
  const erro = cartoes.isError || faturas.isError || categorias.isError || orcamentos.isError || doMes.isError;

  return (
    <Box sx={{ maxWidth: 720 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, ml: -2 }}>
        <IconButton component={Link} href="/ajustes" aria-label="Voltar para ajustes">
          <ArrowBackRounded />
        </IconButton>
        <Typography variant="h1">Categorias e orçamento</Typography>
      </Box>
      {mes && (
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 5 }}>
          Gastos da fatura de {nomeDoMes(mes, false)}. Mudanças no orçamento valem a partir deste mês.
        </Typography>
      )}

      {carregando ? (
        <SecaoCard>
          <CarregandoLista linhas={5} />
        </SecaoCard>
      ) : erro || !mes ? (
        <EstadoErro
          mensagem="Não foi possível carregar as categorias."
          onTentarNovamente={() => {
            void categorias.refetch();
            void orcamentos.refetch();
            void doMes.refetch();
          }}
        />
      ) : (
        <Conteudo
          categorias={categorias.data}
          orcamentos={orcamentos.data}
          gastos={gastoPorCategoria(
            doMes.data.map((l) => ({ mes: l.mes, valor: l.valor, categoriaId: l.categoriaId, historico: false })),
            mes,
          )}
          onEditar={setEditando}
        />
      )}

      {editando && mes && <DialogoCategoria mes={mes} categoria={editando.categoria} onFechar={() => setEditando(null)} />}
    </Box>
  );
}

function Conteudo({
  categorias,
  orcamentos,
  gastos,
  onEditar,
}: {
  categorias: Categoria[];
  orcamentos: Map<string, number>;
  gastos: Map<string, number>;
  onEditar: (e: Editando) => void;
}) {
  const totalOrcado = [...orcamentos.values()].reduce((s, v) => s + v, 0);
  const totalGasto = [...gastos.values()].reduce((s, v) => s + v, 0);
  const novo = (
    <Button variant="contained" startIcon={<AddRounded />} onClick={() => onEditar({})}>
      Categoria
    </Button>
  );

  return (
    <Stack spacing={4}>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 3 }}>
        <CardIndicador titulo="Orçamento total" valor={totalOrcado} />
        <CardIndicador titulo="Gasto com categoria" valor={totalGasto} />
      </Box>

      <SecaoCard titulo="Categorias" acao={novo} gap={1}>
        {categorias.length === 0 ? (
          <EstadoVazio titulo="Nenhuma categoria" descricao="Crie categorias para acompanhar onde o dinheiro vai." />
        ) : (
          categorias.map((c, i) => {
            const orcamento = orcamentos.get(c.id) ?? null;
            const gasto = gastos.get(c.id) ?? 0;
            const s = orcamento ? situacaoDoOrcamento(gasto, orcamento) : null;
            return (
              <Box key={c.id}>
                {i > 0 && <Divider />}
                <ButtonBase
                  onClick={() => onEditar({ categoria: { ...c, orcamento } })}
                  sx={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "stretch", gap: 1.5, py: 3, borderRadius: 2, textAlign: "left" }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                    <Typography variant="subtitle1">{c.nome}</Typography>
                    {orcamento ? (
                      <Valor valor={orcamento} sx={{ fontSize: 14, fontWeight: 700 }} />
                    ) : (
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        Sem orçamento
                      </Typography>
                    )}
                  </Box>
                  {s && orcamento ? (
                    <BarraProgresso
                      compacta
                      rotulo={`${c.nome}: ${s.percentual}% do orçamento`}
                      percentual={s.percentual}
                      tom={s.nivel === "normal" ? "primario" : "alerta"}
                    />
                  ) : null}
                  <Typography variant="caption" component="span" sx={{ color: s && s.nivel !== "normal" ? "warning.main" : undefined, fontWeight: s && s.nivel !== "normal" ? 700 : 400 }}>
                    {orcamento ? (
                      <>
                        {s!.percentual}% · <Valor valor={gasto} sx={{ font: "inherit" }} /> de <Valor valor={orcamento} sx={{ font: "inherit" }} />
                      </>
                    ) : (
                      <>
                        Gasto: <Valor valor={gasto} sx={{ font: "inherit" }} />
                      </>
                    )}
                  </Typography>
                </ButtonBase>
              </Box>
            );
          })
        )}
      </SecaoCard>
    </Stack>
  );
}
