-- Añade teléfono y contacto de emergencia a la tabla de participantes.
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query > pegar y Run.
--
-- Las políticas RLS existentes son por fila, así que cubren las columnas
-- nuevas sin cambios: cada participante ve y edita solo su registro, y los
-- admins el conjunto. Estos datos NO se muestran en el panel de admin
-- (decisión de privacidad); viven solo en la base y en el perfil del
-- propio participante.

alter table public.participantes
  add column if not exists telefono text,
  add column if not exists contacto_emergencia text;
