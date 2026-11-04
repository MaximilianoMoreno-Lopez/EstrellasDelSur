-- Facturas emitidas (/facturas/): numeración compartida por todo el equipo.
-- Ejecutar en Supabase DESPUÉS de 2026-07-16-panel-equipo.sql (usa sus
-- funciones es_miembro_equipo y es_admin_equipo).
--
-- Una sola serie correlativa (019, 020...). El número no lo pone el navegador:
-- lo da emitir_factura() al pulsar "Emitir", con un bloqueo para que dos
-- personas que emiten a la vez no reciban el mismo, y la columna es unique
-- por si acaso. Mientras no se emite, la factura es un borrador local sin
-- número, así que no se gastan números en borradores abandonados.
--
-- Una factura emitida se puede abrir y editar (mismo número); el trigger
-- impide cambiar el número y fija autoría y fechas en servidor. updated_at
-- sirve de control de concurrencia: el cliente solo guarda si nadie ha
-- guardado después de su última lectura.
--
-- Borrar: solo admins y solo la última, para deshacer una emisión por error
-- sin dejar huecos en la serie.
--
-- Las facturas anteriores a esta tabla no están dentro. Para que la serie
-- siga donde iba, basta con dar de alta la última emitida a mano con su
-- número (ver el ejemplo al final) o emitir la siguiente con
-- emitir_factura y corregir luego el número desde el Table Editor.

create table if not exists public.facturas (
  id uuid primary key default gen_random_uuid(),
  numero integer not null unique check (numero > 0),
  fecha date not null default current_date,
  cliente text not null default '',
  total numeric(12, 2) not null default 0,
  -- La factura entera tal como la usa src/lib/factura.mjs (cliente, líneas,
  -- IVA, nota, datos bancarios). El número manda la columna, no este JSON.
  datos jsonb not null default '{}'::jsonb,
  creado_por text,
  editado_por text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists facturas_numero_idx on public.facturas (numero desc);

alter table public.facturas enable row level security;

create or replace function public.facturas_fija_autoria()
returns trigger language plpgsql security definer
set search_path = public as
$$
begin
  -- Sin usuario (SQL Editor) se respeta el creado_por que venga en el insert,
  -- para dar de alta facturas antiguas. Desde la web no se puede insertar
  -- directamente: solo por emitir_factura, que no lo pasa.
  if tg_op = 'INSERT' then
    new.creado_por := coalesce(nullif(lower(auth.jwt() ->> 'email'), ''), new.creado_por, '');
    new.created_at := now();
    new.editado_por := new.creado_por;
  else
    new.numero := old.numero;
    new.creado_por := old.creado_por;
    new.created_at := old.created_at;
    new.editado_por := lower(coalesce(auth.jwt() ->> 'email', ''));
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists facturas_autoria on public.facturas;
create trigger facturas_autoria
  before insert or update on public.facturas
  for each row execute function public.facturas_fija_autoria();

drop policy if exists facturas_select on public.facturas;
create policy facturas_select on public.facturas for select
  to authenticated using (public.es_miembro_equipo());

-- Sin política de insert: solo se crean con emitir_factura().

drop policy if exists facturas_update on public.facturas;
create policy facturas_update on public.facturas for update
  to authenticated
  using (public.es_miembro_equipo())
  with check (public.es_miembro_equipo());

drop policy if exists facturas_delete on public.facturas;
create policy facturas_delete on public.facturas for delete
  to authenticated using (
    public.es_admin_equipo()
    and numero = (select max(f.numero) from public.facturas f)
  );

-- Emite una factura con el siguiente número libre y la devuelve.
create or replace function public.emitir_factura(
  p_fecha date,
  p_cliente text,
  p_total numeric,
  p_datos jsonb
)
returns public.facturas
language plpgsql security definer
set search_path = public as
$$
declare
  fila public.facturas;
begin
  if not public.es_miembro_equipo() then
    raise exception 'Solo el equipo puede emitir facturas' using errcode = '42501';
  end if;

  -- Un emisor detrás de otro: el segundo espera a que el primero termine y
  -- ya ve su número al calcular el siguiente.
  perform pg_advisory_xact_lock(hashtext('public.facturas.numero'));

  insert into public.facturas (numero, fecha, cliente, total, datos)
  values (
    coalesce((select max(numero) from public.facturas), 0) + 1,
    coalesce(p_fecha, current_date),
    coalesce(p_cliente, ''),
    coalesce(p_total, 0),
    coalesce(p_datos, '{}'::jsonb)
  )
  returning * into fila;

  return fila;
end;
$$;

revoke execute on function public.emitir_factura(date, text, numeric, jsonb) from public, anon;
grant execute on function public.emitir_factura(date, text, numeric, jsonb) to authenticated;

-- Ejemplo: dar de alta la última factura hecha antes de esta tabla para que
-- la siguiente salga con el número que toca. datos puede ir vacío; si lleva
-- la factura entera (forma de facturaVacia en src/lib/factura.mjs), además
-- se puede abrir y reimprimir desde la web.
--
-- insert into public.facturas (numero, fecha, cliente, total, datos, creado_por)
-- values (18, '2026-11-03', 'Nombre de la socia', 0, '{}'::jsonb, 'maxi@estrellasdelsur.eu');
