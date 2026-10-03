// Workflow de evaluación simulada calibrada. Dada una solicitud ensamblada, su
// acción y su agencia, lanza dos evaluadores ciegos con personas distintas
// (A, veterana de agencia que desconfía de la ambición; B, especialista externa
// en trabajo juvenil e inclusión) que aplican el prompt calibrado de
// assets/evaluador/evaluador.md, la rúbrica de la acción y las anclas de
// assets/evaluador/anclas.md si existe. El código calcula la mediana por
// criterio y devuelve nota, banda, debilidades decisivas, recorte probable y el
// margen de error de assets/evaluador/calibracion.md.
//
// Es la fuente de la nota estimada de los pasos 5 y 8 de SKILL.md. La nota se
// comunica siempre con su margen ("75 más o menos 6"), nunca la cifra sola.
//
// PARA ADAPTARLO solo hay que editar el bloque DATOS. Si calibracion.md cambia
// el margen o la versión del prompt, hay que cambiar aquí MARGEN y VERSION.
//
// Ciego. Los evaluadores no deben ver la nota real ni la carta. No sirve para
// medir el acierto sobre las 13 solicitudes de calibración, porque las anclas
// citan sus pasajes y sus notas (ver calibracion.md). Para la ronda de octubre
// de 2026, pasar cada solicitud ANTES de conocer su nota y congelar el
// resultado en calibracion.md.
//
// El script no puede escribir ficheros: si TRABAJO no es null, el último agente
// guarda evaluacion_simulada.md tal cual se lo pasa el código.

export const meta = {
  name: 'evaluacion-simulada',
  description: 'Dos evaluadores ciegos calibrados puntúan la solicitud ensamblada; mediana por criterio, banda, recorte y margen de error',
  phases: [
    { title: 'Evaluacion', detail: 'evaluadora veterana de agencia y especialista en trabajo juvenil e inclusión, en paralelo' },
    { title: 'Informe', detail: 'mediana por criterio, banda, margen y evaluacion_simulada.md' },
  ],
}

// ---------------------------------------------------------------- DATOS
const SKILL = '[RUTA ABSOLUTA de .claude/skills/redaccion-proyectos]'
// Carpeta trabajo/ del proyecto donde guardar evaluacion_simulada.md, o null
// para no guardar nada y quedarse solo con el resultado del workflow.
const TRABAJO = '[RUTA ABSOLUTA de la carpeta trabajo/ del proyecto, o null]'

const SOLICITUD = {
  titulo: '[TÍTULO]',
  fichero: '[RUTA ABSOLUTA del markdown ensamblado tal como se presenta]',
  accion: 'ka152-you', // clave de perfiles/rubricas/<accion>.md
  accionNombre: '[CÓDIGO DE ACCIÓN, nombre completo]',
  agencia: 'ES02 INJUVE', // o 'FR02 Agence du Service Civique'
  territorio: '[comunidad autónoma o región con la que compite en el cupo]',
}

// Versión del prompt y margen vigentes, copiados de assets/evaluador/calibracion.md.
const VERSION = 'v1, calibrada el 2026-10-03'
const MARGEN = 6
// Margen para las acciones sin ningún caso en la calibración (MAE de la v0).
const MARGEN_SIN_CALIBRAR = 10

const FICHEROS = {
  prompt: `${SKILL}/assets/evaluador/evaluador.md`,
  anclas: `${SKILL}/assets/evaluador/anclas.md`, // se lee si existe
  rubrica: `${SKILL}/perfiles/rubricas/${SOLICITUD.accion}.md`,
}

// ---------------------------------------------------------------- CRITERIOS
// Criterios y máximos por acción, en el orden de la carta. Las cinco primeras
// están calibradas; KA210 y KA220 no tienen ningún caso con nota real.
const CRITERIOS = {
  'ka152-you': [['Relevancia, justificación e impacto', 30], ['Calidad del diseño y la ejecución', 40], ['Calidad de la gestión', 30]],
  'ka153-you': [['Relevancia, justificación e impacto', 30], ['Calidad del diseño y la implementación', 40], ['Calidad de la gestión', 30]],
  'ka154-you': [['Relevancia, justificación e impacto', 30], ['Calidad del diseño y la implementación', 40], ['Calidad de la gestión', 30]],
  'ka155-you': [['Relevancia, justificación e impacto', 40], ['Calidad del diseño', 40], ['Calidad de la gestión', 20]],
  'esc30-sol': [['Relevancia, justificación e impacto', 40], ['Calidad del diseño', 40], ['Calidad de la gestión', 20]],
  'ka210-you': [['Relevancia', 30], ['Calidad del diseño y la implementación', 30], ['Calidad de la asociación y de los acuerdos de cooperación', 20], ['Impacto', 20]],
  'ka220-yth': [['Relevancia', 25], ['Calidad del diseño y la implementación', 30], ['Calidad de la asociación y de los acuerdos de cooperación', 20], ['Impacto', 25]],
}
const CALIBRADAS = ['ka152-you', 'ka153-you', 'ka154-you', 'ka155-you', 'esc30-sol']

const calibrada = CALIBRADAS.includes(SOLICITUD.accion)
const fijos = CRITERIOS[SOLICITUD.accion] || null
const margen = calibrada ? MARGEN : MARGEN_SIN_CALIBRAR
if (!fijos) log(`AVISO: acción "${SOLICITUD.accion}" sin criterios fijos; se toman los que devuelvan los evaluadores desde la rúbrica`)
if (!calibrada) log(`AVISO: acción "${SOLICITUD.accion}" sin calibrar; la nota es orientativa y el margen sube a ${MARGEN_SIN_CALIBRAR}`)

// ---------------------------------------------------------------- PERSONAS
const PERSONAS = [
  {
    clave: 'A',
    nombre: 'veterana de agencia',
    lente: 'Llevas muchas rondas evaluando para la agencia nacional y has visto muchos proyectos ambiciosos que luego no se ejecutan. Desconfías de la ambición, de las metas de alcance sin base, de los consorcios grandes para actividades cortas y de las cifras que cambian entre secciones. Te preguntas siempre si la entidad puede hacer de verdad lo que promete con los días, el dinero y la gente que declara, y qué recortarías si lo aprobaras.',
  },
  {
    clave: 'B',
    nombre: 'especialista en trabajo juvenil e inclusión',
    lente: 'Eres experta externa que viene del trabajo juvenil de base y de la inclusión. Miras si la necesidad es de jóvenes reales de un territorio concreto y no de la propia red, si las personas con menos oportunidades llegan de verdad (criterios de selección, cupo, apoyos por barrera), qué deciden los jóvenes en cada fase y si el método es aprendizaje no formal y no lógica académica o competitiva. Te fijas en quién gana algo fuera del grupo que viaja.',
  },
]

// ---------------------------------------------------------------- SCHEMA
const EVALUACION = {
  type: 'object',
  additionalProperties: false,
  properties: {
    perfil: { type: 'string', enum: ['A', 'B', 'C'] },
    razonPerfil: { type: 'string' },
    nucleos: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          nucleo: { type: 'string', enum: ['N1', 'N2', 'N3', 'N4', 'N5'] },
          respuesta: { type: 'string', enum: ['si', 'parcial', 'no'] },
          pasaje: { type: 'string' },
        },
        required: ['nucleo', 'respuesta', 'pasaje'],
      },
    },
    criterios: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          criterio: { type: 'string' },
          puntos: { type: 'integer' },
          maximo: { type: 'integer' },
          justificacion: { type: 'string' },
        },
        required: ['criterio', 'puntos', 'maximo', 'justificacion'],
      },
    },
    topesAplicados: { type: 'array', items: { type: 'string' } },
    suelosAplicados: { type: 'array', items: { type: 'string' } },
    fortalezas: { type: 'array', items: { type: 'string' } },
    debilidadesDecisivas: { type: 'array', items: { type: 'string' } },
    incoherencias: { type: 'array', items: { type: 'string' } },
    recorte: { type: 'string' },
    fraseCarta: { type: 'string' },
  },
  required: ['perfil', 'razonPerfil', 'nucleos', 'criterios', 'topesAplicados', 'suelosAplicados', 'fortalezas', 'debilidadesDecisivas', 'incoherencias', 'recorte', 'fraseCarta'],
}

// ---------------------------------------------------------------- PROMPT
const listaCriterios = fijos
  ? fijos.map(([n, m], i) => `${i + 1}. ${n} (máximo ${m})`).join('\n')
  : 'Los criterios y máximos de la rúbrica, en su orden.'

const promptEvaluador = p => `Eres la evaluadora ${p.clave} (${p.nombre}) de una solicitud ${SOLICITUD.accionNombre} titulada "${SOLICITUD.titulo}", presentada a ${SOLICITUD.agencia}. Compite por el cupo de ${SOLICITUD.territorio}.

${p.lente}

Tu lente cambia dónde miras primero, no las reglas. Las reglas, los topes, los suelos y la autocomprobación son los del prompt calibrado, iguales para cualquier evaluador.

LEE con Read, en este orden:
1. ${FICHEROS.prompt} (tus instrucciones completas; síguelas al pie de la letra, incluido el Paso 0, los topes T1 a T14, los suelos S1 a S4 y la autocomprobación)
2. ${FICHEROS.anclas} (anclas de calibración con pasajes reales y su nota; si el fichero no existe, sigue sin él)
3. ${FICHEROS.rubrica}, SOLO hasta el encabezado "## Cómo sacar el máximo". Lo que viene después (consejos para redactores y "Lo que dicen las cartas reales") no es para ti.
4. ${SOLICITUD.fichero} (la solicitud COMPLETA, de principio a fin)

EVALUACIÓN CIEGA. No abras ningún otro fichero. En concreto, no abras assets/evaluador/calibracion.md, src/lib/candidaturas.mjs, historial/, comun/lecciones_evaluadores.md ni nada de proyectos/referencias/resultados/, y no busques la nota de esta solicitud ni de otras. Si reconoces la solicitud por una ancla, dilo en razonPerfil y puntúa solo lo escrito.

DEVUELVE el objeto estructurado:
- perfil (A, B o C) y razonPerfil en una línea.
- nucleos, N1 a N5, con respuesta (si, parcial o no) y el pasaje literal breve que la prueba.
- criterios, exactamente estos y en este orden, con puntos enteros:
${listaCriterios}
  En cada uno, justificación en tres líneas como máximo con lo que suma y lo que resta.
- topesAplicados y suelosAplicados, con su código (T6, S1...) y el motivo en pocas palabras. Vacíos si no hay.
- fortalezas, tres.
- debilidadesDecisivas, tres, las que decidieron el perfil y la nota.
- incoherencias entre secciones (cifras, sedes, fechas, socias), con las dos versiones.
- recorte, qué quitaría la agencia si la aprobara (actividad, meses, participantes, días o viajes) y por qué. Si no la aprobaría, escribe "no aplica".
- fraseCarta, la frase principal que escribirías en la carta.

No propongas texto nuevo para la solicitud.`

// ---------------------------------------------------------------- EVALUACIÓN
phase('Evaluacion')

const resultados = await parallel(PERSONAS.map(p => () => agent(promptEvaluador(p), {
  label: `evaluadora:${p.clave}`,
  phase: 'Evaluacion',
  schema: EVALUACION,
})))

const validas = []
resultados.forEach((r, i) => {
  if (!r) { log(`AVISO: la evaluadora ${PERSONAS[i].clave} no respondió`); return }
  validas.push({ persona: PERSONAS[i], r })
})
if (!validas.length) {
  log('ERROR: ninguna evaluadora respondió; no hay nota')
  return { error: 'sin evaluaciones', solicitud: SOLICITUD.titulo }
}
if (validas.length < PERSONAS.length) log('AVISO: nota con una sola evaluadora; la mediana es esa evaluación y el margen no cambia, pero la estimación es menos fiable')

// ---------------------------------------------------------------- AGREGACIÓN
phase('Informe')

const mediana = arr => {
  const s = [...arr].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
// Medio punto hacia arriba, como en la calibración.
const redondear = x => Math.floor(x + 0.5)

const banda = (puntos, maximo) => {
  if (puntos >= Math.ceil(maximo * 0.85)) return 'Muy bueno'
  if (puntos >= Math.ceil(maximo * 0.7)) return 'Bueno'
  if (puntos >= Math.ceil(maximo * 0.5)) return 'Suficiente'
  return 'Débil'
}

const plantilla = fijos || validas[0].r.criterios.map(c => [c.criterio, c.maximo])
const criterios = plantilla.map(([nombre, maximo], i) => {
  const individuales = validas.map(v => {
    const c = v.r.criterios[i]
    if (!c) { log(`AVISO: la evaluadora ${v.persona.clave} no puntuó el criterio ${i + 1} (${nombre})`); return null }
    if (c.maximo !== maximo) log(`AVISO: la evaluadora ${v.persona.clave} usó máximo ${c.maximo} en ${nombre}; se toma ${maximo}`)
    return Math.max(0, Math.min(maximo, c.puntos))
  }).filter(x => x !== null)
  const puntos = individuales.length ? redondear(mediana(individuales)) : 0
  return { criterio: nombre, puntos, maximo, banda: banda(puntos, maximo), individuales }
})

const total = criterios.reduce((s, c) => s + c.puntos, 0)
const totalesIndividuales = validas.map(v => ({
  evaluadora: v.persona.clave,
  total: v.r.criterios.reduce((s, c) => s + c.puntos, 0),
  perfil: v.r.perfil,
}))
const criterioDebil = criterios.filter(c => c.puntos < c.maximo / 2)
const umbralSuperado = total >= 60 && !criterioDebil.length

const bandaGlobal = !umbralSuperado
  ? `por debajo del umbral${criterioDebil.length ? ` (${criterioDebil.map(c => c.criterio).join(', ')} bajo la mitad)` : ''}, rechazo probable`
  : total >= 72
    ? 'financiable si hay cupo'
    : 'supera el umbral, pero sin fondos probables en agencias con cupo territorial'

const minimo = total - margen
const maximo = total + margen
const avisos = []
if (minimo < 60 && maximo >= 60) avisos.push('el intervalo cruza el umbral de 60: puede quedar por debajo')
if (minimo < 72 && maximo >= 72) avisos.push('el intervalo cruza 72: la financiación no está asegurada y depende del cupo')
if (!calibrada) avisos.push('acción sin calibrar: nota orientativa')
const perfiles = [...new Set(validas.map(v => v.r.perfil))]
if (perfiles.length > 1) avisos.push(`las evaluadoras asignan perfiles distintos (${totalesIndividuales.map(t => `${t.evaluadora} ${t.perfil}`).join(', ')}): revisar los núcleos antes de comunicar la nota`)
const dispersion = Math.max(...totalesIndividuales.map(t => t.total)) - Math.min(...totalesIndividuales.map(t => t.total))
if (dispersion > margen) avisos.push(`las evaluadoras se separan ${dispersion} puntos, más que el margen`)

const notaConMargen = `${total} más o menos ${margen}`
log(`Nota estimada ${notaConMargen} (${criterios.map(c => `${c.puntos}/${c.maximo}`).join(', ')}). ${bandaGlobal}.`)
avisos.forEach(a => log(`AVISO: ${a}`))

// Debilidades y recortes de las dos, sin repetir los idénticos.
const norm = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim()
const unir = campo => {
  const vistos = new Set()
  const out = []
  for (const v of validas) {
    for (const x of [].concat(v.r[campo] || [])) {
      if (!x || vistos.has(norm(x))) continue
      vistos.add(norm(x))
      out.push({ evaluadora: v.persona.clave, texto: x })
    }
  }
  return out
}
const debilidades = unir('debilidadesDecisivas')
const recortes = unir('recorte').filter(x => norm(x.texto) !== 'no aplica')
const frases = unir('fraseCarta')
const incoherencias = unir('incoherencias')
const fortalezas = unir('fortalezas')

// ---------------------------------------------------------------- INFORME
const celda = s => String(s || '').replace(/\|/g, '/').replace(/\n+/g, ' ')
const md = []
md.push(`# Evaluación simulada. ${SOLICITUD.titulo} (${SOLICITUD.accionNombre})`)
md.push('')
md.push(`Solicitud evaluada: ${SOLICITUD.fichero}`)
md.push(`Agencia: ${SOLICITUD.agencia}. Cupo: ${SOLICITUD.territorio}. Prompt: ${VERSION}.`)
md.push('')
md.push(`**Nota estimada: ${notaConMargen}** (intervalo ${minimo} a ${maximo}). ${bandaGlobal.charAt(0).toUpperCase()}${bandaGlobal.slice(1)}.`)
if (avisos.length) {
  md.push('')
  avisos.forEach(a => md.push(`- Aviso: ${a}.`))
}
md.push('')
md.push(`| Criterio | Mediana | Máximo | Banda | ${validas.map(v => `Evaluadora ${v.persona.clave}`).join(' | ')} |`)
md.push(`|---|---|---|---|${validas.map(() => '---').join('|')}|`)
for (const c of criterios) md.push(`| ${celda(c.criterio)} | ${c.puntos} | ${c.maximo} | ${c.banda} | ${c.individuales.join(' | ')} |`)
md.push(`| Total | ${total} | 100 | | ${totalesIndividuales.map(t => t.total).join(' | ')} |`)
md.push('')
md.push(`Perfiles: ${totalesIndividuales.map(t => `${t.evaluadora} ${t.perfil}`).join(', ')}.`)
for (const v of validas) {
  md.push('')
  md.push(`## Evaluadora ${v.persona.clave} (${v.persona.nombre})`)
  md.push('')
  md.push(`Perfil ${v.r.perfil}. ${v.r.razonPerfil}`)
  md.push('')
  md.push('| Núcleo | Respuesta | Pasaje |')
  md.push('|---|---|---|')
  for (const n of v.r.nucleos) md.push(`| ${n.nucleo} | ${n.respuesta} | ${celda(n.pasaje)} |`)
  md.push('')
  for (const c of v.r.criterios) md.push(`- ${c.criterio}, ${c.puntos}/${c.maximo}. ${celda(c.justificacion)}`)
  if (v.r.topesAplicados.length) md.push(`- Topes: ${v.r.topesAplicados.map(celda).join('; ')}`)
  if (v.r.suelosAplicados.length) md.push(`- Suelos: ${v.r.suelosAplicados.map(celda).join('; ')}`)
}
const seccion = (titulo, items) => {
  md.push('')
  md.push(`## ${titulo}`)
  md.push('')
  if (!items.length) { md.push('Ninguna.'); return }
  items.forEach(x => md.push(`- (${x.evaluadora}) ${celda(x.texto)}`))
}
seccion('Debilidades decisivas', debilidades)
seccion('Recorte probable', recortes)
seccion('Incoherencias', incoherencias)
seccion('Fortalezas', fortalezas)
seccion('Frase de carta', frases)
md.push('')
md.push(`El margen sale de assets/evaluador/calibracion.md. La nota se comunica siempre con él: "${notaConMargen}".`)
md.push('')

const contenido = md.join('\n')
let fichero = null
let guardado = null
if (TRABAJO && !String(TRABAJO).startsWith('[')) {
  fichero = `${TRABAJO}/evaluacion_simulada.md`
  guardado = await agent(`Guarda con Write el fichero ${fichero} con EXACTAMENTE el contenido que va entre las marcas INICIO y FIN, sin cambiar, resumir ni añadir nada, con saltos de línea LF. Tu respuesta final es solo "OK" y el número de caracteres guardados.

INICIO
${contenido}
FIN`, { label: 'escribir:evaluacion', phase: 'Informe', effort: 'low' })
  if (!guardado) log(`AVISO: no se pudo guardar ${fichero}; el contenido está en el resultado del workflow`)
}

return {
  solicitud: SOLICITUD.titulo,
  accion: SOLICITUD.accion,
  agencia: SOLICITUD.agencia,
  version: VERSION,
  nota: total,
  margen,
  notaConMargen,
  intervalo: [minimo, maximo],
  banda: bandaGlobal,
  umbralSuperado,
  criterios: criterios.map(c => ({ criterio: c.criterio, puntos: c.puntos, maximo: c.maximo, banda: c.banda, individuales: c.individuales })),
  evaluadoras: totalesIndividuales,
  avisos,
  debilidadesDecisivas: debilidades.map(x => `(${x.evaluadora}) ${x.texto}`),
  recorteProbable: recortes.map(x => `(${x.evaluadora}) ${x.texto}`),
  fraseCarta: frases.map(x => `(${x.evaluadora}) ${x.texto}`),
  fichero: guardado ? fichero : null,
  contenido: guardado ? null : contenido,
}
