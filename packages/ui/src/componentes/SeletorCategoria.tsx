"use client";

import TextField from "@mui/material/TextField";

import type { OpcaoCategoria } from "./ChipsCategoria";

export interface SeletorCategoriaProps {
  rotulo?: string;
  opcoes: OpcaoCategoria[];
  valor: string | null;
  onChange: (id: string | null) => void;
  /** Mostra a opção "Sem categoria" (valor nulo). */
  permitirVazio?: boolean;
  textoVazio?: string;
  erro?: string;
}

/** Categoria como campo de seleção: escala com muitas categorias (lista nativa no celular). */
export function SeletorCategoria({ rotulo = "Categoria", opcoes, valor, onChange, permitirVazio = true, textoVazio = "Sem categoria", erro }: SeletorCategoriaProps) {
  const ordenadas = [...opcoes].sort((a, b) => (a.nome === "Outros" ? 1 : b.nome === "Outros" ? -1 : a.nome.localeCompare(b.nome, "pt-BR")));
  return (
    <TextField
      select
      label={rotulo}
      value={valor ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
      error={Boolean(erro)}
      helperText={erro}
      slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
    >
      {permitirVazio && <option value="">{textoVazio}</option>}
      {ordenadas.map((c) => (
        <option key={c.id} value={c.id}>
          {c.nome}
        </option>
      ))}
    </TextField>
  );
}
