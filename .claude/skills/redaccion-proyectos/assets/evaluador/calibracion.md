# Calibración del evaluador simulado

Documento para quien mantiene el prompt del evaluador y para quien comunica sus notas. El agente evaluador no lo lee nunca, porque contiene las notas reales de las solicitudes con las que se calibró y rompería la evaluación ciega.

Versión vigente `evaluador.md` versión 1, calibrada el 2026-10-03. Margen que se comunica con cada estimación, **más o menos 6 puntos**. La nota se da siempre así, "75 más o menos 6", nunca la cifra sola.

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

- **Regla.** El margen es el MAE de la versión vigente redondeado hacia arriba, y nunca menos de 6 puntos mientras ese MAE se haya medido sobre los mismos casos con los que se ajustó. Hoy el MAE de la v1 es 2,6, que redondeado da 3, y por el sobreajuste se comunica **más o menos 6**. El error máximo observado de la v1 fue 10 (DebatIA 2026, 60) y la v0 erraba de media 10, así que 6 no es un margen holgado.
- **Cómo se dice.** "75 más o menos 6", con el desglose por criterio al lado. Nunca decimales ni la cifra sola.
- **Cuándo avisar.** Si el intervalo cruza 60, puede quedar por debajo del umbral. Si cruza 72, la financiación no está asegurada aunque el centro esté por encima, y depende del cupo de la comunidad o región (Haro Queer 2026, 60, en La Rioja, donde se financió con 73 y 74).
- **Acciones sin calibrar.** KA210, KA220, ESC51 y la Fundación Europea de la Juventud no tienen ningún caso en la muestra. La nota se comunica como orientativa y con más o menos 10, que es el error medio de un prompt sin calibrar (MAE de la v0).
- `assets/workflow_evaluacion.js` lleva el margen en su bloque de datos. Si este documento cambia el margen, hay que cambiarlo también allí.

## Recalibrar con las notas de octubre de 2026

Casos pendientes de la ronda de octubre de 2026, que serán la primera muestra fuera de la calibración.

| Caso | Acción | Agencia | Estimación interna previa (sin calibrar) | v1 congelada | Real |
|---|---|---|---|---|---|
| REAL (Real or Rendered?) | KA152 | ES02 | 87 | pendiente | pendiente |
| Cadres Communs | KA152 | FR02 | 86 | 75 (24/29/22), 2026-10-03 | pendiente |
| EMBER | KA153 | ES02 | sin estimación | pendiente | pendiente |
| Rutas de Barrio | KA155 | ES02 | sin estimación | pendiente | pendiente |
| Billets d'Europe | KA155 | FR02 | sin estimación | pendiente | pendiente |
| Orgullo de Pueblo | KA155 | ES02 | 88 | pendiente | pendiente |
| Conecta Sur | ESC30 | ES02 | sin estimación | pendiente | pendiente |
| CHEMSAFE r3 | ESC30 | FR02 | sin estimación | pendiente | pendiente |
| Haro Queer v2 | ESC30 | ES02 | 81 | pendiente | pendiente |

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

## Historial de versiones

| Versión | Fecha | Ajustada con | MAE en la muestra de ajuste | MAE fuera de muestra | Margen comunicado |
|---|---|---|---|---|---|
| v0 | 2026-10-03 | sin calibrar | 10,0 (13 casos) | no aplica | no se usó |
| v1 | 2026-10-03 | 13 casos de la ronda 1 de 2026 y 21 cartas | 2,6 (13 casos) | pendiente (octubre de 2026) | 6 |
