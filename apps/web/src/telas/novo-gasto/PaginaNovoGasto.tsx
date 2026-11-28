"use client";

import Box from "@mui/material/Box";
import { useRouter } from "next/navigation";
import { CabecalhoTela } from "@financas/ui";
import { BotaoVoltar } from "@/componentes/BotaoVoltar";
import { TelaNovoGasto } from "./TelaNovoGasto";

function voltar(router: ReturnType<typeof useRouter>) {
  if (window.history.length > 1) router.back();
  else router.push("/");
}

/** Acesso direto pelo endereço /gastos/novo (sem modal). */
export function PaginaNovoGasto() {
  const router = useRouter();
  return (
    // Mesma largura do diálogo de Novo gasto (md), para as duas colunas caberem.
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <CabecalhoTela titulo="Novo gasto" voltar={<BotaoVoltar rotulo="Voltar" onClick={() => voltar(router)} />} />
      <TelaNovoGasto onConcluir={() => voltar(router)} />
    </Box>
  );
}
