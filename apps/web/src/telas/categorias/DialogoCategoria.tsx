"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { categoriaFormSchema, nomeDoMes, type CategoriaForm, type Mes } from "@financas/core";
import { CampoMoeda, FolhaInferior, Rotulo, Valor } from "@financas/ui";
import { paleta, semantica } from "@financas/ui/tokens";
import { useArquivarCategoria, useSalvarCategoria } from "@/hooks/useCategorias";
import { useAvisos } from "@/stores/avisos";

export interface DialogoCategoriaProps {
  mes: Mes;
  /** Sem categoria = criar uma nova. */
  categoria?: { id: string; nome: string; orcamento: number | null };
  onFechar: () => void;
}

/** Valores exatos em que os alertas acendem (os mesmos limites de situacaoDoOrcamento). */
function Alertas({ orcamento }: { orcamento: number }) {
  const linha = (texto: string, valor: number, cor: string) => (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, fontSize: 14 }}>
      <span>{texto}</span>
      <Valor valor={valor} semSimbolo sx={{ fontSize: 14, color: cor }} />
    </Box>
  );
  return (
    <Box component="section" aria-label="Alertas" sx={{ border: `1px solid ${paleta.divisor}`, borderRadius: "8px", p: "12px 14px", display: "flex", flexDirection: "column", gap: 2 }}>
      <Rotulo>Alertas</Rotulo>
      {linha("Atenção em 80%", Math.ceil((orcamento * 80) / 100), semantica.atencao.texto)}
      {linha("Estouro em 100%", orcamento, semantica.estouro.texto)}
    </Box>
  );
}

export function DialogoCategoria({ mes, categoria, onFechar }: DialogoCategoriaProps) {
  const salvar = useSalvarCategoria(mes);
  const arquivar = useArquivarCategoria();
  const mostrarAviso = useAvisos((s) => s.mostrar);
  const [confirmandoArquivo, setConfirmandoArquivo] = useState(false);
  const ocupado = salvar.isPending || arquivar.isPending;

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoriaForm>({
    resolver: zodResolver(categoriaFormSchema),
    defaultValues: { nome: categoria?.nome ?? "", orcamentoMensal: categoria?.orcamento ?? null },
  });
  const orcamento = useWatch({ control, name: "orcamentoMensal" });

  const enviar = handleSubmit((form) =>
    salvar.mutate(
      { id: categoria?.id, form, orcamentoAtual: categoria?.orcamento ?? null },
      {
        onSuccess: () => {
          mostrarAviso(categoria ? "Categoria atualizada" : "Categoria criada");
          onFechar();
        },
      },
    ),
  );

  function confirmarArquivo() {
    if (!categoria) return;
    arquivar.mutate(categoria.id, {
      onSuccess: () => {
        mostrarAviso("Categoria arquivada");
        onFechar();
      },
    });
  }

  const erro = salvar.error?.message ?? arquivar.error?.message;
  const mensagemErro = erro && <Alert severity="error">{erro}</Alert>;

  if (confirmandoArquivo && categoria) {
    return (
      <FolhaInferior
        aberta
        titulo="Arquivar categoria?"
        ocupado={ocupado}
        onFechar={onFechar}
        onEnviar={confirmarArquivo}
        largura={440}
        acoes={
          <>
            <Button variant="outlined" onClick={() => setConfirmandoArquivo(false)} disabled={ocupado}>
              Voltar
            </Button>
            <Button type="submit" variant="contained" color="error" disabled={ocupado}>
              {arquivar.isPending ? "Arquivando…" : "Arquivar"}
            </Button>
          </>
        }
      >
        <Typography variant="body2">
          &quot;{categoria.nome}&quot; deixa de aparecer nas escolhas. Os gastos antigos continuam com ela.
        </Typography>
        {mensagemErro}
      </FolhaInferior>
    );
  }

  return (
    <FolhaInferior
      aberta
      titulo={categoria ? "Editar categoria" : "Nova categoria"}
      ocupado={ocupado}
      onFechar={onFechar}
      onEnviar={enviar}
      largura={440}
      acoes={
        <>
          {categoria ? (
            // Não existe excluir: arquivar tira a categoria das escolhas e preserva o histórico.
            <Button variant="outlined" color="error" onClick={() => setConfirmandoArquivo(true)} disabled={ocupado}>
              Arquivar
            </Button>
          ) : (
            <Button variant="outlined" onClick={onFechar} disabled={ocupado}>
              Cancelar
            </Button>
          )}
          <Button type="submit" variant="contained" disabled={ocupado}>
            {salvar.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </>
      }
    >
      <TextField label="Nome" error={Boolean(errors.nome)} helperText={errors.nome?.message} {...register("nome")} />
      <Controller
        control={control}
        name="orcamentoMensal"
        render={({ field, fieldState }) => (
          <CampoMoeda
            label="Orçamento mensal"
            valor={field.value}
            onChange={(v) => field.onChange(v === 0 ? null : v)}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message ?? `Deixe em branco para não ter orçamento. Vale a partir da fatura de ${nomeDoMes(mes, false)}.`}
          />
        )}
      />
      {orcamento ? <Alertas orcamento={orcamento} /> : null}
      {mensagemErro}
    </FolhaInferior>
  );
}
