-- ─────────────────────────────────────────────────────────────────
-- FLUIR INVERTÍ — Tenencias de la cartera (tier Gold)
--
-- Correr en Supabase → SQL Editor. Idempotente.
--
-- La persona carga qué tiene (a mano o con una foto de la pantalla del broker)
-- y Fluir le muestra cuánto vale hoy y cuánto ganó o perdió. No conectamos con
-- ningún broker: los precios salen de fuentes públicas del mercado argentino.
-- ─────────────────────────────────────────────────────────────────

create table if not exists holdings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  ticker      text not null,                  -- "AAPL", "GGAL", "AL30"
  name        text,                           -- "Apple", nombre lindo opcional
  -- cedear | accion | bono | fci | plazo_fijo | cripto | otro
  kind        text not null default 'cedear',
  quantity    numeric(18,4) not null check (quantity > 0),
  avg_price   numeric(18,4) not null check (avg_price >= 0), -- precio promedio de compra, en pesos
  created_at  timestamptz default now()
);

create index if not exists holdings_user_idx on holdings (user_id);

alter table holdings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'holdings' and policyname = 'own holdings'
  ) then
    create policy "own holdings" on holdings
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end
$$;
