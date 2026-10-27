// Puente entre los borradores de /redaccion/ (Supabase) y Claude Code.
//
// Entra en el portal con la misma cuenta que se usa en la web (hay que estar
// en la tabla equipo), baja un borrador al markdown que leen las herramientas
// de la skill redaccion-proyectos y sube de vuelta respuestas, comentarios o
// notas. Así la evaluación y la mejora con la skill se hacen en el ordenador
// de cada uno con su suscripción, y el resultado aparece en la web.
//
// Credenciales en .env.local (solo en local, el fichero está en .gitignore):
//   PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY (ya están)
//   PORTAL_EMAIL=tu@correo   PORTAL_PASSWORD=la del portal
//
// Uso:
//   node scripts/borrador.mjs listar
//   node scripts/borrador.mjs bajar "EMBER" [--salida proyectos/web/ember.md]
//   node scripts/borrador.mjs subir proyectos/web/ember.md
//   node scripts/borrador.mjs comentar "EMBER" comentarios.json
//   node scripts/borrador.mjs notas "EMBER" evaluacion.md
//   node scripts/borrador.mjs estado "EMBER" revisado
//
// "bajar" acepta el título (o parte, sin distinguir mayúsculas) o el id.
// "subir" lee el id de la cabecera del markdown y reemplaza las respuestas
// que encuentre; las preguntas que no estén en el fichero no se tocan.
// "comentar" recibe un JSON { "preguntaId": "texto" } o un markdown con
// "### pregunta literal" seguida del comentario. Un comentario vacío lo borra.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { FORMULARIOS, formularioDe, aMarkdown, contar } from '../src/lib/formularios.mjs';

const RAIZ = process.cwd();

function cargarEnv() {
  const ruta = resolve(RAIZ, '.env.local');
  if (!existsSync(ruta)) return;
  for (const linea of readFileSync(ruta, 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

function fallo(msg) {
  console.error(msg);
  process.exit(1);
}

async function cliente() {
  cargarEnv();
  const { PUBLIC_SUPABASE_URL: url, PUBLIC_SUPABASE_ANON_KEY: clave, PORTAL_EMAIL: email, PORTAL_PASSWORD: password } = process.env;
  if (!url || !clave) fallo('Faltan PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY en .env.local');
  if (!email || !password) fallo('Faltan PORTAL_EMAIL y PORTAL_PASSWORD en .env.local (la cuenta del portal)');
  const sb = createClient(url, clave, { auth: { persistSession: false } });
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) fallo('No se pudo entrar en el portal: ' + error.message);
  return sb;
}

async function buscar(sb, ref) {
  const { data, error } = await sb.from('borradores').select('*').order('updated_at', { ascending: false });
  if (error) fallo('No se pudieron leer los borradores: ' + error.message);
  const porId = data.find((b) => b.id === ref);
  if (porId) return porId;
  const q = ref.toLowerCase();
  const candidatos = data.filter((b) => b.titulo.toLowerCase().includes(q));
  if (candidatos.length === 0) fallo(`Ningún borrador coincide con "${ref}"`);
  if (candidatos.length > 1) fallo(`Varios borradores coinciden con "${ref}": ${candidatos.map((b) => `${b.titulo} (${b.id})`).join(', ')}`);
  return candidatos[0];
}

const normalizar = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'borrador';

// Markdown de un borrador: lo que exporta la web, con una cabecera que lleva
// el id para que "subir" sepa a qué borrador volver.
function aMarkdownConId(b, f) {
  const md = aMarkdown(b, f);
  return md.replace(/^(# .*\n)/, `$1\nBorrador: ${b.id}\nEstado: ${b.estado}\n`);
}

// Lee el markdown y devuelve { id, campos, repetidos } con las respuestas que
// contiene. Reconoce los bloques por su título, las fichas por "#### Etiqueta n"
// y las preguntas por su texto literal.
export function deMarkdown(md, f) {
  const id = md.match(/^Borrador:\s*(\S+)/m)?.[1] ?? null;
  const porTitulo = new Map(f.bloques.map((b) => [normalizar(b.titulo), b]));
  const campos = {};
  const repetidos = {};
  let bloque = null;
  let ficha = null;      // objeto de la ficha actual en un bloque repetible
  let pregunta = null;
  let lineas = [];

  const cerrar = () => {
    if (!bloque || !pregunta) return;
    const destino = bloque.repetible ? ficha : campos;
    if (!destino) return;
    let cuerpo = lineas.filter((l) => !/^\*[\d.,\s]+caracteres\*$/.test(l.trim())).join('\n').trim();
    if (pregunta.tipo === 'opciones') {
      const ops = cuerpo.split('\n').map((l) => l.replace(/^\s*[-*]\s+/, '').trim()).filter(Boolean);
      if (ops.length) destino[pregunta.id] = ops;
    } else if (cuerpo) {
      destino[pregunta.id] = cuerpo;
    }
    pregunta = null;
    lineas = [];
  };

  for (const linea of md.split(/\r?\n/)) {
    let m;
    if ((m = linea.match(/^## (.+)$/))) {
      cerrar();
      bloque = porTitulo.get(normalizar(m[1])) ?? null;
      ficha = null;
      continue;
    }
    if ((m = linea.match(/^#### (.+?)\s+(\d+)$/)) && bloque?.repetible) {
      cerrar();
      repetidos[bloque.id] ??= [];
      const i = Number(m[2]) - 1;
      while (repetidos[bloque.id].length <= i) repetidos[bloque.id].push({});
      ficha = repetidos[bloque.id][i];
      continue;
    }
    if ((m = linea.match(/^### (.+)$/))) {
      cerrar();
      const texto = normalizar(m[1]);
      pregunta = bloque?.preguntas.find((p) => normalizar(p.texto) === texto) ?? null;
      if (bloque && !pregunta) console.error(`Aviso: pregunta no reconocida en "${bloque.titulo}": ${texto.slice(0, 80)}`);
      continue;
    }
    if ((m = linea.match(/^Pertenece a:\s*(.+)$/)) && ficha && !pregunta) {
      ficha._padre = m[1].trim();
      continue;
    }
    if (pregunta) lineas.push(linea);
  }
  cerrar();
  return { id, campos, repetidos };
}

// Comentarios desde un JSON o desde un markdown con "### pregunta" + texto.
function leerComentarios(ruta, f) {
  const texto = readFileSync(ruta, 'utf8');
  if (ruta.endsWith('.json')) return JSON.parse(texto);
  const todas = f.bloques.flatMap((b) => b.preguntas.map((p) => ({ ...p, bloque: b })));
  const out = {};
  let actual = null, ficha = null, lineas = [];
  const cerrar = () => {
    if (!actual) return;
    const clave = ficha ? `${actual.bloque.id}[${ficha}].${actual.id}` : actual.id;
    out[clave] = lineas.join('\n').trim();
    actual = null; lineas = [];
  };
  for (const linea of texto.split(/\r?\n/)) {
    let m;
    if ((m = linea.match(/^#### .+?\s+(\d+)$/))) { cerrar(); ficha = Number(m[1]); continue; }
    if ((m = linea.match(/^## /))) { cerrar(); ficha = null; continue; }
    if ((m = linea.match(/^### (.+)$/))) {
      cerrar();
      const t = normalizar(m[1]);
      actual = todas.find((p) => normalizar(p.texto) === t) ?? null;
      if (!actual) console.error(`Aviso: pregunta no reconocida: ${t.slice(0, 80)}`);
      continue;
    }
    if (actual) lineas.push(linea);
  }
  cerrar();
  return out;
}

async function main() {
  const [orden, ...args] = process.argv.slice(2);
  if (!orden || orden === 'ayuda') {
    console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'));
    return;
  }

  if (orden === 'listar') {
    const sb = await cliente();
    const { data, error } = await sb.from('borradores').select('id, titulo, accion, estado, updated_at, editado_por').order('updated_at', { ascending: false });
    if (error) fallo(error.message);
    for (const b of data) console.log(`${b.id}  ${b.accion.padEnd(9)} ${b.estado.padEnd(13)} ${b.updated_at.slice(0, 16).replace('T', ' ')}  ${b.titulo}  (${b.editado_por ?? ''})`);
    return;
  }

  if (orden === 'bajar') {
    const ref = args[0];
    if (!ref) fallo('Falta el título o el id del borrador');
    const sb = await cliente();
    const b = await buscar(sb, ref);
    const f = formularioDe(b.accion);
    if (!f) fallo(`Sin formulario para ${b.accion}`);
    const salida = args.includes('--salida') ? args[args.indexOf('--salida') + 1] : `proyectos/web/${slug(b.titulo)}.md`;
    mkdirSync(dirname(resolve(RAIZ, salida)), { recursive: true });
    writeFileSync(resolve(RAIZ, salida), aMarkdownConId(b, f));
    const n = Object.keys(b.comentarios ?? {}).length;
    console.log(`Bajado "${b.titulo}" (${b.accion}, ${b.estado}) a ${salida}${n ? `; tiene ${n} comentarios` : ''}${b.notas ? '; notas: ' + b.notas.slice(0, 80).replace(/\n/g, ' ') : ''}`);
    return;
  }

  if (orden === 'subir') {
    const ruta = args[0];
    if (!ruta || !existsSync(resolve(RAIZ, ruta))) fallo('Falta el fichero markdown a subir');
    const md = readFileSync(resolve(RAIZ, ruta), 'utf8');
    const id = md.match(/^Borrador:\s*(\S+)/m)?.[1];
    if (!id) fallo('El markdown no lleva la línea "Borrador: <id>" (baja primero el borrador con este script)');
    const sb = await cliente();
    const b = await buscar(sb, id);
    const f = formularioDe(b.accion);
    const { campos, repetidos } = deMarkdown(md, f);
    const r = b.respuestas ?? { campos: {}, repetidos: {} };
    const nuevas = {
      ...r,
      campos: { ...(r.campos ?? {}), ...campos },
      repetidos: { ...(r.repetidos ?? {}) },
    };
    for (const [bl, fichas] of Object.entries(repetidos)) {
      const previas = Array.isArray(nuevas.repetidos[bl]) ? nuevas.repetidos[bl] : [];
      nuevas.repetidos[bl] = fichas.map((fi, i) => ({ ...(previas[i] ?? {}), ...fi }));
      if (previas.length > fichas.length) nuevas.repetidos[bl].push(...previas.slice(fichas.length));
    }
    const nCampos = Object.keys(campos).length + Object.values(repetidos).reduce((s, fs) => s + fs.reduce((t, fi) => t + Object.keys(fi).length, 0), 0);
    const sobre = f.bloques.flatMap((bl) => bl.preguntas).filter((p) => p.tipo === 'texto').map((p) => {
      const lim = p.limite ?? f.limiteDefecto;
      const v = campos[p.id];
      return typeof v === 'string' && lim && contar(v) > lim ? `${p.id} (${contar(v)}/${lim})` : null;
    }).filter(Boolean);
    if (sobre.length) console.error(`Aviso: respuestas por encima del tope: ${sobre.join(', ')}`);
    const { error } = await sb.from('borradores').update({ respuestas: nuevas, sesion: 'claude-code' }).eq('id', id);
    if (error) fallo('No se pudo subir: ' + error.message);
    console.log(`Subidas ${nCampos} respuestas a "${b.titulo}"`);
    return;
  }

  if (orden === 'comentar') {
    const [ref, ruta] = args;
    if (!ref || !ruta || !existsSync(resolve(RAIZ, ruta))) fallo('Uso: comentar <borrador> <fichero.json|.md>');
    const sb = await cliente();
    const b = await buscar(sb, ref);
    const f = formularioDe(b.accion);
    const nuevos = leerComentarios(resolve(RAIZ, ruta), f);
    const comentarios = { ...(b.comentarios ?? {}) };
    let puestos = 0, quitados = 0;
    for (const [k, v] of Object.entries(nuevos)) {
      if (v && String(v).trim()) { comentarios[k] = String(v).trim(); puestos += 1; }
      else if (k in comentarios) { delete comentarios[k]; quitados += 1; }
    }
    const { error } = await sb.from('borradores').update({ comentarios, sesion: 'claude-code' }).eq('id', b.id);
    if (error) fallo('No se pudieron guardar los comentarios: ' + error.message);
    console.log(`"${b.titulo}": ${puestos} comentarios puestos, ${quitados} quitados, ${Object.keys(comentarios).length} en total`);
    return;
  }

  if (orden === 'notas') {
    const [ref, ruta] = args;
    if (!ref || !ruta || !existsSync(resolve(RAIZ, ruta))) fallo('Uso: notas <borrador> <fichero.md>');
    const sb = await cliente();
    const b = await buscar(sb, ref);
    const notas = readFileSync(resolve(RAIZ, ruta), 'utf8').trim();
    const { error } = await sb.from('borradores').update({ notas, sesion: 'claude-code' }).eq('id', b.id);
    if (error) fallo('No se pudieron guardar las notas: ' + error.message);
    console.log(`Notas de "${b.titulo}" actualizadas (${contar(notas).toLocaleString('es-ES')} caracteres)`);
    return;
  }

  if (orden === 'estado') {
    const [ref, estado] = args;
    const validos = ['borrador', 'para_revisar', 'revisado', 'presentado'];
    if (!ref || !validos.includes(estado)) fallo(`Uso: estado <borrador> <${validos.join('|')}>`);
    const sb = await cliente();
    const b = await buscar(sb, ref);
    const { error } = await sb.from('borradores').update({ estado, sesion: 'claude-code' }).eq('id', b.id);
    if (error) fallo(error.message);
    console.log(`"${b.titulo}" pasa a ${estado}`);
    return;
  }

  fallo(`Orden desconocida: ${orden}. Órdenes: listar, bajar, subir, comentar, notas, estado`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  main();
}
