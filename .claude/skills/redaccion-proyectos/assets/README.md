# Herramientas de la skill redaccion-proyectos

Scripts reutilizables para montar, medir y comprobar una solicitud. Todos corren con Python 3.12 (`py` en Windows) y leen markdown en UTF-8. Dependencias: python-docx (Word), openpyxl (horario en Excel) y Chrome (horario en PDF). Cada script tiene la ayuda completa en su cabecera y con `--help`.

El repositorio es público. Los JSON de configuración y los markdown de cada proyecto se guardan en `proyectos/` (fuera del repositorio) o en el scratchpad, nunca aquí.

| Herramienta | Para qué |
|---|---|
| `md2docx.py` | Markdown de la solicitud a Word para copiar y pegar |
| `contar.py` | Caracteres por respuesta y por celda de tabla |
| `fechas.py` | Día de la semana de cada fecha escrita |
| `presupuesto_ka1.py` | Presupuesto KA152, KA153, KA155 y ESC30 |
| `horario_xlsx.py` | Horario a la plantilla oficial KA152 Annex Timetable |
| `horario_pdf.py` | Horario y calendario a PDF A4 apaisado |
| `comprobacion_mecanica.py` | Guiones largos, emojis, tics, placeholders, códigos internos |
| `workflow_datos.js` | Datos con fuente por frente, cada URL releída por un verificador |
| `workflow_conceptos.js` | De 2 a 4 conceptos puntuados por tres jueces antes de la biblia |
| `workflow_redaccion.js`, `workflow_correccion.js` | Redacción y corrección en paralelo por bloques |
| `workflow_verificacion.js` | Batería de verificadores adversariales con `issues.md` deduplicado |
| `workflow_evaluacion.js` | Nota estimada con dos evaluadores ciegos calibrados, mediana y margen de error |

## md2docx.py

Convierte el markdown en un Word con portada, encabezados en los colores de la marca (navy, teal y gold), listas, negrita y cursiva, y tablas reales con la cabecera en negrita. Un `<br>` dentro de una celda pasa a salto de línea. El nivel de encabezado más alto que use el documento (`# `, o `## ` si no hay `# `) lleva salto de página delante.

La portada sale de la primera tabla de dos columnas del markdown (Project title, Project acronym, Acción, Solicitante, Agencia nacional, Convocatoria). Con `--titulo` se usa lo que se pase por la línea de órdenes. `--lang` elige los textos fijos de la portada (es, fr, en) y `--sin-portada` la quita.

```
py md2docx.py CADRES_para_pegar.md CADRES_para_pegar.docx --lang fr
py md2docx.py REAL_es.md REAL_para_pegar.docx
py md2docx.py HARO_para_pegar.md HARO.docx --titulo "Haro Queer" --subtitulo "Proyecto de solidaridad ESC30" --extra "Ronda 1 de 2027"
```

Las listas numeradas conservan el número escrito en el markdown, así no se encadenan de una lista a otra en Word.

## contar.py

Cuenta los caracteres con espacios de cada respuesta, del encabezado `### ` al siguiente encabezado, sin el marcado markdown y sin las líneas de recuento. Marca SOBRE lo que pasa de `--limite` (5000 por defecto). Si la respuesta es una tabla, cuenta cada celda del cuerpo por separado con su propio tope (`--limite-celda`), porque en el portal cada celda es un campo. Sale con código 1 si algo se pasa.

```
py contar.py REAL_es.md
py contar.py HARO_para_pegar.md --limite-celda 2000
py contar.py *.md --solo-sobre
py contar.py HARO_para_pegar.md --limite-celda 2000 --todas-celdas
```

En una tabla, la línea de resumen da el número de celdas, la mayor y dónde está. `--todas-celdas` lista una por una.

## fechas.py

Busca fechas escritas con día de la semana en español, francés e inglés ("sábado 24 de abril de 2027", "samedi 24 avril 2027", "sábado 24/04/2027", "lunes 19/04", "Saturday 24 April 2027", "Saturday, April 24, 2027") y comprueba que el día cuadra. Informa fichero, línea, texto y el día correcto. Sale con código 1 si hay algún error.

```
py fechas.py CADRES_para_pegar.md horario.md --anio 2027
py fechas.py HARO_para_pegar.md --anio 2027 --todas
```

Conviene pasar siempre `--anio`. Sin él, el año de una fecha que no lo lleva se toma de la última fecha completa del fichero y se avisa ("año supuesto"). Las fechas sin mes al lado ("Martes 2", "du lundi 19 au lundi 26 avril") se resuelven con el mes del rango o con el último mes nombrado antes con año o al empezar frase ("Marzo de 2027.", "Mayo es el mes..."). Salen marcadas "(mes por contexto)" y, si alguna da error, hay que mirarla a ojo. `--sin-contexto` las ignora.

## presupuesto_ka1.py

Calcula el presupuesto de movilidad con los importes de la Guía 2026 y lo devuelve en tablas markdown listas para pegar (una por flujo y el resumen con los nombres de partida del portal), más el total.

- Apoyo individual por día y país de la actividad. KA152 usa la tabla A2.1 (España 58, Francia 67, Italia 69, Macedonia del Norte 41, Serbia 47, Turquía 50...). KA153 usa la A2.2 de trabajadores juveniles (España 81, Francia 85, Italia 85...). KA155 paga 78 al día, como mucho 21 días. Están los 33 países del programa y la tarifa única de terceros países vecinos.
- Días con apoyo individual = días de actividad + días de viaje (2 por defecto) + días extra por viaje sostenible (hasta 4).
- Apoyo organizativo 125 por participante y apoyo a la inclusión 125 por participante con menos oportunidades.
- Viaje por banda de distancia, estándar o sostenible (10-99: 28/56, 100-499: 211/285, 500-1999: 309/417, 2000-2999: 395/535, 3000-3999: 580/785, 4000-7999: 1188, 8000+: 1735). La banda "0-9" es sin viaje. Se puede dar `distancia_km` en lugar de la banda.
- ESC30: 630 al mes de costes del proyecto y coach por día según el país (España 227, Francia 255; para otro país se pasa `coach_dia`).

Entrada KA1 (un flujo por grupo de origen):

```json
{
  "accion": "KA152",
  "idioma": "fr",
  "actividad": "YEX01 Nombre de la actividad",
  "pais_actividad": "FR",
  "dias_actividad": 8,
  "dias_viaje": 2,
  "flujos": [
    {"nombre": "1 France", "origen": "FR", "personas": 8, "participantes": 5,
     "menos_oportunidades": 3, "banda": "0-9", "green": false},
    {"nombre": "2 Espagne", "origen": "ES", "personas": 6, "participantes": 5,
     "menos_oportunidades": 3, "distancia_km": 1050, "green": true, "dias_extra": 2}
  ],
  "costes_reales": {"inclusion_participantes": 0, "excepcionales": 0}
}
```

`personas` son todas las que viajan (participantes, group leaders, facilitadores). `participantes` son las que generan apoyo organizativo. Entrada ESC30:

```json
{"accion": "ESC30", "idioma": "es", "actividad": "Nombre", "pais": "ES", "meses": 4, "dias_coach": 3}
```

```
py presupuesto_ka1.py presupuesto.json
py presupuesto_ka1.py presupuesto.json --out presupuesto.md --lang es
```

Los avisos (más de 4 días extra, días extra sin viaje sostenible, más participantes con menos oportunidades que participantes, KA155 por encima de 21 días, ESC30 fuera de 2 a 12 meses) salen por la salida de error. Si cambia la Guía, se tocan solo las constantes de la cabecera.

## horario_xlsx.py

Rellena la plantilla oficial KA152 Annex Timetable. En la hoja Youth Exchanges escribe la cabecera (actividad, organizaciones, duración, lugar, país y fechas) y un bloque por día: franja AM o PM y hora en la columna A, sesión con su objetivo y quién conduce en B:E, método en F:J, el objetivo del día debajo de la cabecera y el producto del día en negrita. El calendario del proyecto va a una hoja nueva, con 5 o 6 columnas. Borra la hoja Preparatory Visits salvo con `--conservar-visitas`.

Markdown de entrada: una primera sección `## ` con un `### ` por día, la tabla Hora | Sesión | Objetivo | Método | Conduce (cabecera en cualquier idioma) y la línea "Producto del día", "Produit du jour" o "Product of the day"; y, opcionalmente, una segunda `## ` con la tabla del calendario.

```json
{
  "actividad": "YEX01. Título de la actividad",
  "organizaciones": "Organización A (ES, solicitante), Organización B (FR), Organización C (IT).",
  "duracion": "8 días de actividad (19 a 26/04/2027) y 2 días de viaje (18 y 27/04/2027).",
  "ciudad": "Ciudad. Lugar de la actividad",
  "pais": "Francia",
  "inicio": "19/04/2027",
  "fin": "26/04/2027",
  "idioma": "es",
  "titulo_calendario": "CALENDARIO DEL PROYECTO (12 MESES)"
}
```

```
py horario_xlsx.py --md horario.md --config horario.json --out Annex_Timetable.xlsx
py horario_xlsx.py --md horario.md --config horario.json --out Annex_Timetable.xlsx --plantilla otra/plantilla.xlsx
```

La plantilla por defecto es `proyectos/referencias/plantillas/KA152_Annex_Timetable.xlsx`, fuera del repositorio. Si no está, el script avisa y sale sin escribir nada.

## horario_pdf.py

Convierte el mismo markdown del horario en un anexo A4 apaisado: cabecera con título, subtítulo, datos y socias, un bloque por día con su tabla, las pausas en gris, el producto del día resaltado y el calendario en página aparte. Genera el HTML junto al PDF y lo imprime con Chrome sin ventana.

```json
{
  "titulo": "Título del proyecto",
  "subtitulo": "Anexo. Horario del intercambio y calendario del proyecto",
  "meta": "Erasmus+ KA152-YOU · Intercambio juvenil · Ciudad, fechas",
  "socias": "Con socias de Francia, Italia y Serbia",
  "idioma": "es"
}
```

```
py horario_pdf.py --md horario.md --config horario_pdf.json --out Programa_anexo.pdf
py horario_pdf.py --md horario.md --config horario_pdf.json --out Programa_anexo.pdf --solo-html
```

Chrome se busca en `C:/Program Files/Google/Chrome/Application/chrome.exe`; otra ruta con `--chrome`.

## comprobacion_mecanica.py

Revisa guiones largos, emojis, anglicismos, códigos internos fuera de su sección, tics de redacción, placeholders y encabezados que faltan. Sale con código 1 si hay hallazgos duros.

```
py comprobacion_mecanica.py borrador.md
py comprobacion_mecanica.py carpeta --patron "final_*.md"
```

## Workflows

Seis plantillas para la herramienta Workflow, una por paso del proceso que se beneficia de agentes en paralelo. Todas siguen la misma forma: un bloque `DATOS` arriba que es lo único que se edita, `export const meta` literal, prompts que mandan a los agentes leer ficheros por ruta en lugar de pegarles material, y salidas estructuradas con schema donde el resultado se procesa en código. Como el script no puede escribir ficheros, el último agente de cada uno recibe el contenido ya montado y lo guarda con Write en la carpeta `trabajo/` del proyecto.

Para lanzar cualquiera, copiar la plantilla al scratchpad o a `trabajo/`, rellenar el bloque de datos (rutas absolutas, nada de `[corchetes]` sin sustituir) y llamar a la herramienta Workflow con `scriptPath` apuntando a la copia. Si un agente falla a medias, relanzar con el mismo `scriptPath` y el `resumeFromRunId` del resultado: lo ya hecho vuelve de caché. Dos trampas de la ruta de Windows, aprendidas en CHEMSAFE: las cadenas con apóstrofos van entre backticks y, si se reescribe el fichero con Python, con `newline='\n'`.

| Workflow | Cuándo | Escribe |
|---|---|---|
| `workflow_datos.js` | Paso 2, antes de la biblia | `trabajo/datos_verificados.md` |
| `workflow_conceptos.js` | Paso 3, antes de la biblia, si hay más de una idea | `trabajo/conceptos_evaluados.md` y una ficha por concepto |
| `workflow_redaccion.js` | Paso 4, formularios de más de seis bloques | `draft_<clave>.md` por bloque |
| `workflow_verificacion.js` | Paso 5 y segunda ronda tras corregir | `trabajo/issues.md` |
| `workflow_correccion.js` | Paso 6 | `final_<clave>.md` por bloque |
| `workflow_evaluacion.js` | Paso 5 sobre el ensamblado final y paso 8, nota estimada | `trabajo/evaluacion_simulada.md` |

### workflow_datos.js

Investigación de datos con fuente para la biblia. Un investigador por frente busca con WebSearch, abre cada página y devuelve datos con enunciado listo para la biblia, cifra, fuente, URL exacta, año y cita literal. Después, un verificador por dato relee esa URL con la consigna de tumbar el dato y devuelve confirmado, corregido (la página respalda el dato pero la cifra, el año o el ámbito estaban mal, y trae el enunciado bueno), refutado o no accesible. No hay barrera entre fases: cada frente pasa a verificación en cuanto termina.

`datos_verificados.md` lleva solo lo confirmado y lo corregido, agrupado por frente, y aparte las listas de refutados (con lo que la fuente sí dice), no comprobables (la URL no abrió) y huecos (lo que se buscó sin encontrar fuente), para que el usuario decida si busca otra fuente o lo deja fuera.

Qué editar: `TRABAJO`, `PROYECTO` (título, acción, territorio, público, tema, año mínimo y datos por frente), `CONTEXTO` (ficheros que orientan al investigador, como la biblia a medias o el perfil) y `FRENTES`. Los cuatro frentes de serie son situación de los jóvenes del territorio, actores y servicios locales, marco normativo y prioridades de la agencia; se añaden o quitan según el proyecto, y las pistas de cada uno se afinan al tema.

### workflow_conceptos.js

Jueces de conceptos antes de la biblia. Un redactor por concepto desarrolla una ficha de una página con nueve apartados fijos (necesidad y público, eje diferencial, actividades, papel de los jóvenes, indicadores, consorcio, riesgos, qué puntúa y dónde) y la guarda en `trabajo/concepto_<clave>.md`. Tres jueces con lentes distintas (evaluador de la agencia, experto en relevancia y datos, gestor que mira la ejecutabilidad) leen todas las fichas a la vez para puntuar con la misma vara, contra `perfiles/rubricas/<accion>.md` y `comun/maximizar_puntuacion.md`, y devuelven puntos por criterio, riesgos, lo mejor y lo peor de cada concepto. El código calcula la media, elige el ganador y avisa si el margen con el segundo es menor de tres puntos. Un agente de síntesis escribe `conceptos_evaluados.md` con la decisión, las tablas de puntuación, los injertos de los otros conceptos (de dónde vienen y dónde encajan), los riesgos a cubrir en la biblia, el concepto final en una página y los descartados con su razón.

Qué editar: `TRABAJO`, `SKILL` (ruta absoluta de la skill), `PROYECTO` (clave de la rúbrica, nombre de la acción, idioma y el marco con todo lo que un redactor necesita para no inventar), `FICHEROS.datos` (la salida de `workflow_datos.js`, o null) y `FICHEROS.contexto`, y `CONCEPTOS` con entre dos y cuatro entradas de clave, título e idea en diez líneas. El script se niega a arrancar con menos de dos o más de cuatro.

### workflow_verificacion.js

La batería del paso 5 generalizada. Lanza en paralelo los verificadores de coherencia, rúbrica y palancas, originalidad, estilo e idioma, y opcionalmente protección (si `temaSensible`) y carta de la agencia (si `reescrituraTrasRechazo`), más un evaluador simulado rápido y sin calibrar (la nota de `notaEstimada` sale de `workflow_evaluacion.js`). Cada verificador lee el borrador ensamblado, la biblia y las fichas por ruta y devuelve issues con bloque, gravedad, cita literal, problema y propuesta. El de originalidad recibe la referencia aprobada, las hermanas de la misma ronda y los proyectos anteriores de la solicitante, y se omite solo si no hay nada con qué comparar. El de la carta recorre `trabajo/feedback_agencia.md` reproche a reproche y dice si cada uno está resuelto, parcial o sin resolver y dónde; los no resueltos pasan a issues de gravedad alta.

El código deduplica por bloque y cita (se queda con la gravedad mayor y acumula los orígenes y las propuestas distintas), ordena por gravedad y por el orden del formulario, y escribe `issues.md` con la nota del evaluador simulado, la tabla de reproches de la carta si la hay, un resumen por bloque, los issues transversales primero (son las decisiones que hay que tomar antes de corregir) y después los de gravedad alta, media y baja. De ahí salen directamente `GLOBAL` y `TAREAS` de `workflow_correccion.js`.

Qué editar: `TRABAJO`, `SKILL`, `PROYECTO` (título, clave de la rúbrica, idiomas, `temaSensible`, `reescrituraTrasRechazo`, `evaluadorSimulado`, `contextoReferencia` si la aprobada pasa en otra ciudad, y los tokens de placeholder acordados), `VERIFICADORES` (la lista completa, o solo `['coherencia']` para la segunda ronda sobre la versión final), `FICHEROS` (borrador ensamblado, biblia, fichas, referencia, hermanas, anteriores, feedback) y `ORDEN_BLOQUES` con las claves de los bloques en el orden del formulario.

### workflow_evaluacion.js

La nota estimada que se comunica al usuario y que va a `notaEstimada`. Dos evaluadoras ciegas leen el prompt calibrado (`evaluador/evaluador.md`), las anclas (`evaluador/anclas.md`, si existe), la rúbrica de la acción solo hasta "Cómo sacar el máximo" y la solicitud completa. Tienen personas distintas, A veterana de agencia que desconfía de la ambición y B especialista externa en trabajo juvenil e inclusión, pero las mismas reglas. Cada una devuelve perfil A, B o C con los cinco núcleos y su pasaje, puntos enteros por criterio, topes y suelos aplicados, debilidades decisivas, incoherencias, recorte probable y frase de carta.

El código saca la mediana por criterio (el medio punto sube, como en la calibración), suma el total, pone la banda de cada criterio con la tabla oficial, comprueba el umbral (60 y la mitad de cada criterio) y da la banda global (por debajo del umbral, por encima sin fondos probables, o financiable si hay cupo a partir de 72). Añade el margen de `evaluador/calibracion.md` y avisa si el intervalo cruza 60 o 72, si las evaluadoras asignan perfiles distintos o si se separan más que el margen. Escribe `trabajo/evaluacion_simulada.md` con la tabla, los núcleos de cada evaluadora, las debilidades, el recorte y las frases de carta.

La nota se comunica siempre con el margen, "75 más o menos 6". KA210 y KA220 tienen criterios cargados pero no están calibradas; el script lo avisa y sube el margen a 10.

Qué editar: `SKILL`, `TRABAJO` (o null para no guardar), `SOLICITUD` (título, ruta del ensamblado, clave de la rúbrica, nombre de la acción, agencia y territorio del cupo) y, solo si `calibracion.md` cambia, `VERSION` y `MARGEN`. Para congelar predicciones antes de conocer las notas, una ejecución por solicitud y el resultado a la tabla de `calibracion.md`. No sirve para medir el acierto sobre las 13 solicitudes de calibración, porque las anclas citan sus pasajes.

El evaluador simulado de `workflow_verificacion.js` es un control rápido sin calibrar; su cifra no se comunica.

### workflow_redaccion.js y workflow_correccion.js

Plantillas para redactar por bloques en paralelo y aplicar después las correcciones de los verificadores. Solo se editan el bloque de datos y la lista de bloques o tareas; las preguntas literales salen del perfil de la acción en `perfiles/`. En la corrección, las cuestiones transversales se deciden antes de lanzar y se escriben en `GLOBAL`; los issues por bloque de `issues.md` se reparten en `TAREAS`.

## Orden de uso recomendado

1. `workflow_datos.js` y, si hay varias ideas, `workflow_conceptos.js`; con eso se cierra la biblia.
2. Redactar (`workflow_redaccion.js` si el formulario es largo) y ensamblar el markdown para pegar.
3. `workflow_verificacion.js` sobre el ensamblado, repartir `issues.md` en `workflow_correccion.js` y volver a lanzar la verificación solo con coherencia sobre la versión final.
4. `workflow_evaluacion.js` sobre el ensamblado final para la nota estimada, que se comunica con su margen.
5. `comprobacion_mecanica.py`, `contar.py` y `fechas.py --anio` sobre el ensamblado y el horario.
6. `presupuesto_ka1.py` y pegar sus tablas en Flow budget y Budget summary.
7. `horario_xlsx.py` y `horario_pdf.py` para los anexos KA1.
8. `md2docx.py` para el Word final.
