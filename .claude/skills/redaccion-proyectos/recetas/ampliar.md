# Receta. Ampliar una solicitud que se queda corta

Ejemplos: Rutas de Barrio y Billets d'Europe (KA155), que pasaron de 1.300 a 2.000 caracteres por respuesta a 4.000 o 4.900.

## Pasos
1. `contar.py` sobre la solicitud: longitud de cada respuesta frente a su tope. Las que estén por debajo del 70 % del tope son las candidatas.
2. `assets/workflow_verificacion.js` con `VERIFICADORES = ['rubrica', 'estilo']`: el de rúbrica lista por respuesta corta qué elementos no toca o toca sin concreción y el de estilo marca las que están por debajo de 4.000 caracteres. Se amplía con eso, nunca con relleno: datos con fuente (si faltan, `assets/workflow_datos.js` antes), actores con nombre, cifras, ejemplos del día a día, medidas por obstáculo, indicadores con meta.
3. Ampliar con `assets/workflow_correccion.js`, un corrector por bloque con sus issues, y comprobar que la ampliación no repite lo que ya está en otro bloque; si hace falta, se remite.
4. Volver a medir con `contar.py`. Ninguna respuesta por encima del tope, tampoco las traducciones al inglés si van en campo aparte.
5. Segunda ronda de coherencia con `workflow_verificacion.js` y `VERIFICADORES = ['coherencia']`: al ampliar aparecen cifras y fechas nuevas que tienen que cuadrar con la biblia.
