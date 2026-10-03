// Workflow de verificación adversarial sobre el borrador ensamblado, el paso 5
// de SKILL.md generalizado: coherencia, rúbrica y palancas, originalidad (contra
// la referencia aprobada, las hermanas de la misma ronda y los proyectos
// anteriores de la solicitante), estilo e idioma, y, cuando tocan, protección
// (tema sensible) y carta de la agencia (reescritura tras un rechazo). Un
// evaluador simulado rápido puntúa por criterio; es orientativo y sin calibrar,
// la nota estimada que se comunica sale de workflow_evaluacion.js.
//
// Al final deduplica los issues por bloque y cita, los ordena por gravedad y
// bloque y escribe trabajo/issues.md, listo para repartir en TAREAS de
// workflow_correccion.js. Los issues marcados "transversal" van primero porque
// hay que decidirlos antes de lanzar la corrección.
//
// PARA ADAPTARLO solo hay que editar el bloque DATOS. Para la segunda ronda tras
// la corrección basta con cambiar FICHEROS.borrador al ensamblado final y dejar
// VERIFICADORES en ['coherencia'] o ['coherencia', 'estilo'].
//
// Los verificadores leen el borrador por ruta. El script no puede escribir
// ficheros: el último agente guarda issues.md tal cual se lo pasa el código.

export const meta = {
  name: 'verificacion-adversarial',
  description: 'Batería de verificadores adversariales sobre el borrador ensamblado, con issues deduplicados en trabajo/issues.md',
  phases: [
    { title: 'Verificacion', detail: 'coherencia, rúbrica, originalidad, estilo, protección y carta si tocan, más el evaluador simulado' },
    { title: 'Issues', detail: 'deduplicar, ordenar y escribir trabajo/issues.md' },
  ],
}

// ---------------------------------------------------------------- DATOS
const TRABAJO = '[RUTA ABSOLUTA de la carpeta trabajo/ del proyecto]'
const SKILL = '[RUTA ABSOLUTA de .claude/skills/redaccion-proyectos]'

const PROYECTO = {
  titulo: '[TÍTULO]',
  accion: 'ka152-you', // clave del fichero perfiles/rubricas/<accion>.md
  accionNombre: '[CÓDIGO DE ACCIÓN, nombre completo]',
  idiomaRedaccion: 'español',
  idiomaFormulario: 'inglés',
  temaSensible: false, // true activa el verificador de protección
  reescrituraTrasRechazo: false, // true activa el verificador de la carta de la agencia
  evaluadorSimulado: true, // control rápido sin calibrar; la nota que se comunica sale de workflow_evaluacion.js
  // Si la referencia aprobada pasa en otra ciudad o con otro público, decirlo aquí
  // para que el verificador de originalidad cace los datos que se hayan colado.
  // null si no aplica.
  contextoReferencia: null,
  // Tokens de placeholder acordados, para comprobar que son idénticos en todas partes.
  tokens: '[LISTA DE TOKENS ACORDADOS, o "ninguno"]',
}

// Lista completa: coherencia, rubrica, originalidad, estilo, proteccion, carta.
// proteccion y carta solo corren si además PROYECTO.temaSensible o
// PROYECTO.reescrituraTrasRechazo están a true.
const VERIFICADORES = ['coherencia', 'rubrica', 'originalidad', 'estilo', 'proteccion', 'carta']

const FICHEROS = {
  borrador: `${TRABAJO}/borrador_ensamblado.md`,
  biblia: `${TRABAJO}/biblia_[proyecto].md`,
  // Fichas de la solicitante y de cada socia (proyectos/referencias/organizaciones/).
  fichas: ['[RUTA de la ficha de la solicitante]'],
  rubrica: `${SKILL}/perfiles/rubricas/${PROYECTO.accion}.md`,
  palancas: `${SKILL}/comun/maximizar_puntuacion.md`,
  estilo: `${SKILL}/comun/reglas_estilo.md`,
  referencia: null, // solicitud aprobada de referencia extraída a texto, o null
  hermanas: [], // solicitudes hermanas de la misma ronda, ensambladas
  anteriores: [], // proyectos anteriores de la solicitante a texto, si se tienen
  feedback: `${TRABAJO}/feedback_agencia.md`, // carta de la agencia, solo si es reescritura
}

// Claves o títulos de los bloques en el orden del formulario (las de BLOQUES de
// workflow_redaccion.js). Sirve para ordenar issues.md como el formulario.
// Vacío = orden alfabético.
const ORDEN_BLOQUES = []

// ---------------------------------------------------------------- SCHEMAS
const ISSUE = {
  type: 'object',
  additionalProperties: false,
  properties: {
    bloque: { type: 'string' }, // encabezado "## " del bloque, o "transversal" si afecta a varios
    gravedad: { type: 'string', enum: ['alta', 'media', 'baja'] },
    cita: { type: 'string' }, // fragmento literal del borrador, 5 a 30 palabras, para localizarlo con Grep
    problema: { type: 'string' },
    propuesta: { type: 'string' }, // el texto nuevo o el cambio concreto
  },
  required: ['bloque', 'gravedad', 'cita', 'problema', 'propuesta'],
}

const ISSUES = {
  type: 'object',
  additionalProperties: false,
  properties: { issues: { type: 'array', items: ISSUE } },
  required: ['issues'],
}

const CARTA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    reproches: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          reproche: { type: 'string' }, // la frase de la carta, resumida fiel
          criterio: { type: 'string' },
          estado: { type: 'string', enum: ['resuelto', 'parcial', 'no_resuelto'] },
          donde: { type: 'string' }, // bloque y cita del borrador que lo resuelve, o vacío
          propuesta: { type: 'string' }, // qué falta para resolverlo del todo
        },
        required: ['reproche', 'criterio', 'estado', 'donde', 'propuesta'],
      },
    },
    issues: { type: 'array', items: ISSUE },
  },
  required: ['reproches', 'issues'],
}

const NOTA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    criterios: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          criterio: { type: 'string' },
          puntos: { type: 'number' },
          maximo: { type: 'number' },
          justificacion: { type: 'string' },
        },
        required: ['criterio', 'puntos', 'maximo', 'justificacion'],
      },
    },
    total: { type: 'number' },
    umbralSuperado: { type: 'boolean' },
    loQueMasResta: { type: 'array', items: { type: 'string' } },
  },
  required: ['criterios', 'total', 'umbralSuperado', 'loQueMasResta'],
}

// ---------------------------------------------------------------- PROMPTS
const lista = (arr, etiqueta) => (arr && arr.length ? arr.map(p => `- ${p} (${etiqueta})`).join('\n') : '')

const BASE = `Eres verificador adversarial de una solicitud ${PROYECTO.accionNombre} (proyecto ${PROYECTO.titulo}), redactada en ${PROYECTO.idiomaRedaccion} sobre un formulario en ${PROYECTO.idiomaFormulario}. Tu trabajo es encontrar lo que haría perder puntos, no confirmar que está bien.

LEE primero con Read:
- ${FICHEROS.borrador} (borrador ensamblado completo; es lo que verificas)
- ${FICHEROS.biblia} (datos canónicos del proyecto; cualquier desviación es un error)
${lista(FICHEROS.fichas, 'ficha de organización, los únicos datos permitidos de esa entidad')}

FORMATO DE CADA ISSUE: bloque (el encabezado "## " del bloque donde está, o "transversal" si afecta a varios bloques y hay que decidirlo una vez para todos), gravedad (alta = hace perder puntos, contradice la biblia o es un error de hecho; media = debilita un criterio; baja = pulido), cita (fragmento literal del borrador, de 5 a 30 palabras, para que el corrector lo localice con Grep), problema y propuesta (el texto nuevo o el cambio concreto, no "mejorar"). Reporta SOLO problemas reales y accionables. No reportes preferencias estéticas ni repitas el mismo problema en varios issues: si una cifra está mal en cinco sitios, un issue "transversal" con las cinco citas separadas por punto y coma.`

const FOCOS = {
  coherencia: () => `${BASE}

FOCO COHERENCIA. Contradicciones internas y desviaciones de la biblia. Comprueba una a una las cifras de la biblia (participantes, acompañantes, facilitadores, personas por país, número de socias, duración, días, número de sesiones y de actividades, importes), las ciudades y fechas, que la cronología mes a mes sea idéntica en todas las secciones que la mencionan, que las temáticas, los objetivos y los nombres de actividad estén con la redacción exacta de la biblia, que el proyecto no se presente nunca como continuación de otro ajeno, que ningún dato de una entidad salga de fuera de su ficha, que los códigos internos (N1, O1) solo aparezcan en la sección donde se enumeran, y que los placeholders usen el mismo token en todas las secciones y dentro de las traducciones. Tokens acordados: ${PROYECTO.tokens}. Marca también los argumentos repetidos enteros en dos bloques (uno debe remitir al otro).`,

  rubrica: () => `${BASE}
- ${FICHEROS.rubrica} (rúbrica destilada: criterios, elementos y puntos)
- ${FICHEROS.palancas} (palancas aprendidas con notas reales)

FOCO RÚBRICA Y PALANCAS. Recorre uno a uno los elementos de cada criterio de la rúbrica y después una a una las palancas, y comprueba que el borrador responde a cada uno de forma explícita y localizable. Un issue por elemento o palanca débil o ausente, con el bloque donde reforzarlo y el contenido concreto que falta. Recorre la trazabilidad en los dos sentidos: cada necesidad tiene objetivo, actividad, resultado e indicador con meta, y cada actividad responde a una necesidad. Presta atención a lo que más se olvida: prioridades transversales con medida concreta, papel de los jóvenes en todas las fases incluida la concepción, organizaciones recién llegadas, discapacidad nombrada, cómo se detectó la necesidad y cuándo, necesidades de las organizaciones en párrafo aparte, actores con nombre y estado de contacto, indicadores con meta numérica y evaluación intermedia fechada dentro del proyecto, reflexión y reconocimiento como proceso, seguridad y protección, sostenibilidad después de la financiación, alcance ejecutable con la duración y el consorcio.`,

  originalidad: () => `${BASE}
${FICHEROS.referencia ? `- ${FICHEROS.referencia} (solicitud aprobada de referencia)` : ''}
${lista(FICHEROS.hermanas, 'solicitud hermana de la misma ronda')}
${lista(FICHEROS.anteriores, 'proyecto anterior de la misma solicitante')}

FOCO ORIGINALIDAD. Las agencias cruzan solicitudes y un proyecto ya fue advertido por parecido. Busca en el borrador frases, ejemplos, metáforas, soluciones concretas, nombres de actividades, estructuras argumentales y enumeraciones en el mismo orden que un evaluador que conozca los ficheros de comparación reconocería como calco. Compara bloque a bloque con el bloque equivalente de cada fichero de comparación. Para cada calco, cita el fragmento del borrador y el del fichero de comparación (con su nombre) y propón una reformulación desde el marco propio de la biblia, con otro mecanismo o ejemplo si hace falta.${PROYECTO.contextoReferencia ? ` Además, la referencia pasa en otro contexto (${PROYECTO.contextoReferencia}): cualquier ciudad, barrio, servicio, cifra o actor de ese contexto que se haya colado en el borrador es un issue de gravedad alta.` : ''} Comprueba también que el borrador no menciona la solicitud de referencia ni que algo se concedió.`,

  estilo: () => `${BASE}
- ${FICHEROS.estilo} (reglas de estilo obligatorias; cada prohibición es un punto a comprobar)

FOCO ESTILO E IDIOMA. Revisa el borrador entero contra las reglas de estilo: guiones largos o semilargos en cualquier parte (también encabezados, traducciones y placeholders), emojis, abuso del patrón de dos puntos, anglicismos evitables, tono de texto generado (triadas constantes, más de un "no X, sino Y" por bloque, andamiaje enumerativo de apertura), atribuciones de fuente dentro del texto (del tipo "según el PIF" o "information provided by"), datos administrativos que la aplicación ya trae (OID, PIC, dirección exacta, forma legal), menciones al nivel de idioma de los participantes, y errores de lengua en ${PROYECTO.idiomaRedaccion} y en las traducciones al ${PROYECTO.idiomaFormulario}. Mide también las longitudes: en cada respuesta "### " con tope de 5.000 caracteres el objetivo es entre 4.000 y 4.900; marca con gravedad alta las que se pasen del tope (el portal corta) y con media las que estén por debajo de 4.000, indicando con qué contenido de la rúbrica se completarían. Cita el fragmento exacto en cada issue.`,

  proteccion: () => `${BASE}
- ${FICHEROS.palancas} (ver "Protección a la medida del tema")

FOCO PROTECCIÓN. El tema del proyecto es sensible. Comprueba que el borrador tiene un protocolo específico y no genérico: persona de referencia formada y con nombre de función, coach o acompañante donde la acción lo pide, control de edad y medidas si hay menores cerca, consentimiento informado y privacidad de los participantes, qué pasa si alguien se expone sin querer (un joven LGTBIQ+ en su pueblo, una persona con un problema de salud revelado en una sesión), derivación a servicios con nombre, documentos de viaje y seguro si hay movilidad, y que ninguna actividad ni producto de difusión exponga a un participante. Cada carencia es un issue con la medida concreta y el bloque donde va. Marca también lo que, al revés, suena a alarma injustificada y restaría credibilidad.`,

  carta: () => `${BASE}
- ${FICHEROS.feedback} (carta de resultados de la agencia con los reproches a la versión anterior)
- ${FICHEROS.rubrica} (para asignar cada reproche a su criterio)

FOCO CARTA DE LA AGENCIA. Esta solicitud se reescribe tras un rechazo. Recorre la carta frase a frase: cada reproche, observación o debilidad señalada es un elemento a verificar. Para cada uno devuelve el criterio al que afecta, si está resuelto, parcial o no resuelto en el borrador, dónde (bloque y cita literal del borrador que lo resuelve) y qué falta. Sé estricto: un reproche de diseño (todo en línea, sin coach, público mal definido) solo está resuelto si el diseño cambió, no si se explica mejor. Además, comprueba que el borrador no menciona el rechazo ni la candidatura anterior salvo que el formulario lo pregunte, y que no dice "primera candidatura" si la agencia tiene otra registrada. Los reproches no resueltos o parciales van también como issues de gravedad alta con su propuesta.`,
}

const promptEvaluador = `Eres el evaluador externo que puntúa esta solicitud ${PROYECTO.accionNombre} (proyecto ${PROYECTO.titulo}) para la agencia. Lees decenas seguidas y no concedes el beneficio de la duda.

LEE con Read:
- ${FICHEROS.rubrica} (rúbrica, con los criterios y sus máximos; respeta esos máximos)
- ${FICHEROS.borrador} (la solicitud)

Puntúa cada criterio con su máximo de la rúbrica y justifica en tres líneas qué suma y qué resta en cada uno. Indica si supera el umbral (total y mitad de cada criterio). En loQueMasResta, las tres cosas que, corregidas, más subirían la nota, en orden. No propongas texto. Devuelve solo el objeto estructurado.`

// ---------------------------------------------------------------- SELECCIÓN
const activos = VERIFICADORES.filter(v => {
  if (!FOCOS[v]) { log(`AVISO: verificador desconocido "${v}", se omite`); return false }
  if (v === 'proteccion' && !PROYECTO.temaSensible) return false
  if (v === 'carta' && !PROYECTO.reescrituraTrasRechazo) return false
  if (v === 'originalidad' && !FICHEROS.referencia && !FICHEROS.hermanas.length && !FICHEROS.anteriores.length) {
    log('AVISO: originalidad sin ficheros de comparación (referencia, hermanas, anteriores); se omite')
    return false
  }
  return true
})
const omitidos = VERIFICADORES.filter(v => !activos.includes(v))
log(`Verificadores: ${activos.join(', ')}${omitidos.length ? `. Omitidos: ${omitidos.join(', ')}` : ''}${PROYECTO.evaluadorSimulado ? '. Más el evaluador simulado' : ''}`)

// ---------------------------------------------------------------- VERIFICACIÓN
phase('Verificacion')

const tareas = activos.map(v => () => agent(FOCOS[v](), {
  label: `verificar:${v}`,
  phase: 'Verificacion',
  schema: v === 'carta' ? CARTA : ISSUES,
}))
if (PROYECTO.evaluadorSimulado) {
  tareas.push(() => agent(promptEvaluador, { label: 'evaluador-simulado', phase: 'Verificacion', schema: NOTA }))
}

const salidas = await parallel(tareas)

const porVerificador = {}
let reproches = []
let nota = null
activos.forEach((v, i) => {
  const r = salidas[i]
  if (!r) { log(`AVISO: el verificador ${v} no respondió`); porVerificador[v] = []; return }
  porVerificador[v] = r.issues.map(it => ({ ...it, bloque: String(it.bloque || 'transversal').replace(/^#+\s*/, '').trim() || 'transversal', origen: v }))
  if (v === 'carta') {
    reproches = r.reproches
    for (const rep of r.reproches) {
      if (rep.estado === 'resuelto') continue
      porVerificador[v].push({
        bloque: rep.donde ? rep.donde.split(/[.,:;]/)[0].trim() || 'transversal' : 'transversal',
        gravedad: 'alta',
        cita: rep.donde || '(sin pasaje que lo resuelva)',
        problema: `Reproche de la agencia ${rep.estado === 'parcial' ? 'resuelto solo en parte' : 'sin resolver'} (${rep.criterio}): ${rep.reproche}`,
        propuesta: rep.propuesta,
        origen: 'carta',
      })
    }
  }
})
if (PROYECTO.evaluadorSimulado) {
  nota = salidas[activos.length]
  if (!nota) log('AVISO: el evaluador simulado no respondió')
}

// ---------------------------------------------------------------- DEDUPLICACIÓN Y ORDEN
const norm = s => String(s || '').toLowerCase().replace(/^##\s*/, '').replace(/["'“”«»`]/g, '').replace(/\s+/g, ' ').trim()
const RANGO = { alta: 0, media: 1, baja: 2 }
const claveIssue = it => `${norm(it.bloque)}|${norm(it.cita).slice(0, 60)}`

const fusionados = new Map()
let duplicados = 0
for (const v of activos) {
  for (const it of porVerificador[v]) {
    const k = claveIssue(it)
    const previo = fusionados.get(k)
    if (!previo) {
      fusionados.set(k, { ...it, origenes: [it.origen], propuestas: [{ origen: it.origen, texto: it.propuesta }] })
      continue
    }
    duplicados += 1
    if (RANGO[it.gravedad] < RANGO[previo.gravedad]) previo.gravedad = it.gravedad
    if (!previo.origenes.includes(it.origen)) previo.origenes.push(it.origen)
    if (!previo.propuestas.some(p => norm(p.texto) === norm(it.propuesta))) previo.propuestas.push({ origen: it.origen, texto: it.propuesta })
    if (!norm(previo.problema).includes(norm(it.problema).slice(0, 40))) previo.problema = `${previo.problema} También (${it.origen}): ${it.problema}`
  }
}

const ordenBloque = b => {
  const nb = norm(b)
  if (nb === 'transversal') return -1
  const i = ORDEN_BLOQUES.findIndex(o => nb.includes(norm(o)) || norm(o).includes(nb))
  return i === -1 ? ORDEN_BLOQUES.length : i
}
const issues = [...fusionados.values()].sort((a, b) =>
  RANGO[a.gravedad] - RANGO[b.gravedad]
  || ordenBloque(a.bloque) - ordenBloque(b.bloque)
  || norm(a.bloque).localeCompare(norm(b.bloque))
  || norm(a.cita).localeCompare(norm(b.cita)))

const cuenta = g => issues.filter(it => it.gravedad === g).length
log(`Issues: ${issues.length} (alta ${cuenta('alta')}, media ${cuenta('media')}, baja ${cuenta('baja')}); ${duplicados} duplicados fusionados`)

// ---------------------------------------------------------------- ISSUES.MD
phase('Issues')

const celda = s => String(s || '').replace(/\|/g, '/').replace(/\n+/g, ' ')
const salida = `${TRABAJO}/issues.md`
const md = []

md.push(`# Issues de verificación. ${PROYECTO.titulo} (${PROYECTO.accionNombre})`)
md.push('')
md.push(`Borrador verificado: ${FICHEROS.borrador}`)
md.push(`Verificadores: ${activos.join(', ')}${omitidos.length ? `. Omitidos: ${omitidos.join(', ')}` : ''}.`)
md.push(`Issues: ${issues.length} (alta ${cuenta('alta')}, media ${cuenta('media')}, baja ${cuenta('baja')}), ${duplicados} duplicados fusionados.`)
md.push('')
md.push('Cómo usarlo: los transversales se deciden antes de lanzar workflow_correccion.js y van a DECISIONES TRANSVERSALES de GLOBAL; el resto se reparte por bloque en TAREAS. Los G1-G12 no hace falta copiarlos, ya van en GLOBAL.')

if (nota) {
  md.push('')
  md.push('## Evaluador simulado')
  md.push('')
  md.push(`Nota estimada: ${nota.total}. Umbral ${nota.umbralSuperado ? 'superado' : 'NO superado'}.`)
  md.push('')
  md.push('| Criterio | Puntos | Máximo | Justificación |')
  md.push('|---|---|---|---|')
  for (const c of nota.criterios) md.push(`| ${celda(c.criterio)} | ${c.puntos} | ${c.maximo} | ${celda(c.justificacion)} |`)
  md.push('')
  md.push('Lo que más resta, en orden:')
  nota.loQueMasResta.forEach((l, i) => md.push(`${i + 1}. ${l}`))
}

if (reproches.length) {
  const sinResolver = reproches.filter(r => r.estado !== 'resuelto').length
  md.push('')
  md.push('## Carta de la agencia')
  md.push('')
  md.push(`${reproches.length} reproches, ${sinResolver} sin resolver del todo.`)
  md.push('')
  md.push('| Reproche | Criterio | Estado | Dónde se resuelve | Qué falta |')
  md.push('|---|---|---|---|---|')
  for (const r of reproches) md.push(`| ${celda(r.reproche)} | ${celda(r.criterio)} | ${r.estado.replace('_', ' ')} | ${celda(r.donde)} | ${celda(r.propuesta)} |`)
}

const bloques = [...new Set(issues.map(it => it.bloque))].sort((a, b) => ordenBloque(a) - ordenBloque(b) || norm(a).localeCompare(norm(b)))
md.push('')
md.push('## Resumen por bloque')
md.push('')
md.push('| Bloque | Alta | Media | Baja |')
md.push('|---|---|---|---|')
for (const b of bloques) {
  const de = issues.filter(it => it.bloque === b)
  md.push(`| ${celda(b)} | ${de.filter(it => it.gravedad === 'alta').length} | ${de.filter(it => it.gravedad === 'media').length} | ${de.filter(it => it.gravedad === 'baja').length} |`)
}

let numero = 0
const escribirIssue = it => {
  numero += 1
  md.push('')
  md.push(`### ${numero}. [${it.bloque}] ${it.gravedad}`)
  md.push(`- Cita: "${it.cita}"`)
  md.push(`- Problema: ${it.problema}`)
  if (it.propuestas.length === 1) md.push(`- Propuesta: ${it.propuestas[0].texto}`)
  else for (const p of it.propuestas) md.push(`- Propuesta (${p.origen}): ${p.texto}`)
  md.push(`- Origen: ${it.origenes.join(', ')}`)
}

const transversales = issues.filter(it => norm(it.bloque) === 'transversal')
if (transversales.length) {
  md.push('')
  md.push('## Transversales (decidir antes de corregir)')
  transversales.forEach(escribirIssue)
}
for (const g of ['alta', 'media', 'baja']) {
  const de = issues.filter(it => it.gravedad === g && norm(it.bloque) !== 'transversal')
  md.push('')
  md.push(`## Gravedad ${g}`)
  if (!de.length) {
    md.push('')
    md.push('Ninguno.')
  }
  de.forEach(escribirIssue)
}
md.push('')

const contenido = md.join('\n')

const guardado = await agent(`Guarda con Write el fichero ${salida} con EXACTAMENTE el contenido que va entre las marcas INICIO y FIN, sin cambiar, resumir ni añadir nada, con saltos de línea LF. Tu respuesta final es solo "OK" y el número de caracteres guardados.

INICIO
${contenido}
FIN`, { label: 'escribir:issues', phase: 'Issues', effort: 'low' })

if (!guardado) log(`AVISO: no se pudo guardar ${salida}; el contenido está en el resultado del workflow`)

return {
  fichero: salida,
  verificadores: activos,
  omitidos,
  issues: { total: issues.length, alta: cuenta('alta'), media: cuenta('media'), baja: cuenta('baja'), transversales: transversales.length, duplicados },
  reproches: reproches.length ? reproches.map(r => ({ reproche: r.reproche, estado: r.estado })) : null,
  notaEstimada: nota ? { total: nota.total, umbralSuperado: nota.umbralSuperado, criterios: nota.criterios.map(c => `${c.criterio} ${c.puntos}/${c.maximo}`) } : null,
  contenido: guardado ? null : contenido,
}
