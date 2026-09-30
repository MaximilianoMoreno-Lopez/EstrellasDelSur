# Receta. Proyecto desde cero

Ejemplos: Orgullo de Pueblo (KA155), Real or Rendered? (KA152), EuroÁgora (KA154).

## Pasos
1. **Perfil y rúbrica.** `perfiles/<accion>.md` y `perfiles/rubricas/<accion>.md`. Si el perfil no está VERIFICADO, cerrarlo primero.
2. **Fichas de organización.** Leer la de la solicitante y las de cada socia. Si alguna no existe, crearla desde su PIF antes de seguir (plantilla en `proyectos/referencias/organizaciones/README.md`).
3. **Datos con fuente.** Un agente de investigación por frente (situación de los jóvenes, servicios y actores locales, marco normativo, prioridades de la agencia) y un verificador que relee cada URL. Solo entra en la biblia lo confirmado.
4. **Idea diferencial.** Antes de la biblia, dos o tres conceptos alternativos puntuados contra la rúbrica por jueces independientes (By Lot evaluó ocho). Quedarse con el ganador e injertar lo mejor de los otros.
5. **Biblia** (`comun/biblia_template.md`): cifras cerradas, calendario comprobado con `fechas.py`, presupuesto con `presupuesto_ka1.py`, voz fijada, un mecanismo propio por bloque y la lista de lo que NO se puede reutilizar de la referencia y de las hermanas de la ronda.
6. **Redacción.** Con formulario de más de seis bloques, redactores en paralelo con `assets/workflow_redaccion.js`. Con menos, una sola mano de un tirón (repite menos, lección de Billets).
7. **Verificación.** Coherencia, rúbrica con las palancas, originalidad (referencia más hermanas de la ronda) y estilo con idioma. Si el tema es sensible, un cuarto de protección.
8. **Corrección, comprobación mecánica y segunda ronda de coherencia** sobre la versión final (lección de Real or Rendered?).
9. **Entregables.** Word para pegar (`md2docx.py`), horario en plantilla y PDF si es KA1, y la nota estimada por criterio.

## Trampas
- Pedir 5.000 caracteres no es escribirlos: medir con `contar.py` y apuntar a 4.000 o 4.900.
- No dejar el horario para el final: sus días y sesiones tienen que coincidir con el texto.
