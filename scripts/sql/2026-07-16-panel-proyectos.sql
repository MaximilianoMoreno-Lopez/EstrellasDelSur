-- Panel de trabajo, mejora 2: asignación múltiple y proyectos.
-- Ejecutar en Supabase DESPUÉS de 2026-07-16-panel-equipo.sql.
--
--   - proyectos_panel: agrupador de tareas (p.ej. NEST, RELIT, Web).
--     Cualquier miembro crea y edita; solo admins borran. El nombre es
--     único sin distinguir mayúsculas para evitar duplicados por typo.
--   - tareas.asignados: pasa de una persona (asignado_a) a varias
--     (array de emails). Se migran los datos y se elimina la columna vieja.

create table if not exists public.proyectos_panel (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists proyectos_panel_nombre_unico
  on public.proyectos_panel (lower(nombre));

alter table public.proyectos_panel enable row level security;

drop policy if exists proyectos_select on public.proyectos_panel;
create policy proyectos_select on public.proyectos_panel for select
  to authenticated using (public.es_miembro_equipo());

drop policy if exists proyectos_insert on public.proyectos_panel;
create policy proyectos_insert on public.proyectos_panel for insert
  to authenticated with check (public.es_miembro_equipo());

drop policy if exists proyectos_update on public.proyectos_panel;
create policy proyectos_update on public.proyectos_panel for update
  to authenticated
  using (public.es_miembro_equipo())
  with check (public.es_miembro_equipo());

drop policy if exists proyectos_delete on public.proyectos_panel;
create policy proyectos_delete on public.proyectos_panel for delete
  to authenticated using (public.es_admin_equipo());

alter table public.tareas
  add column if not exists asignados text[] not null default '{}',
  add column if not exists proyecto_id uuid references public.proyectos_panel(id) on delete set null;

-- Migra las asignaciones existentes al array y retira la columna antigua
update public.tareas
  set asignados = array[asignado_a]
  where asignado_a is not null and asignados = '{}';

alter table public.tareas drop column if exists asignado_a;
