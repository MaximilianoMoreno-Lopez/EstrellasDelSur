// Workflow de jueces de conceptos, antes de la biblia: un redactor por concepto
// desarrolla una ficha de una página, tres jueces independientes con lentes
// distintas puntúan todas las fichas contra la rúbrica de la acción y las
// palancas, y una síntesis elige el ganador e injerta lo mejor de los otros.
// Es el paso "Idea diferencial" de recetas/desde-cero.md (By Lot evaluó ocho).
//
// PARA ADAPTARLO solo hay que editar el bloque DATOS: carpeta trabajo/, ruta de
// la skill, acción, marco del proyecto y la lista CONCEPTOS (de 2 a 4).
//
// Los jueces ven todas las fichas a la vez para puntuar con la misma vara; por
// eso hay una barrera entre la redacción y el juicio. El script no puede
// escribir ficheros: cada redactor guarda su ficha y el agente de síntesis
// guarda trabajo/conceptos_evaluados.md.

export const meta = {
  name: 'jueces-de-conceptos',
  description: 'Desarrollar de 2 a 4 conceptos, puntuarlos con tres jueces contra la rúbrica y elegir el ganador',
  phases: [
    { title: 'Fichas', detail: 'un redactor por concepto' },
    { title: 'Jueces', detail: 'tres jueces independientes, cada uno con todas las fichas' },
    { title: 'Sintesis', detail: 'ganador con lo mejor de los otros en trabajo/conceptos_evaluados.md' },
  ],
}

// ---------------------------------------------------------------- DATOS
const TRABAJO = '[RUTA ABSOLUTA de la carpeta trabajo/ del proyecto]'
const SKILL = '[RUTA ABSOLUTA de .claude/skills/redaccion-proyectos]'

const PROYECTO = {
  accion: 'ka152-you', // clave del fichero perfiles/rubricas/<accion>.md
  accionNombre: '[CÓDIGO DE ACCIÓN, nombre completo]',
  idioma: 'español',
  // Todo lo que un redactor necesita para no inventar: solicitante y qué hace,
  // público, territorio, socias si las hay, fechas y duración posibles,
  // presupuesto orientativo y las restricciones duras (qué no se puede reutilizar
  // de la referencia aprobada ni de las hermanas de la ronda, temas vetados).
  marco: `[marco del proyecto en diez o quince líneas]`,
}

const FICHEROS = {
  rubrica: `${SKILL}/perfiles/rubricas/${PROYECTO.accion}.md`,
  palancas: `${SKILL}/comun/maximizar_puntuacion.md`,
  perfil: `${SKILL}/perfiles/${PROYECTO.accion}.md`,
  // Salida de workflow_datos.js si se lanzó antes. null si no existe todavía.
  datos: `${TRABAJO}/datos_verificados.md`,
  // Fichas de organizaciones y otros ficheros de contexto. [] si no hay.
  contexto: [],
}

const CONCEPTOS = [
  {
    clave: 'a',
    titulo: '[TÍTULO A]',
    idea: `[idea en unas diez líneas: qué pasa, con quién, qué mecanismo propio tiene, qué produce]`,
  },
  {
    clave: 'b',
    titulo: '[TÍTULO B]',
    idea: `[idea en unas diez líneas]`,
  },
]

// Tres lentes distintas, no tres copias del mismo juez.
const JUECES = [
  {
    clave: 'agencia',
    rol: 'Eres evaluador externo de la agencia nacional. Aplicas la rúbrica elemento a elemento, con la misma dureza que a las decenas de solicitudes que lees seguidas. No premias promesas ni adjetivos, solo lo que la ficha concreta y hace verificable.',
  },
  {
    clave: 'relevancia',
    rol: 'Eres experto en relevancia, público y datos. Penalizas necesidades sin cara ni cifra, prioridades citadas en vacío, valor europeo que se consigue en casa y vínculos entre entidad, público y tema que no se sostienen con actividad real. Premias el eje diferencial que nadie más podría firmar.',
  },
  {
    clave: 'ejecucion',
    rol: 'Eres gestor con años ejecutando proyectos de juventud financiados. Penalizas la ambición operativa (muchos frentes, calendarios imposibles, presupuestos fuera de lo que paga la agencia), los riesgos de protección sin cubrir y las dependencias de terceros sin contacto. Premias lo que un consorcio pequeño puede ejecutar y evaluar dentro del plazo.',
  },
]

// ---------------------------------------------------------------- SCHEMAS
const JUICIO_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    evaluaciones: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          clave: { type: 'string' },
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
          riesgos: { type: 'array', items: { type: 'string' } },
          loMejor: { type: 'array', items: { type: 'string' } }, // ideas concretas que merecen sobrevivir aunque el concepto no gane
          loPeor: { type: 'array', items: { type: 'string' } },
        },
        required: ['clave', 'criterios', 'total', 'riesgos', 'loMejor', 'loPeor'],
      },
    },
    ranking: { type: 'array', items: { type: 'string' } }, // claves de mejor a peor
    comentario: { type: 'string' },
  },
  required: ['evaluaciones', 'ranking', 'comentario'],
}

// ---------------------------------------------------------------- COMPROBACIONES
if (CONCEPTOS.length < 2 || CONCEPTOS.length > 4) {
  throw new Error(`CONCEPTOS tiene ${CONCEPTOS.length} entradas; el workflow está pensado para entre 2 y 4`)
}
const claves = new Set(CONCEPTOS.map(c => c.clave))
if (claves.size !== CONCEPTOS.length) throw new Error('Las claves de CONCEPTOS tienen que ser distintas')

const fichaDe = c => `${TRABAJO}/concepto_${c.clave}.md`
const listaFichas = CONCEPTOS.map(c => `- ${c.clave} "${c.titulo}": ${fichaDe(c)}`).join('\n')

// ---------------------------------------------------------------- FICHAS
phase('Fichas')

const lecturas = [
  `${FICHEROS.rubrica} (rúbrica destilada de la acción)`,
  `${FICHEROS.palancas} (palancas para puntuar alto)`,
  `${FICHEROS.perfil} (perfil de la acción: formato, topes, lo que pide el formulario)`,
  FICHEROS.datos ? `${FICHEROS.datos} (datos ya verificados; usa solo estos, con su fuente y año)` : null,
  ...FICHEROS.contexto.map(c => `${c} (contexto)`),
].filter(Boolean)

const fichas = await parallel(CONCEPTOS.map(c => () => agent(
  `Eres diseñador de proyectos ${PROYECTO.accionNombre}. Tu tarea es desarrollar UN concepto hasta una ficha de una página, en ${PROYECTO.idioma}, para que tres jueces la puntúen contra la rúbrica.

Antes de escribir, LEE con Read:
${lecturas.map((l, i) => `${i + 1}. ${l}`).join('\n')}

MARCO DEL PROYECTO (no inventes nada fuera de esto; lo que falte va entre corchetes):
${PROYECTO.marco}

CONCEPTO QUE TE TOCA: "${c.titulo}"
${c.idea}

FICHA (entre 4.000 y 6.000 caracteres, prosa hilada, con estos encabezados "## " en este orden):
1. Título y lema.
2. Necesidad y público. Con cifras del fichero de datos verificados si existe; si no, marca entre corchetes lo que habría que buscar. Dos párrafos, uno de participantes y otro de organizaciones.
3. Eje diferencial. El mecanismo propio en una frase y cómo funciona por dentro. Tiene que ser algo que la referencia aprobada y las hermanas de la ronda no tengan.
4. Actividades y calendario grueso. Qué pasa, dónde, cuántas personas, cuántos días, en qué mes.
5. Papel de los jóvenes en cada fase, con el órgano o el momento donde deciden.
6. Resultados, indicadores con meta numérica, evaluación intermedia y sostenibilidad después de la financiación.
7. Consorcio y reparto de tareas si hay socias.
8. Riesgos, protección y qué los cubre.
9. Qué puntúa y dónde: en una lista corta, qué elemento de la rúbrica se gana con cada pieza del concepto.

REGLAS DURAS: nada de guiones largos ni semilargos, nada de emojis, no abusar de dos puntos, nada de datos personales de nadie, ninguna cifra sin fuente que no vaya entre corchetes.

GUARDA la ficha con Write en ${fichaDe(c)} y devuélvela también como respuesta final.`,
  { label: `ficha:${c.clave}`, phase: 'Fichas' },
)))

const sinFicha = CONCEPTOS.filter((c, i) => !fichas[i])
if (sinFicha.length) log(`AVISO: conceptos sin ficha: ${sinFicha.map(c => c.clave).join(', ')}`)
const enJuego = CONCEPTOS.filter((c, i) => fichas[i])
if (enJuego.length < 2) throw new Error('Hacen falta al menos dos fichas para juzgar')

// ---------------------------------------------------------------- JUECES
phase('Jueces')

const juicios = await parallel(JUECES.map(j => () => agent(
  `${j.rol}

Vas a puntuar ${enJuego.length} conceptos de proyecto ${PROYECTO.accionNombre}, todos con la misma vara. Trabajas en ${PROYECTO.idioma}.

LEE con Read, en este orden:
1. ${FICHEROS.rubrica} (rúbrica oficial destilada; los criterios y sus puntos máximos son los de ahí)
2. ${FICHEROS.palancas} (palancas aprendidas con notas reales; cada una es un punto a comprobar)
3. Las fichas, una por concepto:
${enJuego.map(c => `   - ${c.clave} "${c.titulo}": ${fichaDe(c)}`).join('\n')}

MARCO DEL PROYECTO, para juzgar si cada concepto es realista con lo que hay:
${PROYECTO.marco}

PARA CADA CONCEPTO devuelve: la puntuación por criterio de la rúbrica (con el máximo de cada criterio tal como está en la rúbrica, y la suma en total), los riesgos que ves, lo mejor (ideas concretas que merecen sobrevivir aunque el concepto no gane, escritas de forma que se puedan injertar en otro) y lo peor. Puntúa como la agencia: una ficha que promete sin concretar se queda por debajo del umbral de su criterio. Ordena las claves en ranking de mejor a peor y resume en comentario, en cinco líneas, qué separa al primero del resto.

No propongas un concepto nuevo. No reescribas las fichas. Devuelve solo el objeto estructurado.`,
  { label: `juez:${j.clave}`, phase: 'Jueces', schema: JUICIO_SCHEMA },
)))

const juiciosValidos = juicios.map((r, i) => (r ? { juez: JUECES[i].clave, ...r } : null)).filter(Boolean)
if (!juiciosValidos.length) throw new Error('Ningún juez devolvió puntuación')
if (juiciosValidos.length < JUECES.length) log(`AVISO: solo respondieron ${juiciosValidos.length} de ${JUECES.length} jueces`)

// Media de totales por concepto y tabla juez por concepto.
const medias = enJuego.map(c => {
  const totales = juiciosValidos
    .map(j => j.evaluaciones.find(e => e.clave === c.clave))
    .filter(Boolean)
    .map(e => e.total)
  const media = totales.length ? totales.reduce((a, b) => a + b, 0) / totales.length : 0
  if (!totales.length) log(`AVISO: ningún juez puntuó el concepto ${c.clave}`)
  return { clave: c.clave, titulo: c.titulo, media: Math.round(media * 10) / 10, votos: totales.length }
})
medias.sort((a, b) => b.media - a.media)

const ganador = medias[0]
const segundo = medias[1]
const margen = segundo ? Math.round((ganador.media - segundo.media) * 10) / 10 : null
log(`Ganador ${ganador.clave} "${ganador.titulo}" con ${ganador.media} de media${segundo ? `, ${margen} por delante de ${segundo.clave}` : ''}`)
if (segundo && margen < 3) log('AVISO: margen estrecho; la síntesis tiene que explicar la elección y el usuario debe confirmarla')

const celda = s => String(s).replace(/\|/g, '/')
const tabla = [
  `| Concepto | ${juiciosValidos.map(j => celda(j.juez)).join(' | ')} | Media |`,
  `|---|${juiciosValidos.map(() => '---|').join('')}---|`,
  ...medias.map(m => {
    const porJuez = juiciosValidos.map(j => {
      const e = j.evaluaciones.find(x => x.clave === m.clave)
      return e ? e.total : 'sin voto'
    })
    return `| ${celda(m.clave)} ${celda(m.titulo)} | ${porJuez.join(' | ')} | ${m.media} |`
  }),
].join('\n')

// ---------------------------------------------------------------- SÍNTESIS
phase('Sintesis')

const salida = `${TRABAJO}/conceptos_evaluados.md`
const resumenJuicios = JSON.stringify(juiciosValidos, null, 1)

const sintesis = await agent(`Eres el responsable de decidir qué concepto va a la biblia de un proyecto ${PROYECTO.accionNombre}. Tres jueces con lentes distintas ya han puntuado ${enJuego.length} fichas. Trabajas en ${PROYECTO.idioma}.

LEE con Read las fichas:
${enJuego.map(c => `- ${c.clave} "${c.titulo}": ${fichaDe(c)}`).join('\n')}
Y la rúbrica: ${FICHEROS.rubrica}

PUNTUACIONES (media de los jueces, de mayor a menor):
${tabla}

GANADOR POR MEDIA: ${ganador.clave} "${ganador.titulo}"${segundo ? `. Segundo: ${segundo.clave} con ${margen} puntos menos.` : ''}
${segundo && margen < 3 ? 'El margen es estrecho: justifica la elección con los criterios donde se decide y di qué tendría que pasar para que el segundo fuera mejor opción.' : ''}

JUICIOS COMPLETOS (JSON, con criterios, riesgos, lo mejor y lo peor de cada concepto según cada juez):
${resumenJuicios}

ESCRIBE con Write el fichero ${salida} con esta estructura, encabezados "## ":
1. Decisión. El ganador en un párrafo y por qué, con los criterios donde se decide. Respeta el ganador por media salvo que detectes un error de bulto de los jueces, y en ese caso dilo con el dato.
2. Puntuaciones. Pega la tabla de arriba tal cual y debajo, por concepto, la puntuación por criterio de cada juez en una tabla pequeña (criterio, juez 1, juez 2, juez 3).
3. Injertos. Lo mejor de los conceptos que no ganan, uno por párrafo: qué idea es, de qué concepto viene, en qué bloque o actividad del ganador encaja y qué cambia al meterla. Solo injertos que no rompan el eje diferencial del ganador ni añadan frentes que lo hagan inejecutable.
4. Riesgos a cubrir en la biblia. Los que señalaron los jueces sobre el ganador y cómo se cubren.
5. Concepto final. El ganador ya con los injertos, en una página (4.000 a 6.000 caracteres) con los mismos nueve encabezados de las fichas, listo para pasar a la sección 3 de la biblia (concepto y eje diferencial) y a la 4 (actividades con números).
6. Descartados. Una línea por concepto descartado con la razón principal, para que no vuelva a proponerse.

REGLAS DURAS: nada de guiones largos ni semilargos, nada de emojis, no abusar de dos puntos, nada de datos personales de nadie, ninguna cifra nueva que no venga de las fichas o del fichero de datos verificados.

Respuesta final: la sección Decisión y los injertos en diez líneas, nada más.`, { label: 'sintesis', phase: 'Sintesis' })

if (!sintesis) log(`AVISO: la síntesis no respondió; ${salida} puede no existir`)

return {
  fichero: salida,
  ganador,
  margen,
  medias,
  fichas: Object.fromEntries(enJuego.map(c => [c.clave, fichaDe(c)])),
  decision: sintesis ? String(sintesis).slice(0, 1500) : null,
}
