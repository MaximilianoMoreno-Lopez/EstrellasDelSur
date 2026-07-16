-- Panel de trabajo del equipo (/equipo/): tablas de miembros y tareas.
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query > pegar y Run.
--
-- Modelo de acceso:
--   - equipo: quién puede entrar al panel. rol 'admin' (Maxi, Pablo, Paula)
--     o 'becario'. Los admins gestionan la lista (añadir becarios desde el
--     Table Editor de Supabase o por SQL; SIEMPRE con el email en minúsculas,
--     el check lo exige).
--   - tareas: cualquier miembro las ve, crea y edita (mover de columna,
--     reasignar); solo los admins borran. La autoría (creado_por) y las
--     fechas las fija un trigger en servidor, el cliente no puede falsearlas.
--
-- Notas de seguridad (revisión 2026-07-16):
--   - Las funciones de membresía no aceptan parámetros (leen el JWT), están
--     revocadas para anon/public y solo son ejecutables por authenticated:
--     así no sirven de oráculo para enumerar miembros.
--   - Todas las políticas llevan TO authenticated.
--   - No se siembra admin@estrellasdelsur.eu: solo cuentas con usuario real
--     en Auth. Si algún día se crea ese usuario, añadidlo a mano.
--   - Mantened activada la confirmación de email en Auth (la autorización
--     se basa en la claim email del JWT).

create table if not exists public.equipo (
  email text primary key check (email = lower(email)),
  nombre text not null,
  rol text not null default 'becario' check (rol in ('admin', 'becario')),
  created_at timestamptz not null default now()
);

create table if not exists public.tareas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  asignado_a text references public.equipo(email) on update cascade on delete set null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_curso', 'hecha')),
  prioridad text not null default 'media' check (prioridad in ('alta', 'media', 'baja')),
  fecha_limite date,
  area text,
  creado_por text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.equipo enable row level security;
alter table public.tareas enable row level security;

-- Funciones de membresía: SECURITY DEFINER (evita la recursión de RLS al
-- consultar equipo desde sus propias políticas), sin parámetros (solo puedes
-- preguntar por ti mismo) y ejecutables únicamente por authenticated.
create or replace function public.es_miembro_equipo()
returns boolean language sql security definer stable
set search_path = public as
$$ select exists (
     select 1 from public.equipo
     where email = lower(coalesce(auth.jwt() ->> 'email', ''))
   ); $$;

create or replace function public.es_admin_equipo()
returns boolean language sql security definer stable
set search_path = public as
$$ select exists (
     select 1 from public.equipo
     where email = lower(coalesce(auth.jwt() ->> 'email', ''))
       and rol = 'admin'
   ); $$;

revoke execute on function public.es_miembro_equipo() from public, anon;
revoke execute on function public.es_admin_equipo() from public, anon;
grant execute on function public.es_miembro_equipo() to authenticated;
grant execute on function public.es_admin_equipo() to authenticated;

-- Trigger: la autoría y las fechas las fija el servidor.
create or replace function public.tareas_fija_autoria()
returns trigger language plpgsql security definer
set search_path = public as
$$
begin
  if tg_op = 'INSERT' then
    new.creado_por := lower(coalesce(auth.jwt() ->> 'email', ''));
    new.created_at := now();
  else
    new.creado_por := old.creado_por;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tareas_autoria on public.tareas;
create trigger tareas_autoria
  before insert or update on public.tareas
  for each row execute function public.tareas_fija_autoria();

-- equipo: los miembros ven la lista; solo los admins la modifican
drop policy if exists equipo_select on public.equipo;
create policy equipo_select on public.equipo for select
  to authenticated using (public.es_miembro_equipo());

drop policy if exists equipo_insert on public.equipo;
create policy equipo_insert on public.equipo for insert
  to authenticated with check (public.es_admin_equipo());

drop policy if exists equipo_update on public.equipo;
create policy equipo_update on public.equipo for update
  to authenticated
  using (public.es_admin_equipo())
  with check (public.es_admin_equipo());

drop policy if exists equipo_delete on public.equipo;
create policy equipo_delete on public.equipo for delete
  to authenticated using (public.es_admin_equipo());

-- tareas: cualquier miembro ve, crea y edita; solo los admins borran
drop policy if exists tareas_select on public.tareas;
create policy tareas_select on public.tareas for select
  to authenticated using (public.es_miembro_equipo());

drop policy if exists tareas_insert on public.tareas;
create policy tareas_insert on public.tareas for insert
  to authenticated with check (public.es_miembro_equipo());

drop policy if exists tareas_update on public.tareas;
create policy tareas_update on public.tareas for update
  to authenticated
  using (public.es_miembro_equipo())
  with check (public.es_miembro_equipo());

drop policy if exists tareas_delete on public.tareas;
create policy tareas_delete on public.tareas for delete
  to authenticated using (public.es_admin_equipo());

-- Miembros iniciales (solo cuentas reales de Auth, en minúsculas)
insert into public.equipo (email, nombre, rol) values
  ('maxi@estrellasdelsur.eu',  'Maxi',  'admin'),
  ('pablo@estrellasdelsur.eu', 'Pablo', 'admin'),
  ('paula@estrellasdelsur.eu', 'Paula', 'admin')
on conflict (email) do nothing;
