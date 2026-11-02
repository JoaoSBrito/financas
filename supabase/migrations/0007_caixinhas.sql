-- Até que dia o rendimento estimado pelo CDI já foi lançado (usado pela tarefa diária).
alter table public.caixinhas add column rendimento_calculado_ate date;

-- Cria a caixinha com o saldo que ela já tem (entra como depósito, não como rendimento).
create function public.criar_caixinha(
  p_nome text,
  p_meta bigint,
  p_data_meta date,
  p_cartao_id uuid,
  p_percentual_cdi numeric,
  p_saldo bigint,
  p_data date
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_caixinha uuid;
begin
  insert into public.caixinhas (nome, meta, data_meta, cartao_id, percentual_cdi, rendimento_calculado_ate)
  values (p_nome, p_meta, p_data_meta, p_cartao_id, p_percentual_cdi, p_data)
  returning id into v_caixinha;
  if p_saldo > 0 then
    insert into public.caixinha_movimentos (caixinha_id, data, valor, tipo) values (v_caixinha, p_data, p_saldo, 'deposito');
  end if;
  return v_caixinha;
end $$;

-- Guardar (conta → caixinha) ou resgatar (caixinha → conta). É transferência: não é gasto nem receita.
create function public.movimentar_caixinha(
  p_caixinha_id uuid,
  p_conta_id uuid,
  p_tipo text,
  p_valor bigint,
  p_data date
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_nome text;
  v_transferencia uuid;
  v_sinal integer := case when p_tipo = 'deposito' then 1 else -1 end;
begin
  if p_tipo not in ('deposito', 'resgate') then
    raise exception 'Tipo inválido' using errcode = '22023';
  end if;
  if p_valor <= 0 then
    raise exception 'O valor precisa ser maior que zero' using errcode = '22023';
  end if;
  select nome into v_nome from public.caixinhas where id = p_caixinha_id;
  if v_nome is null then
    raise exception 'Caixinha não encontrada' using errcode = 'P0002';
  end if;

  insert into public.transferencias (tipo, data, valor)
  values (case when p_tipo = 'deposito' then 'deposito_caixinha' else 'resgate_caixinha' end, p_data, p_valor)
  returning id into v_transferencia;

  insert into public.caixinha_movimentos (caixinha_id, data, valor, tipo, transferencia_id)
  values (p_caixinha_id, p_data, v_sinal * p_valor, p_tipo, v_transferencia);

  insert into public.movimentos (conta_id, data, descricao, valor, tipo, transferencia_id)
  values (
    p_conta_id, p_data,
    case when p_tipo = 'deposito' then 'Guardado em ' else 'Resgate de ' end || v_nome,
    -v_sinal * p_valor, 'transferencia', v_transferencia
  );
end $$;

-- Atualização manual: o saldo do banco prevalece; a diferença vira ajuste (rendimento real).
create function public.atualizar_saldo_caixinha(p_caixinha_id uuid, p_saldo_real bigint, p_data date)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_atual bigint;
  v_diferenca bigint;
begin
  select coalesce(sum(valor), 0) into v_atual from public.caixinha_movimentos where caixinha_id = p_caixinha_id;
  v_diferenca := p_saldo_real - v_atual;
  if v_diferenca <> 0 then
    insert into public.caixinha_movimentos (caixinha_id, data, valor, tipo) values (p_caixinha_id, p_data, v_diferenca, 'ajuste');
  end if;
  update public.caixinhas set rendimento_calculado_ate = greatest(coalesce(rendimento_calculado_ate, p_data), p_data)
  where id = p_caixinha_id;
  return v_diferenca;
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.criar_caixinha(text, bigint, date, uuid, numeric, bigint, date)',
    'public.movimentar_caixinha(uuid, uuid, text, bigint, date)',
    'public.atualizar_saldo_caixinha(uuid, bigint, date)'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
