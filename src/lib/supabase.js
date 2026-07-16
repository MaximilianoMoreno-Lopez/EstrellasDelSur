import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

// OJO: la lista de admins vive en TRES sitios que hay que mantener a la vez:
// 1) este array (gates de /admin/ y /radar/), 2) las políticas RLS de
// participantes en Supabase, y 3) la tabla `equipo` (rol admin) que gobierna
// el panel /equipo/. Si se incorpora alguien, actualizar los tres.
export const ADMIN_EMAILS = [
  'maxi@estrellasdelsur.eu',
  'pablo@estrellasdelsur.eu',
  'paula@estrellasdelsur.eu',
  'admin@estrellasdelsur.eu',
];

export function isAdmin(email) {
  return ADMIN_EMAILS.includes(email?.toLowerCase());
}
