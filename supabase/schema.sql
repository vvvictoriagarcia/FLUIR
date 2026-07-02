-- ─────────────────────────────────────────────────────────────────
-- FLUIR — Esquema de base de datos (MVP Free)
-- Pegá TODO este archivo en: Supabase → SQL Editor → New query → Run
-- Crea las tablas, la seguridad por usuario (RLS) y el trigger que
-- arma el perfil automáticamente cuando alguien se registra.
-- ─────────────────────────────────────────────────────────────────

-- 1) Perfil — extiende auth.users (1 fila por usuario)
create table if not exists profiles (
  id                   uuid primary key references auth.users on delete cascade,
  full_name            text,
  plan                 text check (plan in ('free','plus','gold')) default 'free',
  onboarding_completed boolean default false,
  created_at           timestamptz default now()
);

-- 2) Respuestas del onboarding (1 fila por usuario)
create table if not exists onboarding_answers (
  user_id           uuid primary key references profiles(id) on delete cascade,
  income            numeric,
  pays_rent         boolean,
  has_car           boolean,
  goes_out_often    text,   -- 'poco' | 'seguido' | 'mucho'
  spends_on_clothes text,   -- 'poco' | 'moderado' | 'mucho'
  has_debt          boolean,
  updated_at        timestamptz default now()
);

-- 3) Presupuesto — un registro por mes por usuario
create table if not exists budgets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade,
  month      date,                  -- siempre el día 1: '2026-06-01'
  income     numeric,
  created_at timestamptz default now(),
  unique (user_id, month)
);

-- 4) Categorías dentro del presupuesto
create table if not exists budget_categories (
  id           uuid primary key default gen_random_uuid(),
  budget_id    uuid references budgets(id) on delete cascade,
  category     text,
  allocated    numeric,
  limit_amount numeric,             -- 'limit' es palabra reservada en SQL
  is_fixed     boolean default false
);

-- 5) Gastos registrados
create table if not exists expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade,
  budget_id   uuid references budgets(id) on delete cascade,
  category    text,
  amount      numeric,
  description text,
  date        timestamptz default now(),
  created_at  timestamptz default now()
);

-- ── Trigger: al registrarse un usuario, crear su perfil y su fila de onboarding
-- `set search_path = public` es clave: sin esto, la función security definer
-- no encuentra las tablas y el registro falla con "Database error saving new user".
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );
  insert into public.profiles (id, full_name, plan) values (new.id, v_name, 'free');
  insert into public.onboarding_answers (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Seguridad: cada usuario solo ve y edita lo suyo (RLS) ──────────
alter table profiles           enable row level security;
alter table onboarding_answers enable row level security;
alter table budgets            enable row level security;
alter table budget_categories  enable row level security;
alter table expenses           enable row level security;

create policy "own profile"   on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own answers"   on onboarding_answers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own budgets"   on budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own expenses"  on expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Las categorías se ven si el presupuesto padre es del usuario
create policy "own budget categories" on budget_categories
  for all using (
    exists (select 1 from budgets b where b.id = budget_id and b.user_id = auth.uid())
  ) with check (
    exists (select 1 from budgets b where b.id = budget_id and b.user_id = auth.uid())
  );
