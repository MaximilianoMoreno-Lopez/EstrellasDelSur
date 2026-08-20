// Workflow genérico de redacción de una solicitud, un redactor por bloque del formulario
// más tres verificadores adversariales sobre el borrador ensamblado.
//
// PARA ADAPTARLO solo hay que editar el bloque DATOS y el array BLOQUES.
// Los BLOQUES y sus preguntas literales salen del perfil de la acción
// (.claude/skills/redaccion-proyectos/perfiles/<accion>.md).
//
// Cada redactor guarda su bloque en DIR/draft_<clave>.md y devuelve el texto,
// para que el workflow de corrección pueda leer los ficheros después.

export const meta = {
  name: 'redaccion-solicitud',
  description: 'Redactar una solicitud por bloques y verificarla de forma adversarial',
  phases: [
    { title: 'Redaccion', detail: 'un redactor por bloque del formulario' },
    { title: 'Verificacion', detail: 'coherencia, rubrica y originalidad' },
  ],
}

// ---------------------------------------------------------------- DATOS
const DIR = '[RUTA DEL SCRATCHPAD]'

const PROYECTO = {
  titulo: '[TÍTULO]',
  accion: '[CÓDIGO DE ACCIÓN, nombre completo]',
  idiomaRedaccion: 'español',
  idiomaFormulario: 'inglés',
  // Resumen de una frase larga que todo redactor necesita tener en la cabeza.
  sinopsis: '[qué es el proyecto, quién coordina, cuántas socias, duración, actividades clave, eje diferencial]',
}

const FICHEROS = {
  biblia: `${DIR}/biblia_[proyecto].md`,
  pif: `${DIR}/pif_[coordinadora].md`,
  rubrica: `${DIR}/rubrica_[accion].md`,
  // Solicitud de referencia ya extraída a texto. Dejar en null si no hay.
  referencia: `${DIR}/ref_[accion].txt`,
}

const COMUN = `Eres redactor experto en solicitudes ${PROYECTO.accion}.

Antes de escribir, LEE con la herramienta Read estos ficheros:
1. ${FICHEROS.biblia} (datos canónicos del proyecto, estrategia de puntuación y reglas de estilo OBLIGATORIAS)
2. ${FICHEROS.pif} (los únicos datos reales permitidos de la organización solicitante)
3. ${FICHEROS.rubrica} (rúbrica oficial destilada; tu bloque debe responder de forma explícita a los elementos que le correspondan)
${FICHEROS.referencia ? `4. ${FICHEROS.referencia} SOLO las líneas que te indico abajo, como referencia de registro, tono y extensión. PROHIBIDO copiar o parafrasear de cerca su contenido: las checklists de los formularios exigen contenido original y las agencias cruzan solicitudes. Escribe desde el marco propio de la biblia.` : ''}

EL PROYECTO: ${PROYECTO.sinopsis}

FORMATO DE SALIDA: tu respuesta final es SOLO el texto markdown de tu bloque, sin comentarios meta. Usa "## " para el título del bloque y "### " para cada pregunta del formulario, con la pregunta literal en ${PROYECTO.idiomaFormulario} tal como aparece en el formulario oficial, para que quien rellena localice el campo. Debajo, la respuesta en ${PROYECTO.idiomaRedaccion}, en párrafos hilados. Donde el formulario pida traducción, añade "**Please provide a translation in English.**" y la traducción. Placeholders siempre entre corchetes descriptivos con guion corto. Longitud de cada respuesta entre 1.500 y 4.000 caracteres salvo indicación contraria.

REGLAS DURAS: nada de guiones largos ni semilargos, nada de emojis, no abusar de dos puntos, como máximo un "no X, sino Y" en todo el bloque, sin andamiaje enumerativo de apertura, sin anglicismos evitables. No inventes ningún dato que no esté en la biblia o en el PIF.

GUARDA tu bloque completo con Write en el fichero que te indico, y además devuélvelo como respuesta final.`

const BLOQUES = [
  {
    clave: 'resumen',
    ref: '[líneas de la referencia, por ejemplo 100-300]',
    instrucciones: `Redacta el bloque "Project Summary" con estas preguntas, cada una con su respuesta y su traducción al inglés:
- "[pregunta 1 literal]"
- "[pregunta 2 literal]"
- "[pregunta 3 literal]"
El resumen se publica si el proyecto se aprueba: autocontenido, con cifras de la biblia y vendedor sin grandilocuencia. Menciona el eje diferencial y el perfil del consorcio. Entre 900 y 1.500 caracteres por idioma y respuesta.`,
  },
  {
    clave: '[clave2]',
    ref: '[líneas]',
    instrucciones: `Redacta el bloque "[NOMBRE]" con:
- "[pregunta literal]" y qué contenido concreto tiene que llevar, con los datos de la biblia que le tocan.`,
  },
]

// ---------------------------------------------------------------- REDACCIÓN
phase('Redaccion')

const borradores = await parallel(BLOQUES.map(b => () => agent(
  `${COMUN}

FICHERO DE SALIDA: ${DIR}/draft_${b.clave}.md
${b.ref ? `Referencia de registro: líneas ${b.ref} del fichero de referencia.` : ''}

${b.instrucciones}`,
  { label: `redactar:${b.clave}`, phase: 'Redaccion' },
)))

const faltan = BLOQUES.filter((b, i) => !borradores[i])
if (faltan.length) log(`AVISO: bloques sin redactar: ${faltan.map(b => b.clave).join(', ')}`)

const completo = borradores.filter(Boolean).join('\n\n---\n\n')
log(`Borrador ensamblado: ${completo.length} caracteres`)

// ---------------------------------------------------------------- VERIFICACIÓN
phase('Verificacion')

const ISSUES = {
  type: 'object',
  additionalProperties: false,
  properties: {
    issues: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          section: { type: 'string' },
          severity: { type: 'string', enum: ['alta', 'media', 'baja'] },
          problem: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['section', 'severity', 'problem', 'fix'],
      },
    },
  },
  required: ['issues'],
}

const VBASE = `Eres verificador adversarial de una solicitud ${PROYECTO.accion} (proyecto ${PROYECTO.titulo}). Lee primero ${FICHEROS.biblia} y ${FICHEROS.pif}. Después analiza el borrador completo que sigue. Reporta SOLO problemas reales y accionables, cada uno con su arreglo concreto. No reportes preferencias estéticas menores.`

const veredictos = await parallel([
  () => agent(`${VBASE}

FOCO COHERENCIA: contradicciones internas y desviaciones de la biblia. Comprueba una a una las cifras de la biblia (participantes, facilitadores, personas, número de socias, duración, número de sesiones y de actividades), las ciudades y fechas, que la cronología mes a mes sea idéntica en todas las secciones que la mencionan, que las temáticas y los topics estén con su redacción exacta, que el proyecto no se presente nunca como continuación de otro ajeno, que ningún dato de la solicitante salga fuera del PIF, y que los placeholders usen el mismo token en todas las secciones y también dentro de las traducciones.

BORRADOR:
${completo}`, { label: 'verificar:coherencia', phase: 'Verificacion', schema: ISSUES }),

  () => agent(`${VBASE} Lee también ${FICHEROS.rubrica}.

FOCO RÚBRICA: recorre uno a uno los elementos de cada criterio y verifica que el borrador responde a cada uno de forma explícita y localizable. Reporta cada elemento débil o ausente indicando en qué sección debería reforzarse y con qué contenido concreto. Presta atención especial a lo que más se olvida: prioridades transversales nombradas con su medida, papel de la gente joven en todas las fases, organizaciones recién llegadas, discapacidad mencionada de forma expresa, indicadores con meta numérica, reflexión y reconocimiento como proceso, evaluación intermedia además de la final, seguridad y protección, sostenibilidad tras la financiación.

BORRADOR:
${completo}`, { label: 'verificar:rubrica', phase: 'Verificacion', schema: ISSUES }),

  () => agent(`${VBASE}${FICHEROS.referencia ? ` Lee también ${FICHEROS.referencia} (solicitud de referencia).` : ''}

FOCO ORIGINALIDAD Y ESTILO: (1) ${FICHEROS.referencia ? 'busca frases, ejemplos, metáforas, soluciones concretas o estructuras argumentales que un evaluador que conozca la solicitud de referencia reconocería como calco, incluidas las enumeraciones en el mismo orden, y propón reformulación concreta. ' : ''}(2) revisa violaciones de estilo: guiones largos o semilargos en cualquier parte, emojis, abuso del patrón de dos puntos, anglicismos innecesarios, tono de texto generado (triadas constantes, "no X sino Y" repetido, andamiaje enumerativo de apertura), argumentos repetidos en dos bloques, y errores de lengua. Cita el fragmento exacto en cada issue.

BORRADOR:
${completo}`, { label: 'verificar:originalidad', phase: 'Verificacion', schema: ISSUES }),
])

const [coherencia, rubrica, originalidad] = veredictos.map(v => (v ? v.issues : []))
log(`Issues: coherencia ${coherencia.length}, rúbrica ${rubrica.length}, originalidad ${originalidad.length}`)

return {
  borradores: Object.fromEntries(BLOQUES.map((b, i) => [b.clave, borradores[i] ? borradores[i].length : null])),
  coherencia,
  rubrica,
  originalidad,
}
