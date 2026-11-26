import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import { LogoLastro, Rotulo } from "@financas/ui";
import { paleta } from "@financas/ui/tokens";
import { FormularioEntrar } from "./FormularioEntrar";

export const metadata: Metadata = { title: "Entrar" };

/** Barras ilustrativas do painel da marca (decorativas). */
const AMOSTRA = [
  { rotulo: "Fatura", largura: "64%", cor: paleta.texto },
  { rotulo: "Livre", largura: "100%", cor: paleta.bordaControle },
  { rotulo: "Sobra", largura: "82%", cor: paleta.acao },
];

export default function PaginaEntrar() {
  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", flexWrap: "wrap" }}>
      {/* Painel da marca: só a partir do tablet. */}
      <Box
        component="section"
        aria-label="Lastro"
        sx={{
          display: { xs: "none", sm: "flex" },
          flex: "1 1 480px",
          bgcolor: paleta.painel,
          borderRight: `1px solid ${paleta.divisor}`,
          p: { sm: 10, md: 14 },
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <LogoLastro tamanho={30} />
        <Box sx={{ display: "flex", flexDirection: "column", gap: 5, maxWidth: 520 }}>
          <Typography component="p" sx={{ fontSize: { sm: 40, md: 52 }, fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
            Cada centavo com base.
          </Typography>
          <Typography sx={{ fontSize: 17, lineHeight: 1.6, color: "text.secondary" }}>
            Faturas, parcelas, contas e caixinhas num só painel. Você sabe hoje quanto sobra no fim do mês.
          </Typography>
        </Box>
        <Box aria-hidden sx={{ display: "flex", flexDirection: "column", gap: 2.5, maxWidth: 520 }}>
          {AMOSTRA.map((a) => (
            <Box key={a.rotulo} sx={{ display: "grid", gridTemplateColumns: "64px minmax(0, 1fr)", alignItems: "center", gap: 3 }}>
              <Rotulo>{a.rotulo}</Rotulo>
              <Box sx={{ height: 8, width: a.largura, bgcolor: a.cor }} />
            </Box>
          ))}
        </Box>
      </Box>

      <Box component="main" sx={{ flex: "1 1 420px", display: "flex", alignItems: "center", justifyContent: "center", p: { xs: "32px 20px", sm: 8 } }}>
        <Box sx={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 8 }}>
          <Box sx={{ display: { xs: "block", sm: "none" } }}>
            <LogoLastro tamanho={26} />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Rotulo>Acesso</Rotulo>
            <Typography variant="h1" sx={{ fontSize: { xs: 32, sm: 28 }, lineHeight: 1.15 }}>
              <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
                Cada centavo com base.
              </Box>
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                Entrar
              </Box>
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", fontSize: 15 }}>
              Entre com o e-mail e a senha cadastrados.
            </Typography>
          </Box>
          <FormularioEntrar />
          <Rotulo component="p" sx={{ m: 0 }}>
            No iPhone, o iCloud preenche com Face ID.
          </Rotulo>
        </Box>
      </Box>
    </Box>
  );
}
