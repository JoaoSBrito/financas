-- Move todas as parcelas de uma compra N meses para frente (ou para trás),
-- usado quando a data de fechamento de uma fatura é corrigida.
-- Roda com as permissões de quem chama (RLS continua valendo) e é atômica.
create function public.realocar_compra(p_compra_id uuid, p_meses integer)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_cartao uuid;
begin
  if p_meses = 0 then
    return;
  end if;

  select cartao_id into v_cartao from public.compras where id = p_compra_id;
  if v_cartao is null then
    raise exception 'Compra não encontrada' using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from public.parcelas p
    join public.faturas f on f.id = p.fatura_id
    where p.compra_id = p_compra_id
      and not exists (
        select 1 from public.faturas d
        where d.cartao_id = v_cartao
          and d.mes = (f.mes + make_interval(months => p_meses))::date
      )
  ) then
    raise exception 'Fatura de destino ainda não foi gerada' using errcode = 'P0001';
  end if;

  update public.parcelas p
  set fatura_id = d.id
  from public.faturas f, public.faturas d
  where p.compra_id = p_compra_id
    and f.id = p.fatura_id
    and d.cartao_id = v_cartao
    and d.mes = (f.mes + make_interval(months => p_meses))::date;
end $$;

revoke execute on function public.realocar_compra(uuid, integer) from public, anon;
grant execute on function public.realocar_compra(uuid, integer) to authenticated;
