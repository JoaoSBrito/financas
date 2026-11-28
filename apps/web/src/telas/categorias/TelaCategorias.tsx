"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { hojeEmSaoPaulo, nomeDoMes, situacaoDoOrcamento, type NivelOrcamento } from "@financas/core";
import { CabecalhoTela, CarregandoLista, EstadoErro, EstadoVazio, estiloMono, estiloPainel, Rotulo, SecaoCard, useValoresOcultos } from "@financas/ui";
import { paleta, semantica } from "@financas/ui/tokens";
import { BotaoVoltar } from "@/componentes/BotaoVoltar";
import { useCartoes } from "@/hooks/useCartoes";
import { useCategorias, useFaturasResumo } from "@/hooks/useGastos";
import { useLancamentosDoMes, useOrcamentos, useSaidasDoMes } from "@/hooks/useInicio";
import type { Categoria } from "@/services/categorias";
import { gastoDoOrcamento, mesDeOrcamento } from "@/telas/inicio/resumo";
import { DialogoCategoria } from "./DialogoCategoria";

type Editando = { categoria?: Categoria & { orcamento: number | null } } | null;

const COR_NIVEL: Record<NivelOrcamento, string> = {
  normal: paleta.texto,
  atencao: semantica.atencao.texto,
  estourado: semantica.estouro.texto,
};

/** Reais sem centavos ("612", "1.200"), para comparar gasto e orçamento lado a lado. */
function ValorCurto({ centavos }: { centavos: number }) {
  const oculto = useValoresOcultos();
  if (oculto) return <span aria-label="Valor oculto">••••</span>;
  return <>{Math.round(centavos / 100).toLocaleString("pt-BR")}</>;
}

export function TelaCategorias() {
  const hoje = hojeEmSaoPaulo();
  const cartoes = useCartoes();
  const faturas = useFaturasResumo();
  const categorias = useCategorias();
  const mes = cartoes.data && faturas.data ? mesDeOrcamento(cartoes.data, faturas.data, hoje) : undefined;
  const orcamentos = useOrcamentos(mes);
  const doMes = useLancamentosDoMes(mes);
  const saidas = useSaidasDoMes(mes);
  const [editando, setEditando] = useState<Editando>(null);

  const carregando = cartoes.isPending || faturas.isPending || categorias.isPending || orcamentos.isPending || doMes.isPending;
  const erro = cartoes.isError || faturas.isError || categorias.isError || orcamentos.isError || doMes.isError;

  return (
    <Box>
      <CabecalhoTela
        titulo="Categorias e orçamento"
        voltar={<BotaoVoltar href="/ajustes" rotulo="Voltar para ajustes" />}
        acao={
          !carregando && !erro ? (
            <Button variant="outlined" startIcon={<AddRounded />} onClick={() => setEditando({})} sx={{ flexShrink: 0 }}>
              Nova
            </Button>
          ) : undefined
        }
      />

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
          mes={nomeDoMes(mes, false)}
          categorias={categorias.data}
          orcamentos={orcamentos.data}
          gastos={gastoDoOrcamento(mes, doMes.data, saidas.data ?? [])}
          onEditar={setEditando}
        />
      )}

      {editando && mes && <DialogoCategoria mes={mes} categoria={editando.categoria} onFechar={() => setEditando(null)} />}
    </Box>
  );
}

function Conteudo({
  mes,
  categorias,
  orcamentos,
  gastos,
  onEditar,
}: {
  mes: string;
  categorias: Categoria[];
  orcamentos: Map<string, number>;
  gastos: Map<string, number>;
  onEditar: (e: Editando) => void;
}) {
  if (categorias.length === 0) {
    return (
      <SecaoCard>
        <EstadoVazio
          titulo="Nenhuma categoria"
          descricao="Crie categorias para acompanhar onde o dinheiro vai."
          acao={
            <Button variant="contained" startIcon={<AddRounded />} onClick={() => onEditar({})}>
              Nova categoria
            </Button>
          }
        />
      </SecaoCard>
    );
  }

  const linhas = categorias.map((c) => {
    const orcamento = orcamentos.get(c.id) ?? null;
    const gasto = gastos.get(c.id) ?? 0;
    return { categoria: c, orcamento, gasto, situacao: orcamento ? situacaoDoOrcamento(gasto, orcamento) : null };
  });
  // Mais perto de estourar primeiro; sem orçamento, maior gasto primeiro.
  const comOrcamento = linhas.filter((l) => l.situacao).sort((a, b) => b.situacao!.percentual - a.situacao!.percentual);
  const semOrcamento = linhas.filter((l) => !l.situacao).sort((a, b) => b.gasto - a.gasto || a.categoria.nome.localeCompare(b.categoria.nome, "pt-BR"));
  const editar = (l: (typeof linhas)[number]) => onEditar({ categoria: { ...l.categoria, orcamento: l.orcamento } });

  const orcado = comOrcamento.reduce((s, l) => s + l.orcamento!, 0);
  const gastoComOrcamento = comOrcamento.reduce((s, l) => s + l.gasto, 0);
  const usado = orcado > 0 ? Math.floor((gastoComOrcamento * 100) / orcado) : 0;
  const estouraram = comOrcamento.filter((l) => l.situacao!.nivel === "estourado").length;
  const emAtencao = comOrcamento.filter((l) => l.situacao!.nivel === "atencao").length;
  const alertas = [estouraram && `${estouraram} ${estouraram === 1 ? "estourou" : "estouraram"}`, emAtencao && `${emAtencao} em atenção`].filter(Boolean).join(" · ");

  const linhaTopo = { borderTop: `1px solid ${paleta.divisor}` };

  // Desktop: resumo e "Com orçamento" à esquerda, "Sem orçamento" à direita.
  // Se uma das listas não existe, a outra ocupa a largura toda.
  const duasColunas = comOrcamento.length > 0 && semOrcamento.length > 0;

  return (
    <Box
      sx={{
        display: "grid",
        gap: 3,
        alignItems: "start",
        gridTemplateColumns: { xs: "minmax(0, 1fr)", md: duasColunas ? "minmax(0, 3fr) minmax(0, 2fr)" : "minmax(0, 1fr)" },
        gridTemplateAreas: { md: duasColunas ? '"rotulo rotulo" "resumo sem" "com sem" "nota nota"' : '"rotulo" "resumo" "com" "sem" "nota"' },
        // A coluna da direita não deve esticar as linhas da esquerda.
        gridTemplateRows: { md: duasColunas ? "auto auto 1fr auto" : "auto" },
      }}
    >
      <Rotulo sx={{ gridArea: { md: "rotulo" } }}>
        Orçamento · fatura de {mes} + saídas de {mes}
      </Rotulo>

      {comOrcamento.length > 0 ? (
        <Box component="section" aria-label="Resumo do orçamento" sx={{ ...estiloPainel, gridArea: { md: "resumo" }, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          {[
            { rotulo: "Orçado", valor: orcado },
            { rotulo: "Gasto com orçamento", valor: gastoComOrcamento },
          ].map((c, i) => (
            <Box key={c.rotulo} sx={{ p: "14px 16px", display: "flex", flexDirection: "column", gap: 1, borderRight: i === 0 ? `1px solid ${paleta.divisor}` : "none" }}>
              <Rotulo>{c.rotulo}</Rotulo>
              <Box component="span" sx={{ ...estiloMono, fontSize: 20, fontWeight: 500 }}>
                <ValorCurto centavos={c.valor} />
              </Box>
            </Box>
          ))}
          <Box sx={{ gridColumn: "1 / -1", ...linhaTopo, p: "12px 16px", display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box role="img" aria-label={`${usado}% do orçamento usado`} sx={{ height: 6, bgcolor: paleta.divisor, display: "flex" }}>
              <Box sx={{ width: `${Math.min(usado, 100)}%`, bgcolor: paleta.texto }} />
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
              <Rotulo>{usado}% usado</Rotulo>
              <Rotulo>{alertas || "Nenhuma em alerta"}</Rotulo>
            </Box>
          </Box>
        </Box>
      ) : (
        <Box sx={{ gridArea: { md: "resumo" } }}>
        <SecaoCard>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Defina um orçamento numa categoria para acompanhar os alertas de 80% e 100%.
          </Typography>
        </SecaoCard>
        </Box>
      )}

      {comOrcamento.length > 0 && (
        <Box sx={{ gridArea: { md: "com" }, minWidth: 0 }}>
        <SecaoCard titulo="Com orçamento" gap={1}>
          {comOrcamento.map((l) => {
            const { percentual, nivel } = l.situacao!;
            const cor = COR_NIVEL[nivel];
            return (
              <ButtonBase
                key={l.categoria.id}
                onClick={() => editar(l)}
                sx={{ ...linhaTopo, display: "flex", flexDirection: "column", alignItems: "stretch", gap: 1.5, py: 3, textAlign: "left" }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Box component="span" sx={{ fontSize: 15 }}>
                    {l.categoria.nome}
                  </Box>
                  <Box component="span" sx={{ ...estiloMono, fontSize: 13 }}>
                    <ValorCurto centavos={l.gasto} /> / <ValorCurto centavos={l.orcamento!} />
                  </Box>
                </Box>
                <Box aria-hidden sx={{ height: 4, bgcolor: paleta.divisor, display: "flex" }}>
                  <Box sx={{ width: `${Math.min(percentual, 100)}%`, bgcolor: cor }} />
                </Box>
                <Box component="span" sx={{ ...estiloMono, fontSize: 11, textTransform: "uppercase", color: nivel === "normal" ? "text.secondary" : cor }}>
                  {percentual}%{nivel === "estourado" ? " · estourou" : ""}
                </Box>
              </ButtonBase>
            );
          })}
        </SecaoCard>
        </Box>
      )}

      {semOrcamento.length > 0 && (
        <Box sx={{ gridArea: { md: "sem" }, minWidth: 0 }}>
        <SecaoCard titulo="Sem orçamento" gap={1}>
          {semOrcamento.map((l) => (
            <ButtonBase
              key={l.categoria.id}
              onClick={() => editar(l)}
              sx={{ ...linhaTopo, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, minHeight: 52, textAlign: "left" }}
            >
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Box component="span" sx={{ fontSize: 15 }}>
                  {l.categoria.nome}
                </Box>
                <Rotulo>Sem orçamento · definir</Rotulo>
              </Box>
              <Box component="span" sx={{ ...estiloMono, fontSize: 13, color: "text.secondary" }}>
                <ValorCurto centavos={l.gasto} />
              </Box>
            </ButtonBase>
          ))}
        </SecaoCard>
        </Box>
      )}

      <Typography variant="caption" component="p" sx={{ gridArea: { md: "nota" } }}>
        Âmbar a partir de 80% e coral a partir de 100%, sempre com o percentual escrito. Mudanças valem a partir deste mês.
      </Typography>
    </Box>
  );
}
