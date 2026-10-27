-- Redacción de solicitudes (/redaccion/): borradores de formularios Erasmus+.
-- Ejecutar en Supabase DESPUÉS de 2026-07-16-panel-equipo.sql (usa sus
-- funciones es_miembro_equipo y es_admin_equipo).
--
-- Cada borrador es una solicitud en curso de una acción (KA152, KA153, KA154,
-- KA210, KA220). Las preguntas y sus topes viven en el código
-- (src/lib/formularios/*.json); aquí solo se guardan las respuestas, en un
-- JSON con la forma { campos: {id: valor}, repetidos: {bloqueId: [{id: valor}]} }.
--
-- Modelo de acceso, igual que las tareas del panel: cualquier miembro del
-- equipo (admin o becario) ve, crea y edita todos los borradores; solo los
-- admins borran. La autoría y las fechas las fija un trigger en servidor.
-- updated_at sirve además de control de concurrencia: el cliente solo
-- guarda si nadie ha guardado después de su última lectura.

create table if not exists public.borradores (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  accion text not null check (accion in ('KA152-YOU', 'KA153-YOU', 'KA154-YOU', 'KA210-YOU', 'KA220-YTH')),
  estado text not null default 'borrador' check (estado in ('borrador', 'para_revisar', 'revisado', 'presentado')),
  respuestas jsonb not null default '{"campos":{},"repetidos":{}}'::jsonb,
  notas text,
  creado_por text,
  editado_por text,
  -- Token de la pestaña que hizo el último guardado. Permite distinguir un
  -- reintento propio (respuesta perdida por la red) de otra pestaña o
  -- dispositivo de la misma persona, que debe tratarse como conflicto.
  sesion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists borradores_updated_idx on public.borradores (updated_at desc);

alter table public.borradores enable row level security;

create or replace function public.borradores_fija_autoria()
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
  new.editado_por := lower(coalesce(auth.jwt() ->> 'email', ''));
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists borradores_autoria on public.borradores;
create trigger borradores_autoria
  before insert or update on public.borradores
  for each row execute function public.borradores_fija_autoria();

drop policy if exists borradores_select on public.borradores;
create policy borradores_select on public.borradores for select
  to authenticated using (public.es_miembro_equipo());

drop policy if exists borradores_insert on public.borradores;
create policy borradores_insert on public.borradores for insert
  to authenticated with check (public.es_miembro_equipo());

drop policy if exists borradores_update on public.borradores;
create policy borradores_update on public.borradores for update
  to authenticated
  using (public.es_miembro_equipo())
  with check (public.es_miembro_equipo());

drop policy if exists borradores_delete on public.borradores;
create policy borradores_delete on public.borradores for delete
  to authenticated using (public.es_admin_equipo());
