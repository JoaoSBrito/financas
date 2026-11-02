"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import SettingsRounded from "@mui/icons-material/SettingsRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  dividirFatura,
  faturaDaCompra,
  hojeEmSaoPaulo,
  nomeDoMes,
  parcelamentosAtivos,
  situacaoDaFatura,
  somarMeses,
  type Mes,
} from "@financas/core";
import { CarregandoLista, EstadoErro, EstadoVazio, PilulasSelecao, SecaoCard } from "@financas/ui";
import { DialogoCorrigirData } from "@/componentes/DialogoCorrigirData";
import { useCartoes, useCorrigirFatura } from "@/hooks/useCartoes";
import { usePagamentoFatura } from "@/hooks/useContas";
import { useLancamentos } from "@/hooks/useFaturas";
import { useCategorias, useFaturasResumo } from "@/hooks/useGastos";
import { confirmadasDe, type CartaoCompleto, type FaturaResumo } from "@/services/cartoes-mapeamento";
import type { Lancamento } from "@/services/faturas";
import { ParcelamentosAtivos, ProximasFaturas } from "./ColunaLateral";
import { DialogoEditarLancamento } from "./DialogoEditarLancamento";
import { DialogoPagarFatura } from "./DialogoPagarFatura";
import { ListaLancamentos } from "./ListaLancamentos";
import { ResumoFatura } from "./ResumoFatura";
import { mesCurto } from "./textos";

function Cabecalho({ cartaoId }: { cartaoId?: string }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 4 }}>
      <Typography variant="h1">Cartões</Typography>
      <Box sx={{ display: "flex", gap: 1.5 }}>
        {cartaoId && (
          <IconButton component={Link} href={`/cartoes/${cartaoId}/configurar`} aria-label="Configurar este cartão">
            <SettingsRounded />
          </IconButton>
        )}
        <Button component={Link} href="/cartoes/novo" variant="outlined" startIcon={<AddRounded />}>
          Cartão
        </Button>
      </Box>
    </Box>
  );
}

/** Cartões e faturas: alterna cartão e mês pela URL (?cartao=&mes=). */
export function TelaFaturas() {
  const cartoes = useCartoes();
  const faturas = useFaturasResumo();

  if (cartoes.isPending || faturas.isPending) {
    return (
      <>
        <Cabecalho />
        <Stack spacing={4} aria-busy="true" aria-label="Carregando faturas">
          <Skeleton variant="rounded" height={44} sx={{ borderRadius: 6, maxWidth: 360 }} />
          <Skeleton variant="rounded" height={220} sx={{ borderRadius: 5 }} />
          <Skeleton variant="rounded" height={320} sx={{ borderRadius: 5 }} />
        </Stack>
      </>
    );
  }
  if (cartoes.isError || faturas.isError) {
    return (
      <>
        <Cabecalho />
        <EstadoErro
          mensagem="Não foi possível carregar seus cartões."
          onTentarNovamente={() => {
            void cartoes.refetch();
            void faturas.refetch();
          }}
        />
      </>
    );
  }
  if (cartoes.data.length === 0) {
    return (
      <>
        <Cabecalho />
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
      </>
    );
  }
  return <ConteudoFaturas cartoes={cartoes.data} faturas={faturas.data} />;
}

function ConteudoFaturas({ cartoes, faturas }: { cartoes: CartaoCompleto[]; faturas: FaturaResumo[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const hoje = hojeEmSaoPaulo();

  const cartao = cartoes.find((c) => c.id === params.get("cartao")) ?? cartoes[0]!;
  const doCartao = useMemo(() => faturas.filter((f) => f.cartaoId === cartao.id), [faturas, cartao.id]);
  const mesAberto = faturaDaCompra(cartao, hoje, confirmadasDe(doCartao)).mes;

  // Meses exibidos: até 6 para trás e 3 para frente da fatura aberta.
  const visiveis = doCartao.filter((f) => f.mes >= somarMeses(mesAberto, -6) && f.mes <= somarMeses(mesAberto, 3));
  const mesPedido = params.get("mes");
  const mes: Mes = visiveis.some((f) => f.mes === mesPedido) ? mesPedido! : mesAberto;
  const fatura = doCartao.find((f) => f.mes === mes);

  const desde = mes < mesAberto ? mes : mesAberto;
  const lancamentos = useLancamentos(cartao.id, desde);
  const categorias = useCategorias();
  const { desfazer } = usePagamentoFatura();
  const [pagando, setPagando] = useState(false);
  const corrigir = useCorrigirFatura(cartao.id);
  const [corrigindo, setCorrigindo] = useState<FaturaResumo | null>(null);
  const [editando, setEditando] = useState<Lancamento | null>(null);

  function navegar(novo: { cartao?: string; mes?: Mes | null }) {
    const p = new URLSearchParams(params.toString());
    if (novo.cartao) {
      p.set("cartao", novo.cartao);
      p.delete("mes");
    }
    if (novo.mes) p.set("mes", novo.mes);
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }

  const daFatura = (lancamentos.data ?? []).filter((l) => l.mes === mes);
  const anoAtual = Number(mesAberto.slice(0, 4));

  return (
    <>
      <Cabecalho cartaoId={cartao.id} />

      <Stack spacing={3} sx={{ mb: 4 }}>
        {cartoes.length > 1 && (
          <PilulasSelecao
            rotulo="Cartão"
            valor={cartao.id}
            onChange={(id) => navegar({ cartao: id })}
            opcoes={cartoes.map((c) => ({ valor: c.id, rotulo: c.final ? `${c.nome} •••• ${c.final}` : c.nome }))}
          />
        )}
        <PilulasSelecao
          rotulo="Mês da fatura"
          tamanho="pequeno"
          valor={mes}
          onChange={(m) => navegar({ mes: m })}
          opcoes={visiveis.map((f) => ({
            valor: f.mes,
            rotulo: f.mes === mesAberto ? `${mesCurto(f.mes, anoAtual)} · aberta` : mesCurto(f.mes, anoAtual),
            rotuloAcessivel: `Fatura de ${nomeDoMes(f.mes)}${f.mes === mesAberto ? ", aberta" : ""}`,
          }))}
        />
      </Stack>

      {!fatura ? (
        <SecaoCard>
          <EstadoVazio
            titulo="Fatura ainda não gerada"
            descricao="Abra a configuração do cartão e salve para gerar as faturas."
            acao={
              <Button component={Link} href={`/cartoes/${cartao.id}/configurar`} variant="contained">
                Configurar cartão
              </Button>
            }
          />
        </SecaoCard>
      ) : (
        <Stack spacing={4}>
          <ResumoFatura
            fatura={fatura}
            divisao={dividirFatura(daFatura)}
            situacao={situacaoDaFatura(fatura, hoje, mesAberto)}
            carregandoPagamento={desfazer.isPending}
            onCorrigirDatas={() => setCorrigindo(fatura)}
            onAlternarPagamento={() => (fatura.pagaEm ? desfazer.mutate(fatura.id) : setPagando(true))}
          />

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "flex-start" }}>
            <Box sx={{ flex: "2 1 520px", minWidth: 0 }}>
              {lancamentos.isPending ? (
                <SecaoCard titulo="Lançamentos">
                  <CarregandoLista linhas={4} />
                </SecaoCard>
              ) : lancamentos.isError ? (
                <SecaoCard titulo="Lançamentos">
                  <EstadoErro mensagem="Não foi possível carregar os lançamentos." onTentarNovamente={() => void lancamentos.refetch()} />
                </SecaoCard>
              ) : (
                <ListaLancamentos lancamentos={daFatura} onEditar={setEditando} />
              )}
            </Box>
            <Stack spacing={4} sx={{ flex: "1 1 300px", minWidth: 0 }}>
              <ProximasFaturas
                cartaoId={cartao.id}
                faturas={doCartao.filter((f) => f.mes > mesAberto).slice(0, 3)}
                onCorrigir={setCorrigindo}
              />
              <ParcelamentosAtivos cartaoId={cartao.id} itens={parcelamentosAtivos(lancamentos.data ?? [], mesAberto)} />
            </Stack>
          </Box>
        </Stack>
      )}

      {corrigindo && (
        <DialogoCorrigirData
          aberto
          nomeMes={nomeDoMes(corrigindo.mes)}
          fechamento={corrigindo.fechamento}
          vencimento={corrigindo.vencimento}
          salvando={corrigir.isPending}
          erro={corrigir.error?.message}
          onFechar={() => {
            corrigir.reset();
            setCorrigindo(null);
          }}
          onConfirmar={(datas) =>
            corrigir.mutate({ mes: corrigindo.mes, ...datas }, { onSuccess: () => setCorrigindo(null) })
          }
        />
      )}

      {pagando && fatura && (
        <DialogoPagarFatura fatura={fatura} total={dividirFatura(daFatura).total} onFechar={() => setPagando(false)} />
      )}

      {editando && (
        <DialogoEditarLancamento
          lancamento={editando}
          categorias={categorias.data ?? []}
          onFechar={() => setEditando(null)}
        />
      )}
    </>
  );
}
