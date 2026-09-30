# Cómo maximizar la puntuación

Palancas aprendidas con notas reales. Cada una lleva la solicitud que la enseñó; la lista crece con cada carta de resultados que llega (ver "Cuando llega una carta" al final). Las notas reales, las estimadas y las lecciones de todas las candidaturas están en `src/lib/candidaturas.mjs`, que es también el tablero de `/radar/`.

## Lo que ya sabemos de los números

- El umbral no basta. Haro Queer ronda 1 sacó 60 (25/40, 25/40, 10/20), superó el corte y no se financió porque el INJUVE priorizó otros proyectos de La Rioja. Con cupos autonómicos o agencias con poco dinero, se compite contra el resto de la región: hay que apuntar a 80 o más.
- El criterio que más cae es relevancia. ChemSafe ronda 1 sacó 18/40 en relevancia con 26/40 en diseño. Un buen programa no compensa unas necesidades sin datos ni un público sin cara.
- La gestión se pierde por genérica, no por mala. Los dos rechazos se dejaron la mitad de los puntos de gestión con textos que servían para cualquier proyecto.
- El evaluador simulado de la skill ha dado entre 81 y 88 a las solicitudes de octubre de 2026. Cuando lleguen las notas reales, comparar criterio a criterio y recalibrar este documento.

## Relevancia (30 o 40 puntos)

1. **Datos con fuente nombrada en la frase.** Cifra, organismo y año ("según la ENVIE 2023 del INJEP..."). Nada de "cada vez más jóvenes". Un agente de datos que verifique cada URL antes de redactar (CHEMSAFE: 60 de 63 datos confirmados).
2. **Cómo se detectó la necesidad.** Proceso real y con fecha: encuestas, grupos, una sesión concreta, lo que dijeron los jóvenes. Las dos cartas de rechazo lo echaron en falta.
3. **Necesidades de los participantes Y de las organizaciones.** Dos párrafos distintos. El segundo casi siempre se olvida.
4. **Vínculo organización, público y tema.** Explicar por qué esta entidad trabaja con estos jóvenes en este tema, con actividad regular y cifras. Sacarlo de la ficha de `proyectos/referencias/organizaciones/`, nunca inventarlo.
5. **Prioridades con medida concreta.** Las cuatro prioridades transversales nombradas con lo que hace el proyecto por cada una, y las de la agencia o la convocatoria si las publica (topics, Youth Goals, EU Youth Strategy). Citarlas en vacío no puntúa.
6. **Valor europeo que no se consigue en casa.** Qué aprende el grupo de las socias y al revés, con ejemplos de cada país.
7. **Estreno como fortaleza.** Si la coordinadora estrena la acción, decirlo: puntúa como organización recién llegada. Pero "primer proyecto" sí y "primera candidatura" nunca si la agencia tiene otra registrada (CHEMSAFE).

## Diseño y calidad (40 puntos)

1. **Trazabilidad visible.** Necesidad, objetivo, actividad, resultado y su indicador, sin huecos. El verificador de rúbrica la recorre en ambos sentidos.
2. **Voz de los jóvenes.** En ESC30 el "nosotros" son los jóvenes y la asociación va en tercera persona (ChemSafe r1 se leyó como proyecto de la asociación). En KA1, un órgano joven con nombre, funciones y calendario en todas las fases, concepción incluida.
3. **Un mecanismo propio por bloque.** Cada solicitud necesita soluciones que no estén en la referencia aprobada ni en sus hermanas de la misma ronda (Rutas de Barrio calcó sin querer la estructura de Billets). Nombrar la innovación en una frase.
4. **Método que se puede ver.** Día por día, con sesiones, métodos y quién conduce. El horario anexo (herramienta `horario_xlsx.py`) es parte del argumento, no un trámite.
5. **Inclusión por obstáculo.** Tipo de obstáculo, cuántas personas y medida de apoyo para cada uno, con su partida presupuestaria. Cifra siempre en los campos numéricos.
6. **Protección a la medida del tema.** Tema sensible significa protocolo específico, coach o persona de referencia formada, control de edad si hay menores cerca, consentimiento y privacidad (Orgullo de Pueblo y Haro Queer: nada que exponga a un joven LGTBIQ+ en su pueblo). Con jóvenes migrantes, los documentos de viaje son el primer riesgo (Billets).
7. **Youthpass como proceso** desde el primer día, con momentos de reflexión fechados.
8. **Evaluación que pilota.** Indicadores con meta numérica y umbral que dispara un ajuste, evaluación intermedia fechada dentro de la vida del proyecto (nunca indicadores a seis meses que caen fuera, Billets).

## Gestión, impacto y difusión (20 o 30 puntos)

1. **Actores con nombre y estado de contacto.** "Hemos contactado con X, que ha confirmado..." o "vamos a proponer a Y". Aliados sin nombre fue un reproche en los dos rechazos.
2. **Reparto de tareas por socia** con hitos, reuniones y quién decide qué. Nada que sirva para otro proyecto cambiando el nombre.
3. **Capacidad documentada.** Experiencia previa real, personas clave con cargo y horas, cuentas y procedimientos. De la ficha de la organización.
4. **Presupuesto coherente con la agencia.** Calcular con `presupuesto_ka1.py`; en rondas y agencias con poco dinero, pedir ajustado (Haro Queer se recortó a cuatro meses para caber en el cupo; CHEMSAFE sin costes excepcionales).
5. **Difusión con destinatarios concretos** y los jóvenes como difusores, no solo como público. Resultados tangibles que alguien pueda reutilizar.
6. **Sostenibilidad posterior** con lo que sigue cuando acaba la financiación, quién lo sostiene y con qué recursos.

## Forma (no puntúa sola, pero resta)

- Longitud. Con tope de 5.000 caracteres, apuntar a 4.000 o 4.900. Las KA155 de 1.300 a 2.000 caracteres se quedaron cortas frente a la aprobada de referencia, que usa 4.000 a 5.000. Nunca pasarse: el portal corta (CHEMSAFE llegó con un campo cortado). Medir con `contar.py`, también por celda en las tablas.
- Fechas. Todo día de la semana comprobado con `fechas.py` (Cadres Communs tenía la Journée en "sábado 25" cuando era domingo).
- Estilo sin tics de IA (`comun/reglas_estilo.md`). El evaluador lee decenas seguidas y el texto genérico baja la nota de todos los criterios.
- Cada argumento contado entero en un bloque y remitido en el resto.
- Originalidad frente a la referencia aprobada, frente a las hermanas de la misma ronda y frente a los proyectos anteriores de la misma solicitante (DiáLogos fue señalada por su parecido con D-EU-BATING).

## Cuando llega una carta de resultados

1. Actualizar la entrada en `src/lib/candidaturas.mjs`: `estado`, `nota` con los criterios, `importeConcedido` y `leccion` en una o dos frases.
2. Si trae comentarios, guardarlos en la carpeta del proyecto (`trabajo/feedback_agencia.md`) y convertir cada reproche en una palanca de este documento, con el nombre de la solicitud.
3. Comparar la nota real con `notaEstimada`. Si el evaluador simulado se desvía más de 8 puntos en un criterio, anotar en la rúbrica de la acción qué miró la agencia que nosotros no.
4. Añadir o actualizar la entrada de `historial/` y la ficha de la organización.
