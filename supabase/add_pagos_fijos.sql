-- ─────────────────────────────────────────────────────────────────
-- FLUIR — Pagos fijos con vencimiento (alquiler, tarjeta, seguro, gimnasio…)
--
-- Correr en Supabase → SQL Editor. Idempotente.
--
-- Idea: la persona carga una vez "Alquiler, $350.000, vence el 5" y Fluir le
-- avisa antes de cada vencimiento. Cuando lo marca como pagado, se crea un
-- gasto normal (así entra al presupuesto sin duplicar lógica).
-- ─────────────────────────────────────────────────────────────────

create table if not exists recurring_payments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  name         text not null,                 -- "Alquiler", "Visa Galicia"
  category     text not null,                 -- categoría de Fluir a la que imputa
  amount       numeric(14,2) not null,
  due_day      smallint not null check (due_day between 1 and 31),
  remind_days  smallint not null default 3,   -- cuántos días antes avisar
  is_active    boolean not null default true,
  created_at   timestamptz default now()
);

create index if not exists recurring_payments_user_idx on recurring_payments (user_id);

-- Vínculo del gasto con el pago fijo que lo originó: así sabemos si el mes
-- ya está pago sin inventar otra tabla.
alter table expenses add column if not exists recurring_id uuid
  references recurring_payments(id) on delete set null;

create index if not exists expenses_recurring_idx on expenses (recurring_id);

-- RLS: cada quien ve solo lo suyo (igual que el resto de las tablas).
alter table recurring_payments enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'recurring_payments' and policyname = 'own recurring'
  ) then
    create policy "own recurring" on recurring_payments
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end
$$;
