// Formularios de solicitud Erasmus+ que replica el editor de /redaccion/.
//
// Las preguntas literales, su orden, sus tipos y sus topes de caracteres
// están en src/lib/formularios/<accion>.json, extraídos de solicitudes
// exportadas del portal y de los formularios oficiales publicados por las
// agencias. Las fuentes de cada pregunta y las dudas pendientes están fuera
// del repo, en borradores/fuentes/formularios/<accion>.notas.json, porque
// citan expedientes de otras entidades. Cuando el portal cambie el
// formulario, se actualiza el JSON y el editor lo sigue solo.
//
// Forma de cada JSON:
//   accion, nombre, limiteDefecto
//   bloques[]: { id, titulo, tituloEs, subtitulo?, repetible, etiquetaRepetible,
//                padre? (id de otro bloque repetible del que cuelga), preguntas[] }
//   preguntas[]: { id, texto, tipo, limite, opciones, ayuda,
//                  maximo? (tope de marcadas en "opciones"),
//                  opcionesAbiertas? (admite un valor fuera de la lista) }
//   tipo: texto | corto | numero | fecha | si_no | opcion | opciones
//
// Las respuestas de un borrador van en { idioma, campos: {id: valor},
// repetidos: {bloqueId: [{id: valor, _padre?: etiqueta de la ficha madre}]} }.

// Los atributos de importación hacen que el módulo cargue igual en Vite y en
// Node, así las funciones de abajo se pueden probar desde la terminal.
import ka152 from './formularios/KA152-YOU.json' with { type: 'json' };
import ka153 from './formularios/KA153-YOU.json' with { type: 'json' };
import ka154 from './formularios/KA154-YOU.json' with { type: 'json' };
import ka210 from './formularios/KA210-YOU.json' with { type: 'json' };
import ka220 from './formularios/KA220-YTH.json' with { type: 'json' };

export const FORMULARIOS = [ka152, ka153, ka154, ka210, ka220];

export function formularioDe(accion) {
  return FORMULARIOS.find((f) => f.accion === accion) ?? null;
}

// Tope de una pregunta: el suyo o, en las respuestas largas, el del
// formulario. Los campos cortos solo tienen tope si el JSON lo dice.
export function limiteDe(pregunta, formulario) {
  if (pregunta.tipo === 'texto') return pregunta.limite ?? formulario.limiteDefecto ?? null;
  if (pregunta.tipo === 'corto') return pregunta.limite ?? null;
  return null;
}

// Cuenta como cuenta el portal después de pegar: caracteres con espacios y
// cada salto de línea como un carácter. Los saltos de Windows (\r\n) se
// normalizan antes para no contarlos doble.
export function contar(texto) {
  return (texto ?? '').replace(/\r\n?/g, '\n').length;
}

// Algunos campos del portal cuentan cada salto de párrafo como dos
// caracteres. Es el recuento "pesimista" que conviene mirar cuando se va
// justo de espacio (margen de 60 a 100 que recomienda la skill).
export function contarPesimista(texto) {
  const t = (texto ?? '').replace(/\r\n?/g, '\n');
  return t.length + (t.match(/\n/g) ?? []).length;
}

// Margen de aviso antes del tope, para que el amarillo salte a tiempo: los
// últimos 100 caracteres en las respuestas largas (en las de 5.000 coincide
// con el techo de 4.900 que recomienda la skill) y el último 10 % en los
// campos pequeños, donde 100 sería una quinta parte del tope.
export const MARGEN_AVISO = 100;
export function margenDe(limite) {
  return Math.min(MARGEN_AVISO, Math.round(limite * 0.1));
}

// Estado del contador: ok, cerca (dentro del margen) o sobre (pasado).
export function estadoContador(n, limite) {
  if (!limite) return 'ok';
  if (n > limite) return 'sobre';
  if (n >= limite - margenDe(limite)) return 'cerca';
  return 'ok';
}

// Número de preguntas de texto largo de un formulario, contando las de los
// bloques repetibles una sola vez. Sirve para la barra de progreso.
export function preguntasTexto(formulario) {
  return formulario.bloques.flatMap((b) => b.preguntas.filter((p) => p.tipo === 'texto'));
}

// Exporta un borrador al markdown que usan las herramientas de la skill de
// redacción: "## Bloque", "### Pregunta literal", respuesta y una línea de
// recuento que contar.py ignora. Las fichas repetidas van numeradas.
export function aMarkdown(borrador, formulario) {
  const campos = borrador.respuestas?.campos ?? {};
  const repetidos = borrador.respuestas?.repetidos ?? {};
  const lineas = [`# ${borrador.titulo}`, '', `Acción: ${formulario.accion}, ${formulario.nombre}`, ''];

  const tieneAlgo = (preguntas, valores) =>
    preguntas.some((p) => valores[p.id] !== undefined && valores[p.id] !== null && valores[p.id] !== '');

  const volcar = (preguntas, valores) => {
    preguntas.forEach((p) => {
      const v = valores[p.id];
      if (v === undefined || v === null || v === '') return;
      // El encabezado va en una sola línea: contar.py toma como respuesta
      // todo lo que sigue a "### " hasta el siguiente encabezado.
      lineas.push(`### ${p.texto.replace(/\s*\n\s*/g, ' ')}`, '');
      if (p.tipo === 'texto') {
        lineas.push(String(v), '', `*${contar(v).toLocaleString('es-ES')} caracteres*`, '');
      } else if (p.tipo === 'opciones' && Array.isArray(v)) {
        lineas.push(v.map((o) => `- ${o}`).join('\n'), '');
      } else {
        lineas.push(String(v), '');
      }
    });
  };

  // Los bloques sin nada escrito no se exportan
  formulario.bloques.forEach((b) => {
    if (b.repetible) {
      const fichas = (Array.isArray(repetidos[b.id]) ? repetidos[b.id] : []).filter((f) => f && tieneAlgo(b.preguntas, f));
      if (!fichas.length) return;
      lineas.push(`## ${b.titulo}`, '');
      fichas.forEach((ficha, i) => {
        lineas.push(`#### ${b.etiquetaRepetible ?? 'Ficha'} ${i + 1}`, '');
        if (typeof ficha._padre === 'string') lineas.push(`Pertenece a: ${ficha._padre}`, '');
        volcar(b.preguntas, ficha);
      });
    } else if (tieneAlgo(b.preguntas, campos)) {
      lineas.push(`## ${b.titulo}`, '');
      volcar(b.preguntas, campos);
    }
  });
  return lineas.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

// ── Claves de pregunta ─────────────────────────────────────────────────
// Cada respuesta se identifica con una clave: el id de la pregunta o, en las
// fichas repetidas, "bloque[n].pregunta" con n desde 1. La usan los
// comentarios y la comparación entre versiones.
const RE_CLAVE_FICHA = /^(.+)\[(\d+)\]\.(.+)$/;

export function partirClave(clave) {
  const m = String(clave).match(RE_CLAVE_FICHA);
  return m ? { bloque: m[1], ficha: Number(m[2]), pregunta: m[3] } : { bloque: null, ficha: null, pregunta: String(clave) };
}

// Lista plana { clave, bloque, indiceBloque, pregunta, numero, ficha, valor }
// con todas las respuestas que tienen algo, en el orden del formulario.
export function aplanar(respuestas, formulario) {
  const campos = respuestas?.campos ?? {};
  const repetidos = respuestas?.repetidos ?? {};
  const out = [];
  const lleno = (v) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0);
  formulario.bloques.forEach((b, ib) => {
    if (b.repetible) {
      (Array.isArray(repetidos[b.id]) ? repetidos[b.id] : []).forEach((ficha, i) => {
        b.preguntas.forEach((p, k) => {
          const v = ficha?.[p.id];
          if (lleno(v)) out.push({ clave: `${b.id}[${i + 1}].${p.id}`, bloque: b, indiceBloque: ib, pregunta: p, numero: k + 1, ficha: i + 1, valor: v });
        });
      });
    } else {
      b.preguntas.forEach((p, k) => {
        const v = campos[p.id];
        if (lleno(v)) out.push({ clave: p.id, bloque: b, indiceBloque: ib, pregunta: p, numero: k + 1, ficha: null, valor: v });
      });
    }
  });
  return out;
}

// Pone (o quita, con undefined) el valor de una clave en unas respuestas.
export function ponerValor(respuestas, clave, valor) {
  const { bloque, ficha, pregunta } = partirClave(clave);
  if (bloque) {
    respuestas.repetidos ??= {};
    const fichas = (respuestas.repetidos[bloque] ??= []);
    while (fichas.length < ficha) fichas.push({});
    if (valor === undefined) delete fichas[ficha - 1][pregunta];
    else fichas[ficha - 1][pregunta] = valor;
  } else {
    respuestas.campos ??= {};
    if (valor === undefined) delete respuestas.campos[pregunta];
    else respuestas.campos[pregunta] = valor;
  }
}

// Nombre legible de una clave: "3.2 Título del bloque" o con la ficha.
export function etiquetaClave(clave, formulario) {
  const limpia = String(clave).replace(/~quitada$/, '');
  const { bloque, ficha, pregunta } = partirClave(limpia);
  for (const [ib, b] of formulario.bloques.entries()) {
    if (bloque && b.id !== bloque) continue;
    const k = b.preguntas.findIndex((p) => p.id === pregunta);
    if (k === -1) continue;
    const ficha_ = ficha ? ` · ${b.etiquetaRepetible ?? 'Ficha'} ${ficha}` : '';
    return `${ib + 1}.${k + 1} ${b.tituloEs ?? b.titulo}${ficha_}`;
  }
  return limpia;
}

// ── Avisos de redacción ────────────────────────────────────────────────
// Las comprobaciones baratas de assets/comprobacion_mecanica.py de la skill
// redaccion-proyectos, para verlas mientras se escribe. Son avisos, no
// bloquean nada. Devuelve [{ id, texto, n, posiciones: [[inicio, fin]] }].
const AVISOS = [
  { id: 'guion', re: /[–—]/g, uno: 'guion largo', varios: 'guiones largos' },
  { id: 'emoji', re: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu, uno: 'emoji', varios: 'emojis' },
  { id: 'marca', re: /\b(?:TODO|TBD|XXX|FIXME|LOREM)\b/g, uno: 'marca de edición olvidada (TODO, XXX…)', varios: 'marcas de edición olvidadas (TODO, XXX…)' },
  { id: 'vacio', re: /\[\s*\]/g, uno: 'corchete vacío', varios: 'corchetes vacíos' },
  { id: 'hueco', re: /\[[^\][\n]{2,80}\]/g, uno: 'dato entre corchetes por completar', varios: 'datos entre corchetes por completar' },
  // La letra de delante solo sirve para no contar la sangría: se marca desde el espacio
  { id: 'espacios', re: /\S {2,}(?=\S)/g, desde: 1, uno: 'doble espacio', varios: 'dobles espacios' },
  { id: 'admin', re: /\bE1\d{7}\b|\b(?:OID|PIC)\b\s*[:nº#]?\s*\d|\bno\s+(?:somos|es|son)\s+(?:un\s+)?organismo\s+p[uú]blico\b|\bnot\s+a\s+public\s+body\b/gi,
    uno: 'dato administrativo que el formulario ya trae (OID, PIC, organismo público)', varios: 'datos administrativos que el formulario ya trae (OID, PIC, organismo público)' },
  { id: 'idioma', re: /\bnivel(?:es)?\s+(?:de\s+)?(?:idioma|ingl[eé]s|lengua)\b|\b(?:english|language)\s+(?:level|proficiency|requirement)\b|\blevel\s+of\s+english\b|\b(?:buen|alto|b[aá]sico|suficiente|intermedio)\s+nivel\s+de\s+ingl[eé]s\b|\b(?:good|basic|working|fluent|intermediate)\s+(?:command\s+of\s+|knowledge\s+of\s+)?english\b/gi,
    uno: 'mención al nivel de idioma (mejor contar el apoyo que se da)', varios: 'menciones al nivel de idioma (mejor contar el apoyo que se da)' },
  { id: 'fuente', re: /\([^)]{0,120}?\b(?:provided by|according to|as reported by|source:|facilitad[oa]s? por|proporcionad[oa]s? por|aportad[oa]s? por|comunicad[oa]s? por|seg[uú]n (?:el|la|los|las)\s+(?:PIF|socia|socias|coordinadora|organizaci[oó]n))\b[^)]{0,120}?\)/gi,
    uno: 'paréntesis que cita de dónde sale un dato', varios: 'paréntesis que citan de dónde sale un dato' },
  { id: 'anglicismo', soloEs: true, re: /\b(?:feedback|newcomers?|networking|know-how|deadline)\b/gi, uno: 'anglicismo evitable', varios: 'anglicismos evitables' },
  { id: 'enumera', soloEs: true, re: /\b(?:distinguimos|identificamos|hemos identificado|se articula en|abordamos)\s+(?:dos|tres|cuatro|cinco)\b/gi,
    uno: 'apertura enumerativa ("distinguimos tres…")', varios: 'aperturas enumerativas ("distinguimos tres…")' },
  // Uno por respuesta se tolera; el aviso salta a partir del segundo
  { id: 'nosino', soloEs: true, minimo: 2, re: /\bno\s+[^.,;\n]{2,60},?\s+sino\b/gi, uno: '', varios: 'veces "no X, sino Y" (como mucho uno por bloque)' },
];

export function avisosRedaccion(texto, idioma = 'es') {
  const t = String(texto ?? '');
  if (!t.trim()) return [];
  const out = [];
  for (const a of AVISOS) {
    if (a.soloEs && idioma !== 'es') continue;
    const posiciones = [...t.matchAll(a.re)].map((m) => [m.index + (a.desde ?? 0), m.index + m[0].length]);
    const n = posiciones.length;
    if (n >= (a.minimo ?? 1)) out.push({ id: a.id, n, texto: `${n} ${n === 1 ? a.uno : a.varios}`, posiciones });
  }
  return out;
}
