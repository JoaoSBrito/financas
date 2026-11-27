"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import SettingsRounded from "@mui/icons-material/SettingsRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
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
import { corDoCartao, fundoDoCartao, paleta, raio, semantica, tipografia } from "@financas/ui/tokens";
import { CarregandoLista, CartaoFisico, EstadoErro, EstadoVazio, SecaoCard, Valor } from "@financas/ui";
import { DialogoCorrigirData } from "@/componentes/DialogoCorrigirData";
import { useCartoes, useCorrigirFatura } from "@/hooks/useCartoes";
import { usePagamentoFatura } from "@/hooks/useContas";
import { useLancamentos } from "@/hooks/useFaturas";
import { useCategorias, useFaturasResumo } from "@/hooks/useGastos";
import { confirmadasDe, type CartaoCompleto, type FaturaResumo } from "@/services/cartoes-mapeamento";
import type { Lancamento } from "@/services/faturas";
import { ParcelamentosAtivos } from "./ColunaLateral";
import { DialogoEditarLancamento } from "./DialogoEditarLancamento";
import { DialogoPagarFatura } from "./DialogoPagarFatura";
import { ListaLancamentos } from "./ListaLancamentos";
import { ResumoFatura } from "./ResumoFatura";
import { mesCurto, SITUACAO } from "./textos";

function Cabecalho({ cartaoId }: { cartaoId?: string }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 4 }}>
      <Typography variant="h1">Cartões</Typography>
      <Box sx={{ display: "flex", gap: 1.5 }}>
        {cartaoId && (
          <IconButton component={Link} href={`/cartoes/${cartaoId}/configurar`} aria-label="Configurar este cartão" sx={{ border: `1px solid ${paleta.divisor}` }}>
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
          <Skeleton variant="rounded" height={44} sx={{ borderRadius: `${raio.pilula}px`, maxWidth: 360 }} />
          <Skeleton variant="rounded" height={220} />
          <Skeleton variant="rounded" height={320} />
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

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(220px, 260px) minmax(0, 1fr)" }, gap: { xs: 3, md: 5 }, alignItems: "start" }}>
        {/* Cartões: carrossel no celular, coluna no desktop. */}
        <Box
          role="radiogroup"
          aria-label="Cartão"
          sx={{
            display: "flex",
            flexDirection: { xs: "row", md: "column" },
            gap: 3,
            overflowX: { xs: "auto", md: "visible" },
            mx: { xs: -4, md: 0 },
            px: { xs: 4, md: 0 },
            pb: { xs: 1, md: 0 },
            scrollSnapType: { xs: "x mandatory", md: "none" },
            "& > *": { scrollSnapAlign: "start", flexShrink: 0 },
          }}
        >
          {cartoes.map((c, indice) => {
            const emAberto = faturas.filter((f) => f.cartaoId === c.id && !f.pagaEm).reduce((soma, f) => soma + f.total, 0);
            const uso = c.limite > 0 ? Math.round((emAberto / c.limite) * 100) : 0;
            return (
              <CartaoFisico
                key={c.id}
                nome={c.nome}
                final={c.final}
                cor={corDoCartao(indice)}
                fundo={fundoDoCartao(indice)}
                percentualUso={uso}
                largura={cartoes.length > 1 ? "min(272px, 78vw)" : "100%"}
                selecionado={c.id === cartao.id}
                onSelecionar={() => navegar({ cartao: c.id })}
                rodape={
                  <>
                    <span>
                      Livre <Valor valor={c.limite - emAberto} sx={{ font: "inherit" }} />
                    </span>
                    <span>Vence dia {c.diaVencimento}</span>
                  </>
                }
              />
            );
          })}
        </Box>

        <Stack spacing={3} sx={{ minWidth: 0 }}>
          {/* Meses: cada um com valor e situação (substitui a lista de próximas faturas). */}
          <Box role="group" aria-label="Mês da fatura" sx={{ display: "flex", gap: 1.5, overflowX: "auto", mx: { xs: -4, md: 0 }, px: { xs: 4, md: 0 }, pb: 0.5 }}>
            {visiveis.map((f) => {
              const ativo = f.mes === mes;
              const sit = situacaoDaFatura(f, hoje, mesAberto);
              const rotuloSit = sit === "futura" ? (f.status === "confirmado" ? "Confirmada" : "Estimada") : SITUACAO[sit].rotulo;
              return (
                <ButtonBase
                  key={f.mes}
                  aria-pressed={ativo}
                  aria-label={`Fatura de ${nomeDoMes(f.mes)}${f.mes === mesAberto ? ", aberta" : ""}`}
                  onClick={() => navegar({ mes: f.mes })}
                  sx={{
                    flex: "0 0 auto",
                    minWidth: 88,
                    minHeight: 64,
                    p: "8px 10px",
                    borderRadius: `${raio.controle}px`,
                    border: `1px solid ${ativo ? paleta.texto : paleta.divisor}`,
                    bgcolor: ativo ? paleta.texto : "transparent",
                    color: ativo ? paleta.sobreAcao : paleta.textoSecundario,
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 0.25,
                    fontFamily: tipografia.familiaMono,
                    textTransform: "uppercase",
                  }}
                >
                  <Box component="span" sx={{ fontSize: 11, fontWeight: ativo ? 500 : 400 }}>
                    {mesCurto(f.mes, anoAtual)}
                  </Box>
                  <Valor valor={f.total} sx={{ fontSize: 13, color: ativo ? paleta.sobreAcao : paleta.texto, fontWeight: ativo ? 500 : 400 }} />
                  <Box component="span" sx={{ fontSize: 10, color: ativo ? paleta.sobreAcao : sit === "paga" ? semantica.receita.texto : undefined }}>
                    {sit === "paga" ? `✓ ${rotuloSit}` : rotuloSit}
                  </Box>
                </ButtonBase>
              );
            })}
          </Box>

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
                  <EstadoErro embutido mensagem="Não foi possível carregar os lançamentos." onTentarNovamente={() => void lancamentos.refetch()} />
                </SecaoCard>
              ) : (
                <ListaLancamentos lancamentos={daFatura} onEditar={setEditando} />
              )}
            </Box>
            <Stack spacing={4} sx={{ flex: "1 1 280px", minWidth: 0 }}>
              <ParcelamentosAtivos cartaoId={cartao.id} itens={parcelamentosAtivos(lancamentos.data ?? [], mesAberto)} />
            </Stack>
          </Box>
        </Stack>
      )}

        </Stack>
      </Box>

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
