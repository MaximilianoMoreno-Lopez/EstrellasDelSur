-- Panel de trabajo, mejora 3: subtareas.
-- Ejecutar en Supabase DESPUES de las dos migraciones anteriores.
--
-- Cada tarea puede tener una checklist de subtareas, cada una con su
-- propia gente asignada y su estado hecho/no hecho. Cualquier miembro
-- del equipo crea, edita, marca y borra subtareas (es granularidad de
-- checklist; el borrado de la TAREA sigue siendo solo de admins y
-- arrastra sus subtareas por el on delete cascade).

create table if not exists public.subtareas (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid not null references public.tareas(id) on delete cascade,
  titulo text not null,
  asignados text[] not null default '{}',
  hecha boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists subtareas_tarea_idx on public.subtareas (tarea_id);

alter table public.subtareas enable row level security;

drop policy if exists subtareas_select on public.subtareas;
create policy subtareas_select on public.subtareas for select
  to authenticated using (public.es_miembro_equipo());

drop policy if exists subtareas_insert on public.subtareas;
create policy subtareas_insert on public.subtareas for insert
  to authenticated with check (public.es_miembro_equipo());

drop policy if exists subtareas_update on public.subtareas;
create policy subtareas_update on public.subtareas for update
  to authenticated
  using (public.es_miembro_equipo())
  with check (public.es_miembro_equipo());

drop policy if exists subtareas_delete on public.subtareas;
create policy subtareas_delete on public.subtareas for delete
  to authenticated using (public.es_miembro_equipo());
