"use client";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import { useRef, type KeyboardEvent } from "react";
import { paleta, raio, tipografia } from "../tokens";

export interface OpcaoCartao {
  id: string;
  nome: string;
  /** Ex.: "Paga em 10/12". */
  detalhe: string;
  /** Marca a opção recomendada (ex.: "Melhor hoje"). */
  recomendado?: boolean;
  /** Cor de identificação do cartão (ponto ao lado do nome). Opcional. */
  cor?: string;
}

export interface SeletorCartaoProps {
  opcoes: OpcaoCartao[];
  valor: string | null;
  onChange: (id: string) => void;
  rotulo: string;
}

/** Cartões como blocos de escolha única, com a sugestão de melhor cartão. */
export function SeletorCartao({ opcoes, valor, onChange, rotulo }: SeletorCartaoProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  // Setas do teclado movem a seleção, como num grupo de rádio nativo.
  function aoTeclar(e: KeyboardEvent, i: number) {
    const passo = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!passo) return;
    e.preventDefault();
    const proximo = (i + passo + opcoes.length) % opcoes.length;
    onChange(opcoes[proximo]!.id);
    refs.current[proximo]?.focus();
  }

  const indiceFocavel = Math.max(0, opcoes.findIndex((o) => o.id === valor));

  return (
    <Box
      role="radiogroup"
      aria-label={rotulo}
      sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 2.5 }}
    >
      {opcoes.map((o, i) => {
        const selecionado = o.id === valor;
        return (
          <ButtonBase
            key={o.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="radio"
            aria-checked={selecionado}
            tabIndex={i === indiceFocavel ? 0 : -1}
            onClick={() => onChange(o.id)}
            onKeyDown={(e) => aoTeclar(e, i)}
            sx={{
              minHeight: 64,
              borderRadius: `${raio.controle}px`,
              // Selecionado: borda lima (é a escolha que define a fatura do gasto).
              border: `1px solid ${selecionado ? paleta.acao : paleta.bordaControle}`,
              bgcolor: selecionado ? paleta.elevado : "transparent",
              px: 3,
              py: 2.5,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              textAlign: "left",
              gap: 0.5,
            }}
          >
            <Typography sx={{ fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 2 }}>
              {o.cor && <Box component="span" aria-hidden sx={{ width: 4, height: 14, borderRadius: "2px", bgcolor: o.cor }} />}
              {o.nome}
            </Typography>
            <Typography sx={{ fontFamily: tipografia.familiaMono, fontSize: 11, color: o.recomendado ? paleta.acao : "text.secondary" }}>
              {o.recomendado ? `Melhor hoje · ${o.detalhe}` : o.detalhe}
            </Typography>
          </ButtonBase>
        );
      })}
    </Box>
  );
}
