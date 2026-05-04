import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

export const ADMIN_EMAILS = [
  'maxi@estrellasdelsur.eu',
  'pablo@estrellasdelsur.eu',
  'paula@estrellasdelsur.eu',
  'admin@estrellasdelsur.eu',
];

export function isAdmin(email) {
  return ADMIN_EMAILS.includes(email?.toLowerCase());
}
