"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import CreditCardRounded from "@mui/icons-material/CreditCardRounded";
import ReceiptLongRounded from "@mui/icons-material/ReceiptLongRounded";
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
  gastoPorCategoria,
  nomeDoMes,
  situacaoDoOrcamento,
  type Mes,
} from "@financas/core";
import { BarraProgresso, EstadoVazio, ItemLancamento, SecaoCard, SeloStatus, Valor } from "@financas/ui";
import { cores } from "@financas/ui/tokens";
import type { Categoria } from "@/services/categorias";
import type { CartaoCompleto } from "@/services/cartoes-mapeamento";
import type { Lancamento } from "@/services/faturas";
import type { CompraRecente } from "@/services/inicio";
import type { ResumoInicio } from "./resumo";

const LinkSecao = ({ href, children }: { href: string; children: ReactNode }) => (
  <Typography component={Link} href={href} variant="body2" sx={{ fontWeight: 700, textDecoration: "none", color: "primary.main" }}>
    {children}
  </Typography>
);

/** Celular: fatura de todos os cartões com o uso do limite. */
export function DestaqueFatura({ r, melhorDia }: { r: ResumoInicio; melhorDia: string | null }) {
  const pctAberta = r.limiteTotal ? (r.faturaAtual / r.limiteTotal) * 100 : 0;
  const pctOutros = r.limiteTotal ? ((r.comprometido - r.faturaAtual) / r.limiteTotal) * 100 : 0;
  const fecha = r.proximoFechamento;
  return (
    <Card component="section" aria-label="Fatura atual de todos os cartões" sx={{ bgcolor: cores.destaque, color: "#FFFFFF", borderRadius: 6, p: 5.5, display: "flex", flexDirection: "column", gap: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
        <Typography variant="subtitle2" sx={{ color: "#E0E7FF" }}>
          Fatura atual · todos os cartões
        </Typography>
        {fecha && fecha.dias >= 0 && (
          <Typography sx={{ fontSize: 12, fontWeight: 700, bgcolor: "rgba(255,255,255,0.16)", px: 2.5, py: 1, borderRadius: 999, whiteSpace: "nowrap" }}>
            {fecha.dias === 0 ? `${fecha.cartao} fecha hoje` : fecha.dias === 1 ? `${fecha.cartao} fecha amanhã` : `${fecha.cartao} fecha em ${fecha.dias} dias`}
          </Typography>
        )}
      </Box>
      <Box>
        <Valor valor={r.faturaAtual} component="p" sx={{ m: 0, fontSize: 36, fontWeight: 800, letterSpacing: "-0.5px" }} />
        {melhorDia && (
          <Typography variant="body2" sx={{ color: "#E0E7FF" }}>
            Melhor dia de compra: {formatarDiaMes(melhorDia)}
          </Typography>
        )}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box
          role="img"
          aria-label={`Limite usado: ${Math.round(pctAberta + pctOutros)}%`}
          sx={{ height: 8, bgcolor: "rgba(255,255,255,0.2)", borderRadius: 1, overflow: "hidden", display: "flex" }}
        >
          <Box sx={{ width: `${Math.min(100, pctAberta)}%`, bgcolor: "#FFFFFF" }} />
          <Box sx={{ width: `${Math.min(100 - pctAberta, Math.max(0, pctOutros))}%`, bgcolor: cores.primariaMedia }} />
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#E0E7FF" }}>
          <span>Fatura + parcelas futuras</span>
          <Box component="span" sx={{ fontWeight: 700, color: "#FFFFFF" }}>
            Disponível <Valor valor={r.limiteDisponivel} sx={{ font: "inherit" }} />
          </Box>
        </Box>
      </Box>
    </Card>
  );
}

/** Saldo projetado e caixinhas entram com as telas de Contas e Caixinhas. */
export function CardEmBreve({ titulo, texto, href, rotulo }: { titulo: string; texto: string; href: string; rotulo: string }) {
  return (
    <Card component="section" aria-label={titulo} sx={{ p: 5, border: `2px dashed ${cores.bordaForte}`, display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="subtitle1" sx={{ color: "primary.main" }}>
        {titulo}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {texto}
      </Typography>
      <Box>
        <Button component={Link} href={href} size="small" sx={{ minHeight: 36, px: 0 }}>
          {rotulo}
        </Button>
      </Box>
    </Card>
  );
}

const ATALHOS = [
  { href: "/gastos/novo", rotulo: "Novo gasto", icone: <AddRounded />, cor: cores.primaria },
  { href: "/cartoes", rotulo: "Faturas", icone: <CreditCardRounded />, cor: cores.primaria },
  { href: "/caixinhas", rotulo: "Guardar", icone: <SavingsRounded />, cor: cores.investimento },
  { href: "/gastos/novo", rotulo: "Simular", icone: <ReceiptLongRounded />, cor: cores.primaria },
];

export function Atalhos() {
  return (
    <Box component="nav" aria-label="Atalhos" sx={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 2.5 }}>
      {ATALHOS.map((a) => (
        <ButtonBase
          key={a.rotulo}
          component={Link}
          href={a.href}
          sx={{ bgcolor: "background.paper", borderRadius: 4, py: 3, flexDirection: "column", gap: 2, fontSize: 12, fontWeight: 600, color: "text.primary" }}
        >
          <Box component="span" aria-hidden sx={{ color: a.cor, display: "flex" }}>
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
              <Typography sx={{ width: 48, fontSize: 13, fontWeight: 800 }}>{formatarDiaMes(a.data)}</Typography>
              <Typography variant="body2" sx={{ flex: 1 }}>
                {a.tipo === "fechamento" ? "Fechamento" : "Vencimento"} {a.cartao}
              </Typography>
              {a.tipo === "fechamento" ? (
                <SeloStatus status={a.status} />
              ) : (
                <Valor valor={a.valor ?? 0} sx={{ fontSize: 13, fontWeight: 700 }} />
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
  orcamentos,
  categorias,
}: {
  mes: Mes;
  lancamentos: Lancamento[];
  orcamentos: Map<string, number>;
  categorias: Categoria[];
}) {
  const gastos = gastoPorCategoria(
    lancamentos.map((l) => ({ mes: l.mes, valor: l.valor, categoriaId: l.categoriaId, historico: false })),
    mes,
  );
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
          tom={o.nivel === "normal" ? "primario" : "alerta"}
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
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {nome.get(id) ?? "Categoria"}
              </Typography>
              <Valor valor={gasto} sx={{ fontSize: 13, fontWeight: 700 }} />
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
          <Valor valor={total} component="div" sx={{ fontSize: 24, fontWeight: 800 }} />
        </Box>
        <Typography variant="body2" sx={{ color: cores.investimento, fontWeight: 700 }}>
          <Valor valor={rendeuNoMes} sinal="sempre" sx={{ font: "inherit" }} /> no mês
        </Typography>
      </Box>
      {reserva && (
        <Box sx={{ bgcolor: cores.investimentoClaro, borderRadius: 3, p: 3, display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Typography variant="caption" sx={{ color: cores.investimentoEscuro, fontWeight: 700 }}>
            Reserva de emergência · {reserva.nome}
          </Typography>
          {reserva.sugerida ? (
            <BarraProgresso compacta tom="investimento" percentual={Math.floor((reserva.saldo / reserva.sugerida) * 100)} rotulo={reserva.texto} />
          ) : null}
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
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
