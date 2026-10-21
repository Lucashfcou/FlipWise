-- Flipwise: esquema do Supabase (contas, planos, uso diário e dados sincronizados).
-- Como aplicar: Supabase > SQL Editor > New query > cola tudo isto > Run. Pode correr mais de uma vez.
-- Segurança: todas as tabelas têm Row Level Security. Cada utilizador só lê as suas linhas; quem escreve o plano e o
-- uso é o servidor (chave "service role", só na Vercel). A app no navegador nunca recebe essa chave.

-- ---------------------------------------------------------------------------------------------------------------
-- Perfil e plano
-- ---------------------------------------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'trial' check (plan in ('free', 'trial', 'pro')),
  trial_ends_at timestamptz,
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: ler o próprio" on public.profiles;
create policy "profiles: ler o próprio" on public.profiles for select to authenticated using (id = auth.uid());
-- Sem política de insert/update/delete para utilizadores: só o servidor (service role) altera o plano.

-- Ao criar a conta, nasce o perfil com 1 semana de teste do plano Pro.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, plan, trial_ends_at)
  values (new.id, 'trial', now() + interval '7 days')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Contas que já existiam antes deste esquema também recebem perfil (com teste de 1 semana a contar de agora).
insert into public.profiles (id, plan, trial_ends_at)
select id, 'trial', now() + interval '7 days' from auth.users
on conflict (id) do nothing;

-- Plano efetivo: o teste que acabou conta como grátis.
create or replace function public.effective_plan(p public.profiles)
returns text
language sql
stable
as $$
  select case when p.plan = 'trial' and (p.trial_ends_at is null or p.trial_ends_at < now()) then 'free' else p.plan end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- Limites por plano (ajustáveis sem mexer no código)
-- ---------------------------------------------------------------------------------------------------------------
create table if not exists public.plan_limits (
  plan text primary key check (plan in ('free', 'trial', 'pro')),
  reads_per_day int not null,   -- leituras de print
  smart_per_day int not null,   -- leituras com o modelo forte (Sonnet)
  lookups_per_day int not null  -- buscas no eBay fora do catálogo
);

insert into public.plan_limits (plan, reads_per_day, smart_per_day, lookups_per_day) values
  ('free', 0, 0, 0),
  ('trial', 10, 3, 40),
  ('pro', 10, 3, 40)
on conflict (plan) do nothing;

alter table public.plan_limits enable row level security;
drop policy if exists "plan_limits: leitura aberta" on public.plan_limits;
create policy "plan_limits: leitura aberta" on public.plan_limits for select to authenticated using (true);

-- ---------------------------------------------------------------------------------------------------------------
-- Uso diário
-- ---------------------------------------------------------------------------------------------------------------
create table if not exists public.usage_daily (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default (now() at time zone 'utc')::date,
  reads int not null default 0,
  smart int not null default 0,
  lookups int not null default 0,
  primary key (user_id, day)
);

alter table public.usage_daily enable row level security;
drop policy if exists "usage_daily: ler o próprio" on public.usage_daily;
create policy "usage_daily: ler o próprio" on public.usage_daily for select to authenticated using (user_id = auth.uid());

-- Consome uma unidade de forma atómica: soma só se ainda estiver abaixo do limite do plano. Devolve true se consumiu.
-- p_kind: 'read' | 'smart' | 'lookup'. Só o servidor (service role) a pode chamar.
create or replace function public.consume_usage(p_user uuid, p_kind text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  prof public.profiles;
  lim public.plan_limits;
  cap int;
  cur int;
  today date := (now() at time zone 'utc')::date;
begin
  if p_kind not in ('read', 'smart', 'lookup') then
    raise exception 'tipo inválido';
  end if;
  select * into prof from public.profiles where id = p_user;
  if not found then
    return false;
  end if;
  select * into lim from public.plan_limits where plan = public.effective_plan(prof);
  cap := coalesce(case p_kind when 'read' then lim.reads_per_day when 'smart' then lim.smart_per_day else lim.lookups_per_day end, 0);
  insert into public.usage_daily (user_id, day) values (p_user, today) on conflict (user_id, day) do nothing;
  -- bloqueia a linha do dia para duas chamadas ao mesmo tempo não passarem o limite
  select case p_kind when 'read' then reads when 'smart' then smart else lookups end into cur
    from public.usage_daily where user_id = p_user and day = today for update;
  if cur >= cap then
    return false;
  end if;
  update public.usage_daily
     set reads = reads + (p_kind = 'read')::int,
         smart = smart + (p_kind = 'smart')::int,
         lookups = lookups + (p_kind = 'lookup')::int
   where user_id = p_user and day = today;
  return true;
end;
$$;

-- Devolve uma unidade (quando a chamada à IA falhou e não deve contar).
create or replace function public.refund_usage(p_user uuid, p_kind text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.usage_daily
     set reads = greatest(0, reads - (p_kind = 'read')::int),
         smart = greatest(0, smart - (p_kind = 'smart')::int),
         lookups = greatest(0, lookups - (p_kind = 'lookup')::int)
   where user_id = p_user and day = (now() at time zone 'utc')::date;
$$;

revoke all on function public.consume_usage(uuid, text) from public, anon, authenticated;
revoke all on function public.refund_usage(uuid, text) from public, anon, authenticated;
grant execute on function public.consume_usage(uuid, text) to service_role;
grant execute on function public.refund_usage(uuid, text) to service_role;

-- ---------------------------------------------------------------------------------------------------------------
-- Dados sincronizados entre aparelhos (estoque, vendas, ajustes): um bloco JSON por tipo e utilizador
-- ---------------------------------------------------------------------------------------------------------------
create table if not exists public.user_data (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('stock', 'observations', 'settings')),
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind)
);

alter table public.user_data enable row level security;
drop policy if exists "user_data: ler o próprio" on public.user_data;
create policy "user_data: ler o próprio" on public.user_data for select to authenticated using (user_id = auth.uid());
drop policy if exists "user_data: criar o próprio" on public.user_data;
create policy "user_data: criar o próprio" on public.user_data for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "user_data: atualizar o próprio" on public.user_data;
create policy "user_data: atualizar o próprio" on public.user_data for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "user_data: apagar o próprio" on public.user_data;
create policy "user_data: apagar o próprio" on public.user_data for delete to authenticated using (user_id = auth.uid());
-- Limite de tamanho por bloco (2 MB), para ninguém usar a tabela como armazenamento livre.
alter table public.user_data drop constraint if exists user_data_size;
alter table public.user_data add constraint user_data_size check (octet_length(value::text) < 2000000);
