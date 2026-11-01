"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { supabaseNavegador } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.email("Informe um e-mail válido"),
  senha: z.string().min(6, "A senha tem pelo menos 6 caracteres"),
});
type Login = z.infer<typeof loginSchema>;

export function FormularioEntrar() {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Login>({ resolver: zodResolver(loginSchema) });

  async function entrar(dados: Login) {
    setErro(null);
    const { error } = await supabaseNavegador().auth.signInWithPassword({
      email: dados.email,
      password: dados.senha,
    });
    if (error) {
      setErro("E-mail ou senha incorretos.");
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <Stack component="form" onSubmit={handleSubmit(entrar)} noValidate spacing={4}>
      {erro && <Alert severity="error">{erro}</Alert>}
      <TextField
        label="E-mail"
        type="email"
        autoComplete="username"
        error={Boolean(errors.email)}
        helperText={errors.email?.message}
        {...register("email")}
      />
      <TextField
        label="Senha"
        type="password"
        autoComplete="current-password"
        error={Boolean(errors.senha)}
        helperText={errors.senha?.message}
        {...register("senha")}
      />
      <Button type="submit" variant="contained" size="large" disabled={isSubmitting} sx={{ minHeight: 52 }}>
        {isSubmitting ? "Entrando…" : "Entrar"}
      </Button>
    </Stack>
  );
}
