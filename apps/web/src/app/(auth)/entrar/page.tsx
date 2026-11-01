import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import { FormularioEntrar } from "./FormularioEntrar";

export const metadata: Metadata = { title: "Entrar" };

export default function PaginaEntrar() {
  return (
    <Box sx={{ minHeight: "100dvh", display: "grid", placeItems: "center", p: 5 }}>
      <Card sx={{ width: "100%", maxWidth: 400, p: 7, display: "flex", flexDirection: "column", gap: 6 }}>
        <Box>
          <Typography variant="h1">Finanças</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
            Entre com o e-mail e a senha cadastrados no Supabase.
          </Typography>
        </Box>
        <FormularioEntrar />
      </Card>
    </Box>
  );
}
