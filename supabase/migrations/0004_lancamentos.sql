-- Lançamentos de fatura já "achatados" (parcela + compra + categoria + fatura),
-- para as telas consultarem numa única leitura. Parcelas históricas não têm
-- fatura e ficam de fora automaticamente.
create view public.lancamentos with (security_invoker = true) as
select
  p.id,
  p.user_id,
  p.compra_id,
  p.fatura_id,
  p.numero,
  p.valor,
  p.conferida,
  f.mes,
  f.cartao_id,
  c.descricao,
  c.data_compra,
  c.total_parcelas,
  c.origem,
  c.categoria_id,
  cat.nome as categoria_nome
from public.parcelas p
join public.faturas f on f.id = p.fatura_id
join public.compras c on c.id = p.compra_id
left join public.categorias cat on cat.id = c.categoria_id;
