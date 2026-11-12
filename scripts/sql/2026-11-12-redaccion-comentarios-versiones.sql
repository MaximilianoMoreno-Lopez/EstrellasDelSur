-- Redacción de solicitudes, mejora 2: comentarios por pregunta desde la web
-- e historial de versiones de cada borrador.
-- Ejecutar en Supabase DESPUÉS de 2026-10-27-redaccion.sql. Sustituye a
-- 2026-10-28-comentarios.sql, que no llegó a aplicarse.
--
-- Todo es aditivo: no cambia ni borra nada de la tabla borradores. Se puede
-- ejecutar varias veces.

-- ── Comentarios ─────────────────────────────────────────────────────────
-- Un comentario va pegado a una pregunta (clave = id de la pregunta, o
-- "bloque[n].pregunta" en las fichas repetidas) y puede citar el fragmento
-- de la respuesta al que se refiere. Las respuestas a un comentario llevan
-- padre_id. Resolver no borra: el comentario queda en el historial.
-- Cualquier miembro del equipo lee, escribe y resuelve; el texto solo lo
-- cambia quien lo escribió y borrar puede quien lo escribió o un admin.

create table if not exists public.borrador_comentarios (
  id uuid primary key default gen_random_uuid(),
  borrador_id uuid not null references public.borradores(id) on delete cascade,
  clave text not null,
  padre_id uuid references public.borrador_comentarios(id) on delete cascade,
  cita text,
  texto text not null check (length(btrim(texto)) > 0),
  origen text not null default 'web' check (origen in ('web', 'claude-code')),
  resuelto boolean not null default false,
  resuelto_por text,
  resuelto_at timestamptz,
  autor text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists borrador_comentarios_borrador_idx
  on public.borrador_comentarios (borrador_id, created_at);

alter table public.borrador_comentarios enable row level security;

create or replace function public.borrador_comentarios_fija()
returns trigger language plpgsql security definer
set search_path = public as
$$
declare
  yo text := lower(coalesce(auth.jwt() ->> 'email', ''));
  madre public.borrador_comentarios;
begin
  if tg_op = 'INSERT' then
    new.autor := yo;
    new.created_at := now();
    new.resuelto := false;
    new.resuelto_por := null;
    new.resuelto_at := null;
    -- Una respuesta vive en el mismo borrador y la misma pregunta que su hilo
    if new.padre_id is not null then
      select * into madre from public.borrador_comentarios where id = new.padre_id;
      if not found then raise exception 'El comentario al que respondes ya no existe'; end if;
      new.borrador_id := madre.borrador_id;
      new.clave := madre.clave;
    end if;
  else
    new.id := old.id;
    new.autor := old.autor;
    new.created_at := old.created_at;
    new.borrador_id := old.borrador_id;
    new.padre_id := old.padre_id;
    new.origen := old.origen;
    if (new.texto is distinct from old.texto or new.cita is distinct from old.cita)
       and yo is distinct from old.autor then
      raise exception 'Solo quien escribió el comentario puede cambiar su texto';
    end if;
    if new.resuelto is distinct from old.resuelto then
      new.resuelto_por := case when new.resuelto then yo end;
      new.resuelto_at := case when new.resuelto then now() end;
    else
      new.resuelto_por := old.resuelto_por;
      new.resuelto_at := old.resuelto_at;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists borrador_comentarios_autoria on public.borrador_comentarios;
create trigger borrador_comentarios_autoria
  before insert or update on public.borrador_comentarios
  for each row execute function public.borrador_comentarios_fija();

drop policy if exists borrador_comentarios_select on public.borrador_comentarios;
create policy borrador_comentarios_select on public.borrador_comentarios for select
  to authenticated using (public.es_miembro_equipo());

drop policy if exists borrador_comentarios_insert on public.borrador_comentarios;
create policy borrador_comentarios_insert on public.borrador_comentarios for insert
  to authenticated with check (public.es_miembro_equipo());

drop policy if exists borrador_comentarios_update on public.borrador_comentarios;
create policy borrador_comentarios_update on public.borrador_comentarios for update
  to authenticated
  using (public.es_miembro_equipo())
  with check (public.es_miembro_equipo());

drop policy if exists borrador_comentarios_delete on public.borrador_comentarios;
create policy borrador_comentarios_delete on public.borrador_comentarios for delete
  to authenticated using (
    public.es_admin_equipo()
    or (public.es_miembro_equipo() and autor = lower(coalesce(auth.jwt() ->> 'email', '')))
  );

-- ── Versiones ───────────────────────────────────────────────────────────
-- Copia de un borrador tal como estaba antes de un cambio. Las hace el
-- servidor solo, así que no depende de que la web o el script lo recuerden:
--   automatica: antes de guardar, si es otra persona u otra pestaña, si han
--               pasado 10 minutos desde la última copia o si el cambio es
--               grande (más de 400 caracteres de diferencia).
--   manual:     botón "Guardar versión" y antes de recuperar una versión.
--   borrado:    el borrador entero justo antes de borrarlo (papelera).
--   inicial:    la foto de cada borrador al aplicar esta migración.
-- Nadie puede editar ni borrar versiones desde la web (no hay políticas de
-- escritura); solo se leen.

create table if not exists public.borrador_versiones (
  id bigint generated always as identity primary key,
  borrador_id uuid not null,        -- sin FK: la copia sobrevive al borrado
  titulo text,
  accion text,
  estado text,
  respuestas jsonb not null,
  notas text,
  editado_por text,                 -- quién dejó el borrador así
  guardado_at timestamptz,          -- cuándo se guardó ese estado
  motivo text not null check (motivo in ('automatica', 'manual', 'borrado', 'inicial')),
  etiqueta text,
  creado_por text,                  -- quién provocó la copia
  created_at timestamptz not null default now()
);

create index if not exists borrador_versiones_borrador_idx
  on public.borrador_versiones (borrador_id, created_at desc);

alter table public.borrador_versiones enable row level security;

drop policy if exists borrador_versiones_select on public.borrador_versiones;
create policy borrador_versiones_select on public.borrador_versiones for select
  to authenticated using (public.es_miembro_equipo());

create or replace function public.borradores_guarda_version()
returns trigger language plpgsql security definer
set search_path = public as
$$
declare
  ultima timestamptz;
  yo text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  -- Un fallo al copiar nunca debe impedir guardar o borrar el borrador
  begin
    if tg_op = 'DELETE' then
      insert into public.borrador_versiones
        (borrador_id, titulo, accion, estado, respuestas, notas, editado_por, guardado_at, motivo, creado_por)
      values
        (old.id, old.titulo, old.accion, old.estado, old.respuestas, old.notas, old.editado_por, old.updated_at, 'borrado', yo);
    elsif new.respuestas is distinct from old.respuestas or new.notas is distinct from old.notas then
      select max(created_at) into ultima from public.borrador_versiones where borrador_id = old.id;
      if ultima is null
         or ultima < now() - interval '10 minutes'
         or old.editado_por is distinct from new.editado_por
         or old.sesion is distinct from new.sesion
         or abs(length(old.respuestas::text) - length(new.respuestas::text)) > 400
         or abs(length(coalesce(old.notas, '')) - length(coalesce(new.notas, ''))) > 400 then
        insert into public.borrador_versiones
          (borrador_id, titulo, accion, estado, respuestas, notas, editado_por, guardado_at, motivo, creado_por)
        values
          (old.id, old.titulo, old.accion, old.estado, old.respuestas, old.notas, old.editado_por, old.updated_at, 'automatica', yo);
      end if;
    end if;
  exception when others then
    raise warning 'borradores_guarda_version: %', sqlerrm;
  end;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists borradores_version on public.borradores;
create trigger borradores_version
  after update or delete on public.borradores
  for each row execute function public.borradores_guarda_version();

-- Copia a petición (botón de la web, antes de recuperar y antes de "subir"
-- desde Claude Code). Devuelve el id de la versión creada.
create or replace function public.guardar_version_borrador(p_id uuid, p_etiqueta text default null)
returns bigint language plpgsql security definer
set search_path = public as
$$
declare
  nuevo bigint;
begin
  if not public.es_miembro_equipo() then
    raise exception 'Solo el equipo puede guardar versiones';
  end if;
  insert into public.borrador_versiones
    (borrador_id, titulo, accion, estado, respuestas, notas, editado_por, guardado_at, motivo, etiqueta, creado_por)
  select id, titulo, accion, estado, respuestas, notas, editado_por, updated_at, 'manual',
         nullif(left(btrim(coalesce(p_etiqueta, '')), 120), ''),
         lower(coalesce(auth.jwt() ->> 'email', ''))
  from public.borradores where id = p_id
  returning id into nuevo;
  if nuevo is null then raise exception 'El borrador no existe'; end if;
  return nuevo;
end;
$$;

revoke execute on function public.guardar_version_borrador(uuid, text) from public, anon;
grant execute on function public.guardar_version_borrador(uuid, text) to authenticated;

-- Foto inicial de lo que ya hay escrito (solo la primera vez)
insert into public.borrador_versiones
  (borrador_id, titulo, accion, estado, respuestas, notas, editado_por, guardado_at, motivo, creado_por)
select b.id, b.titulo, b.accion, b.estado, b.respuestas, b.notas, b.editado_por, b.updated_at, 'inicial', 'migracion'
from public.borradores b
where not exists (select 1 from public.borrador_versiones v where v.borrador_id = b.id);
