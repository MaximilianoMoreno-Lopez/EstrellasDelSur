-- Mantiene participantes.updated_at al día en cada modificación, también si
-- se edita la fila desde el panel de Supabase o desde otra página.
-- El portal ya envía updated_at al guardar; esto es la red de seguridad.
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query > pegar y Run.

alter table public.participantes
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.participantes_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists participantes_updated_at on public.participantes;
create trigger participantes_updated_at
  before update on public.participantes
  for each row execute function public.participantes_set_updated_at();
