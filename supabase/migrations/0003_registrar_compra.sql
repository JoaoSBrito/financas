-- Parcelas históricas (pagas antes de usar o app) não precisam de fatura:
-- guardam só o mês, para a linha do tempo do parcelamento.
alter table public.parcelas alter column fatura_id drop not null;
alter table public.parcelas add column mes_historico date
  check (mes_historico is null or extract(day from mes_historico) = 1);
alter table public.parcelas add constraint parcela_tem_fatura_ou_historico
  check (fatura_id is not null or (historico and mes_historico is not null));

-- Registra uma compra e suas parcelas numa única transação.
-- As parcelas chegam já calculadas pelo packages/core (valor e mês de cada uma).
create function public.registrar_compra(
  p_cartao_id uuid,
  p_categoria_id uuid,
  p_descricao text,
  p_data_compra date,
  p_valor_total bigint,
  p_origem text,
  p_parcelas jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_compra uuid;
  v_total_parcelas integer := jsonb_array_length(p_parcelas);
  v_soma bigint;
  v_inseridas integer;
begin
  select coalesce(sum((x ->> 'valor')::bigint), 0) into v_soma from jsonb_array_elements(p_parcelas) x;
  if v_soma <> p_valor_total then
    raise exception 'A soma das parcelas (%) não bate com o total (%)', v_soma, p_valor_total using errcode = '22023';
  end if;

  insert into public.compras (cartao_id, categoria_id, descricao, data_compra, valor_total, total_parcelas, origem)
  values (p_cartao_id, p_categoria_id, p_descricao, p_data_compra, p_valor_total, v_total_parcelas, p_origem)
  returning id into v_compra;

  insert into public.parcelas (compra_id, fatura_id, numero, valor, historico, mes_historico)
  select v_compra,
         case when x.historico then null else f.id end,
         x.numero,
         x.valor,
         x.historico,
         case when x.historico then x.mes end
  from jsonb_to_recordset(p_parcelas) as x(numero integer, mes date, valor bigint, historico boolean)
  left join public.faturas f on f.cartao_id = p_cartao_id and f.mes = x.mes
  where x.historico or f.id is not null;

  get diagnostics v_inseridas = row_count;
  if v_inseridas <> v_total_parcelas then
    raise exception 'Faltam faturas geradas para algumas parcelas' using errcode = 'P0001';
  end if;

  return v_compra;
end $$;

revoke execute on function public.registrar_compra(uuid, uuid, text, date, bigint, text, jsonb) from public, anon;
grant execute on function public.registrar_compra(uuid, uuid, text, date, bigint, text, jsonb) to authenticated;
