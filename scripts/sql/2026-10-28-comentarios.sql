-- Redacción de solicitudes, mejora 1: comentarios por pregunta.
-- Ejecutar en Supabase DESPUÉS de 2026-10-27-redaccion.sql.
--
-- Quien revisa un borrador (desde Claude Code con scripts/borrador.mjs, o
-- a mano) deja un comentario en una pregunta concreta y quien redacta lo ve
-- debajo de esa respuesta en /redaccion/. Forma: { "preguntaId": "texto" }
-- y, en las fichas repetidas, { "bloqueId[2].preguntaId": "texto" }.
-- Las políticas de la tabla no cambian: cualquier miembro del equipo lee y
-- escribe comentarios.

alter table public.borradores
  add column if not exists comentarios jsonb not null default '{}'::jsonb;
