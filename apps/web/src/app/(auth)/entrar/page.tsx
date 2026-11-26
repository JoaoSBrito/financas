import CreditCardRounded from "@mui/icons-material/CreditCardRounded";
import Box from "@mui/material/Box";
import { paleta, raio } from "@financas/ui/tokens";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import { FormularioEntrar } from "./FormularioEntrar";

export const metadata: Metadata = { title: "Entrar" };

export default function PaginaEntrar() {
  return (
    <Box sx={{ minHeight: "100dvh", display: "grid", placeItems: "center", p: 5 }}>
      {/* No celular o formulário fica direto sobre o fundo; a partir do tablet, dentro de um card. */}
      <Card
        sx={{
          width: "100%",
          maxWidth: 400,
          p: { xs: 0, sm: 8 },
          bgcolor: { xs: "transparent", sm: "background.paper" },
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <Box>
          <Box aria-hidden sx={{ width: 44, height: 44, mb: 4, borderRadius: `${raio.card}px`, bgcolor: { xs: "background.paper", sm: paleta.interativo }, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CreditCardRounded fontSize="small" />
          </Box>
          <Typography variant="h1">Lastro</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
            Entre com o e-mail e a senha cadastrados no Supabase.
          </Typography>
        </Box>
        <FormularioEntrar />
      </Card>
    </Box>
  );
}
