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
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import { caixinhaFormSchema, dataSchema, hojeEmSaoPaulo, type CaixinhaForm } from "@financas/core";
import { CampoMoeda, ControleSegmentado, PilulasSelecao, Valor } from "@financas/ui";
import { useArquivarCaixinha, useAtualizarSaldoCaixinha, useMovimentarCaixinha, useSalvarCaixinha } from "@/hooks/useCaixinhas";
import type { CartaoCompleto } from "@/services/cartoes-mapeamento";
import type { Caixinha } from "@/services/caixinhas";
import type { Conta } from "@/services/contas";
import { useAvisos } from "@/stores/avisos";

function Janela({ titulo, ocupado, onFechar, onEnviar, acoes, children }: {
  titulo: string;
  ocupado: boolean;
  onFechar: () => void;
  onEnviar?: () => void;
  acoes: ReactNode;
  children: ReactNode;
}) {
  return (
    <Dialog open onClose={ocupado ? undefined : onFechar} fullWidth maxWidth="xs">
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

const Rotulo = ({ children }: { children: string }) => (
  <Typography variant="body2" sx={{ fontWeight: 700 }}>
    {children}
  </Typography>
);

// ───────────── Nova / editar caixinha ─────────────

type Entrada = z.input<typeof caixinhaFormSchema>;

export function DialogoCaixinha({ caixinha, cartoes, onFechar }: { caixinha?: Caixinha; cartoes: CartaoCompleto[]; onFechar: () => void }) {
  const salvar = useSalvarCaixinha();
  const arquivar = useArquivarCaixinha();
  const aviso = useAvisos((s) => s.mostrar);
  const [saldoAtual, setSaldoAtual] = useState<number | null>(null);
  const [confirmandoArquivo, setConfirmandoArquivo] = useState(false);
  const ocupado = salvar.isPending || arquivar.isPending;
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Entrada, unknown, CaixinhaForm>({
    resolver: zodResolver(caixinhaFormSchema),
    defaultValues: {
      nome: caixinha?.nome ?? "",
      meta: caixinha?.meta ?? null,
      dataMeta: caixinha?.dataMeta ?? null,
      cartaoId: caixinha?.cartaoId ?? null,
      percentualCdi: caixinha?.percentualCdi ?? null,
    },
  });

  const enviar = handleSubmit((form) =>
    salvar.mutate(
      { id: caixinha?.id, form, saldoAtual: saldoAtual ?? 0 },
      {
        onSuccess: () => {
          aviso(caixinha ? "Caixinha atualizada" : "Caixinha criada");
          onFechar();
        },
      },
    ),
  );

  if (confirmandoArquivo && caixinha) {
    return (
      <Janela
        titulo="Arquivar caixinha?"
        ocupado={ocupado}
        onFechar={onFechar}
        onEnviar={() => arquivar.mutate(caixinha.id, { onSuccess: () => (aviso("Caixinha arquivada"), onFechar()) })}
        acoes={
          <>
            <Button onClick={() => setConfirmandoArquivo(false)}>Voltar</Button>
            <Button type="submit" color="error" variant="contained" disabled={ocupado}>
              Arquivar
            </Button>
          </>
        }
      >
        <Typography variant="body2">
          &quot;{caixinha.nome}&quot; sai da lista e do patrimônio. Se ainda tem dinheiro nela, resgate antes.
        </Typography>
      </Janela>
    );
  }

  return (
    <Janela
      titulo={caixinha ? "Editar caixinha" : "Nova caixinha"}
      ocupado={ocupado}
      onFechar={onFechar}
      onEnviar={enviar}
      acoes={
        <>
          {caixinha && (
            <Button color="error" sx={{ mr: "auto" }} onClick={() => setConfirmandoArquivo(true)} disabled={ocupado}>
              Arquivar
            </Button>
          )}
          <Button onClick={onFechar}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={ocupado}>
            {salvar.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </>
      }
    >
      <TextField label="Nome" placeholder="Ex.: Reserva de emergência" error={Boolean(errors.nome)} helperText={errors.nome?.message} {...register("nome")} />
      {!caixinha && (
        <CampoMoeda label="Quanto já tem guardado" valor={saldoAtual} onChange={setSaldoAtual} helperText="Entra como depósito, não como rendimento." />
      )}
      <Controller
        control={control}
        name="meta"
        render={({ field, fieldState }) => (
          <CampoMoeda label="Meta (opcional)" valor={field.value ?? null} onChange={(v) => field.onChange(v || null)} error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
        )}
      />
      <Controller
        control={control}
        name="dataMeta"
        render={({ field, fieldState }) => (
          <TextField
            label="Data da meta (opcional)"
            type="date"
            value={field.value ?? ""}
            onChange={(e) => field.onChange(e.target.value || null)}
            slotProps={{ inputLabel: { shrink: true } }}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
          />
        )}
      />
      {cartoes.length > 0 && (
        <Stack spacing={2}>
          <Rotulo>Vincular a um cartão</Rotulo>
          <Controller
            control={control}
            name="cartaoId"
            render={({ field }) => (
              <PilulasSelecao
                rotulo="Cartão vinculado"
                tamanho="pequeno"
                valor={field.value ?? "nenhum"}
                onChange={(v) => field.onChange(v === "nenhum" ? null : v)}
                opcoes={[{ valor: "nenhum", rotulo: "Nenhum" }, ...cartoes.map((c) => ({ valor: c.id, rotulo: c.nome }))]}
              />
            )}
          />
          <Typography variant="caption">Para juntar o valor da próxima fatura. Sem data, a meta é o vencimento dela.</Typography>
        </Stack>
      )}
      <Controller
        control={control}
        name="percentualCdi"
        render={({ field, fieldState }) => (
          <CampoPercentual valor={field.value ?? null} onChange={field.onChange} erro={fieldState.error?.message} />
        )}
      />
      {salvar.error && <Alert severity="error">{salvar.error.message}</Alert>}
    </Janela>
  );
}

// ───────────── Guardar / resgatar ─────────────

export function DialogoMovimentar({
  caixinhas,
  contas,
  inicial,
  onFechar,
}: {
  caixinhas: Caixinha[];
  contas: Conta[];
  inicial: { tipo: "deposito" | "resgate"; caixinhaId?: string };
  onFechar: () => void;
}) {
  const movimentar = useMovimentarCaixinha();
  const aviso = useAvisos((s) => s.mostrar);
  const [tipo, setTipo] = useState(inicial.tipo);
  const [caixinhaId, setCaixinhaId] = useState(inicial.caixinhaId ?? caixinhas[0]?.id ?? "");
  const [contaId, setContaId] = useState(contas[0]?.id ?? "");
  const [valor, setValor] = useState<number | null>(null);
  const [data, setData] = useState(hojeEmSaoPaulo());
  const [erro, setErro] = useState<string | null>(null);
  const caixinha = caixinhas.find((c) => c.id === caixinhaId);

  function enviar() {
    if (!valor || valor <= 0) return setErro("Informe um valor");
    if (tipo === "resgate" && caixinha && valor > caixinha.saldo) return setErro("Valor maior que o saldo da caixinha");
    if (!dataSchema.safeParse(data).success) return setErro("Data inválida");
    movimentar.mutate(
      { caixinhaId, contaId, tipo, valor, data },
      {
        onSuccess: () => {
          aviso(tipo === "deposito" ? `Guardado em ${caixinha?.nome}` : `Resgatado de ${caixinha?.nome}`);
          onFechar();
        },
      },
    );
  }

  if (contas.length === 0) {
    return (
      <Janela titulo="Cadastre uma conta" ocupado={false} onFechar={onFechar} acoes={<Button onClick={onFechar}>Fechar</Button>}>
        <Typography variant="body2">
          Guardar e resgatar movem dinheiro entre a conta e a caixinha.{" "}
          <Link href="/contas" style={{ color: "inherit", fontWeight: 700 }}>
            Cadastrar conta
          </Link>
          . Para só informar o valor que já está na caixinha, use &quot;Atualizar saldo&quot;.
        </Typography>
      </Janela>
    );
  }

  return (
    <Janela
      titulo={tipo === "deposito" ? "Guardar" : "Resgatar"}
      ocupado={movimentar.isPending}
      onFechar={onFechar}
      onEnviar={enviar}
      acoes={
        <>
          <Button onClick={onFechar}>Cancelar</Button>
          <Button type="submit" variant="contained" color="success" disabled={movimentar.isPending}>
            {movimentar.isPending ? "Salvando…" : tipo === "deposito" ? "Guardar" : "Resgatar"}
          </Button>
        </>
      }
    >
      <ControleSegmentado
        rotulo="Tipo"
        valor={tipo}
        onChange={setTipo}
        opcoes={[
          { valor: "deposito", rotulo: "Guardar" },
          { valor: "resgate", rotulo: "Resgatar" },
        ]}
      />
      <CampoMoeda
        label="Valor"
        valor={valor}
        onChange={(v) => {
          setValor(v);
          setErro(null);
        }}
        error={Boolean(erro)}
        helperText={erro ?? undefined}
      />
      {caixinhas.length > 1 && (
        <Stack spacing={2}>
          <Rotulo>Caixinha</Rotulo>
          <PilulasSelecao rotulo="Caixinha" tamanho="pequeno" valor={caixinhaId} onChange={setCaixinhaId} opcoes={caixinhas.map((c) => ({ valor: c.id, rotulo: c.nome }))} />
        </Stack>
      )}
      {caixinha && tipo === "resgate" && (
        <Typography variant="caption">
          Disponível: <Valor valor={caixinha.saldo} sx={{ font: "inherit", fontWeight: 700 }} />
        </Typography>
      )}
      {contas.length > 1 && (
        <Stack spacing={2}>
          <Rotulo>{tipo === "deposito" ? "Sai da conta" : "Volta para a conta"}</Rotulo>
          <PilulasSelecao rotulo="Conta" tamanho="pequeno" valor={contaId} onChange={setContaId} opcoes={contas.map((c) => ({ valor: c.id, rotulo: c.nome }))} />
        </Stack>
      )}
      <TextField label="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
      <Typography variant="caption">É uma transferência: não conta como gasto nem como receita.</Typography>
      {movimentar.error && <Alert severity="error">{movimentar.error.message}</Alert>}
    </Janela>
  );
}

// ───────────── Atualizar saldo ─────────────

export function DialogoAtualizarSaldo({ caixinha, onFechar }: { caixinha: Caixinha; onFechar: () => void }) {
  const atualizar = useAtualizarSaldoCaixinha();
  const aviso = useAvisos((s) => s.mostrar);
  const [saldoReal, setSaldoReal] = useState<number | null>(caixinha.saldo);
  const diferenca = (saldoReal ?? 0) - caixinha.saldo;
  return (
    <Janela
      titulo={`Atualizar ${caixinha.nome}`}
      ocupado={atualizar.isPending}
      onFechar={onFechar}
      onEnviar={() =>
        atualizar.mutate({ caixinhaId: caixinha.id, saldoReal: saldoReal ?? 0 }, { onSuccess: () => (aviso("Saldo atualizado"), onFechar()) })
      }
      acoes={
        <>
          <Button onClick={onFechar}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={atualizar.isPending}>
            Atualizar
          </Button>
        </>
      }
    >
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        No app: <Valor valor={caixinha.saldo} sx={{ font: "inherit", fontWeight: 700 }} />
      </Typography>
      <CampoMoeda label="Saldo no banco agora" valor={saldoReal} onChange={setSaldoReal} />
      {diferenca !== 0 && (
        <Alert severity="info">
          <Valor valor={diferenca} sinal="sempre" sx={{ font: "inherit", fontWeight: 700 }} /> será registrado como rendimento.
        </Alert>
      )}
      {atualizar.error && <Alert severity="error">{atualizar.error.message}</Alert>}
    </Janela>
  );
}

// ───────────── Ações de uma caixinha ─────────────

export function DialogoAcoes({
  caixinha,
  onEscolher,
  onFechar,
}: {
  caixinha: Caixinha;
  onEscolher: (acao: "deposito" | "resgate" | "atualizar" | "editar") => void;
  onFechar: () => void;
}) {
  return (
    <Janela titulo={caixinha.nome} ocupado={false} onFechar={onFechar} acoes={<Button onClick={onFechar}>Fechar</Button>}>
      <Valor valor={caixinha.saldo} sx={{ fontSize: 24, fontWeight: 800 }} />
      <Button variant="contained" color="success" onClick={() => onEscolher("deposito")}>
        Guardar
      </Button>
      <Button variant="outlined" onClick={() => onEscolher("resgate")}>
        Resgatar
      </Button>
      <Button variant="outlined" onClick={() => onEscolher("atualizar")}>
        Atualizar saldo
      </Button>
      <Button onClick={() => onEscolher("editar")}>Editar caixinha</Button>
    </Janela>
  );
}

/** Texto livre com vírgula ("102,5"); o número só é convertido quando o texto é válido. */
function CampoPercentual({ valor, onChange, erro }: { valor: number | null; onChange: (v: number | null) => void; erro?: string }) {
  const [texto, setTexto] = useState(valor === null ? "" : String(valor).replace(".", ","));
  return (
    <TextField
      label="% do CDI (opcional)"
      placeholder="Ex.: 102"
      value={texto}
      onChange={(e) => {
        const t = e.target.value.replace(/[^\d,.]/g, "");
        setTexto(t);
        const n = Number(t.replace(",", "."));
        onChange(t === "" ? null : Number.isFinite(n) ? n : null);
      }}
      slotProps={{ htmlInput: { inputMode: "decimal" } }}
      error={Boolean(erro)}
      helperText={erro ?? "Com o valor, o rendimento é estimado todo dia. Sem ele, só muda quando você atualiza o saldo."}
    />
  );
}
