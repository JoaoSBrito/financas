"use client";

import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useState } from "react";
import { formatar, hojeEmSaoPaulo, mesDe, nomeDoMes, somarMeses, type LinhaDeCategoria, type Mes } from "@financas/core";
import {
  CabecalhoTela,
  ControleSegmentado,
  EstadoErro,
  EstadoVazio,
  estiloMono,
  estiloPainel,
  Rotulo,
  SecaoCard,
  useValoresOcultos,
  Valor,
} from "@financas/ui";
import { paleta, semantica } from "@financas/ui/tokens";
import { BotaoVoltar } from "@/componentes/BotaoVoltar";
import { useCartoes } from "@/hooks/useCartoes";
import { useContas } from "@/hooks/useContas";
import { useCategorias } from "@/hooks/useGastos";
import { useGastosDoMes } from "@/hooks/useGastosDoMes";
import { usePreferencias } from "@/stores/preferencias";
import { DialogoDetalheCategoria, PainelDetalheCategoria } from "./DialogoDetalheCategoria";
import { ListaCategorias } from "./ListaCategorias";

const curto = (mes: Mes) => nomeDoMes(mes, false).slice(0, 3);

/** Setas do mês com o nome em mono no meio. */
function SeletorMes({ mes, onChange }: { mes: Mes; onChange: (mes: Mes) => void }) {
  const botao = { width: 44, height: 44, borderRadius: "8px", border: `1px solid ${paleta.divisor}`, bgcolor: paleta.painel, color: "text.primary" } as const;
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, width: { xs: "100%", md: 300 } }}>
      <IconButton aria-label="Mês anterior" onClick={() => onChange(somarMeses(mes, -1))} sx={botao}>
        <ChevronLeftRounded />
      </IconButton>
      <Typography aria-live="polite" sx={{ ...estiloMono, fontSize: 15, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {nomeDoMes(mes, false)} {mes.slice(0, 4)}
      </Typography>
      <IconButton aria-label="Próximo mês" onClick={() => onChange(somarMeses(mes, 1))} sx={botao}>
        <ChevronRightRounded />
      </IconButton>
    </Box>
  );
}

/** Total do mês com a comparação em duas barras e a variação escrita. */
function PainelTotal({ mes, total, anterior }: { mes: Mes; total: number; anterior: number }) {
  const oculto = useValoresOcultos();
  const mesAnterior = somarMeses(mes, -1);
  const maior = Math.max(total, anterior, 1);
  const variacao = anterior > 0 ? Math.round(((total - anterior) / anterior) * 100) : null;
  const descricaoVariacao =
    variacao === null ? null : variacao === 0 ? "sem variação" : `${variacao > 0 ? "aumento" : "queda"} de ${Math.abs(variacao)}%`;

  const linha = (rotulo: string, valor: number, atual: boolean) => (
    <Box sx={{ display: "grid", gridTemplateColumns: "36px minmax(0, 1fr) 88px", gap: 2, alignItems: "center" }}>
      <Box component="span" sx={{ ...estiloMono, fontSize: 11, textTransform: "uppercase", color: atual ? "text.primary" : "text.secondary" }}>
        {rotulo}
      </Box>
      <Box sx={{ height: 8, width: `${(valor / maior) * 100}%`, bgcolor: atual ? paleta.texto : paleta.bordaControle }} />
      <Valor valor={valor} semSimbolo sx={{ fontSize: 12, textAlign: "right", color: atual ? "text.primary" : "text.secondary" }} />
    </Box>
  );

  return (
    <Box component="section" aria-label={`Gasto em ${nomeDoMes(mes, false)}`} sx={{ ...estiloPainel, p: 4, display: "flex", flexDirection: "column", gap: 3 }}>
      <Rotulo>Gasto em {nomeDoMes(mes, false)}</Rotulo>
      <Valor valor={total} sx={{ fontSize: { xs: 32, sm: 38 }, fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.1 }} />
      {anterior > 0 ? (
        <>
          <Box
            role="img"
            aria-label={
              oculto
                ? `${nomeDoMes(mes, false)} contra ${nomeDoMes(mesAnterior, false)}: ${descricaoVariacao}`
                : `${nomeDoMes(mes, false)} ${formatar(total)} contra ${nomeDoMes(mesAnterior, false)} ${formatar(anterior)}: ${descricaoVariacao}`
            }
            sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
          >
            <Box aria-hidden sx={{ display: "contents" }}>
              {linha(curto(mes), total, true)}
              {linha(curto(mesAnterior), anterior, false)}
            </Box>
          </Box>
          <Box
            component="span"
            sx={{
              ...estiloMono,
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: !variacao ? "text.secondary" : variacao > 0 ? semantica.atencao.texto : semantica.receita.texto,
            }}
          >
            {variacao === 0
              ? `Igual a ${nomeDoMes(mesAnterior, false)}`
              : `${variacao! > 0 ? "+" : "−"}${Math.abs(variacao!)}% em relação a ${nomeDoMes(mesAnterior, false)}`}
          </Box>
        </>
      ) : (
        <Rotulo>Sem gastos em {nomeDoMes(mesAnterior, false)} para comparar</Rotulo>
      )}
    </Box>
  );
}

export function TelaGastos() {
  const tema = useTheme();
  const desktop = useMediaQuery(tema.breakpoints.up("md"));
  const [mes, setMes] = useState(mesDe(hojeEmSaoPaulo()));
  const { baseGastos, definirBaseGastos } = usePreferencias();
  const gastos = useGastosDoMes(mes, baseGastos);
  const categorias = useCategorias();
  const cartoes = useCartoes();
  const contas = useContas();
  // undefined = nada escolhido (no desktop, o painel mostra a maior categoria).
  const [escolhida, setEscolhida] = useState<string | null | undefined>(undefined);
  const nomes = new Map((categorias.data ?? []).map((c) => [c.id, c.nome]));
  const nomeMes = nomeDoMes(mes, false);

  function trocarMes(novo: Mes) {
    setMes(novo);
    setEscolhida(undefined);
  }

  const linhas = gastos.resumo?.linhas ?? [];
  const noPainel = escolhida !== undefined ? escolhida : linhas[0]?.categoriaId;
  const detalhe = (categoriaId: string | null) => ({
    titulo: `${categoriaId ? (nomes.get(categoriaId) ?? "Categoria") : "Sem categoria"} · ${nomeMes}`,
    itens: gastos.itensDoMes.filter((i) => i.categoriaId === categoriaId),
    cartoes: cartoes.data ?? [],
    contas: contas.data ?? [],
    categorias: categorias.data ?? [],
  });

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { md: "center" }, justifyContent: "space-between", gap: { md: 4 }, mb: { xs: 3, md: 4 } }}>
        <CabecalhoTela titulo="Gastos" voltar={<BotaoVoltar href="/" rotulo="Voltar para o início" soNoCelular />} sx={{ mb: { xs: 4, sm: 4, md: 0 } }} />
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { md: "center" }, gap: 3 }}>
          <SeletorMes mes={mes} onChange={trocarMes} />
          <Box sx={{ width: { xs: "100%", md: 320 } }}>
            <ControleSegmentado
              rotulo="Gastos do cartão com base na"
              valor={baseGastos}
              onChange={definirBaseGastos}
              opcoes={[
                { valor: "compra", rotulo: "Data da compra" },
                { valor: "fatura", rotulo: "Data da fatura" },
              ]}
            />
          </Box>
        </Box>
      </Box>

      {gastos.isPending || categorias.isPending ? (
        <Box aria-busy="true" aria-label="Carregando" sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Skeleton variant="rounded" height={160} />
          <Skeleton variant="rounded" height={320} />
        </Box>
      ) : gastos.isError || !gastos.resumo ? (
        <EstadoErro mensagem="Não foi possível carregar os gastos." onTentarNovamente={gastos.refetch} />
      ) : gastos.resumo.total === 0 ? (
        <SecaoCard>
          <EstadoVazio titulo={`Nenhum gasto em ${nomeMes}`} descricao="Gastos no cartão e saídas da conta aparecem aqui, separados por categoria." />
        </SecaoCard>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 3fr) minmax(0, 2fr)" }, gap: { xs: 3, md: 4 }, alignItems: "start" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 3, md: 4 }, minWidth: 0 }}>
            <PainelTotal mes={mes} total={gastos.resumo.total} anterior={gastos.resumo.totalAnterior} />
            <SecaoCard
              titulo="Por categoria"
              gap={3}
              acao={
                <Box component="span" aria-hidden sx={{ ...estiloMono, fontSize: 10, color: "text.secondary", textTransform: "uppercase" }}>
                  % · var · valor
                </Box>
              }
            >
              <ListaCategorias
                linhas={linhas}
                nomes={nomes}
                mesAnterior={nomeDoMes(somarMeses(mes, -1), false)}
                onAbrir={(l: LinhaDeCategoria) => setEscolhida(l.categoriaId)}
                selecionada={desktop ? noPainel : undefined}
              />
            </SecaoCard>
            <Typography variant="caption" component="p">
              {baseGastos === "compra"
                ? "Pela data da compra: cada parcela conta a partir do mês em que você comprou. "
                : "Pela data da fatura: cada parcela conta no mês da fatura em que cai. "}
              Transferências, pagamento de fatura e saldo inicial ficam de fora. O orçamento, em Categorias, segue a fatura.
            </Typography>
          </Box>

          {desktop && noPainel !== undefined && (
            <Box sx={{ position: "sticky", top: 16, minWidth: 0 }}>
              <PainelDetalheCategoria {...detalhe(noPainel)} />
            </Box>
          )}
        </Box>
      )}

      {!desktop && escolhida !== undefined && <DialogoDetalheCategoria {...detalhe(escolhida)} onFechar={() => setEscolhida(undefined)} />}
    </>
  );
}
