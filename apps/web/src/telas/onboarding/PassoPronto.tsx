"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { SecaoCard } from "@financas/ui";

function Dica({ titulo, children }: { titulo: string; children: string }) {
  return (
    <Box>
      <Typography variant="subtitle1">{titulo}</Typography>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {children}
      </Typography>
    </Box>
  );
}

export function PassoPronto() {
  return (
    <Stack spacing={4}>
      <SecaoCard titulo="Instale na tela inicial">
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Assim o app abre em tela cheia, como um aplicativo, e pode enviar avisos de fechamento.
        </Typography>
        <Dica titulo="iPhone">No Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”.</Dica>
        <Dica titulo="Android">No Chrome, abra o menu ⋮ e toque em “Instalar app”.</Dica>
      </SecaoCard>
      <SecaoCard titulo="No dia a dia">
        <Dica titulo="Lance na hora">O botão + da barra inferior abre o novo gasto em qualquer tela.</Dica>
        <Dica titulo="Confirme o fechamento">Quando o banco divulgar a data, corrija a fatura estimada com um toque.</Dica>
        <Dica titulo="Confira a fatura">Em Cartões, marque cada lançamento que bate com o app do banco.</Dica>
      </SecaoCard>
      <Button component={Link} href="/" variant="contained" size="large" sx={{ minHeight: 54, fontWeight: 800 }}>
        Começar a usar
      </Button>
    </Stack>
  );
}
