# Billets d'Europe (KA155-YOU, Étoiles de France, FR02, redactado 2026-09-27)

Primer KA155 redactado con el método y primero de esta acción en francés. Referencia de estructura: "Melilla is Europe" (Estrella del Rif, ES02, aprobado en 2026). Material en `proyectos/erasmus/KA155_Billets_d_Europe_Etoiles/`.

## Qué se hizo
1. Perfil nuevo `perfiles/ka155-you.md` destilado de la Guía 2026 (pp. 219-229) y la Guide for Experts 2026 (pp. 38-41).
2. Un agente de datos verificó 30 cifras con fuente (Insee, INJEP, Banque de France, OIB, Eurobarómetro juventud 2024, directiva 2014/92/UE, art. 227 TFUE, DiscoverEU) y los horarios reales de las paradas. De ahí salieron dos cambios de diseño: Europa Experience solo acepta el juego de rol con grupos de 16 a 32 personas (sesión conjunta de los dos grupos) y el Banco de España recibe a asociaciones de martes a jueves por la tarde con CIF español (prerreserva vía la Federación).
3. Borrador escrito por una sola mano (sin redactores en paralelo) para no repetir argumentos, y luego 3 verificadores (coherencia, rúbrica y originalidad, estilo francés) con 118 issues, reescritura completa en v2 y un lector fresco final con 24 retoques.

## Qué funcionó
- Escribir el borrador de un tirón: el verificador de coherencia no encontró errores de cifras ni de presupuesto, solo repeticiones.
- El verificador de rúbrica con la referencia aprobada al lado detectó calcos estructurales que nadie ve leyendo solo el texto propio (nivel de asistencia, tarjeta de emergencia, reflexión diaria de 30 minutos, las mismas Youth Goals).
- Calcular días de la semana y horarios de apertura con python y cruzarlos con las visitas.

## Qué costó
- La primera versión fijaba el itinerario desde los adultos y tenía 7 días de tren en 11: el evaluador lo lee como viaje de estudios. Solución: 12 días con uno sin tren, tres citas fijas y el resto decidido por los jóvenes.
- Indicadores a seis meses que caían fuera de la vida del proyecto.
- Seguridad con jóvenes extranjeros: pasaporte Y título de residencia, récépissés, jamás remitir a un refugiado a su consulado, y el consulado de Francia para el visado de retorno.
- Heredoc de bash con apóstrofos franceses: escribir con Write y ejecutar scripts .py.

## Reglas nuevas (en el perfil)
Itinerario real comprobado, pase de 7 días contado, reservas como coste excepcional, no copiar las soluciones de Melilla, documentos de viaje como primer riesgo con jóvenes migrantes.

## Segunda solicitud del mismo día: Rutas de Barrio (Federación, ES02)
Redactada justo después y por la misma mano, la primera versión calcó sin querer la estructura de Billets (selección, seis sesiones en el mismo orden, seguridad, Youthpass, gestión). El verificador lo cazó cruzando las dos solicitudes. Regla nueva: cuando una misma red presenta varias solicitudes, el verificador de originalidad recibe TODAS las hermanas además de la referencia aprobada, y cada una necesita mecanismos propios en cada bloque, no solo tema distinto.
