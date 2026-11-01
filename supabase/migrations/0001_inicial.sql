-- Modelo inicial do app de finanças pessoais.
-- Regras:
--   • Dinheiro sempre em BIGINT de centavos (10000 = R$ 100,00).
--   • Toda tabela do usuário tem user_id + RLS (cada um só vê o que é seu).
--   • Chaves estrangeiras compostas (id, user_id) impedem ligar registros de usuários diferentes.
--   • "mes" de fatura é sempre o dia 1 do mês do vencimento.

-- ───────────────────────── Categorias e orçamento ─────────────────────────
create table categorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  nome text not null check (char_length(nome) between 1 and 30),
  arquivada boolean not null default false,
  criado_em timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, nome)
);

-- O orçamento pode mudar com o tempo: cada linha vale a partir de um mês.
create table orcamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  categoria_id uuid not null,
  vigente_desde date not null check (extract(day from vigente_desde) = 1),
  valor bigint not null check (valor > 0),
  foreign key (categoria_id, user_id) references categorias (id, user_id) on delete cascade,
  unique (categoria_id, vigente_desde)
);

-- ───────────────────────── Contas ─────────────────────────
create table contas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  nome text not null check (char_length(nome) between 1 and 40),
  tipo text not null default 'corrente' check (tipo in ('corrente', 'carteira', 'outra')),
  conferida_em date,
  arquivada boolean not null default false,
  criado_em timestamptz not null default now(),
  unique (id, user_id)
);

-- ───────────────────────── Cartões e faturas ─────────────────────────
create table cartoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  nome text not null check (char_length(nome) between 1 and 40),
  final text check (final ~ '^[0-9]{4}$'),
  limite bigint not null check (limite > 0),
  dia_vencimento smallint not null check (dia_vencimento between 1 and 31),
  vencimento_nao_util text not null default 'proximo_dia_util'
    check (vencimento_nao_util in ('proximo_dia_util', 'mantem')),
  fechamento_tipo text not null check (fechamento_tipo in ('dia_fixo', 'dias_antes', 'manual')),
  fechamento_dia smallint check (fechamento_dia between 1 and 31),
  fechamento_dias smallint check (fechamento_dias between 1 and 20),
  fechamento_contagem text check (fechamento_contagem in ('uteis', 'corridos')),
  avisar_antes_do_fechamento boolean not null default true,
  pedir_confirmacao_mensal boolean not null default true,
  conta_pagamento_id uuid,
  arquivado boolean not null default false,
  criado_em timestamptz not null default now(),
  unique (id, user_id),
  foreign key (conta_pagamento_id, user_id) references contas (id, user_id) on delete set null (conta_pagamento_id),
  check (
    (fechamento_tipo = 'dia_fixo' and fechamento_dia is not null) or
    (fechamento_tipo = 'dias_antes' and fechamento_dias is not null and fechamento_contagem is not null) or
    (fechamento_tipo = 'manual')
  )
);

create table faturas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  cartao_id uuid not null,
  mes date not null check (extract(day from mes) = 1),
  fechamento date not null,
  vencimento date not null,
  status text not null default 'estimada' check (status in ('estimada', 'confirmada')),
  paga_em date,
  unique (id, user_id),
  unique (cartao_id, mes),
  foreign key (cartao_id, user_id) references cartoes (id, user_id) on delete cascade,
  check (fechamento < vencimento)
);

-- ───────────────────────── Compras e parcelas ─────────────────────────
create table compras (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  cartao_id uuid not null,
  categoria_id uuid,
  descricao text not null check (char_length(descricao) between 1 and 80),
  -- Nula para "saldo inicial" e parcelamentos antigos sem data conhecida.
  data_compra date,
  valor_total bigint not null check (valor_total > 0),
  total_parcelas smallint not null default 1 check (total_parcelas between 1 and 48),
  origem text not null default 'app'
    check (origem in ('app', 'anterior_ao_app', 'saldo_inicial', 'importada', 'recorrente')),
  -- Futuro: importação (evita duplicar) e gastos compartilhados.
  id_externo text,
  dividido_com text,
  criado_em timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, id_externo),
  foreign key (cartao_id, user_id) references cartoes (id, user_id) on delete cascade,
  foreign key (categoria_id, user_id) references categorias (id, user_id) on delete set null (categoria_id)
);

create table parcelas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  compra_id uuid not null,
  fatura_id uuid not null,
  numero smallint not null check (numero >= 1),
  valor bigint not null check (valor > 0),
  -- Parcela paga antes de usar o app: fora de orçamento, limite e relatórios.
  historico boolean not null default false,
  conferida boolean not null default false,
  unique (compra_id, numero),
  foreign key (compra_id, user_id) references compras (id, user_id) on delete cascade,
  foreign key (fatura_id, user_id) references faturas (id, user_id) on delete restrict
);

-- ───────────────────────── Caixinhas ─────────────────────────
create table caixinhas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  nome text not null check (char_length(nome) between 1 and 40),
  meta bigint check (meta > 0),
  data_meta date,
  cartao_id uuid,
  -- Opcional: sem valor, o saldo só muda com depósitos, resgates e atualizações manuais.
  percentual_cdi numeric(6, 2) check (percentual_cdi > 0 and percentual_cdi <= 300),
  arquivada boolean not null default false,
  criado_em timestamptz not null default now(),
  unique (id, user_id),
  foreign key (cartao_id, user_id) references cartoes (id, user_id) on delete set null (cartao_id)
);

-- ───────────────────────── Movimentos, transferências e recorrências ─────────────────────────
-- Agrupa os dois lados de uma transferência (conta → caixinha, conta → fatura).
create table transferencias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  tipo text not null check (tipo in ('pagamento_fatura', 'deposito_caixinha', 'resgate_caixinha', 'entre_contas')),
  data date not null,
  valor bigint not null check (valor > 0),
  criado_em timestamptz not null default now(),
  unique (id, user_id)
);

create table recorrentes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  descricao text not null check (char_length(descricao) between 1 and 80),
  tipo text not null check (tipo in ('entrada', 'saida')),
  valor bigint not null check (valor > 0),
  dia smallint not null check (dia between 1 and 31),
  -- Na conta (salário, aluguel) OU no cartão (assinaturas).
  conta_id uuid,
  cartao_id uuid,
  categoria_id uuid,
  ativo boolean not null default true,
  unique (id, user_id),
  foreign key (conta_id, user_id) references contas (id, user_id) on delete cascade,
  foreign key (cartao_id, user_id) references cartoes (id, user_id) on delete cascade,
  foreign key (categoria_id, user_id) references categorias (id, user_id) on delete set null (categoria_id),
  check ((conta_id is null) <> (cartao_id is null)),
  check (cartao_id is null or tipo = 'saida')
);

create table movimentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  conta_id uuid not null,
  data date not null,
  descricao text not null check (char_length(descricao) between 1 and 80),
  -- Positivo entra, negativo sai.
  valor bigint not null check (valor <> 0),
  tipo text not null check (tipo in ('saldo_inicial', 'entrada', 'saida', 'transferencia', 'ajuste')),
  categoria_id uuid,
  transferencia_id uuid,
  fatura_id uuid,
  recorrente_id uuid,
  criado_em timestamptz not null default now(),
  foreign key (conta_id, user_id) references contas (id, user_id) on delete cascade,
  foreign key (categoria_id, user_id) references categorias (id, user_id) on delete set null (categoria_id),
  foreign key (transferencia_id, user_id) references transferencias (id, user_id) on delete cascade,
  foreign key (fatura_id, user_id) references faturas (id, user_id) on delete set null (fatura_id),
  foreign key (recorrente_id, user_id) references recorrentes (id, user_id) on delete set null (recorrente_id),
  check ((tipo = 'transferencia') = (transferencia_id is not null))
);

create table caixinha_movimentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  caixinha_id uuid not null,
  data date not null default current_date,
  valor bigint not null check (valor <> 0),
  tipo text not null check (tipo in ('deposito', 'resgate', 'rendimento_estimado', 'ajuste')),
  transferencia_id uuid,
  foreign key (caixinha_id, user_id) references caixinhas (id, user_id) on delete cascade,
  foreign key (transferencia_id, user_id) references transferencias (id, user_id) on delete cascade
);

-- ───────────────────────── CDI, push e alertas ─────────────────────────
-- Taxa DI diária (série SGS 12 do Banco Central), em % ao dia. Escrita só pelo cron.
create table taxas_cdi (
  data date primary key,
  taxa_dia numeric(12, 8) not null check (taxa_dia >= 0)
);

create table push_inscricoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  criado_em timestamptz not null default now()
);

-- Evita repetir o mesmo aviso (ex.: "fatura fecha amanhã", orçamento em 80%).
create table alertas_enviados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  chave text not null,
  enviado_em timestamptz not null default now(),
  unique (user_id, chave)
);

-- ───────────────────────── Índices ─────────────────────────
create index on faturas (user_id, mes);
create index on parcelas (fatura_id);
create index on parcelas (user_id, compra_id);
create index on compras (cartao_id, data_compra);
create index on movimentos (conta_id, data);
create index on caixinha_movimentos (caixinha_id, data);
create index on recorrentes (user_id) where ativo;

-- ───────────────────────── Segurança por linha ─────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'categorias', 'orcamentos', 'contas', 'cartoes', 'faturas', 'compras', 'parcelas',
    'caixinhas', 'transferencias', 'recorrentes', 'movimentos', 'caixinha_movimentos',
    'push_inscricoes', 'alertas_enviados'
  ] loop
    execute format('alter table %I enable row level security', t);
    -- (select auth.uid()) é avaliado uma vez por consulta, não por linha.
    execute format(
      'create policy dono on %I for all to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

alter table taxas_cdi enable row level security;
create policy leitura on taxas_cdi for select to authenticated using (true);

-- ───────────────────────── Views de apoio ─────────────────────────
create view saldo_contas with (security_invoker = true) as
select c.id, c.user_id, c.nome, c.tipo, c.conferida_em,
       coalesce(sum(m.valor) filter (where m.data <= current_date), 0)::bigint as saldo
from contas c
left join movimentos m on m.conta_id = c.id
where not c.arquivada
group by c.id;

create view saldo_caixinhas with (security_invoker = true) as
select x.id, x.user_id, x.nome, x.meta, x.data_meta, x.cartao_id, x.percentual_cdi,
       coalesce(sum(m.valor), 0)::bigint as saldo
from caixinhas x
left join caixinha_movimentos m on m.caixinha_id = x.id
where not x.arquivada
group by x.id;

-- Fatura com totais. Parcelas históricas ficam fora.
create view faturas_resumo with (security_invoker = true) as
select f.*,
       coalesce(sum(p.valor) filter (where not p.historico), 0)::bigint as total,
       count(p.id) filter (where not p.historico) as lancamentos,
       count(p.id) filter (where not p.historico and p.conferida) as conferidos
from faturas f
left join parcelas p on p.fatura_id = f.id
group by f.id;

-- ───────────────────────── Categorias padrão ─────────────────────────
create function public.criar_categorias_padrao() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.categorias (user_id, nome)
  select new.id, n from unnest(array[
    'Alimentação', 'Mercado', 'Transporte', 'Casa', 'Saúde',
    'Lazer', 'Eletrônicos', 'Assinaturas', 'Outros'
  ]) as n;
  return new;
end $$;

create trigger ao_criar_usuario
after insert on auth.users
for each row execute function public.criar_categorias_padrao();
