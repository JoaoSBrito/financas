"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import CreditCardRounded from "@mui/icons-material/CreditCardRounded";
import SavingsRounded from "@mui/icons-material/SavingsRounded";
import ShoppingBagRounded from "@mui/icons-material/ShoppingBagRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  formatarDiaMes,
  nomeDoMes,
  situacaoDoOrcamento,
  type Mes,
} from "@financas/core";
import { BarraProgresso, EstadoVazio, ItemLancamento, SecaoCard, SeloStatus, Valor } from "@financas/ui";
import { paleta, raio, semantica, tipografia, toqueMinimo } from "@financas/ui/tokens";
import type { Categoria } from "@/services/categorias";
import type { CartaoCompleto } from "@/services/cartoes-mapeamento";
import type { Lancamento } from "@/services/faturas";
import type { LinhaDeCategoria } from "@financas/core";
import type { MovimentoConta } from "@/services/contas";
import { ListaCategorias } from "@/telas/gastos/ListaCategorias";
import type { CompraRecente } from "@/services/inicio";
import { gastoDoOrcamento, type ResumoInicio } from "./resumo";

const LinkSecao = ({ href, children }: { href: string; children: ReactNode }) => (
  <Typography
    component={Link}
    href={href}
    variant="body2"
    // Área de toque de 44px sem aumentar a altura visual do cabeçalho.
    sx={{ color: "text.secondary", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: toqueMinimo, my: -3, "&:hover": { color: "text.primary", textDecoration: "underline" } }}
  >
    {children}
  </Typography>
);

/** Celular: fatura de todos os cartões com o uso do limite. */
export function DestaqueFatura({ r, melhorDia }: { r: ResumoInicio; melhorDia: string | null }) {
  const pctAberta = r.limiteTotal ? (r.faturaAtual / r.limiteTotal) * 100 : 0;
  const pctOutros = r.limiteTotal ? ((r.comprometido - r.faturaAtual) / r.limiteTotal) * 100 : 0;
  const fecha = r.proximoFechamento;
  return (
    <Card component="section" aria-label="Fatura atual de todos os cartões" sx={{ p: "20px", display: "flex", flexDirection: "column", gap: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
        <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
          Fatura atual · todos os cartões
        </Typography>
        {fecha && fecha.dias >= 0 && (
          <Typography sx={{ fontSize: 12, bgcolor: paleta.interativo, px: 2.5, py: 1, borderRadius: `${raio.chip}px`, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box component="span" aria-hidden sx={{ width: 6, height: 6, borderRadius: "3px", bgcolor: semantica.atencao.texto }} />
            {fecha.dias === 0 ? `${fecha.cartao} fecha hoje` : fecha.dias === 1 ? `${fecha.cartao} fecha amanhã` : `${fecha.cartao} fecha em ${fecha.dias} dias`}
          </Typography>
        )}
      </Box>
      <Box>
        <Valor
          valor={r.faturaAtual}
          component="p"
          sx={{ m: 0, fontSize: tipografia.escala.valorDestaque.tamanho, fontWeight: 500, lineHeight: tipografia.escala.valorDestaque.alturaLinha, letterSpacing: "-0.02em" }}
        />
        {melhorDia && (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Melhor dia de compra: {formatarDiaMes(melhorDia)}
          </Typography>
        )}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box
          role="img"
          aria-label={`Limite usado: ${Math.round(pctAberta + pctOutros)}%`}
          sx={{ height: 6, bgcolor: paleta.interativo, borderRadius: "3px", overflow: "hidden", display: "flex" }}
        >
          <Box sx={{ width: `${Math.min(100, pctAberta)}%`, bgcolor: paleta.texto }} />
          <Box sx={{ width: `${Math.min(100 - pctAberta, Math.max(0, pctOutros))}%`, bgcolor: paleta.bordaCampo }} />
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "text.secondary" }}>
          <span>Fatura + parcelas futuras</span>
          <Box component="span">
            Disponível <Valor valor={r.limiteDisponivel} sx={{ font: "inherit", color: "text.primary" }} />
          </Box>
        </Box>
      </Box>
    </Card>
  );
}

/** Saldo projetado e caixinhas entram com as telas de Contas e Caixinhas. */
export function CardEmBreve({ titulo, texto, href, rotulo }: { titulo: string; texto: string; href: string; rotulo: string }) {
  return (
    <Card component="section" aria-label={titulo} sx={{ p: "20px", bgcolor: "transparent", border: `1px dashed ${paleta.bordaCampo}`, display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
        {titulo}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {texto}
      </Typography>
      <Box>
        <Button component={Link} href={href} variant="contained" color="secondary" size="small">
          {rotulo}
        </Button>
      </Box>
    </Card>
  );
}

const ATALHOS = [
  { href: "/gastos/novo", rotulo: "Novo gasto", icone: <AddRounded fontSize="small" /> },
  { href: "/cartoes", rotulo: "Faturas", icone: <CreditCardRounded fontSize="small" /> },
  { href: "/caixinhas", rotulo: "Guardar", icone: <SavingsRounded fontSize="small" /> },
];

export function Atalhos() {
  return (
    <Box component="nav" aria-label="Atalhos" sx={{ display: "grid", gridTemplateColumns: `repeat(${ATALHOS.length}, minmax(0, 1fr))`, gap: 2.5 }}>
      {ATALHOS.map((a) => (
        <ButtonBase
          key={a.rotulo}
          component={Link}
          href={a.href}
          sx={{ bgcolor: "background.paper", borderRadius: `${raio.pilula}px`, minHeight: 48, gap: 1.5, fontSize: 13, color: "text.primary" }}
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

export function AgendaCartoes({ r }: { r: ResumoInicio }) {
  return (
    <SecaoCard titulo="Agenda dos cartões" gap={1}>
      {r.agenda.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Nenhum fechamento ou vencimento neste mês.
        </Typography>
      ) : (
        r.agenda.map((a, i) => (
          <Box key={`${a.data}-${a.tipo}-${a.cartao}`}>
            {i > 0 && <Divider />}
            <Box sx={{ display: "flex", alignItems: "center", gap: 3, minHeight: 52 }}>
              <Typography sx={{ width: 48, fontSize: 14 }}>{formatarDiaMes(a.data)}</Typography>
              <Typography variant="body2" sx={{ flex: 1 }}>
                {a.tipo === "fechamento" ? "Fechamento" : "Vencimento"} {a.cartao}
              </Typography>
              {a.tipo === "fechamento" ? (
                <SeloStatus status={a.status} />
              ) : (
                <Valor valor={a.valor ?? 0} sx={{ fontSize: 14 }} />
              )}
            </Box>
          </Box>
        ))
      )}
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
              icone={<ShoppingBagRounded fontSize="small" />}
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
  reserva?: { nome: string; saldo: number; sugerida: number | null; texto: string };
}) {
  const comMeta = caixinhas.filter((c) => c.meta).slice(0, reserva ? 2 : 3);
  return (
    <SecaoCard titulo="Caixinhas" acao={<LinkSecao href="/caixinhas">Ver tudo</LinkSecao>}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 2 }}>
        <Box>
          <Typography variant="caption">Total guardado</Typography>
          <Valor valor={total} component="div" sx={{ fontSize: 24, fontWeight: 500 }} />
        </Box>
        <Typography variant="body2" sx={{ color: semantica.receita.texto }}>
          <Valor valor={rendeuNoMes} sinal="sempre" sx={{ font: "inherit" }} /> no mês
        </Typography>
      </Box>
      {reserva && (
        <Box sx={{ bgcolor: paleta.interativo, borderRadius: `${raio.card}px`, p: 3.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Typography variant="caption">
            Reserva de emergência · {reserva.nome}
          </Typography>
          {reserva.sugerida ? (
            <BarraProgresso compacta tom="investimento" percentual={Math.floor((reserva.saldo / reserva.sugerida) * 100)} rotulo={reserva.texto} />
          ) : null}
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

/** Card do Início: as 3 maiores categorias do mês. */
export function ParaOndeFoi({ mes, total, linhas, nomes }: { mes: Mes; total: number; linhas: LinhaDeCategoria[]; nomes: Map<string, string> }) {
  return (
    <SecaoCard titulo="Para onde foi o dinheiro" acao={<LinkSecao href="/gastos">Ver tudo</LinkSecao>}>
      <Typography variant="caption" component="p">
        {nomeDoMes(mes, false).charAt(0).toUpperCase() + nomeDoMes(mes, false).slice(1)}: <Valor valor={total} sx={{ font: "inherit", color: "text.primary" }} />
      </Typography>
      <ListaCategorias linhas={linhas} nomes={nomes} limite={3} />
    </SecaoCard>
  );
}
