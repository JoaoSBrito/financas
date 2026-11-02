"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Link from "next/link";
import { useState } from "react";
import { formatarDiaMes } from "@financas/core";
import { EstadoVazio, ItemLancamento, PilulasSelecao, SecaoCard, Valor } from "@financas/ui";
import { useMarcarConferida } from "@/hooks/useFaturas";
import type { Lancamento } from "@/services/faturas";

type Filtro = "todos" | "pendentes" | "parcelados";

const VAZIO: Record<Filtro, string> = {
  todos: "Nenhum lançamento nesta fatura",
  pendentes: "Tudo conferido nesta fatura",
  parcelados: "Nenhum parcelado nesta fatura",
};

export function textoParcela(l: Lancamento): string {
  if (l.origem === "saldo_inicial") return "saldo inicial";
  if (l.origem === "recorrente") return "assinatura";
  return l.totalParcelas > 1 ? `${l.numero} de ${l.totalParcelas}` : "à vista";
}

function detalhe(l: Lancamento) {
  const partes = [l.dataCompra ? formatarDiaMes(l.dataCompra) : null, l.categoriaNome ?? "Sem categoria"];
  if (l.totalParcelas > 1 || l.origem !== "app") partes.push(textoParcela(l));
  return partes.filter(Boolean).join(" · ");
}

export interface ListaLancamentosProps {
  lancamentos: Lancamento[];
  onEditar: (l: Lancamento) => void;
}

export function ListaLancamentos({ lancamentos, onEditar }: ListaLancamentosProps) {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const conferir = useMarcarConferida();

  const visiveis = lancamentos.filter((l) =>
    filtro === "pendentes" ? !l.conferida : filtro === "parcelados" ? l.totalParcelas > 1 : true,
  );
  const alternar = (l: Lancamento, conferida: boolean) => conferir.mutate({ id: l.id, conferida });

  return (
    <SecaoCard
      titulo="Lançamentos"
      acao={
        <Button component={Link} href="/gastos/novo" size="small" startIcon={<AddRounded />} sx={{ minHeight: 36 }}>
          Gasto
        </Button>
      }
    >
      <PilulasSelecao
        rotulo="Filtrar lançamentos"
        tamanho="pequeno"
        valor={filtro}
        onChange={setFiltro}
        opcoes={[
          { valor: "todos", rotulo: "Todos" },
          { valor: "pendentes", rotulo: "Não conferidos" },
          { valor: "parcelados", rotulo: "Parcelados" },
        ]}
      />

      {visiveis.length === 0 ? (
        <EstadoVazio titulo={VAZIO[filtro]} />
      ) : (
        <>
          {/* Celular e tablet: lista */}
          <Box sx={{ display: { xs: "block", md: "none" } }}>
            {visiveis.map((l, i) => (
              <Box key={l.id}>
                {i > 0 && <Divider />}
                <ItemLancamento
                  descricao={l.descricao}
                  detalhe={detalhe(l)}
                  valor={l.valor}
                  conferido={l.conferida}
                  onConferir={(c) => alternar(l, c)}
                  onAbrir={() => onEditar(l)}
                />
              </Box>
            ))}
          </Box>

          {/* Desktop: tabela */}
          <Box sx={{ display: { xs: "none", md: "block" }, overflowX: "auto" }}>
            <Table size="small" aria-label="Lançamentos da fatura" sx={{ "& td, & th": { py: 2.5, px: 2 } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 48 }}>
                    <Box component="span" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                      Conferido
                    </Box>
                  </TableCell>
                  <TableCell>Data</TableCell>
                  <TableCell>Descrição</TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell>Parcela</TableCell>
                  <TableCell align="right">Valor</TableCell>
                  <TableCell sx={{ width: 56 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {visiveis.map((l) => (
                  <TableRow key={l.id} hover>
                    <TableCell>
                      <Checkbox
                        checked={l.conferida}
                        onChange={(e) => alternar(l, e.target.checked)}
                        slotProps={{ input: { "aria-label": `Conferido: ${l.descricao}` } }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>{l.dataCompra ? formatarDiaMes(l.dataCompra) : "—"}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{l.descricao}</TableCell>
                    <TableCell>{l.categoriaNome ?? "Sem categoria"}</TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>{textoParcela(l)}</TableCell>
                    <TableCell align="right">
                      <Valor valor={l.valor} sx={{ fontSize: 14, fontWeight: 700 }} />
                    </TableCell>
                    <TableCell>
                      <IconButton aria-label={`Editar ${l.descricao}`} onClick={() => onEditar(l)}>
                        <EditRounded fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </>
      )}
    </SecaoCard>
  );
}
