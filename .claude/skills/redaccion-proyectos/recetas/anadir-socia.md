# Receta. Añadir o cambiar una socia

Ejemplo: GUCKOBIR como sexta socia de Cadres Communs, añadida con la solicitud ya cerrada.

## Qué cambia cuando entra una socia
Participantes por país y total, group leaders, participantes con menos oportunidades, viaje (banda y green), apoyo organizativo e inclusión, reparto de tareas, presentación de la socia en su campo, valor europeo, difusión por socia, horario (quién conduce) y el resumen. Si la actividad tiene un tope de participantes, hay que recortar en otras socias.

## Pasos
1. Ficha de la socia desde su PIF (`proyectos/referencias/organizaciones/socias/`). Si el PIF pone a una persona de nuestra red como contacto y no debe figurar, avisar.
2. Decidir las cifras nuevas en la biblia y recalcular con `presupuesto_ka1.py`.
3. Buscar en el texto todas las menciones de cifras, países y número de socias ("cinco socias", "cinco países") y cambiarlas. Grep por el número en letra y en cifra, en todos los idiomas del documento.
4. Escribir el bloque de la socia y darle un papel propio en el programa y en la gestión, no solo plazas.
5. Actualizar horario y calendario.
6. `assets/workflow_verificacion.js` con `VERIFICADORES = ['coherencia']` sobre el documento entero, con la biblia ya actualizada y la ficha de la socia nueva en `FICHEROS.fichas`.
