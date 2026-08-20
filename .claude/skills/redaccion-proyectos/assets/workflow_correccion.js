// Workflow genérico de corrección: un corrector por bloque, con las correcciones
// globales G1-G9 fijas y las específicas que salen de los verificadores.
//
// PARA ADAPTARLO: editar DIR, PROYECTO y el array TAREAS (una entrada por bloque,
// con las correcciones concretas asignadas a ese bloque).
//
// ANTES DE LANZARLO hay que decidir las cuestiones transversales (redacción única
// de cada temática, secuencias temporales, alcance de invitados, tokens de
// placeholder) y escribirlas en GLOBAL, para que todos los correctores apliquen
// lo mismo. Si se dejan al criterio de cada corrector, vuelven las incoherencias.

export const meta = {
  name: 'correccion-solicitud',
  description: 'Aplicar las correcciones de los verificadores a cada bloque de la solicitud',
  phases: [{ title: 'Correccion', detail: 'un corrector por bloque' }],
}

// ---------------------------------------------------------------- DATOS
const DIR = '[RUTA DEL SCRATCHPAD]'

const PROYECTO = {
  titulo: '[TÍTULO]',
  accion: '[CÓDIGO DE ACCIÓN]',
  biblia: `${DIR}/biblia_[proyecto].md`,
}

const GLOBAL = `Eres corrector experto de solicitudes ${PROYECTO.accion}. Tu tarea: reescribir un bloque del formulario del proyecto ${PROYECTO.titulo} aplicando correcciones concretas de una auditoría, y guardar el resultado.

PASOS: (1) Lee ${PROYECTO.biblia}, en especial sus reglas de estilo. (2) Lee el fichero del borrador que te indico. (3) Aplica TODAS las correcciones listadas, reescribiendo lo necesario sin acortar sustancialmente las respuestas ni perder contenido que puntúa en la rúbrica. (4) Guarda el texto corregido COMPLETO con Write en el fichero de salida indicado. (5) Tu respuesta final: solo "OK" y el número de caracteres guardados.

CORRECCIONES GLOBALES (aplican a todo el bloque):
G1. Eliminar todos los guiones largos y semilargos, también en encabezados, traducciones y placeholders. En encabezados, punto y espacio como separador. En placeholders, guion corto.
G2. El patrón "no X, sino Y" es un tic: conservar como máximo UNO en el bloque, el de más peso argumental, y reformular el resto en afirmativo.
G3. Eliminar el andamiaje enumerativo de apertura ("Distinguimos tres niveles", "Elegimos estos canales por tres razones", "Su rol se articula en tres momentos"): entrar en materia hilando las razones en prosa. Excepción: los objetivos del proyecto pueden seguir enumerados.
G4. Sustituir anglicismos evitables. "feedback" pasa a devolución o valoraciones; "newcomers" pasa a organizaciones recién llegadas al Programa.
G5. Unificar placeholders con el token acordado, idéntico en todas las secciones y también dentro de las traducciones al inglés. Tokens de este proyecto: [LISTA DE TOKENS ACORDADOS].
G6. Redacción única de los conceptos recurrentes. Cada temática, objetivo y nombre de actividad se escribe siempre igual, con la redacción de la biblia.
G7. Los códigos internos de necesidades y objetivos (N1, O1...) solo pueden existir en la sección donde se enumeran y etiquetan. En cualquier otro sitio, referencias descriptivas.
G8. No inventar datos nuevos de la solicitante ni de las socias. Lo que no esté en el PIF va entre corchetes.
G9. No alterar ninguna cifra de la biblia. Si crees que una cifra está mal, la mencionas en tu respuesta final, no la cambias.

DECISIONES TRANSVERSALES YA TOMADAS (respétalas literalmente):
[Escribir aquí las decisiones que afectan a más de un bloque, para que todos los correctores apliquen lo mismo.]`

const TAREAS = [
  {
    clave: 'resumen',
    correcciones: `CORRECCIONES ESPECÍFICAS:
1. [corrección concreta, con el texto nuevo si procede]
2. [...]`,
  },
  {
    clave: '[clave2]',
    correcciones: `CORRECCIONES ESPECÍFICAS:
1. [...]`,
  },
]

// ---------------------------------------------------------------- CORRECCIÓN
phase('Correccion')

const resultados = await parallel(TAREAS.map(t => () => agent(
  `${GLOBAL}

FICHERO DE ENTRADA: ${DIR}/draft_${t.clave}.md
FICHERO DE SALIDA: ${DIR}/final_${t.clave}.md

${t.correcciones}`,
  { label: `corregir:${t.clave}`, phase: 'Correccion' },
)))

const fallidos = TAREAS.filter((t, i) => !resultados[i])
if (fallidos.length) log(`AVISO: bloques sin corregir: ${fallidos.map(t => t.clave).join(', ')}`)

return Object.fromEntries(TAREAS.map((t, i) => [t.clave, resultados[i] ? String(resultados[i]).slice(0, 200) : null]))
