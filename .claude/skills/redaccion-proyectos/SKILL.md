---
name: redaccion-proyectos
description: Redactar, revisar o mejorar solicitudes de subvención de proyectos europeos (Erasmus+ KA152, KA153, KA154, KA210, KA220; Cuerpo Europeo de Solidaridad ESC30 y ESC51; Fundación Europea de la Juventud del Consejo de Europa; Anna Lindh y otras convocatorias) de forma completa, verificada y con disciplina de tokens. Usar cuando el usuario pida escribir un formulario, un borrador de solicitud, una memoria de proyecto o auditar una solicitud ya escrita.
---

# Redacción de solicitudes de proyectos europeos

Proceso común a todas las convocatorias, con un perfil por acción que aporta lo específico (bloques del formulario, criterios y trampas). Nació del KA154 EuroÁgora (agosto 2026): 7 redactores en paralelo, 3 verificadores adversariales, 7 correctores y ensamblado a .docx, con 43 problemas reales cazados antes de entregar.

## Lo primero: elegir perfil

1. Identifica la acción exacta y lee `perfiles/<accion>.md`. Perfiles disponibles: `ka152-you`, `ka153-you`, `ka154-you`, `ka210-you`, `ka220-yth`, `esc30-sol`, `esc51-vtj`, `coe-eyf`.
2. Cada perfil lleva un campo **Estado**. `VERIFICADO` = contrastado contra formulario y guía oficiales, fiable. `BORRADOR` = estructura correcta pero criterios o pesos por confirmar. `ESQUELETO` = solo el andamiaje, hay que cerrarlo antes de redactar.
3. Si el perfil no está `VERIFICADO`, ciérralo ANTES de redactar siguiendo su sección "Cómo cerrar este perfil", y guarda ahí lo que averigües. Cada solicitud deja el perfil mejor que lo encontró.
4. Si la convocatoria no tiene perfil, copia `perfiles/_plantilla.md`, rellénalo y déjalo en el repo con el commit del proyecto.

Lo transversal a todas las acciones está en `comun/`: no lo repitas en los perfiles.

## Disciplina de tokens (la razón de ser del skill)

- No releer guías completas de 80 o 200 páginas. Cada perfil tiene su rúbrica destilada; si falta, destílala UNA vez con pypdf y guárdala en `perfiles/rubricas/`.
- PDFs de materiales (PIF, solicitudes de referencia, guía del programa): extraer a .txt en el scratchpad y localizar secciones con Grep. En el contexto principal leer solo lo imprescindible.
- Los subagentes leen FICHEROS y rangos de líneas que tú les indicas, nunca material largo pegado en el prompt. Excepción: los verificadores reciben el borrador ensamblado inline.
- Reutilizar `assets/workflow_redaccion.js` y `assets/workflow_correccion.js` editando solo el bloque de datos.
- Una biblia bien cerrada = menos ciclos de corrección. Invertir ahí, no en iterar borradores.

## Proceso

### 1. Recopilar y extraer
Localiza o pide: PIF de la organización coordinadora, formulario oficial de la acción (vacío o de referencia aprobada), datos del proyecto (título, socias, duración, actividades, temáticas, topics) y la guía del programa del año en curso. Extrae los PDFs a texto. De un formulario de referencia anota solo: estructura de preguntas, cifras clave, registro y longitud típica de respuesta.

Si el usuario no aporta formulario oficial, el perfil manda: no inventes preguntas ni campos.

### 2. Cerrar la biblia
Copia `comun/biblia_template.md` al scratchpad y rellena TODOS los huecos con números coherentes entre sí (participantes + facilitadores = personas; plazas por socia vs total; ponencias vs temáticas). Escribe además un `pif_<coordinadora>.md` con los únicos datos reales permitidos de la organización. Si el usuario no ha dado un dato, fija un placeholder descriptivo y sigue, no esperes.

Advertencias que ya costaron caras:
- Si la coordinadora estrena la acción, redactar como estreno (ser recién llegada puntúa), jamás "continuación de" un proyecto ajeno.
- Si hay una solicitud de referencia, la originalidad es requisito duro: sirve como guía de registro y detalle, nunca de contenido.
- No inventar datos de la coordinadora fuera de su PIF.

### 3. Workflow de redacción
Adapta `assets/workflow_redaccion.js`: un redactor por bloque del formulario (los bloques los define el perfil), en paralelo. Cada prompt lleva los ficheros a leer, las preguntas exactas del formulario en su idioma oficial como encabezados `###`, y las respuestas en el idioma de redacción que fije el perfil.

Después, 3 verificadores adversariales con schema de issues sobre el borrador ensamblado:
- **Coherencia**: contar números, fechas, ciudades, placeholders, cronología repetida entre secciones.
- **Rúbrica**: elemento a elemento contra la rúbrica destilada del perfil.
- **Originalidad y estilo**: calcos de la referencia, reglas de `comun/reglas_estilo.md`, tono de IA.

No saltarse esta fase. Es la que sube la nota.

### 4. Workflow de corrección
Adapta `assets/workflow_correccion.js`. Asigna cada issue a su bloque, deja las correcciones globales G1-G12 tal cual, y decide TÚ las cuestiones transversales antes de lanzar (redacción única de cada temática, secuencias temporales, alcance de invitados) para que todos los correctores apliquen lo mismo. Cada corrector lee su `draft_<bloque>.md` y escribe `final_<bloque>.md`.

### 5. Comprobación mecánica y ensamblado
`python assets/comprobacion_mecanica.py <dir> --patron "final_*.md" --seccion-codigos <bloque>` busca guiones largos, emojis, anglicismos, códigos internos fuera de su sección, marcas de edición, dobles espacios y tics de redacción, cuenta encabezados y lista los placeholders para ver si un mismo concepto usa dos tokens. Acepta también un fichero ensamblado; en ese caso el tope de `no X, sino Y` es uno por bloque, así que se pasa `--tope-no-sino <nº de bloques>`. Arregla a mano lo poco que salga.

Ensambla: portada + bloques en orden + sección final "Datos pendientes / placeholders" inventariada con la regex `\[([^\]]+)\]`.

### 6. Generar el Word
`python assets/md2docx.py <ensamblado.md> "<destino>.docx" --titulo "..." --subtitulo "..." --extra "..."` (requiere python-docx). Guarda .docx y .md junto a los materiales del usuario y verifica el .docx reabriéndolo.

### 7. Cierre
Resumen con: decisiones estratégicas tomadas, qué encontraron los verificadores, lista de datos pendientes, y el recordatorio de que la checklist de originalidad la firma el usuario y merece su lectura final. Actualiza el perfil de la acción con lo aprendido y añade una entrada en `historial/`.

## Estructura del skill
- `comun/biblia_template.md` - fuente única de verdad del proyecto, agnóstica de acción.
- `comun/reglas_estilo.md` - reglas de redacción obligatorias y correcciones globales G1-G9.
- `comun/criterios_comunes.md` - lo que piden casi todas las convocatorias, con el porqué. Base de la verificación.
- `perfiles/<accion>.md` - bloques del formulario, criterios, pesos, límites y trampas de cada acción.
- `perfiles/_plantilla.md` - para acciones sin perfil.
- `assets/` - workflows de redacción y corrección, comprobación mecánica, conversor a Word.
- `historial/` - lecciones por proyecto ya presentado.
