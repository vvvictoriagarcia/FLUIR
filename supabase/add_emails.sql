-- ─────────────────────────────────────────────────────────────────
-- FLUIR — Emails y engagement (aditivo: no rompe nada de lo que ya hay)
--
-- Correr en Supabase → SQL Editor. Es idempotente: se puede correr de nuevo.
--
-- Para qué: hoy el mail de la persona vive solo en `auth.users`, que no se
-- puede consultar desde el cliente ni cruzar con sus datos. Copiándolo a
-- `profiles` podemos armar campañas ("hace 12 días que no cargás gastos",
-- "cerrá tu mes", "tu resumen de julio") cruzando plan + actividad + consentimiento.
-- ─────────────────────────────────────────────────────────────────

-- 1) Columnas nuevas en profiles ───────────────────────────────────
alter table profiles add column if not exists email text;
-- Consentimiento explícito para mails que NO son transaccionales (Ley 25.326).
alter table profiles add column if not exists marketing_opt_in boolean not null default false;
-- Avisos del producto (resumen mensual, recordatorio de cierre).
alter table profiles add column if not exists product_emails boolean not null default true;
-- Última vez que abrió la app: sin esto no se puede segmentar por inactividad.
alter table profiles add column if not exists last_seen_at timestamptz;
-- Para el link de "darse de baja" sin tener que iniciar sesión.
alter table profiles add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

create index if not exists profiles_email_idx on profiles (email);
create index if not exists profiles_last_seen_idx on profiles (last_seen_at);

-- 2) Backfill de los que ya existen ────────────────────────────────
update profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is distinct from u.email;

-- 3) Que los nuevos usuarios ya traigan el mail ────────────────────
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
  insert into public.profiles (id, full_name, plan, email)
  values (new.id, v_name, 'free', new.email);
  insert into public.onboarding_answers (user_id) values (new.id);
  return new;
end;
$$;

-- 4) Si cambia el mail en auth, que se refleje ─────────────────────
create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.sync_profile_email();

-- Nota: la política RLS "own profile" ya existente cubre estas columnas
-- (cada usuario ve y edita solo su fila). Las campañas se mandan desde el
-- servidor con la service_role key, que saltea RLS.
