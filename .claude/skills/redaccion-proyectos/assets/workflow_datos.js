// Workflow de datos con fuente para la biblia: un investigador por frente y un
// verificador por dato que relee la URL. Solo lo confirmado entra en
// trabajo/datos_verificados.md; lo refutado y lo que no se pudo abrir se listan
// aparte para que el usuario decida. Es la palanca que más sube relevancia
// (comun/maximizar_puntuacion.md, "Datos con fuente nombrada en la frase").
//
// PARA ADAPTARLO solo hay que editar el bloque DATOS: la carpeta trabajo/, el
// proyecto, los ficheros de contexto y la lista de FRENTES.
//
// El script no puede escribir ficheros. El último agente recibe la lista ya
// filtrada y la guarda tal cual con Write. Si se relanza con resumeFromRunId,
// los agentes ya terminados vuelven de caché y solo corre lo que cambió.

export const meta = {
  name: 'datos-con-fuente',
  description: 'Investigar datos con fuente por frente y verificar cada URL antes de la biblia',
  phases: [
    { title: 'Investigacion', detail: 'un investigador por frente' },
    { title: 'Verificacion', detail: 'un verificador por dato, relee la URL' },
    { title: 'Salida', detail: 'escribe trabajo/datos_verificados.md' },
  ],
}

// ---------------------------------------------------------------- DATOS
const TRABAJO = '[RUTA ABSOLUTA de la carpeta trabajo/ del proyecto]'

const PROYECTO = {
  titulo: '[TÍTULO]',
  accion: '[CÓDIGO DE ACCIÓN, nombre completo]',
  territorio: '[ciudad, provincia o región y país donde pasa el proyecto]',
  idioma: 'español', // idioma de los enunciados y de las notas del fichero de salida
  publico: '[quién es el público: edad, situación, barrera principal]',
  tema: '[tema del proyecto en una frase]',
  anioMinimo: 2019, // los datos más viejos solo se aceptan si no hay otros y se avisa
  datosPorFrente: 10, // objetivo por frente; entre 6 y 12 funciona bien
}

// Ficheros que el investigador puede leer para orientarse (biblia a medias,
// perfil de la acción, ficha de la solicitante). Dejar [] si no hay.
const CONTEXTO = [
  // `${TRABAJO}/biblia_[proyecto].md`,
]

// Un investigador por frente. Las pistas dicen qué buscar y en qué fuentes.
const FRENTES = [
  {
    clave: 'jovenes',
    titulo: 'Situación de los jóvenes del territorio',
    pistas: 'Paro juvenil, abandono escolar temprano, jóvenes que ni estudian ni trabajan, emancipación, salud mental, participación, y lo que toque al tema del proyecto. Fuentes: INE, instituto de estadística regional, Eurostat, INJUVE, EU Youth Report, encuestas oficiales con año. Preferir el dato del territorio al nacional y el nacional al europeo, y traer los tres cuando el contraste ayude.',
  },
  {
    clave: 'actores',
    titulo: 'Actores y servicios locales',
    pistas: 'Servicios públicos y entidades que trabajan con el público del proyecto: centros de juventud, servicios sociales, sanidad, educación, asociaciones, programas municipales. Para cada uno, qué hace, a cuánta gente atiende, desde cuándo y dónde consta. Solo nombres de entidades y servicios, nunca datos de personas.',
  },
  {
    clave: 'normativa',
    titulo: 'Marco normativo y estrategias',
    pistas: 'Leyes, planes y estrategias vigentes (local, autonómico, estatal, europeo) que respalden el tema, con el artículo, el objetivo o la medida literal que encaja con el proyecto.',
  },
  {
    clave: 'agencia',
    titulo: 'Prioridades de la agencia y de la convocatoria',
    pistas: 'Prioridades publicadas por la agencia nacional o el programa para el año de la convocatoria, temas de la convocatoria, Youth Goals, EU Youth Strategy, con la cita exacta de la página o la guía donde aparecen.',
  },
]

// ---------------------------------------------------------------- SCHEMAS
const DATOS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    datos: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          enunciado: { type: 'string' }, // frase lista para la biblia, con la fuente y el año dentro
          cifra: { type: 'string' },
          fuente: { type: 'string' }, // organismo o publicación
          url: { type: 'string' }, // página exacta donde está la cifra
          anio: { type: 'string' }, // año del dato, no de la consulta
          cita: { type: 'string' }, // cita literal de la página, una a tres frases
          uso: { type: 'string' }, // bloque o criterio de la solicitud donde sirve
        },
        required: ['enunciado', 'cifra', 'fuente', 'url', 'anio', 'cita', 'uso'],
      },
    },
    huecos: { type: 'array', items: { type: 'string' } }, // lo que se buscó y no se encontró con fuente
  },
  required: ['datos', 'huecos'],
}

const VEREDICTO_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    veredicto: { type: 'string', enum: ['confirmado', 'corregido', 'refutado', 'no_accesible'] },
    citaEncontrada: { type: 'string' }, // lo que de verdad dice la página, literal
    correccion: { type: 'string' }, // enunciado corregido si la cifra, el año o la fuente estaban mal; vacío si no
    motivo: { type: 'string' },
  },
  required: ['veredicto', 'citaEncontrada', 'correccion', 'motivo'],
}

// ---------------------------------------------------------------- PROMPTS
const promptInvestigar = f => `Eres investigador de datos para una solicitud ${PROYECTO.accion} (proyecto ${PROYECTO.titulo}). Trabajas en ${PROYECTO.idioma}.

TERRITORIO: ${PROYECTO.territorio}
PÚBLICO: ${PROYECTO.publico}
TEMA: ${PROYECTO.tema}
${CONTEXTO.length ? `\nCONTEXTO. Lee antes con Read estos ficheros para saber qué necesita el proyecto:\n${CONTEXTO.map(c => `- ${c}`).join('\n')}\n` : ''}
TU FRENTE: ${f.titulo}.
${f.pistas}

CÓMO TRABAJAR: busca con WebSearch y abre cada página con WebFetch (si las herramientas no están cargadas, cárgalas con ToolSearch). Objetivo: unos ${PROYECTO.datosPorFrente} datos útiles para argumentar relevancia, necesidades y prioridades. Cada dato cumple todo esto:
- La URL es la página exacta donde aparece la cifra, no la portada del organismo ni un buscador. Si el dato está en un PDF, la URL abre ese PDF.
- La cita es literal, copiada de la página, y contiene la cifra. Si la página no está en ${PROYECTO.idioma}, la cita va en su idioma original.
- El año es el del dato, no el de la consulta. Datos anteriores a ${PROYECTO.anioMinimo} solo si no hay otros, y dilo en el enunciado.
- El enunciado es una frase lista para pegar en la biblia con la fuente y el año dentro, del tipo "según la Encuesta X del organismo Y (2024), el 23 % de...". Nada de "cada vez más jóvenes".
- Fuentes oficiales o de organismos reconocidos antes que prensa. La prensa solo vale si cita la fuente original y no la encuentras.
- Prohibido inventar o redondear. Si no encuentras un dato con fuente, va a "huecos" con lo que buscaste, para que lo decida el usuario.
- Nada de datos personales: ni nombres de personas, ni cargos con nombre, ni contactos. Solo entidades, servicios y cifras.

Devuelve solo el objeto estructurado.`

const promptVerificar = (d, f) => `Eres verificador adversarial de datos para una solicitud ${PROYECTO.accion}. Tu trabajo es intentar tumbar este dato releyendo su fuente. No busques fuentes alternativas: solo compruebas la URL dada.

DATO (frente ${f.titulo}):
- Enunciado: ${d.enunciado}
- Cifra: ${d.cifra}
- Fuente: ${d.fuente}
- Año: ${d.anio}
- URL: ${d.url}
- Cita que dice haber copiado: ${d.cita}

PASOS: abre la URL con WebFetch (cárgala con ToolSearch si hace falta). Si falla, prueba una segunda vez. Busca en la página la cifra, el año y el contexto de la cita.

VEREDICTO:
- "confirmado" solo si la página contiene la cifra y el año tal cual, o con un cálculo trivial que expliques en motivo, y el enunciado no distorsiona lo que dice la fuente.
- "corregido" si la página respalda el dato pero la cifra, el año, el ámbito o el nombre de la fuente estaban mal. Escribe en correccion el enunciado corregido completo, con lo que de verdad dice la página.
- "refutado" si la página abre y no respalda el dato, o la cita no está, o el enunciado dice algo que la fuente no dice. Explica en motivo qué dice en realidad.
- "no_accesible" si no se pudo abrir en dos intentos.
En citaEncontrada copia el fragmento literal de la página que respalda tu veredicto, o déjalo vacío si no hay. En la duda, refutado.`

// ---------------------------------------------------------------- UTILIDADES
const norm = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim()
const claveDato = d => `${norm(d.url)}|${norm(d.cifra)}`

// ---------------------------------------------------------------- INVESTIGACIÓN Y VERIFICACIÓN
// Sin barrera entre fases: cada frente pasa a verificación en cuanto termina.
phase('Investigacion')

const resultados = await pipeline(
  FRENTES,
  f => agent(promptInvestigar(f), { label: `investigar:${f.clave}`, phase: 'Investigacion', schema: DATOS_SCHEMA }),
  (r, f) => {
    if (!r) {
      log(`AVISO: el frente ${f.clave} no devolvió datos`)
      return { frente: f, datos: [], huecos: [] }
    }
    const vistos = new Set()
    const datos = []
    for (const d of r.datos) {
      const k = claveDato(d)
      if (vistos.has(k)) continue
      vistos.add(k)
      datos.push(d)
    }
    log(`${f.clave}: ${datos.length} datos a verificar, ${r.huecos.length} huecos`)
    return { frente: f, datos, huecos: r.huecos }
  },
  async (r, f) => {
    const veredictos = await parallel(r.datos.map((d, i) => () => agent(
      promptVerificar(d, f),
      { label: `verificar:${f.clave}:${i + 1}`, phase: 'Verificacion', schema: VEREDICTO_SCHEMA },
    )))
    return { ...r, veredictos }
  },
)

// ---------------------------------------------------------------- CLASIFICACIÓN
const confirmados = []
const refutados = []
const noAccesibles = []
const huecos = []
const yaVistos = new Set() // el mismo dato traído por dos frentes se cuenta una vez

for (const r of resultados.filter(Boolean)) {
  huecos.push(...r.huecos.map(h => `${r.frente.titulo}. ${h}`))
  r.datos.forEach((d, i) => {
    const v = r.veredictos[i]
    const base = { ...d, frente: r.frente.titulo }
    const k = claveDato(d)
    if (yaVistos.has(k)) return
    yaVistos.add(k)
    if (!v) {
      noAccesibles.push({ ...base, motivo: 'el verificador no respondió' })
      return
    }
    if (v.veredicto === 'confirmado' || v.veredicto === 'corregido') {
      confirmados.push({
        ...base,
        enunciado: v.veredicto === 'corregido' && v.correccion ? v.correccion : d.enunciado,
        citaVerificada: v.citaEncontrada || d.cita,
        corregido: v.veredicto === 'corregido',
        motivo: v.motivo,
      })
    } else if (v.veredicto === 'refutado') {
      refutados.push({ ...base, motivo: v.motivo, correccion: v.correccion })
    } else {
      noAccesibles.push({ ...base, motivo: v.motivo })
    }
  })
}

const corregidos = confirmados.filter(d => d.corregido).length
log(`Confirmados ${confirmados.length} (${corregidos} con corrección), refutados ${refutados.length}, no accesibles ${noAccesibles.length}, huecos ${huecos.length}`)

// ---------------------------------------------------------------- SALIDA
phase('Salida')

const lineasDato = (d, n) => [
  `### ${n}. ${d.enunciado}${d.corregido ? ' (corregido por el verificador)' : ''}`,
  `- Cifra: ${d.cifra}. Fuente: ${d.fuente} (${d.anio}).`,
  `- URL: ${d.url}`,
  `- Cita verificada: "${d.citaVerificada}"`,
  `- Uso: ${d.uso}`,
  d.corregido && d.motivo ? `- Nota del verificador: ${d.motivo}` : null,
].filter(Boolean).join('\n')

const md = []
md.push(`# Datos verificados. ${PROYECTO.titulo} (${PROYECTO.accion})`)
md.push('')
md.push(`Territorio: ${PROYECTO.territorio}. Solo entran en la biblia los datos de la sección "Confirmados". Cada uno lleva la URL releída por un verificador independiente y la cita literal que encontró. Los marcados "corregido" llevan el enunciado que la fuente respalda de verdad, no el que propuso el investigador.`)
md.push('')
md.push(`Resumen: ${confirmados.length} confirmados (${corregidos} con corrección), ${refutados.length} refutados, ${noAccesibles.length} no comprobables, ${huecos.length} huecos.`)
md.push('')
md.push('## Confirmados')
let n = 0
for (const f of FRENTES) {
  const delFrente = confirmados.filter(d => d.frente === f.titulo)
  md.push('')
  md.push(`### ${f.titulo}`)
  if (!delFrente.length) md.push('Sin datos confirmados en este frente.')
  for (const d of delFrente) {
    n += 1
    md.push('')
    md.push(lineasDato(d, n).replace(/^### /, '#### '))
  }
}
md.push('')
md.push('## Refutados (no usar)')
md.push('')
if (!refutados.length) md.push('Ninguno.')
for (const d of refutados) {
  md.push(`- ${d.enunciado}`)
  md.push(`  - URL: ${d.url}`)
  md.push(`  - Por qué: ${d.motivo}`)
  if (d.correccion) md.push(`  - Lo que la fuente sí dice: ${d.correccion}`)
}
md.push('')
md.push('## No comprobables (la URL no abrió; buscar otra fuente o descartar)')
md.push('')
if (!noAccesibles.length) md.push('Ninguno.')
for (const d of noAccesibles) {
  md.push(`- ${d.enunciado}`)
  md.push(`  - URL: ${d.url}`)
  md.push(`  - Motivo: ${d.motivo}`)
}
md.push('')
md.push('## Huecos (se buscó y no apareció con fuente)')
md.push('')
if (!huecos.length) md.push('Ninguno.')
for (const h of huecos) md.push(`- ${h}`)
md.push('')

const contenido = md.join('\n')
const salida = `${TRABAJO}/datos_verificados.md`

const guardado = await agent(`Guarda con Write el fichero ${salida} con EXACTAMENTE el contenido que va entre las marcas INICIO y FIN, sin cambiar, resumir ni añadir nada, con saltos de línea LF. Tu respuesta final es solo "OK" y el número de caracteres guardados.

INICIO
${contenido}
FIN`, { label: 'escribir:datos_verificados', phase: 'Salida', effort: 'low' })

if (!guardado) log(`AVISO: no se pudo guardar ${salida}; el contenido está en el resultado del workflow`)

return {
  fichero: salida,
  confirmados: confirmados.length,
  corregidos,
  refutados: refutados.map(d => d.enunciado),
  noAccesibles: noAccesibles.map(d => d.url),
  huecos,
  contenido: guardado ? null : contenido,
}
