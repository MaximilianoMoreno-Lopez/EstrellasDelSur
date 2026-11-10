-- Alta automática en el equipo de las cuentas @estrellasdelsur.eu.
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query > pegar y Run.
--
-- Quien crea su cuenta en el portal con un correo del dominio entra solo en la
-- tabla `equipo` (rol 'miembro') y con eso tiene el panel de trabajo, la
-- redacción de solicitudes y las facturas, igual que un becario.
--
-- Seguridad: el alta solo se hace cuando la persona CONFIRMA su correo con el
-- enlace que le llega (email_confirmed_at pasa de null a una fecha). Así se
-- demuestra que el buzón es suyo. Si en Auth está desactivada la confirmación
-- de email, las cuentas nacen ya confirmadas, ese paso no ocurre y nadie entra
-- solo por escribir una dirección del dominio. Para que esto funcione hay que
-- tener activado Authentication > Sign In / Providers > Email > "Confirm email".
--
-- Las bajas siguen siendo a mano: cuando alguien se va, un admin borra su fila
-- de `equipo`. El trigger no lo vuelve a meter (solo actúa al confirmar).

-- Nuevo rol para el personal y voluntariado con correo del dominio
alter table public.equipo drop constraint if exists equipo_rol_check;
alter table public.equipo add constraint equipo_rol_check
  check (rol in ('admin', 'miembro', 'becario'));

create or replace function public.alta_equipo_por_dominio()
returns trigger language plpgsql security definer
set search_path = '' as
$$
declare
  correo text := lower(new.email);
begin
  if tg_op = 'UPDATE'
     and old.email_confirmed_at is null
     and new.email_confirmed_at is not null
     and split_part(correo, '@', 2) = 'estrellasdelsur.eu'
  then
    insert into public.equipo (email, nombre, rol)
    values (
      correo,
      initcap(replace(split_part(correo, '@', 1), '.', ' ')),
      'miembro'
    )
    on conflict (email) do nothing;
  end if;
  return new;
exception when others then
  -- Un fallo aquí nunca debe impedir que alguien confirme su cuenta
  raise warning 'alta_equipo_por_dominio: %', sqlerrm;
  return new;
end;
$$;

revoke execute on function public.alta_equipo_por_dominio() from public, anon, authenticated;

drop trigger if exists alta_equipo_por_dominio on auth.users;
create trigger alta_equipo_por_dominio
  after update of email_confirmed_at on auth.users
  for each row execute function public.alta_equipo_por_dominio();
