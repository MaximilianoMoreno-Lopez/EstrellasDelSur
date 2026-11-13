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
//   node scripts/borrador.mjs plantilla KA152-YOU --titulo "EMBER" --salida proyectos/web/ember.md
//   node scripts/borrador.mjs crear proyectos/web/ember.md [--responsables paula@...,maxi@...] [--simulacro]
//   node scripts/borrador.mjs bajar "EMBER" [--salida proyectos/web/ember.md]
//   node scripts/borrador.mjs subir proyectos/web/ember.md
//   node scripts/borrador.mjs comentarios "EMBER"
//   node scripts/borrador.mjs comentar "EMBER" comentarios.json
//   node scripts/borrador.mjs notas "EMBER" evaluacion.md
//   node scripts/borrador.mjs estado "EMBER" revisado
//
// "plantilla" escribe un markdown vacío con las preguntas literales de la
// acción, en el orden del portal y con su tope; se redacta encima.
// "crear" sube ese markdown como borrador nuevo de la web, lo asigna (por
// defecto a quien ejecuta el script) y apunta su id en el fichero, así los
// cambios siguientes van con "subir". Las preguntas se reconocen por su texto
// literal o, si el encabezado está resumido, por parecido; las que no se
// reconocen se listan y no se suben. "subir" y "crear" aceptan --simulacro.
// "bajar" acepta el título (o parte, sin distinguir mayúsculas) o el id.
// "bajar" deja además, si hay comentarios del equipo sin resolver, un
// <nombre>.comentarios.md al lado con cada uno bajo su pregunta.
// "comentarios" los enseña en la terminal.
// "subir" lee el id de la cabecera del markdown y reemplaza las respuestas
// que encuentre; las preguntas que no estén en el fichero no se tocan. Antes
// guarda una versión del borrador, que se recupera desde Historial en la web.
// "comentar" recibe un JSON { "preguntaId": "texto" } (o { "preguntaId":
// { "texto": "...", "cita": "fragmento" } }) o un markdown con "### pregunta
// literal" seguida del comentario. Cada uno se publica como comentario nuevo
// de Estrella (la asistente de redacción); uno vacío marca como resueltos los abiertos de esa pregunta.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { formularioDe, aMarkdown, contar, etiquetaClave, partirClave, aplanar, limiteDe, FORMULARIOS } from '../src/lib/formularios.mjs';

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

// Palabras de un texto para comparar encabezados con preguntas literales
const palabras = (t) => (t ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2);

// Busca la pregunta de un encabezado "### ...". Primero el texto literal en
// el bloque actual, luego en todo el formulario, y por último por parecido:
// vale un encabezado resumido ("Aims. Please describe...") si casi todas sus
// palabras están en una sola pregunta y no empata con otra.
export function buscarPregunta(texto, f, bloque) {
  const t = normalizar(texto).replace(/\.{3}$|…$/, '').trim();
  const todas = f.bloques.flatMap((b) => b.preguntas.map((p) => ({ p, b })));
  const exacta = (lista) => lista.find(({ p }) => normalizar(p.texto) === t)
    ?? lista.find(({ p }) => t.length >= 25 && normalizar(p.texto).startsWith(t));
  const delBloque = bloque ? todas.filter(({ b }) => b === bloque) : [];
  const hallada = exacta(delBloque) ?? exacta(todas);
  if (hallada) return hallada;
  const h = new Set(palabras(t));
  if (h.size < 4) return null;
  const puntuadas = todas.map((x) => {
    const q = new Set(palabras(x.p.texto));
    let comunes = 0;
    h.forEach((w) => { if (q.has(w)) comunes += 1; });
    return { ...x, contiene: comunes / h.size, jaccard: comunes / (h.size + q.size - comunes) };
  }).sort((a, b) => b.contiene - a.contiene || b.jaccard - a.jaccard || (b.b === bloque) - (a.b === bloque));
  const [mejor, segunda] = puntuadas;
  if (!mejor || mejor.contiene < 0.8) return null;
  if (segunda && segunda.contiene === mejor.contiene && segunda.jaccard === mejor.jaccard && segunda.b !== bloque) return null;
  return { p: mejor.p, b: mejor.b };
}

// Lee el markdown y devuelve { id, campos, repetidos, reconocidas, perdidas }.
// Reconoce los bloques por su título, las fichas por "#### Etiqueta n" y las
// preguntas con buscarPregunta. Si un título de bloque no coincide, la
// pregunta se busca en todo el formulario; las de un bloque repetible sin
// "#### Etiqueta n" delante van a su primera ficha. Las líneas de comentario
// HTML (<!-- ... -->) de la plantilla no cuentan como respuesta.
export function deMarkdown(md, f) {
  const id = md.match(/^Borrador:\s*(\S+)/m)?.[1] ?? null;
  const porTitulo = new Map(f.bloques.map((b) => [normalizar(b.titulo), b]));
  const campos = {};
  const repetidos = {};
  const perdidas = [];
  let reconocidas = 0;
  let bloque = null;     // bloque del último "## " reconocido
  let ficha = null;      // { bloque, valores } de la última "#### Etiqueta n"
  let actual = null;     // { p, b, destino } de la pregunta abierta
  let previa = null;     // { p, b } de la última pregunta reconocida
  let lineas = [];

  const fichaDe = (b, i) => {
    repetidos[b.id] ??= [];
    while (repetidos[b.id].length <= i) repetidos[b.id].push({});
    return repetidos[b.id][i];
  };

  const cerrar = () => {
    if (!actual) return;
    const { p, destino } = actual;
    const cuerpo = lineas
      .filter((l) => !/^\*[\d.,\s]+caracteres\*$/.test(l.trim()) && !/^\s*<!--.*-->\s*$/.test(l))
      .join('\n').trim();
    if (p.tipo === 'opciones') {
      const ops = cuerpo.split('\n').map((l) => l.replace(/^\s*[-*]\s+/, '').trim()).filter(Boolean);
      if (ops.length) { destino[p.id] = ops; reconocidas += 1; }
    } else if (cuerpo) {
      destino[p.id] = cuerpo;
      reconocidas += 1;
    }
    actual = null;
    lineas = [];
  };

  for (const linea of md.split(/\r?\n/)) {
    let m;
    if ((m = linea.match(/^## (.+)$/))) {
      cerrar();
      bloque = porTitulo.get(normalizar(m[1])) ?? null;
      ficha = null;
      previa = null;
      continue;
    }
    if ((m = linea.match(/^#### (.+?)\s+(\d+)\s*$/))) {
      const etiqueta = normalizar(m[1]).toLowerCase();
      const b = bloque?.repetible ? bloque
        : f.bloques.find((x) => x.repetible && normalizar(x.etiquetaRepetible ?? 'Ficha').toLowerCase() === etiqueta);
      // Si no es una ficha, la línea es texto de la respuesta
      if (b) {
        cerrar();
        bloque = b;
        ficha = { bloque: b, valores: fichaDe(b, Number(m[2]) - 1) };
        previa = null;
        continue;
      }
    }
    if ((m = linea.match(/^### (.+)$/))) {
      cerrar();
      const hallada = buscarPregunta(m[1], f, bloque);
      if (!hallada) { perdidas.push(normalizar(m[1]).slice(0, 90)); continue; }
      let { p } = hallada;
      const { b } = hallada;
      const destino = !b.repetible ? campos
        : ficha?.bloque === b ? ficha.valores
        : fichaDe(b, 0);
      // Preguntas con el mismo texto en un bloque (las "Please provide a
      // translation in English" de KA154): se toma la primera que vaya
      // después de la última pregunta leída, como en el formulario.
      const gemelas = b.preguntas.filter((q) => normalizar(q.texto) === normalizar(p.texto));
      if (gemelas.length > 1) {
        const ultima = previa?.b === b ? b.preguntas.indexOf(previa.p) : -1;
        p = gemelas.find((q) => b.preguntas.indexOf(q) > ultima) ?? gemelas[0];
      }
      actual = { p, b, destino };
      previa = { p, b };
      continue;
    }
    if ((m = linea.match(/^Pertenece a:\s*(.+)$/)) && ficha && !actual) {
      ficha.valores._padre = m[1].trim();
      continue;
    }
    if (actual) lineas.push(linea);
  }
  cerrar();
  return { id, campos, repetidos, reconocidas, perdidas };
}

// Markdown vacío con todas las preguntas literales de una acción, en el
// orden del portal, para redactar encima y luego "crear" o "subir". Cada
// pregunta lleva una línea <!-- ... --> con su tope, que no se sube.
export function plantillaMarkdown(f, titulo) {
  const lineas = [`# ${titulo}`, '', `Acción: ${f.accion}, ${f.nombre}`, ''];
  const tope = (p) => {
    const lim = p.tipo === 'texto' ? (p.limite ?? f.limiteDefecto) : p.limite;
    const partes = [`tipo ${p.tipo}`];
    if (lim) partes.push(`tope ${lim.toLocaleString('es-ES')} caracteres`);
    if (p.opciones?.length) partes.push(`opciones: ${p.opciones.join(' | ')}`);
    if (p.maximo) partes.push(`máximo ${p.maximo}`);
    return `<!-- ${partes.join(', ')} -->`;
  };
  const volcar = (b) => b.preguntas.forEach((p) => {
    lineas.push(`### ${p.texto.replace(/\s*\n\s*/g, ' ')}`, tope(p), '', '');
  });
  f.bloques.forEach((b) => {
    lineas.push(`## ${b.titulo}`, '');
    if (b.repetible) {
      lineas.push(`<!-- Bloque repetible: copiar desde "#### ${b.etiquetaRepetible ?? 'Ficha'} 1" para añadir fichas 2, 3... -->`, '');
      lineas.push(`#### ${b.etiquetaRepetible ?? 'Ficha'} 1`, '');
    }
    volcar(b);
  });
  return lineas.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
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

// Comentarios sin resolver de un borrador, en hilos y por orden de llegada
async function comentariosAbiertos(sb, b) {
  const { data, error } = await sb.from('borrador_comentarios').select('*').eq('borrador_id', b.id).order('created_at');
  if (error) {
    console.error('Aviso: no se pudieron leer los comentarios (¿falta la migración 2026-11-12?): ' + error.message);
    return [];
  }
  return data
    .filter((c) => !c.padre_id && !c.resuelto)
    .map((c) => ({ ...c, respuestas: data.filter((r) => r.padre_id === c.id) }));
}

// Markdown con los comentarios abiertos bajo el texto literal de su pregunta,
// para leerlo junto al borrador. Las claves de fichas llevan su número.
export function comentariosAMarkdown(b, f, hilos) {
  const texto = (clave) => {
    const { bloque, pregunta } = partirClave(clave.replace(/~quitada$/, ''));
    const bl = bloque ? f.bloques.find((x) => x.id === bloque) : f.bloques.find((x) => x.preguntas.some((p) => p.id === pregunta));
    return bl?.preguntas.find((p) => p.id === pregunta)?.texto.replace(/\s*\n\s*/g, ' ') ?? clave;
  };
  const quien = (c) => (c.origen === 'claude-code' ? 'Estrella' : c.autor);
  const lineas = [`# Comentarios abiertos de ${b.titulo}`, '', `Borrador: ${b.id}`, ''];
  for (const h of hilos) {
    lineas.push(`## ${etiquetaClave(h.clave, f)}${h.clave.endsWith('~quitada') ? ' (ficha quitada)' : ''}`, '', `### ${texto(h.clave)}`, '');
    lineas.push(`**${quien(h)}**, ${h.created_at.slice(0, 16).replace('T', ' ')} (clave ${h.clave})`, '');
    if (h.cita) lineas.push(...h.cita.split('\n').map((l) => `> ${l}`), '');
    lineas.push(h.texto, '');
    for (const r of h.respuestas) lineas.push(`- **${quien(r)}**: ${r.texto.replace(/\n/g, ' ')}`);
    if (h.respuestas.length) lineas.push('');
  }
  return lineas.join('\n');
}

// Avisos de lo leído de un markdown: preguntas que no se reconocieron (se
// quedarían sin subir) y respuestas por encima del tope del portal.
function informe(leido, f) {
  if (leido.perdidas.length) {
    console.error(`Aviso: ${leido.perdidas.length} encabezados "###" no corresponden a ninguna pregunta y NO se suben:`);
    leido.perdidas.forEach((t) => console.error(`  - ${t}`));
  }
  const sobre = aplanar({ campos: leido.campos, repetidos: leido.repetidos }, f)
    .filter((x) => typeof x.valor === 'string')
    .map((x) => ({ ...x, lim: limiteDe(x.pregunta, f), n: contar(x.valor) }))
    .filter((x) => x.lim && x.n > x.lim);
  if (sobre.length) console.error(`Aviso: por encima del tope: ${sobre.map((x) => `${etiquetaClave(x.clave, f)} (${x.n}/${x.lim})`).join(', ')}`);
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
    const hilos = await comentariosAbiertos(sb, b);
    const salidaCom = salida.replace(/\.md$/, '') + '.comentarios.md';
    if (hilos.length) writeFileSync(resolve(RAIZ, salidaCom), comentariosAMarkdown(b, f, hilos));
    console.log(`Bajado "${b.titulo}" (${b.accion}, ${b.estado}) a ${salida}${hilos.length ? `; ${hilos.length} comentarios sin resolver en ${salidaCom}` : ''}${b.notas ? '; notas: ' + b.notas.slice(0, 80).replace(/\n/g, ' ') : ''}`);
    return;
  }

  if (orden === 'plantilla') {
    const accion = (args[0] ?? '').toUpperCase();
    const f = accion ? (formularioDe(accion) ?? FORMULARIOS.find((x) => x.accion.startsWith(accion))) : null;
    if (!f) fallo(`Uso: plantilla <${FORMULARIOS.map((x) => x.accion).join('|')}> [--titulo "..."] [--salida fichero.md]`);
    const titulo = args.includes('--titulo') ? args[args.indexOf('--titulo') + 1] : 'Título de trabajo';
    const md = plantillaMarkdown(f, titulo);
    if (args.includes('--salida')) {
      const salida = args[args.indexOf('--salida') + 1];
      if (existsSync(resolve(RAIZ, salida))) fallo(`${salida} ya existe; no lo piso. Elige otro nombre.`);
      mkdirSync(dirname(resolve(RAIZ, salida)), { recursive: true });
      writeFileSync(resolve(RAIZ, salida), md);
      console.log(`Plantilla de ${f.accion} (${f.bloques.length} bloques) en ${salida}`);
    } else {
      process.stdout.write(md);
    }
    return;
  }

  if (orden === 'crear') {
    const ruta = args[0];
    if (!ruta || !existsSync(resolve(RAIZ, ruta))) fallo('Uso: crear <fichero.md> [--accion KA152-YOU] [--titulo "..."] [--responsables correo,correo] [--estado borrador|para_revisar] [--simulacro]');
    const opcion = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
    const md = readFileSync(resolve(RAIZ, ruta), 'utf8');
    if (/^Borrador:\s*\S+/m.test(md)) fallo('Este markdown ya está en la web (lleva "Borrador: <id>"). Usa "subir" para actualizarlo.');
    const accion = (opcion('--accion') ?? md.match(/^Acción:\s*([A-Z0-9]+-[A-Z]+)/m)?.[1] ?? '').toUpperCase();
    const f = formularioDe(accion);
    if (!f) fallo(`No sé de qué acción es. Pon --accion (${FORMULARIOS.map((x) => x.accion).join(', ')}) o la línea "Acción: KA152-YOU" bajo el título.`);
    const titulo = opcion('--titulo') ?? md.match(/^# (.+)$/m)?.[1]?.trim();
    if (!titulo || titulo === 'Título de trabajo') fallo('Falta el título: pon "# Título" en la primera línea o --titulo "..."');
    const estado = opcion('--estado') ?? 'borrador';
    if (!['borrador', 'para_revisar', 'revisado', 'presentado'].includes(estado)) fallo(`Estado no válido: ${estado}`);
    const leido = deMarkdown(md, f);
    informe(leido, f);
    if (!leido.reconocidas) fallo('No he reconocido ninguna respuesta en el fichero; no creo nada.');
    // Idioma de redacción: el de la línea "Idioma: es|en|fr" o, si no hay, se deduce
    const muestra = Object.values(leido.campos).filter((v) => typeof v === 'string').join(' ').slice(0, 3000);
    const cuenta = (re) => (muestra.match(re) ?? []).length;
    const votos = {
      es: cuenta(/\b(el|los|las|del|que|y|con|para|una)\b/gi),
      en: cuenta(/\b(the|and|of|will|our|with|to|for)\b/gi),
      fr: cuenta(/\b(les|des|nous|est|une|avec|pour|du)\b/gi),
    };
    const deducido = Object.entries(votos).sort((a, b) => b[1] - a[1])[0];
    const idioma = /^Idioma:\s*(es|en|fr)\b/m.exec(md)?.[1] ?? (deducido[1] ? deducido[0] : 'es');
    const respuestas = { idioma, campos: leido.campos, repetidos: leido.repetidos };
    console.log(`"${titulo}" (${f.accion}): ${leido.reconocidas} respuestas reconocidas, idioma ${idioma}`);
    if (args.includes('--simulacro')) { console.log('Simulacro: no se ha creado nada.'); return; }
    const sb = await cliente();
    const { data: b, error } = await sb.from('borradores')
      .insert({ titulo, accion: f.accion, estado, respuestas, sesion: 'claude-code' })
      .select().single();
    if (error) fallo('No se pudo crear el borrador: ' + error.message);
    // Responsables: los que se pidan y, si no se pide ninguno, quien ejecuta el script
    const yo = (process.env.PORTAL_EMAIL ?? '').toLowerCase();
    const resp = (opcion('--responsables') ?? yo).split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
    for (const email of resp) {
      const { error: e } = await sb.from('borrador_responsables').insert({ borrador_id: b.id, email });
      if (e) console.error(`Aviso: no se pudo asignar a ${email}: ${e.message}`);
    }
    // El id vuelve al markdown para que los cambios siguientes vayan con "subir"
    writeFileSync(resolve(RAIZ, ruta), md.replace(/^(# .*\r?\n)/, `$1\nBorrador: ${b.id}\nEstado: ${estado}\n`));
    console.log(`Creado. Responsables: ${resp.join(', ') || 'nadie'}. https://estrellasdelsur.eu/redaccion/#${b.id}`);
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
    const leido = deMarkdown(md, f);
    const { campos, repetidos } = leido;
    informe(leido, f);
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
    if (args.includes('--simulacro')) {
      console.log(`Simulacro: se subirían ${nCampos} respuestas a "${b.titulo}". No se ha tocado nada.`);
      return;
    }
    // Copia de lo que hay antes de reemplazar, recuperable desde Historial
    const { error: errorVersion } = await sb.rpc('guardar_version_borrador', { p_id: id, p_etiqueta: 'Antes de que Estrella subiera cambios' });
    if (errorVersion) fallo('No se pudo guardar la versión previa, así que no se sube nada: ' + errorVersion.message);
    const { error } = await sb.from('borradores').update({ respuestas: nuevas, sesion: 'claude-code' }).eq('id', id);
    if (error) fallo('No se pudo subir: ' + error.message);
    console.log(`Subidas ${nCampos} respuestas a "${b.titulo}"`);
    return;
  }

  if (orden === 'comentarios') {
    const ref = args[0];
    if (!ref) fallo('Uso: comentarios <borrador>');
    const sb = await cliente();
    const b = await buscar(sb, ref);
    const f = formularioDe(b.accion);
    const hilos = await comentariosAbiertos(sb, b);
    if (!hilos.length) { console.log(`"${b.titulo}" no tiene comentarios sin resolver`); return; }
    console.log(comentariosAMarkdown(b, f, hilos));
    return;
  }

  if (orden === 'comentar') {
    const [ref, ruta] = args;
    if (!ref || !ruta || !existsSync(resolve(RAIZ, ruta))) fallo('Uso: comentar <borrador> <fichero.json|.md>');
    const sb = await cliente();
    const b = await buscar(sb, ref);
    const f = formularioDe(b.accion);
    const nuevos = leerComentarios(resolve(RAIZ, ruta), f);
    const filas = [];
    const aResolver = [];
    for (const [clave, v] of Object.entries(nuevos)) {
      const texto = String((v && typeof v === 'object' ? v.texto : v) ?? '').trim();
      const cita = v && typeof v === 'object' && v.cita ? String(v.cita).trim().slice(0, 400) : null;
      if (texto) filas.push({ borrador_id: b.id, clave, texto, cita, origen: 'claude-code' });
      else aResolver.push(clave);
    }
    if (filas.length) {
      const { error } = await sb.from('borrador_comentarios').insert(filas);
      if (error) fallo('No se pudieron guardar los comentarios: ' + error.message);
    }
    let resueltos = 0;
    if (aResolver.length) {
      const { data, error } = await sb.from('borrador_comentarios')
        .update({ resuelto: true })
        .eq('borrador_id', b.id).eq('resuelto', false).is('padre_id', null)
        .in('clave', aResolver)
        .select('id');
      if (error) fallo('No se pudieron resolver los comentarios: ' + error.message);
      resueltos = data.length;
    }
    console.log(`"${b.titulo}": ${filas.length} comentarios publicados, ${resueltos} marcados como resueltos`);
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

  fallo(`Orden desconocida: ${orden}. Órdenes: listar, plantilla, crear, bajar, subir, comentarios, comentar, notas, estado`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  main();
}
