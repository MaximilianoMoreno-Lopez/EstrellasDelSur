# Receta. Reescribir tras un rechazo

Ejemplos: Haro Queer v2 (ESC30, de 60 a una estimación de 81) y CHEMSAFE ronda 3 (ESC30, tras 57).

## Pasos
1. **Registrar el resultado** en `src/lib/candidaturas.mjs` con la nota por criterio y guardar la carta en `trabajo/feedback_agencia.md`.
2. **Diagnóstico.** Cada frase de la carta es un elemento a verificar. Tabla con reproche, criterio al que afecta, causa en el texto y cambio de diseño que lo resuelve. Cuando el reproche es de diseño (todo en línea, sin coach, coach con el público), se cambia el proyecto, no solo la redacción.
3. **Contexto de la ronda.** Cupos regionales o dinero de la agencia en la ronda a la que se vuelve (el INJUVE publica los cupos por comunidad en el BOE; La Rioja tuvo 3.316,90 € en octubre de 2026). Ajustar duración y presupuesto para caber.
4. **Biblia nueva.** No se parte del texto rechazado: se reescribe desde la biblia. Del texto viejo solo se conservan los datos verificados; los que faltan para responder a la carta (sobre todo en relevancia) se buscan con `assets/workflow_datos.js`. Si el reproche es de diseño, `assets/workflow_conceptos.js` con el diseño viejo como un concepto más y dos o tres alternativas deja claro si el cambio sube la nota.
5. **Verificador de la carta.** `assets/workflow_verificacion.js` con `reescrituraTrasRechazo: true`: además de los habituales, un verificador recorre `trabajo/feedback_agencia.md` reproche a reproche y marca si cada uno está resuelto, parcial o sin resolver y dónde. La tabla queda al principio de `trabajo/issues.md` y los no resueltos pasan a issues de gravedad alta.
6. **Ni una mención al rechazo en el texto**, salvo que el formulario lo pregunte. "Primer proyecto" puede seguir siendo cierto; "primera candidatura" ya no.
7. En el cierre, contar al usuario qué reproches se han resuelto con cambio de diseño y cuáles solo con redacción.
