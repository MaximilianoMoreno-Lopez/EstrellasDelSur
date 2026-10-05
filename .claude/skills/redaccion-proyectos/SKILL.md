---
name: redaccion-proyectos
description: Redactar, revisar, adaptar, ampliar o rehacer tras un rechazo solicitudes de subvención de proyectos europeos (Erasmus+ KA152, KA153, KA154, KA155, KA210, KA220; Cuerpo Europeo de Solidaridad ESC30 y ESC51; Fundación Europea de la Juventud del Consejo de Europa y otras convocatorias) buscando la máxima puntuación, con horarios, presupuesto y Word listos para pegar. Usar cuando el usuario pida escribir un formulario, un borrador de solicitud, adaptar una solicitud aprobada, añadir una socia, mejorar una solicitud rechazada o registrar el resultado de una candidatura.
---

# Redacción de solicitudes de proyectos europeos

El objetivo es que cada solicitud saque la nota más alta posible, no solo que pase el umbral. El proceso es común a todas las convocatorias; cada acción tiene un perfil con lo específico y cada tipo de encargo una receta. La skill aprende de las notas reales: cada carta de resultados que llega se convierte en palancas nuevas.

Nació del KA154 EuroÁgora (agosto de 2026) y se afinó con las diez solicitudes presentadas el 1 de octubre de 2026. Estimaciones del evaluador simulado entre 81 y 88, hechas antes de calibrarlo (con la versión calibrada hay que rehacerlas); los dos rechazos registrados (57 y 60) son la base de las palancas de relevancia y gestión.

## Mapa

| Qué | Dónde | Público o privado |
|---|---|---|
| Palancas para puntuar alto | `comun/maximizar_puntuacion.md` | skill |
| Receta según el encargo | `recetas/` | skill |
| Perfil y rúbrica de cada acción | `perfiles/<accion>.md`, `perfiles/rubricas/<accion>.md` | skill |
| Estilo, biblia, criterios comunes | `comun/` | skill |
| Herramientas (Word, horario, contador, fechas, presupuesto, workflows) | `assets/` y su `README.md` | skill |
| Lecciones por proyecto | `historial/` | skill |
| Lo que hicieron los evaluadores con nuestros textos (26 resultados, reproches, recortes) | `comun/lecciones_evaluadores.md` | skill |
| Lo que dicen las guías y las agencias que valoran y penalizan | `comun/buenas_practicas_evaluadores.md` | skill |
| Evaluador simulado calibrado (prompt, anclas, calibración y margen) | `assets/evaluador/` (`evaluador.md`, `anclas.md`, `calibracion.md`) | skill |
| Resultados y notas de todas las candidaturas | `src/lib/candidaturas.mjs` (tablero en `/radar/`) | repo público, sin datos personales |
| Fichas de organizaciones y socias | `proyectos/referencias/organizaciones/` | repo privado |
| Solicitudes, PIF, guías, aprobadas de referencia, plantillas | `proyectos/` | repo privado |
| Cartas de las agencias y solicitudes presentadas con su nota (verdad terreno de la calibración) | `proyectos/referencias/resultados/` | repo privado |

`proyectos/` es un repositorio privado aparte, excluido del público con `/proyectos/` en `.gitignore` (anclado, para no excluir `src/pages/proyectos/`). Lleva PIF con teléfonos, PRN y fechas de nacimiento: nada de ahí se copia a la skill, a `candidaturas.mjs` ni a ningún fichero del repo público. La skill tiene que poder compartirse tal cual.

## Lo primero

1. **Receta.** Identificar el encargo y leer la receta de `recetas/` (desde cero, adaptar aprobada, ampliar, tras rechazo, añadir socia).
2. **Perfil.** Leer `perfiles/<accion>.md` y su rúbrica. `VERIFICADO` es fiable; `BORRADOR` o `ESQUELETO` hay que cerrarlo antes de redactar siguiendo su sección "Cómo cerrar este perfil". Si la acción no tiene perfil, copiar `perfiles/_plantilla.md`.
3. **Historial de resultados.** Mirar en `src/lib/candidaturas.mjs` qué ha presentado ya la solicitante (con qué nota y lección) y qué hermanas van en la misma ronda.
4. **Fichas.** Leer la ficha de la solicitante y de cada socia en `proyectos/referencias/organizaciones/`. Son la única fuente de datos permitidos de cada entidad y llevan sus reglas duras (quién figura dónde, qué no se puede afirmar).
5. **Palancas.** `comun/maximizar_puntuacion.md` es la lista de comprobación del verificador de rúbrica.

## Disciplina de tokens

- No releer guías completas. La rúbrica destilada está en `perfiles/rubricas/`; si falta, destilarla una vez y guardarla.
- PDF y Word se extraen a .txt en el scratchpad y se buscan con Grep.
- Los subagentes leen ficheros y rangos de líneas indicados, no material pegado en el prompt. Excepción: los verificadores reciben el borrador ensamblado.
- Reutilizar `assets/workflow_redaccion.js` y `assets/workflow_correccion.js` editando solo el bloque de datos.
- Invertir en la biblia, no en iterar borradores.

## Proceso

### 1. Recopilar
PIF, formulario oficial (vacío o de referencia), datos del proyecto y guía del año. Si el usuario no da formulario, el perfil manda: no inventar preguntas ni campos. Si el usuario pide trabajar sin preguntas, fijar supuestos razonables y listarlos al final del Word.

### 2. Datos con fuente
Un agente de investigación por frente y un verificador que relee cada URL. Solo lo confirmado entra en la biblia. Es la palanca que más sube relevancia.

### 3. Biblia
`comun/biblia_template.md` en la carpeta `trabajo/` del proyecto, con:
- cifras que cuadran entre sí;
- calendario comprobado con `assets/fechas.py`;
- presupuesto con `assets/presupuesto_ka1.py`;
- voz fijada (en ESC30, los jóvenes en primera persona);
- un mecanismo propio por bloque;
- lista de lo que no se puede reutilizar de la referencia aprobada ni de las hermanas de la ronda.

Advertencias que ya costaron caras:
- Estreno se cuenta como estreno, nunca como continuación de un proyecto ajeno.
- "Primer proyecto" sí; "primera candidatura" nunca si la agencia tiene otra registrada.
- Ningún dato de una entidad fuera de su ficha.

### 4. Redacción
Formularios largos, redactores en paralelo con `assets/workflow_redaccion.js`, uno por bloque, con las preguntas literales como encabezados `###`. Formularios cortos, una sola mano de un tirón. Cada argumento se cuenta entero en un bloque y en el resto se remite. Longitud objetivo 4.000 a 4.900 caracteres sobre 5.000.

### 5. Verificación adversarial
Sobre el borrador ensamblado, como mínimo:
- **Coherencia**: cifras, fechas, ciudades, placeholders, repeticiones entre bloques.
- **Rúbrica y palancas**: elemento a elemento, más la carta de la agencia si es una reescritura.
- **Originalidad**: contra la referencia aprobada, las hermanas de la misma ronda y los proyectos anteriores de la solicitante.
- **Estilo e idioma**: `comun/reglas_estilo.md`, tono de IA y longitudes.
- **Protección** si el tema es sensible.

La nota estimada sale de `assets/workflow_evaluacion.js` sobre el ensamblado final (dos evaluadoras ciegas con el prompt calibrado de `assets/evaluador/`, mediana por criterio) y va a `notaEstimada`. Se comunica siempre con su margen de `assets/evaluador/calibracion.md`, por ejemplo "82 más o menos 8" con el margen vigente, nunca la cifra sola. El evaluador rápido de `workflow_verificacion.js` es solo un control.

### 6. Corrección
`assets/workflow_correccion.js`. Asignar cada issue a su bloque, pasar G1-G12 tal cual y decidir TÚ las cuestiones transversales antes de lanzar. Después, segunda ronda de coherencia sobre la versión final: las correcciones por bloque abren incoherencias nuevas.

### 7. Comprobación mecánica y entregables
- `assets/comprobacion_mecanica.py` (tics, guiones, placeholders, códigos internos).
- `assets/contar.py` (topes por respuesta y por celda).
- `assets/fechas.py --anio <año>` (sin `--anio` puede suponer mal el año).
- Word con `assets/md2docx.py`.
- En KA1, horario con `assets/horario_xlsx.py` sobre la plantilla oficial (`proyectos/referencias/plantillas/`) y `assets/horario_pdf.py` para el anexo.

Uso de cada herramienta en `assets/README.md`.

**Antes de enviar, revisar el PDF exportado del portal, no el Word.** En octubre de 2026 tres solicitudes salieron con restos de trabajo pegados en el portal: un hueco `[CONSULTATION DES JEUNES - date, nombre...]` en Billets d'Europe, la nota "HAY QUE PONER ESTO QUE PAULA TIENE DISCAPACIDAD" en EMBER, y "FALTA LA PARTE DE MELILLA" y "(no sé si ponerlos como parte del grupo motor)" en EU Voices. Pídele al usuario el PDF del portal, extráelo a texto y pásale `assets/comprobacion_mecanica.py`, más una búsqueda de corchetes, "FALTA", "HAY QUE", "no sé", "CONFIRMAR", "TODO" y nombres de personas junto a datos de salud o discapacidad. Comprueba también que las socias citadas en el texto son las del consorcio.

### 8. Cierre y aprendizaje
- **Resumen al usuario**: decisiones, lo que cazaron los verificadores, supuestos y datos pendientes, y la nota estimada de `assets/workflow_evaluacion.js` por criterio y con su margen ("82 más o menos 8"), con el aviso si el intervalo cruza 60 o 72. Recordar que la checklist de originalidad la firma el usuario.
- **Registrar la candidatura** en `src/lib/candidaturas.mjs`, sin nombres de participantes, PRN ni teléfonos.
- **Actualizar** el perfil de la acción, las fichas de las entidades implicadas y una entrada de `historial/`.
- **Cuando llegue la carta de resultados**, seguir "Cuando llega una carta" en `comun/maximizar_puntuacion.md` y anotar la nota real junto a la predicción congelada en `assets/evaluador/calibracion.md`, que explica cuándo recalibrar. Es lo que hace que la skill mejore.
- **Commits**: la skill y `candidaturas.mjs` van al repo público y las solicitudes y fichas al privado `proyectos/`. Push solo con permiso del usuario.
