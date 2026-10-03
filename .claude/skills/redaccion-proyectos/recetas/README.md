# Recetas por tipo de encargo

El proceso general está en `SKILL.md`. Cada receta dice qué cambia según lo que pida el usuario. Si el encargo mezcla dos (por ejemplo, adaptar una aprobada y añadir una socia), se aplica la más exigente y se suma lo de la otra.

| Encargo | Receta | Señal |
|---|---|---|
| Proyecto nuevo con idea, socias y fechas | `desde-cero.md` | "prepárame un KA1xx para..." |
| Llevar una solicitud aprobada a otra entidad, ciudad o idioma | `adaptar-aprobada.md` | "adapta este proyecto a..." |
| Una solicitud ya escrita que se queda corta | `ampliar.md` | "está escaso de palabras", "revísalo" |
| Volver a presentar tras un rechazo | `tras-rechazo.md` | llega una carta con nota y comentarios |
| Meter o cambiar una socia en una solicitud hecha | `anadir-socia.md` | "se me olvidó un partner" |

En todas:
- La biblia se escribe antes que cualquier texto y los datos de las entidades salen de `proyectos/referencias/organizaciones/`.
- Las palancas de `comun/maximizar_puntuacion.md` son la lista de comprobación del verificador de rúbrica.
- Los pasos con agentes en paralelo tienen plantilla en `assets/`: `workflow_datos.js` (datos con fuente), `workflow_conceptos.js` (jueces de conceptos), `workflow_redaccion.js`, `workflow_verificacion.js` (issues en `trabajo/issues.md`) y `workflow_correccion.js`. Cómo lanzarlas, en `assets/README.md`.
- Al terminar, se registra la candidatura en `src/lib/candidaturas.mjs` con `estado: 'preparacion'` o `'presentada'` y `notaEstimada`.
