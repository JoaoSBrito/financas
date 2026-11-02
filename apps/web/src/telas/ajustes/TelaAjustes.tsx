"use client";

import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import CreditCardRounded from "@mui/icons-material/CreditCardRounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import SellRounded from "@mui/icons-material/SellRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { SecaoCard } from "@financas/ui";
import { cores } from "@financas/ui/tokens";
import { supabaseNavegador } from "@/lib/supabase/client";

function ItemMenu({ href, icone, titulo, descricao }: { href: string; icone: ReactNode; titulo: string; descricao: string }) {
  return (
    <ButtonBase component={Link} href={href} sx={{ width: "100%", justifyContent: "flex-start", gap: 3, minHeight: 64, borderRadius: 3, textAlign: "left" }}>
      <Box aria-hidden sx={{ width: 40, height: 40, borderRadius: 3, bgcolor: cores.primariaClara, color: cores.primaria, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icone}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle1">{titulo}</Typography>
        <Typography variant="caption">{descricao}</Typography>
      </Box>
      <ChevronRightRounded aria-hidden sx={{ color: "text.secondary" }} />
    </ButtonBase>
  );
}

export function TelaAjustes() {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);

  async function sair() {
    setSaindo(true);
    await supabaseNavegador().auth.signOut();
    router.replace("/entrar");
    router.refresh();
  }

  return (
    <Box sx={{ maxWidth: 640 }}>
      <Typography variant="h1" sx={{ mb: 5 }}>
        Ajustes
      </Typography>
      <SecaoCard gap={1}>
        <ItemMenu href="/ajustes/categorias" icone={<SellRounded />} titulo="Categorias e orçamento" descricao="Nomes das categorias e quanto gastar em cada uma" />
        <Divider />
        <ItemMenu href="/cartoes" icone={<CreditCardRounded />} titulo="Cartões" descricao="Limites, vencimentos e regras de fechamento" />
      </SecaoCard>
      <Button
        onClick={sair}
        disabled={saindo}
        startIcon={<LogoutRounded />}
        color="error"
        sx={{ mt: 5 }}
      >
        {saindo ? "Saindo…" : "Sair"}
      </Button>
    </Box>
  );
}
