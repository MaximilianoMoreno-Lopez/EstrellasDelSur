# Calibración del evaluador simulado

Documento para quien mantiene el prompt del evaluador y para quien comunica sus notas. El agente evaluador no lo lee nunca, porque contiene las notas reales de las solicitudes con las que se calibró y rompería la evaluación ciega.

Versión vigente `evaluador.md` versión 1, calibrada el 2026-10-03. Margen que se comunica con cada estimación, **más o menos 8 puntos** (ampliado el mismo día tras la prueba con tres aprobadas fuera de muestra; ver abajo). La v2 del 2026-10-06 se probó con validación cruzada y se descartó porque empeoraba el error fuera de muestra (ver "Versión 2 (2026-10-06)"); la v1 y su margen siguen vigentes. La nota se da siempre así, "75 más o menos 8", nunca la cifra sola.

## Resumen

| Medida (13 casos con nota real) | v0 | v1 |
|---|---|---|
| Error absoluto medio (MAE) | 10,0 | 2,6 |
| Sesgo medio (estimada menos real) | +5,5 | -2,5 |
| Lado del umbral de 60 acertado | 6 de 13 | 12 de 13 |
| Lado de la línea de 72 acertado (aprobadas de la muestra) | 10 de 13 | 13 de 13 |
| Error máximo | 24 | 10 |
| Casos con error de 3 puntos o menos | 3 | 9 |
| Diferencia máxima entre los dos evaluadores | 4 | 2 |

La v1 mejora el MAE y el acierto del umbral, así que sustituye a la v0 en `evaluador.md`. Los números de la v1 están medidos sobre los mismos casos con los que se ajustó y son optimistas (ver "Lectura honesta").

## Método

- **Verdad terreno.** La nota de la carta real de la agencia. Cuando la carta desglosa, también la nota de cada criterio. DebatIA 2026 y DigiTE 2026 no tienen carta con desglose y solo cuentan por el total.
- **Muestra.** 13 solicitudes de la red de la ronda 1 de 2026 que conservan el texto presentado y la nota. Por acción, 3 KA152, 2 KA153, 4 KA154, 2 KA155 y 2 ESC30. Por resultado, 8 rechazadas (45 a 58), 2 con calidad suficiente y sin fondos (60) y 3 aprobadas (72 a 80). Casi todas son del INJUVE (ES02); de la agencia francesa (FR02) solo entra ChemSafe.
- **Evaluación ciega.** Cada evaluador recibe el prompt, la parte de criterios de la rúbrica de la acción y la solicitud. No ve la carta, la nota, `src/lib/candidaturas.mjs`, `historial/`, `comun/lecciones_evaluadores.md`, este documento ni `proyectos/referencias/resultados/`.
- **Dos evaluadores por solicitud con personas distintas.** A es una evaluadora veterana de agencia que desconfía de la ambición, de las cifras de alcance y de lo que no se puede ejecutar. B es una especialista externa en trabajo juvenil e inclusión que mira si la necesidad es de jóvenes reales y si los de menos oportunidades llegan de verdad. Las dos aplican el mismo prompt y la misma rúbrica; la persona es una lente, no otra regla.
- **Agregación.** Mediana por criterio entre los evaluadores, redondeada al entero más cercano (el medio punto sube), y suma de las tres medianas. Con dos evaluadores la mediana es la media. `comun/lecciones_evaluadores.md` cita la v0 como media de los totales (68,5 en vez de 69, por ejemplo), lo que cambia como mucho un punto y medio y ninguna conclusión.
- **Medidas.** Error, estimada menos real. MAE, media del error en valor absoluto. Sesgo, media del error con signo. Umbral acertado, la estimada cae del mismo lado de 60 que la real (60 cuenta como superado aunque no tuviera fondos). La línea de 72 es la nota de la aprobada más baja de la muestra; no es una regla de la agencia, porque la línea de financiación cambia con el territorio y la acción (DebatIA 2026, 60, con KA154 financiadas de 64 a 68 en Madrid).

## Resultados de la v0

Prompt versión 0, antes de calibrar. Desglose en relevancia / diseño / gestión.

| Caso | Acción | Real | Desglose real | v0 | Desglose v0 | Individuales v0 | Error |
|---|---|---|---|---|---|---|---|
| Mind the Gap 2026 | KA152 | 54 | 18/21/15 | 69 | 20/28/21 | 67 y 70 | +15 |
| Debate2Participate 2026 | KA153 | 52 | 15/22/15 | 72 | 21/30/21 | 70 y 71 | +20 |
| D-iberia-ting 2026 | KA154 | 45 | 15/17/13 | 69 | 20/27/22 | 68 y 69 | +24 |
| Green Tracks 2026 | KA155 | 58 | 23/23/12 | 63 | 23/27/13 | 63 y 62 | +5 |
| Frames of Us 2026 | KA152 | 72 | sin desglose | 74 | 22/30/22 | 73 y 73 | +2 |
| DebatIA 2026 | KA154 | 60 | sin carta | 55 | 16/22/17 | 55 y 54 | -5 |
| Semillas de Cambio 2026 | KA152 | 51 | 16/19/16 | 66 | 18/29/19 | 64 y 68 | +15 |
| DigiTE 2026 | KA153 | 57 | sin carta | 66 | 18/26/22 | 65 y 66 | +9 |
| Conexión Atlántica 2026 | KA154 | 52 | 16/20/16 | 55 | 16/22/17 | 53 y 55 | +3 |
| Democracia sin barreras 2026 | KA154 | 80 | sin desglose | 68 | 20/27/21 | 68 y 66 | -12 |
| Melilla is Europe 2026 | KA155 | 79 | sin desglose | 67 | 27/27/13 | 67 y 67 | -12 |
| ChemSafe 2026 | ESC30 | 57 | 18/26/13 | 57 | 22/22/13 | 56 y 55 | 0 |
| Haro Queer 2026 | ESC30 | 60 | 25/25/10 | 68 | 26/27/15 | 67 y 67 | +8 |

MAE 10,0, sesgo +5,5, umbral acertado 6 de 13. La v0 puntuaba al revés que la agencia en los extremos. Inflaba las rechazadas largas y cargadas (D-iberia-ting 2026, 45; Debate2Participate 2026, 52) y desinflaba las aprobadas con mejor nota (Democracia sin barreras 2026, 80; Melilla is Europe 2026, 79).

Fuera de la muestra, Cadres Communs (KA152, FR02, ronda de octubre, sin nota todavía) sacó 78 con la v0 (24/30/24, individuales 77 y 78). La estimación interna anterior, hecha sin calibrar, era 86.

## Diagnóstico

1. La v0 encontraba casi los mismos defectos que la carta, pero los convertía en notas con una regla que no separa. Rechazadas y aprobadas tenían un número parecido de debilidades y todas quedaban en Suficiente alto, entre 19 y 22 de 30 y entre 26 y 30 de 40 (Mind the Gap 2026, 54, puntuada 20/28/21; Democracia sin barreras 2026, 80, puntuada 20/27/21).
2. La agencia no suma elemento a elemento. Decide primero si el proyecto es financiable y los tres criterios siguen esa decisión. Las rechazadas quedan en torno al 50 % de cada criterio (Debate2Participate 2026, 52, con 15/22/15; Semillas de Cambio 2026, 51, con 16/19/16; Conexión Atlántica 2026, 52, con 16/20/16) y las aprobadas en torno al 75 % (Frames of Us 2026, 72; Democracia sin barreras 2026, 80).
3. En las aprobadas, la sobrecarga, las sedes cruzadas, las cifras que no cuadran y la falta de itinerario se resolvieron con recortes y no bajaron la nota de 72. Hubo una actividad menos y dos meses menos (Democracia sin barreras 2026, 80), uno o dos viajes menos (Melilla is Europe 2026, 79) y dos días menos (Frames of Us 2026, 72). La v0 los restó en puntos y dejó las dos primeras en 68 y 67.
4. La v0 pedía una consulta previa con número y fecha. La agencia dio por bueno el "sólido análisis de necesidades" con un dato local de fuente local (Melilla is Europe 2026, 79) o con la vivencia en primera persona de alguien del grupo destinatario que está en el equipo (Democracia sin barreras 2026, 80). Ninguna de las tres aprobadas tenía encuesta (Frames of Us 2026, 72, incluida).
5. Lo que la agencia premió y la v0 no vio fue un territorio concreto con una barrera objetiva (Melilla is Europe 2026, 79), una entidad de referencia en el tema dentro del consorcio, un ayuntamiento con carta y papel en la actividad y un grupo motor con número y funciones (Democracia sin barreras 2026, 80).
6. En las rechazadas, la v0 subió el diseño a entre 27 y 30 de 40 por la higiene que tiene casi toda la red, es decir, programa diario, Youthpass como proceso, seguridad detallada, medidas verdes y listas de inclusión. La agencia dejó ese criterio entre 17 y 22 (D-iberia-ting 2026, 45, con 17 frente a 27; Semillas de Cambio 2026, 51, con 19 frente a 29; Debate2Participate 2026, 52, con 22 frente a 30).
7. También premió listas de entidades del entorno de la sede y decisores con nombre aunque no tuvieran papel. La rechazada más baja tenía concejalas, un senador y un municipio socio (D-iberia-ting 2026, 45), y la v0 elogió los decisores con nombre de otra rechazada (DebatIA 2026, 60).
8. La v0 dio entre 18 y 21 de 30 en relevancia a justificaciones largas con datos europeos y la experiencia de la propia red, como "constatación" o "conclusiones de nuestras reuniones". La agencia las dejó entre 15 y 18 (Mind the Gap 2026, 54; Semillas de Cambio 2026, 51; D-iberia-ting 2026, 45).
9. El aparato de gestión de proyecto grande, con KPI, registro de riesgos y dossier auditable, sumó en la v0. La agencia lo leyó como "excesivamente complejo" y dejó la gestión entre 13 y 16 de 30 (Mind the Gap 2026, 54, con 15; D-iberia-ting 2026, 45, con 13).
10. No vio que la lógica académica o competitiva de los torneos universitarios es un problema de encaje con la acción que, por sí solo, hunde la relevancia en KA154 (D-iberia-ting 2026, 45; Conexión Atlántica 2026, 52).
11. Socias de otro ámbito, fichas copiadas, socias sin tarea y 7 a 9 países para una actividad corta quedaron como incoherencias menores, cuando en la agencia decidieron el rechazo (Semillas de Cambio 2026, 51, por el ámbito y por 7 países en 6 días; Debate2Participate 2026, 52, por la ficha copiada; D-iberia-ting 2026, 45, por las socias sin tarea).
12. En ESC30 el patrón es parecido pero menos completo. Sin estructura local ni dato, la relevancia cae por debajo de la mitad aunque diseño y gestión aprueben (ChemSafe 2026, 57, con 18 de 40). Sin presupuesto por partidas, la gestión se queda en 10 de 20 (Haro Queer 2026, 60).

## Cambios de la v1

El fichero completo es `evaluador.md` de esta carpeta. Conserva la estructura de la v0 (rol, reglas, señales penalizadas y elogiadas, procedimiento y sesgos) y añade lo siguiente.

- Una sección inicial que explica que la agencia juzga primero el proyecto en conjunto y que en las cartas de la red casi no hay notas entre 61 y 71 (diagnóstico 2).
- Las bandas oficiales en tabla (máximos de 40, 30 y 20) en lugar de porcentajes, con aviso contra usar la parte alta de Suficiente en los tres criterios (diagnóstico 1).
- Un paso 0 con cinco preguntas, cada una respondida con su pasaje. Necesidad situada, encaje con la lógica de la acción, consorcio con sentido, proporción y credibilidad del texto. Con ellas se asigna el perfil A (72 a 82), B (45 a 60) o C (57 a 66), y hay horquillas por criterio para los pesos 30/40/30 y 40/40/20.
- 14 topes de tipo "si pasa X, el criterio no supera Y". Por ejemplo, necesidad genérica, relevancia como máximo 18 de 30 (diagnóstico 8); lógica académica, como máximo 16 de 30 (diagnóstico 10); más de 6 países o más de 30 personas en 6 días, diseño como máximo 20 de 40 (diagnóstico 11); la higiene no sube el diseño de una B por encima de 22 a 25 (diagnóstico 6); ficha copiada o socia sin tarea, gestión como máximo 16 de 30 (diagnóstico 11); texto de otra solicitud, total como máximo 60.
- 4 suelos de tipo "si tiene A, B y C, el criterio es al menos Y". Necesidad situada más selección con instrumento más vínculo entre necesidad y objetivos da relevancia de al menos 23 de 30 o 30 de 40, sin exigir encuesta (diagnóstico 4). También hay suelos para gestión con consorcio de referencia, para diseño con grupo motor y para lo modesto y coherente (diagnóstico 5).
- Una sección "Lo que no discrimina (higiene)" con lo que suma poco por sí solo (diagnósticos 6 y 7).
- Una tabla de cifras de referencia entre aprobadas y rechazadas, con notas por criterio, origen de la necesidad, consorcio, personas, productos, alcance, incoherencias y qué hizo la agencia con la sobrecarga.
- 24 anclas anónimas (9 de relevancia, 7 de diseño y 8 de gestión), cada una con un pasaje tipo y la nota del criterio, descritas por contenido, sin título, entidad ni persona.
- Un procedimiento de 8 pasos que añade que, en el perfil A, los defectos se escriben en el recorte y no se restan (diagnóstico 3).
- Una autocomprobación de 10 preguntas antes de dar la nota. Perfil, horquilla, topes, suelos, higiene en B, castigo excesivo en A, zona 61 a 71, coherencia entre la frase de carta y la nota, premio a la longitud y si la nota separa.
- Tres sesgos nuevos. Comprimir hacia el centro, exigir una consulta que la agencia no exige y contar actores sin papel como anclaje.
- Señales nuevas en las listas. Socias "de ámbito no relacionado", iniciativa parecida a otra ya financiada y el elogio a "sin grandes propósitos pero coherente".
- Comprobado sin guiones largos ni semilargos, sin emojis y sin nombres de personas ni de casos. Se quitó una frase que ligaba una nota exacta a rasgos que permitían reconocer la solicitud.

## Resultados de la v1

| Caso | Acción | Real | v0 | v1 | Desglose v1 | Individuales v1 | Error v1 |
|---|---|---|---|---|---|---|---|
| Mind the Gap 2026 | KA152 | 54 | 69 | 53 | 17/21/15 | 53 y 53 | -1 |
| Debate2Participate 2026 | KA153 | 52 | 72 | 52 | 16/21/15 | 52 y 51 | 0 |
| D-iberia-ting 2026 | KA154 | 45 | 69 | 46 | 15/18/13 | 45 y 46 | +1 |
| Green Tracks 2026 | KA155 | 58 | 63 | 58 | 23/23/12 | 57 y 58 | 0 |
| Frames of Us 2026 | KA152 | 72 | 74 | 72 | 22/28/22 | 72 y 72 | 0 |
| DebatIA 2026 | KA154 | 60 | 55 | 50 | 15/20/15 | 50 y 49 | -10 |
| Semillas de Cambio 2026 | KA152 | 51 | 66 | 50 | 16/19/15 | 50 y 50 | -1 |
| DigiTE 2026 | KA153 | 57 | 66 | 51 | 16/20/15 | 51 y 51 | -6 |
| Conexión Atlántica 2026 | KA154 | 52 | 55 | 50 | 15/20/15 | 50 y 49 | -2 |
| Democracia sin barreras 2026 | KA154 | 80 | 68 | 76 | 24/29/23 | 75 y 76 | -4 |
| Melilla is Europe 2026 | KA155 | 79 | 67 | 76 | 32/29/15 | 77 y 75 | -3 |
| ChemSafe 2026 | ESC30 | 57 | 57 | 51 | 18/22/11 | 51 y 51 | -6 |
| Haro Queer 2026 | ESC30 | 60 | 68 | 60 | 24/26/10 | 60 y 60 | 0 |

MAE 2,6, sesgo -2,5, umbral acertado 12 de 13. El único fallo de umbral es DebatIA 2026 (60 real, 50 estimada).

Por acción, el MAE de la v1 es 0,7 en KA152 (3 casos), 3,0 en KA153 (2), 4,3 en KA154 (4), 1,5 en KA155 (2) y 3,0 en ESC30 (2). Por grupo, 2,1 en las 8 rechazadas, 5,0 en las 2 de 60 y 2,3 en las 3 aprobadas.

En los criterios con desglose real, la v1 acierta casi al punto en las rechazadas KA152 a KA154 (Mind the Gap 2026, 54, con 17/21/15 frente a 18/21/15; D-iberia-ting 2026, 45, con 15/18/13 frente a 15/17/13) y en Green Tracks 2026 (58), donde coincide en los tres. En ESC30 falla en diseño y gestión de la rechazada (ChemSafe 2026, 57, con 22 frente a 26 y 11 frente a 13).

Cadres Communs (ronda de octubre, sin nota) sacó 75 con la v1 (24/29/22, individuales 75 y 75), frente a 78 con la v0 y 86 de la estimación interna anterior.

## Lectura honesta

- **Mejora, y no por poco.** El MAE baja de 10,0 a 2,6, el umbral pasa de 6 a 12 aciertos de 13 y desaparece la inversión de los extremos. La v0 ponía a las aprobadas por debajo de rechazadas (Democracia sin barreras 2026, 80, con 68, por debajo de Debate2Participate 2026, 52, con 72). La v1 ordena las 13 casi como la agencia.
- **Pero está medida sobre los mismos casos con los que se ajustó.** Las horquillas por perfil, los topes, los suelos, la tabla de cifras y las anclas salen de estas 13 solicitudes y de sus cartas, así que el error sobre ellas es optimista (sobreajuste). Varios topes se apoyan en uno o dos casos; por ejemplo, el de más de 6 países en 6 días sale de una sola solicitud (Semillas de Cambio 2026, 51). La validación de verdad llegará con las notas de la ronda de octubre de 2026.
- **Algunas anclas se reconocen.** Las anclas R1, R2, D1 y D2 de `evaluador.md` describen de forma reconocible a las dos aprobadas con mejor nota (Melilla is Europe 2026, 79; Democracia sin barreras 2026, 80). Volver a pasar esas solicitudes no es una prueba ciega. Lo mismo ocurre con `anclas.md`, que cita pasajes literales y notas de las 13.
- **El sesgo cambió de signo.** La v0 inflaba (+5,5) y la v1 se queda corta (-2,5). Los cuatro errores mayores son todos por debajo (DebatIA 2026, 60, con -10; DigiTE 2026, 57, con -6; ChemSafe 2026, 57, con -6; Democracia sin barreras 2026, 80, con -4). Con 13 casos no basta para corregir el sesgo sumando puntos, pero hay que vigilarlo.
- **El tope de la lógica académica puede ser demasiado duro.** La v1 dejó en 50 un torneo de debate que la agencia puntuó con 60 y dejó sin fondos solo por el cupo (DebatIA 2026, 60), mientras acertaba los otros dos torneos (D-iberia-ting 2026, 45; Conexión Atlántica 2026, 52). Ni DebatIA ni DigiTE tienen carta con desglose, así que su verdad terreno es más débil que la del resto.
- **La regla de la zona 61 a 71 es un efecto de la muestra.** En las 13 no hay ninguna nota real ahí, pero la red sí la ha tenido (Green Tracks 2025, 61) y el INJUVE financió KA154 de otras entidades entre 64 y 68 en Madrid (DebatIA 2026, 60). La v1 puede empujar a 58 o a 72 una solicitud que de verdad vale 65.
- **La agencia francesa casi no está.** Solo ChemSafe 2026 (57) es de FR02, y es uno de los dos errores de 6 puntos. Cadres Communs, Billets d'Europe y CHEMSAFE r3 serán las primeras pruebas reales con esa agencia.
- **Que los dos evaluadores coincidan no mide el acierto.** En la v1 nunca se separan más de 2 puntos (Melilla is Europe 2026, 79, con 77 y 75), porque las horquillas del perfil dejan poco margen. Si el perfil está mal asignado, los dos se equivocan juntos (DebatIA 2026, 60, con 50 y 49).
- **Las estimaciones internas anteriores no son comparables.** Las cifras de 81 a 88 de `candidaturas.mjs` para la ronda de octubre se hicieron sin calibrar (Cadres Communs, 86 interno frente a 75 con la v1). Hay que rehacerlas con la v1 antes de conocer la nota.

Decisión. La v1 mejora el MAE y el acierto del umbral respecto a la v0, así que pasa a ser la versión vigente de `evaluador.md`. La v0 queda en el historial de git.

## Margen de error que se comunica

- **Regla.** El margen es el error medio fuera de muestra redondeado hacia arriba, y nunca menos de 6. Hoy es 5,1 en 9 casos reales no vistos, con errores de hasta 17 en aprobadas, así que se comunica **más o menos 8**. Historia: empezó en 6 por el sobreajuste a los 13 casos de calibración y se amplió a 8 el 2026-10-03 tras probar con tres aprobadas fuera de muestra.
- **Cómo se dice.** "75 más o menos 8", con el desglose por criterio al lado. Nunca decimales ni la cifra sola.
- **Cuándo avisar.** Si el intervalo cruza 60, puede quedar por debajo del umbral. Si cruza 72, la financiación no está asegurada aunque el centro esté por encima, y depende del cupo de la comunidad o región (Haro Queer 2026, 60, en La Rioja, donde se financió con 73 y 74).
- **Acciones sin calibrar.** KA210, KA220, ESC51 y la Fundación Europea de la Juventud no tienen ningún caso en la muestra. La nota se comunica como orientativa y con más o menos 10, que es el error medio de un prompt sin calibrar (MAE de la v0).
- `assets/workflow_evaluacion.js` lleva el margen en su bloque de datos. Si este documento cambia el margen, hay que cambiarlo también allí.

## Recalibrar con las notas de octubre de 2026

Casos pendientes de la ronda de octubre de 2026, que serán la primera muestra fuera de la calibración.

| Caso | Acción | Agencia | Estimación interna previa (sin calibrar) | v1 congelada | Real |
|---|---|---|---|---|---|
| REAL (Real or Rendered?) | KA152 | ES02 | 87 | 76 (24/30/22), 2026-10-03 | pendiente |
| Cadres Communs | KA152 | FR02 | 86 | 75 (24/29/22), 2026-10-03; segunda pasada 76 | pendiente |
| EMBER | KA153 | ES02 | sin estimación | 60 (23/22/15), 2026-10-03, sobre el PDF enviado el 1 de octubre (la exportación del 15 de septiembre también dio 60) | pendiente |
| Rutas de Barrio | KA155 | ES02 | sin estimación | 78 (33/30/15), 2026-10-03 | pendiente |
| Billets d'Europe | KA155 | FR02 | sin estimación | 66 (27/27/12), 2026-10-03, sobre el texto con unos quince huecos sin rellenar | pendiente |
| Orgullo de Pueblo | KA155 | ES02 | 88 | 80 (33/31/16), 2026-10-03 | pendiente |
| Conecta Sur | ESC30 | ES02 | sin estimación | 81 (34/31/16), 2026-10-03 | pendiente |
| CHEMSAFE r3 | ESC30 | FR02 | sin estimación | 78 (32/30/16), 2026-10-03 | pendiente |
| Haro Queer v2 | ESC30 | ES02 | 81 | 80 (34/30/16), 2026-10-03 | pendiente |

### 1. Antes de conocer ninguna nota

1. Pasar `assets/workflow_evaluacion.js` con la versión vigente sobre cada solicitud tal como se presentó (el ensamblado final de su carpeta en `proyectos/`). Una ejecución por solicitud, con la acción y la agencia correctas.
2. Anotar en la tabla de arriba el total, el desglose, la fecha y la versión del prompt. Esa es la predicción congelada y no se vuelve a tocar. Si se repite la evaluación por cualquier motivo, cuenta la primera.
3. No cambiar `evaluador.md`, `anclas.md` ni el margen hasta que lleguen todas las notas de la ronda, o al menos las del INJUVE. Un cambio a mitad mezcla versiones y deja la validación sin valor.
4. Commit del documento con las predicciones congeladas, para que la fecha quede registrada antes que las cartas. Push solo con permiso.

### 2. Cuando llegan las cartas

1. Guardar la carta en `proyectos/referencias/resultados/` en la carpeta de su ronda y seguir "Cuando llega una carta de resultados" de `comun/maximizar_puntuacion.md`.
2. Rellenar la columna "Real" con el total y el desglose si la carta lo da.
3. Calcular sobre los casos de octubre, y por separado de los 13 de calibración, el error de cada caso, el MAE, el sesgo, el lado del umbral y el error por criterio. Comparar también la estimación interna previa donde la hay.
4. Mirar los casos con error de más de 6 puntos. Para cada uno, qué núcleo, tope o suelo decidió el perfil y qué vio la agencia. Comprobar en especial el tope de la lógica académica (diagnóstico 10), la zona de 61 a 71, la agencia francesa y las tres KA155.

### 3. Decidir

- Si el MAE fuera de muestra es de 6 o menos y el umbral se acierta en al menos 7 de 9, la v1 sigue. El margen pasa a ser el MAE fuera de muestra redondeado hacia arriba, sin bajar de 4 mientras haya menos de 20 casos fuera de muestra (criterio propuesto, revisable).
- Si es peor, se escribe una v2 con los 22 casos. Antes de adoptarla se valida dejando fuera 3 o 4 casos que no se miran al ajustar, y se exige que mejore a la v1 en esos casos, no en los que se usaron para escribirla.
- En cualquier caso, las anclas nuevas salen de los casos de octubre solo después de haberlos puntuado y medido. En `anclas.md` se anota qué casos alimentan las anclas, porque esos dejan de servir para validar.
- Las 8 cartas que no tienen solicitud conservada pasan a la muestra si aparecen sus textos, como casos fuera de muestra para la v1.
- Antes de la ronda de febrero de 2027 se repite el paso 1 con la versión que quede vigente.

## Desglose por criterio de DebatIA y DigiTE (cartas recibidas el 2026-10-03)

Las dos cartas que faltaban llegaron después de calibrar. Dan el desglose que la tabla de arriba no tenía, y lo confirman como diagnóstico, no como reajuste (la v1 no se toca hasta octubre, ver "Recalibrar").

| Caso | Real | v1 | Error por criterio |
|---|---|---|---|
| DebatIA 2026 (KA154) | 60 (24/21/15) | 50 (15/20/15) | relevancia -9, diseño -1, gestión 0 |
| DigiTE 2026 (KA153) | 57 (17/20/20) | 51 (16/20/15) | relevancia -1, diseño 0, gestión -5 |

- El fallo de DebatIA está entero en la relevancia. El tope de la lógica académica se aplicó a una solicitud que en esta ronda ya había quitado el criterio de selección universitario; la agencia le dio 24 de 30 y la castigó en gestión por incoherencias y por reenviar casi lo mismo. Confirma el aviso de arriba: el tope académico debe saltar cuando la selección, la actividad o la difusión siguen siendo académicas, no por el tema del debate.
- En DigiTE la v1 acertó relevancia y diseño y se quedó corta en gestión. La carta no reprocha la gestión, sino la capacidad de la entidad, que la v1 cargó en gestión y la agencia en relevancia.
- Con este desglose, el error por criterio de la v1 en los 11 casos que ya lo tienen está en relevancia más que en diseño o gestión. Es el criterio que hay que mirar primero al recalibrar.

## Validación fuera de muestra (2026-10-03)

Para medir el sobreajuste se escribió una versión de prueba (v1b) con la misma estructura que la v1, pero reconstruida solo con 9 de los 13 casos. Quien la escribió no pudo abrir nada de los otros 4 (ni análisis, ni cartas, ni corpus, ni las anclas que venían de ellos). Después dos evaluadoras ciegas puntuaron esos 4 con la v1b.

| Caso de prueba | Real | v1b | Error |
|---|---|---|---|
| KA154 aprobado con recorte (Democracia sin barreras 2026) | 80 | 73 (23/28/22) | -7 |
| KA155 rechazado (Green Tracks 2026) | 58 | 59 (23/24/12) | +1 |
| KA154 rechazado (Conexión Atlántica 2026) | 52 | 51 (16/20/15) | -1 |
| ESC30 sin fondos (Haro Queer 2026 r1) | 60 | 58 (22/24/12) | -2 |

Error medio fuera de muestra 2,8 y el lado del umbral de 60 se acierta en 3 de 4 (Haro Queer queda en 58 frente a 60 real). La v1 no es solo memoria de los 13 casos: separa aprobadas y rechazadas que no ha visto. Dos cautelas. Son 4 casos, y el error más grande vuelve a estar en la aprobada mejor puntuada (-7), igual que en la v1, así que el evaluador tiende a quedarse corto con los proyectos excelentes. Se mantiene el margen de más o menos 6, que cubre todos los casos de prueba salvo el de 80.

## Segunda prueba fuera de muestra: 7 solicitudes de octubre de 2025 (2026-10-03)

Siete solicitudes de la ronda de octubre de 2025 con nota real, que no estaban en la calibración ni las había visto ningún agente. Se puntuaron con la v1 vigente, dos evaluadoras y mediana.

| Caso | Real | v1 | Error |
|---|---|---|---|
| EcoVibe 2025 (KA152) | 58 (19/21/18) | 58 (19/22/17) | 0 |
| Mind the Gap 2025 (KA152) | 51 (17/18/16) | 52 (17/20/15) | +1 |
| Re-Think, Re-Dress 2025 (KA152) | 59 (20/20/19) | 57 (19/22/16) | -2 |
| Green Tracks 2025 (KA155) | 61 (23/21/17) | 58 (23/23/12) | -3 |
| Igualdad y Deporte 2025 (KA153) | 59 (15/25/19) | 55 (16/23/16) | -4 |
| Verde y Claro 2025 (KA154) | 59 (20/24/15) | 53 (16/21/16) | -6 |
| DebatIA 2025 (KA154) | 60 (20/20/20) | 51 (16/20/15) | -9 |

Error medio 3,6, sesgo -3,3 (se queda corto) y el umbral se acierta en 5 de 7: falla justo en las dos que la agencia dejó en 60 y 61 sin fondos. Lectura: con solicitudes que no ha visto, la v1 no infla; si acaso, castiga de más los KA154 de debate (el mismo tope académico que ya se vio en DebatIA 2026) y la gestión. Las siete están entre 51 y 61, así que esta prueba no dice nada de la parte alta.

### Tercera prueba: tres aprobadas que el evaluador no había visto (2026-10-03)

| Caso | Real | v1 | Error |
|---|---|---|---|
| NEST (KA153, Federación, octubre de 2025) | 70, aprobada | 53 (16/22/15) | -17 |
| Decide con Información (ESC30, Federación, febrero de 2026) | 68, aprobada | 64 (25/26/13) | -4 |
| DiáLogos Europa (KA154, Estrellas del Sur, febrero de 2025) | aprobada sin recorte, nota no publicada | 51 (16/20/15) | por debajo del umbral |

La v1 se queda muy corta con dos de las tres aprobadas. En las dos encontró defectos que la agencia de 2026 sí castigó (texto arrastrado de otra solicitud, cifras que cambian entre apartados, socias con fichas cruzadas, torneos de debate universitarios con decisores genéricos) y les aplicó los topes. La agencia de 2025 los aprobó igualmente. DiáLogos 2025 tiene casi el mismo perfil que Conexión Atlántica 2026 (52) y D-iberia-ting 2026 (45), que se rechazaron por esos mismos motivos.

Lectura: el ruido de la propia agencia es grande. Dos evaluadores distintos, o el mismo en rondas distintas, juzgan igual de forma muy diferente, y la v1 está ajustada a la severidad de la ronda de febrero de 2026. Ningún evaluador simulado puede bajar de un error de 5 a 8 puntos por caso con ese ruido.

Resumen fuera de muestra con nota numérica (9 casos: los 7 de 2025, NEST y Decide con Información): error medio 5,1, sesgo -4,9 (siempre por debajo o en el sitio, nunca infla más de 1 punto) y umbral acertado en 6 de 9 (7 de 10 contando DiáLogos como fallo). Consecuencias:
- El margen que se comunica pasa a **más o menos 8**.
- La v1 sirve para detectar debilidades y para comparar versiones de una misma solicitud. Como predicción absoluta es conservadora: si da 76, la nota real es más probable por encima que por debajo, salvo con agencias o rondas especialmente estrictas.
- Los topes T2 (lógica académica) y T13 (texto de otra solicitud) son demasiado duros para algunas rondas. No se tocan hasta tener las notas de octubre de 2026, para no invalidar las predicciones congeladas, pero son lo primero que hay que revisar en la v2.

### La comparación con anclas no sirvió

Se probó a situar solicitudes comparándolas con ocho casos de nota conocida en lugar de puntuarlas. Con cuatro controles de nota conocida, el error fue de -13 (Frames of Us, 72, situada en 59), +15 (Green Tracks 2026, 58, situada en 73), -3 y +4. Error medio 8,8, peor que puntuar. Las situaciones que dio para octubre (entre 74 y 83) no se usan como estimación. Sí aportaron riesgos concretos que la puntuación no había visto (ver `octubre_riesgos` en la carpeta de resultados del repo privado).

### Lo que queda sin poder medir

Las solicitudes de octubre de 2026 están escritas con la propia skill, que aprendió de las cartas las mismas señales que mira el evaluador. Ningún caso de la muestra es de ese tipo, así que el riesgo de que el evaluador premie su propio estilo sigue abierto hasta que lleguen las notas. Mientras tanto, junto a la cifra del evaluador se da una lectura prudente unos 5 puntos por debajo.

## Versión 2 (2026-10-06)

### Qué cambiaba

La v2 se escribió con los 22 casos que tienen nota real (los 13 de la ronda 1 de 2026, los 7 de octubre de 2025, NEST y Decide con Información) para corregir lo que la v1 hacía peor fuera de muestra, quedarse corta con las aprobadas y con la ronda de 2025. Sus cambios principales:

1. Puntúa por banda del criterio entero (Very good, Good, Fair, Weak de la guía 2026), con subbandas para cada máximo (40, 30, 25 y 20). Un elemento ausente es una debilidad del criterio, no una resta fija.
2. Cada criterio tiene un elemento central que decide la banda. La higiene (Youthpass, seguridad, medidas verdes) no la sube.
3. Mapa de grupos con las notas reales, G1 77-82, G2 68-73, G3 57-61, G4 51-56 y G5 45-50. Sustituye la regla de la zona 61 a 71 por un hueco de 62 a 67: si la nota cae ahí y falta alguna señal de G2, se baja.
4. La lógica académica deja de tener tope duro si va sola, con formato modesto, presupuesto limpio y decisores con función (relevancia 17 a 21 de 30). Solo baja a 16 o menos si se acumulan otros defectos.
5. El tope de texto copiado (máximo 60) queda para copias sustanciales. Un nombre suelto de otra entidad resta 1 o 2 puntos en gestión.
6. El tope por frase de carta cuenta núcleos. Con uno, máximo 60; con dos, 57; con los tres, 52.
7. Reglas propias de KA153. Las necesidades de competencia socia por socia y el trabajo juvenil regular de la solicitante cuentan como necesidad situada; la relevancia queda en 17 de 30 como mucho si no se explican ni ese trabajo ni el vínculo de los participantes con las entidades; siete países con 4 plazas por socia en 7 días es proporcionado.
8. Topes de ESC30, KA155 y diseño ajustados (diseño de las rechazadas hasta 25 o 26 de 40; viajes idénticos en KA155, 13 de 20) y un suelo nuevo de 57 para lo proporcionado y sin copia.
9. Señales visibles para separar grupos, cuatro obligatorias para G1 y cinco para G2. En G1 y G2 la sobrecarga resta como mucho 1 o 2 puntos por criterio y va al recorte.
10. Autocomprobación de 12 preguntas con control de inflado (techos en 67, 76 y 82) y de hundimiento (nada bajo 57 sin varios defectos, nada bajo 51 sin acumulación de G5). Anclas por contenido y en rangos. `comun/criterios_detallados_agencias.md` pasa a la lista de ficheros que el evaluador no abre, porque trae notas reales de la red.

El texto completo está en `evaluador_v2_descartada.md` de esta carpeta.

### Método

- **Validación cruzada en 3 pliegues.** Los 22 casos se repartieron en tres grupos. Para cada grupo se escribió una v2 parcial sin ver ninguno de sus casos (ni la carta, ni el texto, ni anclas que vinieran de ellos) y con ella se puntuaron esos casos. Así cada uno de los 22 se puntúa con una versión que no lo había visto.
- **Dos evaluadoras ciegas por caso,** las mismas personas A y B que en la v1, y mediana por criterio (el medio punto sube).
- **Comparación justa con la v1.** En los 13 casos de 2026 R1 la cifra de la v1 es dentro de muestra y no sirve para comparar. La comparación se hace en los 9 casos que la v1 tampoco había visto (los 7 de 2025, NEST y Decide con Información).
- **Prueba binaria.** Ocho solicitudes antiguas con resultado conocido (aprobada o rechazada) pero sin nota publicada, puntuadas con la v2 final. Ninguna se usó para escribirla. Acierta si la aprobada queda en 60 o más y la rechazada por debajo.
- **Regla de adopción, fijada antes de ver los resultados.** La v2 sustituye a la v1 si en los 9 comparables baja el error medio, no infla de media más de 1 punto y en la prueba binaria acierta al menos lo que acierta la v1.
- Las notas a mano del calibrador sobre los 22 casos, casi todas a 3 puntos o menos de la real, no cuentan como validación, porque los conocía.

### Validación cruzada (22 casos)

| Caso | Acción | Real | Desglose v2 | v1 | v2 | Error v1 | Error v2 |
|---|---|---|---|---|---|---|---|
| Democracia sin barreras 2026 | KA154 | 80 | 23/29/22 | 76 | 74 | -4 | -6 |
| Melilla is Europe 2026 | KA155 | 79 | 28/26/13 | 76 | 67 | -3 | -12 |
| Frames of Us 2026 | KA152 | 72 | 20/26/19 | 72 | 65 | 0 | -7 |
| NEST (2025) * | KA153 | 70 | 16/22/15 | 53 | 53 | -17 | -17 |
| Decide con Información (2026) * | ESC30 | 68 | 24/27/14 | 64 | 65 | -4 | -3 |
| Green Tracks 2025 * | KA155 | 61 | 23/23/12 | 58 | 58 | -3 | -3 |
| DebatIA 2026 | KA154 | 60 | 16/22/16 | 50 | 54 | -10 | -6 |
| DebatIA 2025 * | KA154 | 60 | 16/20/14 | 51 | 50 | -9 | -10 |
| Haro Queer 2026 r1 | ESC30 | 60 | 25/26/11 | 60 | 62 | 0 | +2 |
| Re-Think, Re-Dress 2025 * | KA152 | 59 | 19/22/16 | 57 | 57 | -2 | -2 |
| Verde y Claro 2025 * | KA154 | 59 | 16/21/15 | 53 | 52 | -6 | -7 |
| Igualdad y Deporte 2025 * | KA153 | 59 | 18/24/18 | 55 | 60 | -4 | +1 |
| EcoVibe 2025 * | KA152 | 58 | 19/23/17 | 58 | 59 | 0 | +1 |
| Green Tracks 2026 | KA155 | 58 | 23/23/12 | 58 | 58 | 0 | 0 |
| DigiTE 2026 | KA153 | 57 | 17/22/15 | 51 | 54 | -6 | -3 |
| ChemSafe 2026 r1 | ESC30 | 57 | 20/23/11 | 51 | 54 | -6 | -3 |
| Mind the Gap 2026 | KA152 | 54 | 18/23/15 | 53 | 56 | -1 | +2 |
| Conexión Atlántica 2026 | KA154 | 52 | 16/20/16 | 50 | 52 | -2 | 0 |
| Debate2Participate 2026 | KA153 | 52 | 17/24/15 | 52 | 56 | 0 | +4 |
| Semillas de Cambio 2026 | KA152 | 51 | 16/22/15 | 50 | 53 | -1 | +2 |
| Mind the Gap 2025 * | KA152 | 51 | 18/22/19 | 52 | 59 | +1 | +8 |
| D-iberia-ting 2026 | KA154 | 45 | 16/21/15 | 46 | 52 | +1 | +7 |

Con asterisco, los 9 casos comparables (fuera de muestra para las dos versiones). En los otros 13 la columna v1 es dentro de muestra.

| Medida | v1 | v2 |
|---|---|---|
| **9 comparables, error medio** | **5,1** | **5,8** |
| 9 comparables, sesgo (estimada menos real) | -4,9 | -3,6 |
| 9 comparables, lado del umbral de 60 acertado | 6 de 9 | 5 de 9 |
| 9 comparables, casos a 3 puntos o menos | 4 | 5 |
| 22 casos, error medio | 3,6 (13 dentro de muestra) | 4,8 |
| 22 casos, sesgo | -3,5 | -2,4 |
| 22 casos, umbral acertado | 18 de 22 | 17 de 22 |
| 22 casos, error máximo | 17 | 17 |
| 13 de 2026 R1, error medio | 2,6 (dentro de muestra) | 4,2 |
| 5 aprobadas con 68 o más, sesgo | -5,6 | -9,0 |
| 13 rechazadas (menos de 60), sesgo | -2,0 | +0,8 |

### Prueba binaria (8 casos sin nota publicada)

| Caso | Resultado real | v2 | Desglose v2 | Acierta | v1 |
|---|---|---|---|---|---|
| Deubating 2023 | aprobada | 52 | 15/21/16 | no | no se pasó |
| Community Dance 2022 | aprobada | 60 | 16/25/19 | sí, justo en el umbral | no se pasó |
| DiáLogos Europa 2025 | aprobada | 54 | 16/20/18 | no | 51, falla |
| DiáLogos 2024 r1 | rechazada | 51 | 15/20/16 | sí | no se pasó |
| BEC 2023 | rechazada | 56 | 18/21/17 | sí | no se pasó |
| EUmigrating 2023 | rechazada | 48 | 15/20/13 | sí | no se pasó |
| No Planet B 2022 | rechazada | 50 | 15/21/14 | sí | no se pasó |
| Critical Thinking 2022 | rechazada | 48 | 15/19/14 | sí | no se pasó |

La v2 acierta 6 de 8, las cinco rechazadas y una de las tres aprobadas, y esa por los pelos. Falla DiáLogos 2025, igual que la v1, y además Deubating 2023. Con un solo caso en común, la prueba binaria no separa las dos versiones. Lo que sí muestra es que la v2 sigue sin reconocer las aprobadas de rondas anteriores, que era lo que se quería arreglar.

### Lectura

- **Lo que mejora.** El sesgo se acerca a cero (de -4,9 a -3,6 en los comparables) y suben los casos que la v1 hundía por topes duros, como DebatIA 2026 (de -10 a -6), Igualdad y Deporte 2025 (de -4 a +1), DigiTE 2026 y ChemSafe 2026 r1 (de -6 a -3). El tope académico condicionado y las reglas de KA153 van en la buena dirección.
- **Lo que empeora.** La v2 comprime hacia el centro, el defecto de la v0 que la v1 había corregido. Infla las rechazadas (sesgo +0,8, con Mind the Gap 2025 a +8 y D-iberia-ting 2026 a +7) y hunde más las aprobadas (sesgo -9,0 en las cinco de 68 o más, con Melilla is Europe 2026 a -12 y Frames of Us 2026 a -7).
- **El hueco de 62 a 67 no funcionó.** Cuatro casos caen justo ahí (Melilla is Europe 2026, 67; Decide con Información, 65; Frames of Us 2026, 65; Haro Queer 2026 r1, 62). Las evaluadoras no aplican la regla de mover la nota fuera del hueco, y las señales obligatorias de G1 y G2 dejan fuera a aprobadas reales.
- **NEST sigue igual** (-17 con las dos versiones). Ninguna regla escrita con la ronda de 2026 reconoce esa aprobada de 2025. Es el ruido entre rondas que ya se describió en la tercera prueba de la v1.
- **Cautela.** La validación cruzada mide el procedimiento de escribir la v2, no el fichero final exacto, que se escribió con los 22 casos. Es lo mejor que se puede medir antes de octubre.

### Decisión

La v2 **no sustituye** a la v1. En los 9 comparables el error medio sube de 5,1 a 5,8, así que falla la primera condición de la regla. No infla (su sesgo sigue siendo negativo, -3,6) y en la prueba binaria empata con la v1 en el único caso común, pero eso no basta. `evaluador.md` sigue en la versión 1 y la v2 se guarda como `evaluador_v2_descartada.md`.

Esto respeta además el paso 3 de "Recalibrar", y las predicciones congeladas de la v1 siguen siendo la referencia de octubre. Para la v3 conviene conservar de la v2 el tope académico condicionado, las reglas de KA153 y la puntuación por banda, y quitar el mapa de grupos con hueco y las señales obligatorias, que empujan las aprobadas hacia abajo y las rechazadas hacia arriba. La v3 se escribe cuando lleguen las notas de octubre, con los 22 casos más los de octubre, y se valida igual, por pliegues.

### Margen

Con la regla de esta sección (error medio de la validación cruzada redondeado hacia arriba, mínimo 6), a la v2 le habría tocado **más o menos 6** (4,8 se redondea a 5 y sube al mínimo). No se aplica, porque la v2 no es la vigente. La v1 conserva **más o menos 8**. Su error medio fuera de muestra es 5,1, pero con errores de hasta 17 en aprobadas, y la validación de la v2, con errores de -17 y -12, confirma que 6 se quedaría corto. `SKILL.md`, `workflow_evaluacion.js` y `README.md` ya dicen 8 y no cambian.

### Predicciones de octubre de 2026 con la v1 y con la v2

La predicción congelada oficial sigue siendo la de la v1 (tabla de "Recalibrar"). La de la v2 se congela también, con fecha 2026-10-06, como prueba fuera de muestra adicional. Si con las notas reales la v2 acertara claramente mejor que la v1, se reconsideraría. Las dos versiones no puntuaron exactamente el mismo texto, porque la v1 puntuó el ensamblado final de cada carpeta (en Billets d'Europe, con unos quince huecos sin rellenar) y la v2 la versión exportada del portal. Los datos completos, con las debilidades de cada caso, están en `proyectos/referencias/resultados/2026-2_predicciones_congeladas_v2.json`.

| Caso | Acción | Agencia | v1 (2026-10-03) | v2 (2026-10-06) | Individuales v2 | Diferencia |
|---|---|---|---|---|---|---|
| REAL (Real or Rendered?) | KA152 | ES02 | 76 (24/30/22) | 72 (23/28/21) | 72 y 72 | -4 |
| Bridges Beyond the Mediterranean | KA152 | ES02 | no se pasó | 57 (19/21/17) | 56 y 56 | |
| Cadres Communs | KA152 | FR02 | 76 (24/30/22) | no se pasó | | |
| EMBER | KA153 | ES02 | 60 (23/22/15) | 73 (24/29/20) | 70 y 75 | +13 |
| ACCESS-YW | KA153 | ES02 | no se pasó | 68 (20/28/20) | 68 y 68 | |
| EU Voices | KA154 | ES02 | no se pasó | 60 (18/22/20) | 59 y 59 | |
| Rutas de Barrio | KA155 | ES02 | 78 (33/30/15) | 75 (31/30/14) | 73 y 75 | -3 |
| Orgullo de Pueblo | KA155 | ES02 | 80 (33/31/16) | 77 (31/31/15) | 77 y 76 | -3 |
| Green Tracks 2026 r2 | KA155 | ES02 | no se pasó | 60 (23/25/12) | 59 y 60 | |
| Melilla 2026 r2 | KA155 | ES02 | no se pasó | 73 (30/29/14) | 72 y 73 | |
| Billets d'Europe | KA155 | FR02 | 66 (27/27/12) | 76 (31/30/15) | 73 y 78 | +10 |
| Conecta Sur | ESC30 | ES02 | 81 (34/31/16) | 76 (31/30/15) | 73 y 78 | -5 |
| Haro Queer v2 | ESC30 | ES02 | 80 (34/30/16) | 75 (31/29/15) | 72 y 78 | -5 |
| CHEMSAFE r3 | ESC30 | FR02 | 78 (32/30/16) | 74 (30/29/15) | 73 y 73 | -4 |

En los ocho casos con las dos versiones, la v2 baja entre 3 y 5 puntos las seis que la v1 ya veía como aprobadas y sube mucho las dos que la v1 dejaba bajas (EMBER, +13; Billets d'Europe, +10). La subida de Billets puede deberse en parte al texto, porque la v1 puntuó una versión con unos quince huecos y la del portal conserva al menos uno (la consulta de Necesidades). La de EMBER encaja con las reglas nuevas de KA153. Son las dos predicciones en las que las versiones discrepan de verdad y las primeras que hay que mirar cuando lleguen las cartas.

## Historial de versiones

| Versión | Fecha | Ajustada con | MAE en la muestra de ajuste | MAE fuera de muestra | Margen comunicado |
|---|---|---|---|---|---|
| v0 | 2026-10-03 | sin calibrar | 10,0 (13 casos) | no aplica | no se usó |
| v1 | 2026-10-03 | 13 casos de la ronda 1 de 2026 y 21 cartas | 2,6 (13 casos) | 2,8 en 4 casos con la v1b; 5,1 en 9 casos reales no vistos (sesgo -4,9); octubre de 2026 pendiente | 8 (vigente) |
| v2 (descartada) | 2026-10-06 | 22 casos (13 de 2026 R1, 7 de octubre de 2025, NEST y Decide con Información) y sus cartas | no medido (solo notas a mano del calibrador) | 4,8 en 22 casos con validación cruzada en 3 pliegues; 5,8 en los 9 comparables con la v1 (sesgo -3,6); 6 de 8 en la prueba binaria | no se comunica (le habría tocado 6) |
