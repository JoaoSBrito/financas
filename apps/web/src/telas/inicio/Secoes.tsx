"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import CreditCardRounded from "@mui/icons-material/CreditCardRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatar, formatarDiaMes, nomeDoMes, situacaoDoOrcamento, type LinhaDeCategoria, type Mes } from "@financas/core";
import {
  BarraProgresso,
  BarraSegmentada,
  EstadoVazio,
  IconeCaixinha,
  ItemLancamento,
  ItemLinhaDoTempo,
  ReguaCobertura,
  Rotulo,
  SecaoCard,
  SeloStatus,
  Valor,
} from "@financas/ui";
import { corDoCartao, grafico, paleta, semantica, tipografia } from "@financas/ui/tokens";
import { LinkDiscreto } from "@/componentes/LinkDiscreto";
import type { Categoria } from "@/services/categorias";
import type { CartaoCompleto } from "@/services/cartoes-mapeamento";
import type { MovimentoConta } from "@/services/contas";
import type { Lancamento } from "@/services/faturas";
import type { CompraRecente } from "@/services/inicio";
import { gastoDoOrcamento, type ResumoInicio } from "./resumo";

const estiloMono = { fontFamily: tipografia.familiaMono, fontVariantNumeric: tipografia.numeros } as const;
const estiloRotulo = { ...estiloMono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" } as const;
const estiloPainel = { bgcolor: paleta.painel, border: `1px solid ${paleta.divisor}`, borderRadius: "10px" } as const;

const LinkSecao = LinkDiscreto;

/** Celular: fatura de todos os cartões com o uso do limite. */
const maiusc = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Linha de um cartão no painel: filete, nome, fechamento e valor da fatura aberta. */
function LinhaCartao({ nome, cor, dias, fechamento, total, ultima }: { nome: string; cor: string; dias: number; fechamento: string; total: number; ultima: boolean }) {
  const emBreve = dias >= 0 && dias <= 3;
  return (
    <Box
      component="li"
      sx={{ display: "grid", gridTemplateColumns: "4px minmax(0, 1fr) auto 96px", alignItems: "center", columnGap: 2.5, minHeight: 44, borderBottom: ultima ? "none" : `1px solid ${paleta.divisor}` }}
    >
      <Box component="span" aria-hidden sx={{ width: 4, height: 18, borderRadius: "2px", bgcolor: cor }} />
      <Typography component="span" sx={{ fontSize: 14 }}>
        {nome}
      </Typography>
      <Box component="span" sx={{ ...estiloMono, fontSize: 11, textTransform: "uppercase", color: emBreve ? semantica.atencao.texto : "text.secondary" }}>
        {dias === 0 ? "Fecha hoje" : emBreve ? `Fecha em ${dias} ${dias === 1 ? "dia" : "dias"}` : `Fecha ${formatarDiaMes(fechamento)}`}
      </Box>
      <Valor valor={total} sx={{ fontSize: 14, textAlign: "right" }} />
    </Box>
  );
}

const MAX_CARTOES_NO_PAINEL = 3;

/** Painel do mês: fatura atual, limite, sobra, parcelas e a fatura de cada cartão. */
export function PainelDoMes({ r, melhorDia, sobra }: { r: ResumoInicio; melhorDia: string | null; sobra: ReactNode }) {
  const usado = r.limiteTotal > 0 ? Math.round((r.comprometido / r.limiteTotal) * 100) : 0;
  const visiveis = r.porCartao.slice(0, MAX_CARTOES_NO_PAINEL);
  const resto = r.porCartao.slice(MAX_CARTOES_NO_PAINEL);
  const celula = { p: { xs: "14px 16px", md: "18px 24px" }, display: "flex", flexDirection: "column", gap: 1, minWidth: 0 } as const;
  return (
    <Card component="section" aria-label="Fatura atual de todos os cartões" sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "2fr repeat(3, minmax(0, 1fr))" } }}>
      <Box sx={{ ...celula, gridColumn: { xs: "1 / -1", md: "auto" }, gap: 2.5, borderBottom: { xs: `1px solid ${paleta.divisor}`, md: "none" }, borderRight: { md: `1px solid ${paleta.divisor}` } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
          <Rotulo>Fatura atual · {r.porCartao.length} {r.porCartao.length === 1 ? "cartão" : "cartões"}</Rotulo>
          <Rotulo>{usado}% do limite</Rotulo>
        </Box>
        <Valor valor={r.faturaAtual} component="p" sx={{ m: 0, fontSize: { xs: 38, md: 32 }, fontWeight: 500, lineHeight: 1.1, letterSpacing: "-0.03em" }} />
        <BarraSegmentada
          rotulo={`Limite: fatura atual, parcelas futuras e ${formatar(r.limiteDisponivel)} livres de ${formatar(r.limiteTotal)}`}
          total={r.limiteTotal}
          segmentos={[
            { rotulo: "Fatura", valor: r.faturaAtual, cor: paleta.texto },
            { rotulo: "Parcelas", valor: Math.max(0, r.comprometido - r.faturaAtual), cor: paleta.bordaControle },
          ]}
          rotuloRestante="Livre"
          legenda
        />
      </Box>
      <Box sx={{ ...celula, borderRight: `1px solid ${paleta.divisor}` }}>
        <Rotulo>Limite livre</Rotulo>
        <Valor valor={r.limiteDisponivel} sx={{ fontSize: { xs: 18, md: 24 }, fontWeight: 500 }} />
        <Typography variant="caption" sx={{ display: { xs: "none", md: "block" } }}>
          de <Valor valor={r.limiteTotal} sx={{ font: "inherit" }} />
        </Typography>
      </Box>
      <Box sx={{ ...celula, borderRight: { md: `1px solid ${paleta.divisor}` } }}>{sobra}</Box>
      <Box sx={{ ...celula, display: { xs: "none", md: "flex" } }}>
        <Rotulo>Em parcelas</Rotulo>
        <Valor valor={r.comprometidoFuturo} sx={{ fontSize: 24, fontWeight: 500 }} />
        <Typography variant="caption">{r.ultimoMesComprometido ? `até ${nomeDoMes(r.ultimoMesComprometido)}` : "nenhuma parcela futura"}</Typography>
      </Box>
      <Box sx={{ gridColumn: "1 / -1", borderTop: `1px solid ${paleta.divisor}`, px: { xs: 4, md: 6 } }}>
        <Box component="ol" aria-label="Fatura atual por cartão" sx={{ listStyle: "none", m: 0, p: 0 }}>
          {visiveis.map((c, i) => (
            <LinhaCartao key={c.cartaoId} nome={c.nome} cor={corDoCartao(c.indice)} dias={c.dias} fechamento={c.fechamento} total={c.total} ultima={i === visiveis.length - 1} />
          ))}
        </Box>
      </Box>
      {resto.length > 0 && (
        <ButtonBase
          component={Link}
          href="/cartoes"
          sx={{ gridColumn: "1 / -1", borderTop: `1px solid ${paleta.divisor}`, minHeight: 44, px: { xs: 4, md: 6 }, justifyContent: "space-between", ...estiloMono, fontSize: 11, textTransform: "uppercase" }}
        >
          <span>
            +{resto.length} {resto.length === 1 ? "cartão" : "cartões"} · <Valor valor={resto.reduce((s, c) => s + c.total, 0)} sx={{ font: "inherit" }} />
          </span>
          <span>Ver todos →</span>
        </ButtonBase>
      )}
      <Box sx={{ gridColumn: "1 / -1", borderTop: `1px solid ${paleta.divisor}`, px: { xs: 4, md: 6 }, py: 2.5, display: "flex", justifyContent: "space-between", gap: 3, flexWrap: "wrap" }}>
        {melhorDia ? <Rotulo>Melhor dia de compra: {formatarDiaMes(melhorDia)}</Rotulo> : <span />}
        {resto.length === 0 && (
          <Box component={Link} href="/cartoes" sx={{ ...estiloRotulo, color: "text.primary", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: 44, my: -3, "&:hover": { color: paleta.acao } }}>
            Todos os cartões →
          </Box>
        )}
      </Box>
    </Card>
  );
}

/** Conteúdo da célula "Sobra em": link para Contas. */
export function CelulaSobra({ ate, valor }: { ate: string; valor: number }) {
  return (
    <Box component={Link} href="/contas" aria-label={`Sobra em ${formatarDiaMes(ate)}: ver contas`} sx={{ display: "flex", flexDirection: "column", gap: 1, textDecoration: "none", color: "inherit", minHeight: 44 }}>
      <Rotulo>Sobra em {formatarDiaMes(ate)} →</Rotulo>
      <Valor valor={valor} sx={{ fontSize: { xs: 18, md: 24 }, fontWeight: 500, color: valor < 0 ? semantica.estouro.texto : undefined }} />
    </Box>
  );
}

export function CardEmBreve({ titulo, texto, href, rotulo }: { titulo: string; texto: string; href: string; rotulo: string }) {
  return (
    <Card sx={{ p: "16px", bgcolor: "transparent", border: `1px dashed ${paleta.bordaControle}`, display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
        {titulo}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {texto}
      </Typography>
      <Box>
        <Button component={Link} href={href} variant="outlined" size="small">
          {rotulo}
        </Button>
      </Box>
    </Card>
  );
}

const ATALHOS = [
  { href: "/gastos/novo", rotulo: "Novo gasto", icone: <AddRounded fontSize="small" sx={{ color: paleta.acao }} /> },
  { href: "/cartoes", rotulo: "Faturas", icone: <CreditCardRounded fontSize="small" /> },
  { href: "/caixinhas", rotulo: "Guardar", icone: <IconeCaixinha fontSize="small" /> },
];

/** Atalhos do celular: blocos com ícone e texto. */
export function Atalhos() {
  return (
    <Box component="nav" aria-label="Atalhos" sx={{ display: "grid", gridTemplateColumns: `repeat(${ATALHOS.length}, minmax(0, 1fr))`, gap: 2 }}>
      {ATALHOS.map((a) => (
        <ButtonBase
          key={a.href}
          component={Link}
          href={a.href}
          sx={{ ...estiloPainel, minHeight: 64, p: "10px 12px", flexDirection: "column", alignItems: "flex-start", justifyContent: "space-between", fontSize: 13, color: "text.primary" }}
        >
          <Box component="span" aria-hidden sx={{ display: "flex" }}>
            {a.icone}
          </Box>
          {a.rotulo}
        </ButtonBase>
      ))}
    </Box>
  );
}

/** Próximas datas em linha do tempo: círculo vazio = fechamento, cheio = vencimento. */
export function ProximasDatas({ r, corPorCartao }: { r: ResumoInicio; corPorCartao: Map<string, string> }) {
  return (
    <SecaoCard titulo="Próximas datas" gap={1}>
      {r.agenda.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Nenhuma fatura a fechar ou a pagar.
        </Typography>
      ) : (
        <>
          <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0 }}>
            {r.agenda.map((a) => (
              <ItemLinhaDoTempo
                key={`${a.tipo}-${a.cartao}-${a.data}`}
                data={formatarDiaMes(a.data)}
                tipo={a.tipo}
                cor={corPorCartao.get(a.cartao) ?? paleta.textoSecundario}
                titulo={`${a.tipo === "fechamento" ? "Fechamento" : "Vencimento"} ${a.cartao}`}
                fim={
                  a.tipo === "fechamento" ? (
                    <SeloStatus status={a.status} />
                  ) : (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      {a.vencida && (
                        <Chip size="small" label="Vencida" sx={{ height: 22, fontSize: 10, fontFamily: "inherit", textTransform: "uppercase", borderRadius: "4px", color: semantica.estouro.texto, bgcolor: semantica.estouro.fundo }} />
                      )}
                      <Valor valor={a.valor ?? 0} sx={{ fontSize: 14 }} />
                    </Box>
                  )
                }
              />
            ))}
          </Box>
          <Typography variant="caption" component="p" sx={{ pt: 1 }}>
            Círculo vazio: fechamento. Círculo cheio: vencimento.
          </Typography>
        </>
      )}
    </SecaoCard>
  );
}

/** Próximas faturas em barras horizontais, com o valor ao lado. */
export function ProximasFaturas({ meses }: { meses: ResumoInicio["proximasFaturas"] }) {
  const maior = Math.max(1, ...meses.map((m) => m.total));
  const resumo = meses.map((m) => `${nomeDoMes(m.mes)}: ${formatar(m.total)}`).join("; ");
  return (
    <SecaoCard titulo="Próximas faturas" acao={<LinkSecao href="/cartoes">Ver tudo</LinkSecao>}>
      <Box role="img" aria-label={`Próximas faturas. ${resumo}.`} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {meses.map((m) => (
          <Box key={m.mes} sx={{ display: "grid", gridTemplateColumns: "44px minmax(0, 1fr) 96px", alignItems: "center", gap: 3 }}>
            <Box component="span" sx={{ ...estiloMono, fontSize: 12, textTransform: "uppercase", color: m.aberta ? "text.primary" : "text.secondary" }}>
              {nomeDoMes(m.mes, false).slice(0, 3)}
            </Box>
            <Box sx={{ height: 10, width: `${Math.max(2, (m.total / maior) * 100)}%`, bgcolor: m.aberta ? grafico.destaque : grafico.inativo }} />
            <Valor valor={m.total} sx={{ fontSize: 13, textAlign: "right" }} />
          </Box>
        ))}
      </Box>
      <Typography variant="caption" component="p">
        Meses seguintes mostram parcelas já lançadas.
      </Typography>
    </SecaoCard>
  );
}

export function OrcamentoDoMes({
  mes,
  lancamentos,
  saidas,
  orcamentos,
  categorias,
}: {
  mes: Mes;
  lancamentos: Lancamento[];
  saidas: MovimentoConta[];
  orcamentos: Map<string, number>;
  categorias: Categoria[];
}) {
  const gastos = gastoDoOrcamento(mes, lancamentos, saidas);
  const nome = new Map(categorias.map((c) => [c.id, c.nome]));
  const comOrcamento = [...orcamentos.entries()]
    .map(([id, orcamento]) => ({ id, orcamento, gasto: gastos.get(id) ?? 0, ...situacaoDoOrcamento(gastos.get(id) ?? 0, orcamento) }))
    .sort((a, b) => b.percentual - a.percentual);
  const semOrcamento = [...gastos.entries()].filter(([id]) => !orcamentos.has(id)).sort((a, b) => b[1] - a[1]);

  return (
    <SecaoCard
      titulo={`Orçamento · fatura de ${nomeDoMes(mes, false)}`}
      acao={<LinkSecao href="/ajustes/categorias">{orcamentos.size ? "Ajustar" : "Definir"}</LinkSecao>}
    >
      {comOrcamento.length === 0 && semOrcamento.length === 0 && (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Nenhum gasto com categoria nas faturas de {nomeDoMes(mes, false)} ainda.
        </Typography>
      )}
      {comOrcamento.map((o) => (
        <BarraProgresso
          key={o.id}
          rotulo={nome.get(o.id) ?? "Categoria"}
          percentual={o.percentual}
          tom={o.nivel === "normal" ? "primario" : o.nivel === "atencao" ? "alerta" : "estouro"}
          detalhe={
            <>
              {o.percentual}% · <Valor valor={o.gasto} sx={{ font: "inherit" }} /> de <Valor valor={o.orcamento} sx={{ font: "inherit" }} />
            </>
          }
        />
      ))}
      {semOrcamento.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {comOrcamento.length > 0 && <Divider sx={{ mb: 1 }} />}
          <Typography variant="caption">Sem orçamento definido</Typography>
          {semOrcamento.slice(0, 4).map(([id, gasto]) => (
            <Box key={id} sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: 14 }}>
                {nome.get(id) ?? "Categoria"}
              </Typography>
              <Valor valor={gasto} sx={{ fontSize: 14 }} />
            </Box>
          ))}
        </Box>
      )}
    </SecaoCard>
  );
}

export function UltimosGastos({
  compras,
  cartoes,
  categorias,
}: {
  compras: CompraRecente[];
  cartoes: CartaoCompleto[];
  categorias: Categoria[];
}) {
  const cartao = new Map(cartoes.map((c) => [c.id, c.nome]));
  const cor = new Map(cartoes.map((c, i) => [c.id, corDoCartao(i)]));
  const categoria = new Map(categorias.map((c) => [c.id, c.nome]));
  return (
    <SecaoCard titulo="Últimos gastos" acao={<LinkSecao href="/cartoes">Ver faturas</LinkSecao>} gap={1}>
      {compras.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum gasto lançado"
          acao={
            <Button component={Link} href="/gastos/novo" variant="contained" startIcon={<AddRounded />}>
              Lançar gasto
            </Button>
          }
        />
      ) : (
        compras.map((c, i) => (
          <Box key={c.id}>
            {i > 0 && <Divider />}
            <ItemLancamento
              descricao={c.descricao}
              corFilete={cor.get(c.cartaoId)}
              detalhe={[
                c.dataCompra ? formatarDiaMes(c.dataCompra) : null,
                cartao.get(c.cartaoId),
                c.categoriaId ? categoria.get(c.categoriaId) : null,
                c.totalParcelas > 1 ? `${c.totalParcelas}x` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              valor={c.valorTotal}
            />
          </Box>
        ))
      )}
    </SecaoCard>
  );
}

export { LinkSecao };

export function ResumoCaixinhas({
  total,
  rendeuNoMes,
  caixinhas,
  reserva,
}: {
  total: number;
  rendeuNoMes: number;
  caixinhas: { id: string; nome: string; saldo: number; meta: number | null }[];
  /** Reserva de emergência em destaque, quando existe. */
  reserva?: { nome: string; saldo: number; sugerida: number | null; texto: string; coberto: number | null; meses: number };
}) {
  const comMeta = caixinhas.filter((c) => c.meta).slice(0, reserva ? 2 : 3);
  return (
    <SecaoCard titulo="Caixinhas" acao={<LinkSecao href="/caixinhas">Ver tudo</LinkSecao>}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 2 }}>
        <Box>
          <Rotulo component="div">Total guardado</Rotulo>
          <Valor valor={total} component="div" sx={{ fontSize: 22, fontWeight: 500 }} />
        </Box>
        <Typography variant="body2" sx={{ ...estiloMono, color: semantica.receita.texto }}>
          <Valor valor={rendeuNoMes} sinal="sempre" sx={{ font: "inherit" }} /> no mês
        </Typography>
      </Box>
      {reserva && (
        <Box sx={{ borderTop: `1px solid ${paleta.divisor}`, pt: 3, display: "flex", flexDirection: "column", gap: 2 }}>
          <Rotulo>Reserva de emergência · {reserva.nome}</Rotulo>
          {reserva.coberto !== null ? <ReguaCobertura coberto={reserva.coberto} meses={reserva.meses} rotulo={reserva.texto} /> : null}
          <Typography sx={{ fontSize: 14 }}>
            {reserva.texto}
          </Typography>
        </Box>
      )}
      {comMeta.map((c) => (
        <BarraProgresso
          key={c.id}
          tom="investimento"
          rotulo={c.nome}
          percentual={Math.floor((c.saldo / c.meta!) * 100)}
          detalhe={
            <>
              <Valor valor={c.saldo} sx={{ font: "inherit" }} /> / <Valor valor={c.meta!} sx={{ font: "inherit" }} />
            </>
          }
        />
      ))}
    </SecaoCard>
  );
}

/** Card do Início: barra empilhada e as 3 maiores categorias do mês. */
export function ParaOndeFoi({ mes, total, linhas, nomes }: { mes: Mes; total: number; linhas: LinhaDeCategoria[]; nomes: Map<string, string> }) {
  const comCategoria = linhas.filter((l) => l.categoriaId !== null);
  const top = comCategoria.slice(0, 3);
  const cores = grafico.distribuicao;
  return (
    <SecaoCard titulo="Para onde foi o dinheiro" acao={<LinkSecao href="/gastos">Ver tudo</LinkSecao>}>
      <Typography variant="caption" component="p">
        {maiusc(nomeDoMes(mes, false))}: <Valor valor={total} sx={{ font: "inherit", color: "text.primary" }} />
      </Typography>
      <Box role="img" aria-label={top.map((l) => `${nomes.get(l.categoriaId!) ?? "Categoria"} ${Math.round(l.participacao * 100)}%`).join(", ")} sx={{ display: "flex", gap: "2px", height: 12 }}>
        {top.map((l, i) => (
          <Box key={l.categoriaId} sx={{ width: `${l.participacao * 100}%`, bgcolor: cores[i % cores.length] }} />
        ))}
        <Box sx={{ flex: 1, bgcolor: paleta.divisor }} />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {top.map((l, i) => (
          <Box key={l.categoriaId} sx={{ display: "grid", gridTemplateColumns: "10px minmax(0, 1fr) auto 44px", gap: 2.5, alignItems: "center", minHeight: 36 }}>
            <Box component="span" aria-hidden sx={{ width: 8, height: 8, bgcolor: cores[i % cores.length] }} />
            <Typography component="span" sx={{ fontSize: 14 }}>
              {nomes.get(l.categoriaId!) ?? "Categoria"}
            </Typography>
            <Valor valor={l.total} sx={{ fontSize: 14, textAlign: "right" }} />
            <Box component="span" sx={{ ...estiloMono, fontSize: 12, color: "text.secondary", textAlign: "right" }}>
              {Math.round(l.participacao * 100)}%
            </Box>
          </Box>
        ))}
      </Box>
    </SecaoCard>
  );
}
