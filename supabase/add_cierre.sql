-- ─────────────────────────────────────────────────────────────────
-- FLUIR INVERTÍ — Cerrar posiciones (vender) y ganancia realizada
--
-- Correr en Supabase → SQL Editor. Idempotente.
--
-- Cuando vendés una tenencia, no la borramos: la marcamos como "cerrada" con el
-- precio y la fecha de venta. Así se puede contar la ganancia REALIZADA (la
-- plata que efectivamente hiciste), separada de la ganancia en papel de lo que
-- todavía tenés. `loadHoldings` sigue devolviendo solo las activas.
-- ─────────────────────────────────────────────────────────────────

-- activa | cerrada
alter table holdings add column if not exists status text not null default 'activa';
-- Precio al que vendiste (por unidad, en pesos). null mientras esté activa.
alter table holdings add column if not exists sell_price numeric(18,4);
alter table holdings add column if not exists sold_at timestamptz;

create index if not exists holdings_status_idx on holdings (user_id, status);
