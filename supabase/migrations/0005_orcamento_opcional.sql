-- Permite registrar "sem orçamento a partir de tal mês" (valor nulo),
-- para remover o orçamento de uma categoria sem apagar o histórico.
alter table public.orcamentos alter column valor drop not null;
alter table public.orcamentos drop constraint orcamentos_valor_check;
alter table public.orcamentos add constraint orcamentos_valor_check check (valor is null or valor > 0);
