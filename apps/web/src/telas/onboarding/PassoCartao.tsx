"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { descreverRegra } from "@financas/core";
import { SecaoCard, Valor } from "@financas/ui";
import type { CartaoCompleto } from "@/services/cartoes-mapeamento";
import { useAvisos } from "@/stores/avisos";
import { FormularioCartao } from "@/telas/configurar-cartao/FormularioCartao";
import { CARTAO_NOVO } from "@/telas/configurar-cartao/valores";

export function PassoCartao({ cartoes, onContinuar }: { cartoes: CartaoCompleto[]; onContinuar: () => void }) {
  const [novo, setNovo] = useState(cartoes.length === 0);
  const mostrarAviso = useAvisos((s) => s.mostrar);

  if (novo) {
    return (
      <Stack spacing={3}>
        <FormularioCartao
          inicial={CARTAO_NOVO}
          faturas={[]}
          onSalvo={() => {
            mostrarAviso("Cartão salvo e faturas geradas");
            setNovo(false);
          }}
        />
        {cartoes.length > 0 && (
          <Button onClick={() => setNovo(false)} sx={{ alignSelf: "center" }}>
            Cancelar
          </Button>
        )}
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      <SecaoCard titulo="Seus cartões" gap={1}>
        {cartoes.map((c, i) => (
          <Box key={c.id}>
            {i > 0 && <Divider />}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, minHeight: 64 }}>
              <Box>
                <Typography variant="subtitle1">
                  {c.nome}
                  {c.final ? ` •••• ${c.final}` : ""}
                </Typography>
                <Typography variant="caption">{descreverRegra(c)}</Typography>
              </Box>
              <Valor valor={c.limite} sx={{ fontSize: 14, fontWeight: 700 }} />
            </Box>
          </Box>
        ))}
      </SecaoCard>
      <Button startIcon={<AddRounded />} onClick={() => setNovo(true)} sx={{ alignSelf: "flex-start" }}>
        Adicionar outro cartão
      </Button>
      <Button variant="contained" size="large" onClick={onContinuar} sx={{ minHeight: 54, fontWeight: 800 }}>
        Continuar
      </Button>
    </Stack>
  );
}
