-- Redacción de solicitudes, mejora 3: personas responsables de cada borrador.
-- Ejecutar en Supabase DESPUÉS de 2026-11-12-redaccion-comentarios-versiones.sql.
--
-- Va en su propia tabla y no en borradores: asignar a alguien desde la lista
-- no debe cambiar el updated_at del borrador, porque eso provocaría un
-- conflicto de guardado a quien lo esté escribiendo en ese momento.
-- Cualquier miembro del equipo ve, asigna y desasigna. Solo se puede asignar
-- a personas de la tabla equipo. Aditivo: no toca ninguna tabla existente.

create table if not exists public.borrador_responsables (
  borrador_id uuid not null references public.borradores(id) on delete cascade,
  email text not null,
  asignado_por text,
  created_at timestamptz not null default now(),
  primary key (borrador_id, email)
);

alter table public.borrador_responsables enable row level security;

create or replace function public.borrador_responsables_fija()
returns trigger language plpgsql security definer
set search_path = public as
$$
begin
  new.email := lower(btrim(new.email));
  new.asignado_por := lower(coalesce(auth.jwt() ->> 'email', ''));
  new.created_at := now();
  if not exists (select 1 from public.equipo where email = new.email) then
    raise exception 'Solo se puede asignar a personas del equipo';
  end if;
  return new;
end;
$$;

drop trigger if exists borrador_responsables_autoria on public.borrador_responsables;
create trigger borrador_responsables_autoria
  before insert on public.borrador_responsables
  for each row execute function public.borrador_responsables_fija();

drop policy if exists borrador_responsables_select on public.borrador_responsables;
create policy borrador_responsables_select on public.borrador_responsables for select
  to authenticated using (public.es_miembro_equipo());

drop policy if exists borrador_responsables_insert on public.borrador_responsables;
create policy borrador_responsables_insert on public.borrador_responsables for insert
  to authenticated with check (public.es_miembro_equipo());

drop policy if exists borrador_responsables_delete on public.borrador_responsables;
create policy borrador_responsables_delete on public.borrador_responsables for delete
  to authenticated using (public.es_miembro_equipo());
