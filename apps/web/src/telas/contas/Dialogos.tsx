"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import {
  contaFormSchema,
  hojeEmSaoPaulo,
  movimentoFormSchema,
  recorrenteFormSchema,
  transferenciaEntreContasSchema,
  type ContaForm,
  type MovimentoForm,
  type RecorrenteForm,
  type TransferenciaEntreContas,
} from "@financas/core";
import { CampoMoeda, ControleSegmentado, PilulasSelecao, Valor } from "@financas/ui";
import {
  useAjustarSaldo,
  useCriarConta,
  useDesativarRecorrente,
  useDesfazerTransferencia,
  useExcluirMovimento,
  useTransferirEntreContas,
  useRegistrarMovimento,
  useSalvarRecorrente,
} from "@/hooks/useContas";
import type { Conta, MovimentoConta, Recorrente } from "@/services/contas";
import { useAvisos } from "@/stores/avisos";

function Janela({
  titulo,
  aberto = true,
  ocupado,
  onFechar,
  onEnviar,
  acoes,
  children,
}: {
  titulo: string;
  aberto?: boolean;
  ocupado: boolean;
  onFechar: () => void;
  onEnviar?: () => void;
  acoes: ReactNode;
  children: ReactNode;
}) {
  return (
    <Dialog open={aberto} onClose={ocupado ? undefined : onFechar} fullWidth maxWidth="xs">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onEnviar?.();
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>{titulo}</DialogTitle>
        <DialogContent>
          <Stack spacing={4} sx={{ pt: 1 }}>
            {children}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 6, pb: 5, gap: 2, flexWrap: "wrap" }}>{acoes}</DialogActions>
      </form>
    </Dialog>
  );
}

function SeletorConta({ contas, valor, onChange }: { contas: Conta[]; valor: string; onChange: (id: string) => void }) {
  if (contas.length <= 1) return null;
  return (
    <Stack spacing={2}>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        Conta
      </Typography>
      <PilulasSelecao rotulo="Conta" tamanho="pequeno" valor={valor} onChange={onChange} opcoes={contas.map((c) => ({ valor: c.id, rotulo: c.nome }))} />
    </Stack>
  );
}

// ───────────── Nova conta ─────────────

export function DialogoNovaConta({ onFechar }: { onFechar: () => void }) {
  const criar = useCriarConta();
  const aviso = useAvisos((s) => s.mostrar);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContaForm>({ resolver: zodResolver(contaFormSchema), defaultValues: { nome: "", tipo: "corrente", saldoAtual: 0 } });

  const enviar = handleSubmit((f) =>
    criar.mutate(f, {
      onSuccess: () => {
        aviso("Conta criada");
        onFechar();
      },
    }),
  );

  return (
    <Janela
      titulo="Nova conta"
      ocupado={criar.isPending}
      onFechar={onFechar}
      onEnviar={enviar}
      acoes={
        <>
          <Button onClick={onFechar}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={criar.isPending}>
            {criar.isPending ? "Salvando…" : "Criar conta"}
          </Button>
        </>
      }
    >
      <TextField label="Nome" placeholder="Ex.: Conta XP" error={Boolean(errors.nome)} helperText={errors.nome?.message} {...register("nome")} />
      <Controller
        control={control}
        name="tipo"
        render={({ field }) => (
          <ControleSegmentado
            rotulo="Tipo de conta"
            valor={field.value}
            onChange={field.onChange}
            opcoes={[
              { valor: "corrente", rotulo: "Corrente" },
              { valor: "carteira", rotulo: "Carteira" },
              { valor: "outra", rotulo: "Outra" },
            ]}
          />
        )}
      />
      <Controller
        control={control}
        name="saldoAtual"
        render={({ field }) => (
          <CampoMoeda
            label="Saldo hoje"
            valor={field.value || null}
            onChange={(v) => field.onChange(v ?? 0)}
            helperText="O valor que aparece no app do banco agora."
          />
        )}
      />
      {criar.error && <Alert severity="error">{criar.error.message}</Alert>}
    </Janela>
  );
}

// ───────────── Ajustar saldo ─────────────

export function DialogoAjustarSaldo({ conta, onFechar }: { conta: Conta; onFechar: () => void }) {
  const [saldoReal, setSaldoReal] = useState<number | null>(conta.saldo);
  const ajustar = useAjustarSaldo();
  const aviso = useAvisos((s) => s.mostrar);
  const diferenca = (saldoReal ?? 0) - conta.saldo;

  return (
    <Janela
      titulo={`Conferir ${conta.nome}`}
      ocupado={ajustar.isPending}
      onFechar={onFechar}
      onEnviar={() =>
        ajustar.mutate(
          { contaId: conta.id, saldoReal: saldoReal ?? 0 },
          {
            onSuccess: (d) => {
              aviso(d === 0 ? "Saldo conferido" : "Saldo ajustado");
              onFechar();
            },
          },
        )
      }
      acoes={
        <>
          <Button onClick={onFechar}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={ajustar.isPending}>
            {diferenca === 0 ? "Confirmar que bate" : "Lançar ajuste"}
          </Button>
        </>
      }
    >
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        No app: <Valor valor={conta.saldo} sx={{ font: "inherit", fontWeight: 700 }} />
      </Typography>
      <CampoMoeda label="Saldo no banco agora" valor={saldoReal} onChange={setSaldoReal} />
      {diferenca !== 0 && (
        <Alert severity="info">
          A diferença de <Valor valor={diferenca} sinal="sempre" sx={{ font: "inherit", fontWeight: 700 }} /> será lançada como ajuste.
        </Alert>
      )}
      {ajustar.error && <Alert severity="error">{ajustar.error.message}</Alert>}
    </Janela>
  );
}

// ───────────── Entrada / saída ─────────────

type EntradaMov = z.input<typeof movimentoFormSchema>;

export function DialogoMovimento({
  tipo,
  contas,
  inicial,
  recorrenteId,
  onFechar,
}: {
  tipo: "entrada" | "saida";
  contas: Conta[];
  inicial?: Partial<MovimentoForm>;
  recorrenteId?: string;
  onFechar: () => void;
}) {
  const registrar = useRegistrarMovimento();
  const aviso = useAvisos((s) => s.mostrar);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EntradaMov, unknown, MovimentoForm>({
    resolver: zodResolver(movimentoFormSchema),
    defaultValues: {
      contaId: contas[0]?.id ?? "",
      tipo,
      valor: 0,
      descricao: "",
      data: hojeEmSaoPaulo(),
      categoriaId: null,
      ...inicial,
    },
  });

  const enviar = handleSubmit((form) =>
    registrar.mutate(
      { form, recorrenteId },
      {
        onSuccess: () => {
          aviso(tipo === "entrada" ? "Entrada lançada" : "Saída lançada");
          onFechar();
        },
      },
    ),
  );

  return (
    <Janela
      titulo={recorrenteId ? "Lançar recorrente" : tipo === "entrada" ? "Nova entrada" : "Nova saída / Pix"}
      ocupado={registrar.isPending}
      onFechar={onFechar}
      onEnviar={enviar}
      acoes={
        <>
          <Button onClick={onFechar}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={registrar.isPending}>
            {registrar.isPending ? "Salvando…" : "Lançar"}
          </Button>
        </>
      }
    >
      <Controller
        control={control}
        name="valor"
        render={({ field, fieldState }) => (
          <CampoMoeda
            label="Valor"
            valor={field.value || null}
            onChange={(v) => field.onChange(v ?? 0)}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
          />
        )}
      />
      <TextField
        label="Descrição"
        placeholder={tipo === "entrada" ? "Ex.: Salário" : "Ex.: Aluguel"}
        error={Boolean(errors.descricao)}
        helperText={errors.descricao?.message}
        {...register("descricao")}
      />
      <TextField
        label="Data"
        type="date"
        slotProps={{ inputLabel: { shrink: true } }}
        error={Boolean(errors.data)}
        helperText={errors.data?.message ?? "Data futura fica como agendada."}
        {...register("data")}
      />
      <Controller control={control} name="contaId" render={({ field }) => <SeletorConta contas={contas} valor={field.value} onChange={field.onChange} />} />
      {registrar.error && <Alert severity="error">{registrar.error.message}</Alert>}
    </Janela>
  );
}

// ───────────── Recorrente ─────────────

type EntradaRec = z.input<typeof recorrenteFormSchema>;

export function DialogoRecorrente({ contas, recorrente, onFechar }: { contas: Conta[]; recorrente?: Recorrente; onFechar: () => void }) {
  const salvar = useSalvarRecorrente();
  const desativar = useDesativarRecorrente();
  const aviso = useAvisos((s) => s.mostrar);
  const ocupado = salvar.isPending || desativar.isPending;
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EntradaRec, unknown, RecorrenteForm>({
    resolver: zodResolver(recorrenteFormSchema),
    defaultValues: {
      descricao: recorrente?.descricao ?? "",
      tipo: recorrente?.tipo ?? "saida",
      valor: recorrente?.valor ?? 0,
      dia: recorrente?.dia ?? 5,
      contaId: recorrente?.contaId ?? contas[0]?.id ?? null,
      cartaoId: null,
      categoriaId: null,
    },
  });

  const enviar = handleSubmit((form) =>
    salvar.mutate(
      { id: recorrente?.id, form },
      {
        onSuccess: () => {
          aviso(recorrente ? "Recorrente atualizado" : "Recorrente criado");
          onFechar();
        },
      },
    ),
  );

  return (
    <Janela
      titulo={recorrente ? "Editar recorrente" : "Novo recorrente"}
      ocupado={ocupado}
      onFechar={onFechar}
      onEnviar={enviar}
      acoes={
        <>
          {recorrente && (
            <Button
              color="error"
              sx={{ mr: "auto" }}
              disabled={ocupado}
              onClick={() =>
                desativar.mutate(recorrente.id, {
                  onSuccess: () => {
                    aviso("Recorrente removido");
                    onFechar();
                  },
                })
              }
            >
              Remover
            </Button>
          )}
          <Button onClick={onFechar}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={ocupado}>
            {salvar.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </>
      }
    >
      <Controller
        control={control}
        name="tipo"
        render={({ field }) => (
          <ControleSegmentado
            rotulo="Tipo"
            valor={field.value}
            onChange={field.onChange}
            opcoes={[
              { valor: "entrada", rotulo: "Entrada" },
              { valor: "saida", rotulo: "Conta fixa" },
            ]}
          />
        )}
      />
      <TextField label="Descrição" placeholder="Ex.: Salário, Aluguel" error={Boolean(errors.descricao)} helperText={errors.descricao?.message} {...register("descricao")} />
      <Controller
        control={control}
        name="valor"
        render={({ field, fieldState }) => (
          <CampoMoeda label="Valor" valor={field.value || null} onChange={(v) => field.onChange(v ?? 0)} error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
        )}
      />
      <Controller
        control={control}
        name="dia"
        render={({ field, fieldState }) => (
          <TextField
            label="Dia do mês"
            value={Number.isNaN(field.value) ? "" : field.value}
            onChange={(e) => field.onChange(e.target.value === "" ? Number.NaN : Number(e.target.value))}
            slotProps={{ htmlInput: { inputMode: "numeric", pattern: "[0-9]*", maxLength: 2 } }}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message ?? "Dia 31 vira o último dia em meses mais curtos."}
            sx={{ maxWidth: 220 }}
          />
        )}
      />
      <Controller control={control} name="contaId" render={({ field }) => <SeletorConta contas={contas} valor={field.value ?? ""} onChange={field.onChange} />} />
      {(salvar.error ?? desativar.error) && <Alert severity="error">{(salvar.error ?? desativar.error)!.message}</Alert>}
    </Janela>
  );
}

// ───────────── Excluir movimento ─────────────

export function DialogoExcluirMovimento({ movimento, onFechar }: { movimento: MovimentoConta; onFechar: () => void }) {
  const excluir = useExcluirMovimento();
  const aviso = useAvisos((s) => s.mostrar);
  return (
    <Janela
      titulo="Excluir movimento?"
      ocupado={excluir.isPending}
      onFechar={onFechar}
      onEnviar={() =>
        excluir.mutate(movimento.id, {
          onSuccess: () => {
            aviso("Movimento excluído");
            onFechar();
          },
        })
      }
      acoes={
        <>
          <Button onClick={onFechar}>Cancelar</Button>
          <Button type="submit" variant="contained" color="error" disabled={excluir.isPending}>
            Excluir
          </Button>
        </>
      }
    >
      <Typography variant="body2">
        &quot;{movimento.descricao}&quot; (<Valor valor={movimento.valor} sinal="sempre" sx={{ font: "inherit" }} />) sai do saldo da conta.
      </Typography>
      {excluir.error && <Alert severity="error">{excluir.error.message}</Alert>}
    </Janela>
  );
}

// ───────────── Transferência entre contas ─────────────

type EntradaTransf = z.input<typeof transferenciaEntreContasSchema>;

export function DialogoTransferir({ contas, onFechar }: { contas: Conta[]; onFechar: () => void }) {
  const transferir = useTransferirEntreContas();
  const aviso = useAvisos((s) => s.mostrar);
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EntradaTransf, unknown, TransferenciaEntreContas>({
    resolver: zodResolver(transferenciaEntreContasSchema),
    defaultValues: {
      origemId: contas[0]?.id ?? "",
      destinoId: contas[1]?.id ?? "",
      valor: 0,
      data: hojeEmSaoPaulo(),
      descricao: "",
    },
  });

  const enviar = handleSubmit((t) =>
    transferir.mutate(t, {
      onSuccess: () => {
        aviso("Transferência registrada");
        onFechar();
      },
    }),
  );

  const opcoes = contas.map((c) => ({ valor: c.id, rotulo: c.nome }));

  return (
    <Janela
      titulo="Transferir entre contas"
      ocupado={transferir.isPending}
      onFechar={onFechar}
      onEnviar={enviar}
      acoes={
        <>
          <Button onClick={onFechar}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={transferir.isPending}>
            {transferir.isPending ? "Salvando…" : "Transferir"}
          </Button>
        </>
      }
    >
      <Controller
        control={control}
        name="origemId"
        render={({ field }) => (
          <Stack spacing={2}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              De
            </Typography>
            <PilulasSelecao
              rotulo="Conta de origem"
              tamanho="pequeno"
              valor={field.value}
              onChange={(id) => {
                field.onChange(id);
                // Mantém origem e destino diferentes.
                const outra = contas.find((c) => c.id !== id);
                setValue("destinoId", outra?.id ?? "");
              }}
              opcoes={opcoes}
            />
          </Stack>
        )}
      />
      <Controller
        control={control}
        name="destinoId"
        render={({ field, fieldState }) => (
          <Stack spacing={2}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Para
            </Typography>
            <PilulasSelecao rotulo="Conta de destino" tamanho="pequeno" valor={field.value} onChange={field.onChange} opcoes={opcoes} />
            {fieldState.error && (
              <Typography variant="caption" sx={{ color: "error.main" }}>
                {fieldState.error.message}
              </Typography>
            )}
          </Stack>
        )}
      />
      <Controller
        control={control}
        name="valor"
        render={({ field, fieldState }) => (
          <CampoMoeda label="Valor" valor={field.value || null} onChange={(v) => field.onChange(v ?? 0)} error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
        )}
      />
      <TextField label="Data" type="date" slotProps={{ inputLabel: { shrink: true } }} error={Boolean(errors.data)} helperText={errors.data?.message} {...register("data")} />
      <TextField
        label="Descrição (opcional)"
        placeholder="Ex.: Para pagar a conta de luz"
        error={Boolean(errors.descricao)}
        helperText={errors.descricao?.message}
        {...register("descricao")}
      />
      <Typography variant="caption">É uma transferência: não conta como gasto nem como receita.</Typography>
      {transferir.error && <Alert severity="error">{transferir.error.message}</Alert>}
    </Janela>
  );
}

export function DialogoDesfazerTransferencia({ movimento, onFechar }: { movimento: MovimentoConta; onFechar: () => void }) {
  const desfazer = useDesfazerTransferencia();
  const aviso = useAvisos((s) => s.mostrar);
  return (
    <Janela
      titulo="Desfazer transferência?"
      ocupado={desfazer.isPending}
      onFechar={onFechar}
      onEnviar={() =>
        desfazer.mutate(movimento.transferenciaId!, {
          onSuccess: () => {
            aviso("Transferência desfeita");
            onFechar();
          },
        })
      }
      acoes={
        <>
          <Button onClick={onFechar}>Cancelar</Button>
          <Button type="submit" variant="contained" color="error" disabled={desfazer.isPending}>
            Desfazer
          </Button>
        </>
      }
    >
      <Typography variant="body2">
        &quot;{movimento.descricao}&quot; sai das duas contas, e os saldos voltam ao que eram antes.
      </Typography>
      {desfazer.error && <Alert severity="error">{desfazer.error.message}</Alert>}
    </Janela>
  );
}
