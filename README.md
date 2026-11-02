# Finanças

Sistema pessoal de finanças, mobile first, focado em cartão de crédito.

## Estrutura

```
apps/web/                 PWA em Next.js 16 (App Router), deploy na Vercel
  src/app/                rotas: (auth), (app), manifest
  src/componentes/        navegação (AppShell, BottomNav, MenuPrincipal)
  src/lib/supabase/       clientes do navegador, do servidor e do proxy
  src/stores/             Zustand (só estado de interface)
  src/services/, hooks/   acesso a dados (entram com as telas)
packages/core/            regras de negócio puras + schemas Zod, com testes
packages/ui/              tokens, tema MUI e componentes base, com testes
supabase/migrations/      banco versionado (Postgres + RLS)
```

## Começando

Requisitos: Node 22 e pnpm 9 (`corepack enable` instala o pnpm).

```bash
pnpm install
pnpm test         # core + ui
pnpm typecheck
pnpm dev          # http://localhost:3000
```

## Banco de dados (Supabase)

1. Crie um projeto em supabase.com.
2. Em **Authentication → Sign In / Providers**, desative "Allow new users to sign up"
   (o app é de um usuário só) e crie seu usuário em **Authentication → Users**.
3. Aplique as migrações:
   ```bash
   npx supabase link --project-ref SEU-PROJETO
   npx supabase db push --remote
   ```
   Ao criar o usuário, um gatilho cadastra as categorias padrão.
4. Copie `apps/web/.env.example` para `apps/web/.env.local` e preencha.

## Deploy

**Vercel:** importe o repositório, defina **Root Directory** como `apps/web` e
cadastre `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

**Tarefa diária (Vercel Cron):** o arquivo `apps/web/vercel.json` agenda `/api/cron/diario`
todo dia às 7h (Brasília). Ela busca o CDI no Banco Central e lança o rendimento estimado
das caixinhas com % do CDI. Cadastre na Vercel, **sem** o prefixo `NEXT_PUBLIC_`:
`SUPABASE_SECRET_KEY` (chave secreta do Supabase) e `CRON_SECRET` (texto aleatório longo).

**Aplicar entregas:** descompacte sempre pelo Terminal, dentro da pasta do projeto:
`unzip -o ~/Downloads/ARQUIVO.zip -d .` (o Finder substitui pastas inteiras e apaga arquivos).

**Migrações automáticas:** o workflow `migracoes.yml` roda `supabase db push --remote --yes` a
cada push na `main` que altere `supabase/migrations`. Cadastre no GitHub os
secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` e `SUPABASE_PROJECT_REF`.
Também dá para rodar à mão pelo botão "Run workflow" na aba Actions.

**iPhone:** abra o endereço no Safari → Compartilhar → "Adicionar à Tela de Início".
O login por e-mail e senha funciona com o preenchimento automático do iCloud
(Face ID), sem precisar de passkey.

## Regras de negócio (resumo)

- Dinheiro em **centavos inteiros**; datas como texto `AAAA-MM-DD`.
- A fatura é identificada pelo mês do vencimento e guarda fechamento, vencimento e
  status (`estimada` ou `confirmada`).
- **A compra feita no dia do fechamento entra na fatura que fecha naquele dia.**
- Compra e parcelas são gravadas juntas pela função `registrar_compra` (tudo ou nada).
- "Melhor cartão para hoje" é o que dá mais prazo até o vencimento.
- Fechamento por dias úteis considera feriados nacionais, Carnaval e Corpus Christi.
- Corrigir a data de uma fatura move só as compras afetadas (`planejarRealocacao`).
- Parcelas antigas ficam como histórico: fora de orçamento, limite e relatórios.
- No orçamento, cada parcela conta no mês da fatura em que cai. Alertas em 80% e 100%.
- Pagamento de fatura e depósito em caixinha são **transferências**, não gastos.
- % do CDI da caixinha é opcional; o saldo informado do banco sempre prevalece.

## Ordem das telas

1. Configurar cartão
2. Novo gasto
3. Cartões e faturas
4. Início
5. Parcelamento em andamento
6. Onboarding
7. Contas e saldo
8. Caixinhas e investimentos

Pendências de infraestrutura: service worker com Serwist e notificações push
(entram junto com os lembretes) e, na tarefa diária, a renovação das faturas
futuras e os alertas de fechamento.
