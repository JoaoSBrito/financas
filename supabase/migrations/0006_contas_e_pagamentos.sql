-- Operações de conta que precisam ser atômicas.

-- Cria a conta já com o saldo de hoje (lançado como "saldo_inicial").
create function public.criar_conta(p_nome text, p_tipo text, p_saldo bigint)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_conta uuid;
begin
  insert into public.contas (nome, tipo, conferida_em) values (p_nome, p_tipo, current_date)
  returning id into v_conta;
  if p_saldo <> 0 then
    insert into public.movimentos (conta_id, data, descricao, valor, tipo)
    values (v_conta, current_date, 'Saldo inicial', p_saldo, 'saldo_inicial');
  end if;
  return v_conta;
end $$;

-- Informa o saldo real do banco: lança a diferença como ajuste e marca a conta como conferida.
create function public.ajustar_saldo(p_conta_id uuid, p_saldo_real bigint, p_data date)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_atual bigint;
  v_diferenca bigint;
begin
  select coalesce(sum(valor), 0) into v_atual
  from public.movimentos where conta_id = p_conta_id and data <= p_data;

  v_diferenca := p_saldo_real - v_atual;
  if v_diferenca <> 0 then
    insert into public.movimentos (conta_id, data, descricao, valor, tipo)
    values (p_conta_id, p_data, 'Ajuste de saldo', v_diferenca, 'ajuste');
  end if;
  update public.contas set conferida_em = p_data where id = p_conta_id;
  return v_diferenca;
end $$;

-- Paga a fatura com uma conta: transferência conta → cartão (não é gasto) + fatura marcada como paga.
create function public.pagar_fatura(p_fatura_id uuid, p_conta_id uuid, p_data date)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_total bigint;
  v_paga date;
  v_rotulo text;
  v_transferencia uuid;
begin
  select f.paga_em,
         coalesce((select sum(p.valor) from public.parcelas p where p.fatura_id = f.id and not p.historico), 0),
         'Fatura ' || c.nome || ' ' || to_char(f.mes, 'MM/YYYY')
    into v_paga, v_total, v_rotulo
  from public.faturas f
  join public.cartoes c on c.id = f.cartao_id
  where f.id = p_fatura_id;

  if not found then
    raise exception 'Fatura não encontrada' using errcode = 'P0002';
  end if;
  if v_paga is not null then
    raise exception 'Esta fatura já está marcada como paga' using errcode = 'P0001';
  end if;

  if v_total > 0 and p_conta_id is not null then
    insert into public.transferencias (tipo, data, valor) values ('pagamento_fatura', p_data, v_total)
    returning id into v_transferencia;
    insert into public.movimentos (conta_id, data, descricao, valor, tipo, transferencia_id, fatura_id)
    values (p_conta_id, p_data, v_rotulo, -v_total, 'transferencia', v_transferencia, p_fatura_id);
  end if;

  update public.faturas set paga_em = p_data where id = p_fatura_id;
end $$;

-- Desfaz o pagamento: remove a transferência (e o movimento, em cascata).
create function public.desfazer_pagamento_fatura(p_fatura_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.transferencias t
  using public.movimentos m
  where m.transferencia_id = t.id and m.fatura_id = p_fatura_id and m.tipo = 'transferencia';
  update public.faturas set paga_em = null where id = p_fatura_id;
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.criar_conta(text, text, bigint)',
    'public.ajustar_saldo(uuid, bigint, date)',
    'public.pagar_fatura(uuid, uuid, date)',
    'public.desfazer_pagamento_fatura(uuid)'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
