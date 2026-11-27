"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { descreverRegra } from "@financas/core";
import { CartaoFisico, Valor } from "@financas/ui";
import { corDoCartao, fundoDoCartao } from "@financas/ui/tokens";
import type { CartaoCompleto } from "@/services/cartoes-mapeamento";
import { useAvisos } from "@/stores/avisos";
import { FormularioCartao } from "@/telas/configurar-cartao/FormularioCartao";
import { CARTAO_NOVO } from "@/telas/configurar-cartao/valores";
import { RodapePasso } from "./RodapePasso";

export function PassoCartao({ cartoes, onContinuar }: { cartoes: CartaoCompleto[]; onContinuar: () => void }) {
  const [novo, setNovo] = useState(cartoes.length === 0);
  const mostrarAviso = useAvisos((s) => s.mostrar);

  if (novo) {
    return (
      <Stack spacing={3}>
        <FormularioCartao
          inicial={CARTAO_NOVO}
          faturas={[]}
          indiceCor={cartoes.length}
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
      {/* Resumo do passo: cada cartão como ficará em Cartões, com a regra escrita embaixo. */}
      <Box component="ul" aria-label="Seus cartões" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 4 }}>
        {cartoes.map((c, i) => (
          <Box component="li" key={c.id} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <CartaoFisico
              nome={c.nome}
              final={c.final}
              cor={corDoCartao(i)}
              fundo={fundoDoCartao(i)}
              rodape={
                <>
                  <span>
                    Limite <Valor valor={c.limite} semSimbolo sx={{ font: "inherit" }} />
                  </span>
                  <span>Vence dia {c.diaVencimento}</span>
                </>
              }
            />
            <Typography variant="caption">{descreverRegra(c)}</Typography>
          </Box>
        ))}
      </Box>
      <Button variant="outlined" startIcon={<AddRounded />} onClick={() => setNovo(true)} sx={{ minHeight: 52, borderStyle: "dashed" }}>
        Adicionar outro cartão
      </Button>
      <RodapePasso>
        <Button variant="contained" size="large" onClick={onContinuar}>
          Continuar
        </Button>
      </RodapePasso>
    </Stack>
  );
}
