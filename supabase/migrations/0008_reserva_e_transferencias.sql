-- ───────────── Reserva de emergência ─────────────
-- Meses de cobertura da caixinha marcada como reserva (nulo = caixinha comum).
alter table public.caixinhas add column reserva_meses smallint check (reserva_meses between 1 and 36);

-- Só uma reserva por usuário.
create unique index caixinha_reserva_unica on public.caixinhas (user_id) where reserva_meses is not null;

-- A view ganha a coluna no final (create or replace exige manter as anteriores na ordem).
create or replace view public.saldo_caixinhas with (security_invoker = true) as
select x.id, x.user_id, x.nome, x.meta, x.data_meta, x.cartao_id, x.percentual_cdi,
       coalesce(sum(m.valor), 0)::bigint as saldo,
       x.reserva_meses
from public.caixinhas x
left join public.caixinha_movimentos m on m.caixinha_id = x.id
where not x.arquivada
group by x.id;

-- Marca (ou desmarca, com p_meses nulo) a reserva. Ao marcar, a reserva anterior volta a ser comum.
-- Reserva não tem meta manual, data nem cartão vinculado.
create function public.definir_reserva(p_caixinha_id uuid, p_meses smallint)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_meses is null then
    update public.caixinhas set reserva_meses = null where id = p_caixinha_id;
    return;
  end if;
  update public.caixinhas set reserva_meses = null
  where reserva_meses is not null and id <> p_caixinha_id;
  update public.caixinhas
  set reserva_meses = p_meses, meta = null, data_meta = null, cartao_id = null
  where id = p_caixinha_id;
end $$;

-- ───────────── Transferência entre contas ─────────────
-- Os dois lados de uma vez; não conta como gasto nem como receita.
create function public.transferir_entre_contas(
  p_origem uuid,
  p_destino uuid,
  p_valor bigint,
  p_data date,
  p_descricao text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_origem text;
  v_destino text;
  v_transferencia uuid;
begin
  if p_origem = p_destino then
    raise exception 'Escolha contas diferentes' using errcode = '22023';
  end if;
  if p_valor <= 0 then
    raise exception 'O valor precisa ser maior que zero' using errcode = '22023';
  end if;
  select nome into v_origem from public.contas where id = p_origem;
  select nome into v_destino from public.contas where id = p_destino;
  if v_origem is null or v_destino is null then
    raise exception 'Conta não encontrada' using errcode = 'P0002';
  end if;

  insert into public.transferencias (tipo, data, valor) values ('entre_contas', p_data, p_valor)
  returning id into v_transferencia;

  insert into public.movimentos (conta_id, data, descricao, valor, tipo, transferencia_id) values
    (p_origem, p_data, coalesce(nullif(trim(p_descricao), ''), 'Transferência para ' || v_destino), -p_valor, 'transferencia', v_transferencia),
    (p_destino, p_data, coalesce(nullif(trim(p_descricao), ''), 'Transferência da ' || v_origem), p_valor, 'transferencia', v_transferencia);

  return v_transferencia;
end $$;

-- Desfaz uma transferência entre contas (os dois movimentos saem em cascata).
create function public.desfazer_transferencia(p_transferencia_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.transferencias where id = p_transferencia_id and tipo = 'entre_contas';
  if not found then
    raise exception 'Só transferências entre contas podem ser desfeitas aqui' using errcode = 'P0001';
  end if;
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.definir_reserva(uuid, smallint)',
    'public.transferir_entre_contas(uuid, uuid, bigint, date, text)',
    'public.desfazer_transferencia(uuid)'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
