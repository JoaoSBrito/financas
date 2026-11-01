import Typography from "@mui/material/Typography";
import { EstadoVazio } from "@financas/ui";

/** Ocupa as rotas enquanto as telas são implementadas, na ordem combinada. */
export function TelaEmConstrucao({ titulo }: { titulo: string }) {
  return (
    <>
      <Typography variant="h1">{titulo}</Typography>
      <EstadoVazio titulo="Tela em construção" descricao="Esta tela entra nas próximas etapas." />
    </>
  );
}
