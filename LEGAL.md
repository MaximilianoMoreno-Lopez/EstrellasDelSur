# Mantenimiento de los documentos legales

Guía para actualizar los Términos y condiciones y la Política de Privacidad
sin que se desincronice nada. Todo gira en torno a un único sitio.

## Fuente única de la versión

`src/lib/legal.js` contiene la versión legal vigente:

```js
export const LEGAL_VERSION = '2026-07-14';        // AAAA-MM-DD
export const LEGAL_VERSION_LABEL = '14 de julio de 2026';
```

Ese número se propaga solo a dos sitios, sin tocar nada más:

1. La página `/terminos/` muestra "Versión AAAA-MM-DD" (lee la constante).
2. El registro del portal (`src/pages/portal/registro.astro`) guarda esa versión
   en los metadatos del usuario de Supabase (`legal_version`) cuando alguien acepta.

Por eso basta con cambiar la constante en un sitio.

## La regla de oro

Cada vez que cambies el TEXTO legal de forma relevante:

1. Edita el contenido en `src/pages/terminos.astro` o `src/pages/privacidad.astro`.
2. Sube la fecha en `src/lib/legal.js` (`LEGAL_VERSION` y `LEGAL_VERSION_LABEL`).
3. Haz los dos cambios en el MISMO commit.

Si cambias el texto pero no subes la fecha, no habrá forma de distinguir dos
versiones distintas, y se pierde la prueba de qué estaba vigente.

## Cómo se demuestra qué términos estaban vigentes

Tres piezas encajan:

1. Cada usuario tiene guardado en Supabase qué `legal_version` aceptó y cuándo
   (`accepted_at`), sellado con el `created_at` de su cuenta.
2. Esa versión la fija `src/lib/legal.js`, versionado en git.
3. El commit de git de esa versión, con su fecha y hash en GitHub, prueba
   palabra por palabra qué decía el texto ese día.

Para consultar una aceptación: panel de Supabase, Authentication, Users, abrir el
usuario y mirar "Raw User Meta Data" (`legal_version`, `accepted_at`).

## Documentos legales y sus fuentes

| Documento | Fuente | Publicado en |
|-----------|--------|--------------|
| Términos y condiciones | `src/pages/terminos.astro` | `/terminos/` |
| Política de Privacidad | `src/pages/privacidad.astro` | `/privacidad/` |
| Consentimiento y exención de menores | `scripts/consentimiento-menores.html` | `public/docs/Consentimiento_Participacion_Menores_Estrellas_del_Sur.pdf` |

Los PDF del portal (incluida la plantilla de menores) se generan desde el HTML de
`scripts/` con Chrome headless. El comando y las rutas están anotados en la memoria
del proyecto (pipeline de documentos).

## Aceptación fuera del portal (Google Form)

En el Google Form de solicitud de proyectos hay casillas obligatorias de
aceptación. Google guarda automáticamente la marca de tiempo de cada respuesta,
así que ahí no hay que hacer nada técnico. Si se cambia el texto legal, conviene
revisar que los enlaces de las casillas sigan apuntando a `/terminos/` y `/privacidad/`.

### Textos de las casillas del formulario de inscripción

Estos son los textos vigentes. Se copian tal cual en cada convocatoria, y esta
sección es la fuente: si se cambian aquí, se cambian en el formulario, y el commit
deja constancia de qué texto se estaba usando en cada momento.

Cada casilla va como **pregunta independiente** de tipo casilla de verificación con
una sola opción y marcada como obligatoria. Una única pregunta con cinco opciones no
sirve: Google da por válida la respuesta con que se marque una sola.

**Obligatorias**

1. He leído la Política de Privacidad (estrellasdelsur.eu/privacidad/) y consiento el
   tratamiento de mis datos personales para gestionar mi solicitud, mi participación en
   la actividad y las obligaciones de justificación ante el programa financiador y sus
   agencias nacionales.
2. He leído y acepto las condiciones de participación de esta convocatoria y el apartado 4
   de los Términos y condiciones (estrellasdelsur.eu/terminos/#participacion), incluido lo
   relativo a seguro, salud, documentación de viaje, conducta y exención de responsabilidad.
3. Me comprometo a respetar el Código Ético y de Conducta y el Protocolo de prevención del
   acoso de la asociación (estrellasdelsur.eu/transparencia/) durante toda la actividad, y
   entiendo que un incumplimiento grave puede suponer la expulsión sin derecho a reembolso.
4. Declaro que los datos facilitados son veraces, que cumplo los requisitos de la
   convocatoria y que me encuentro en condiciones de salud adecuadas para la actividad. Me
   comprometo a comunicar antes del inicio cualquier alergia, tratamiento, condición médica
   o necesidad de apoyo relevante para mi seguridad.
5. Soy mayor de 18 años. Si eres menor de edad, tu participación necesita la autorización
   firmada de tu madre, padre o tutor legal: escríbenos antes de enviar la solicitud.

**Voluntarias** (van al final, con el encabezado "Estas dos casillas son voluntarias y no
influyen en la selección")

6. Autorizo a la Asociación Cultural Estrellas del Sur a captar mi imagen y mi voz en las
   fotografías y vídeos tomados durante la actividad y a difundirlos en su web
   estrellasdelsur.eu, en sus redes sociales, en sus memorias anuales y en los materiales de
   difusión y justificación del programa que financia el proyecto. La autorización es
   gratuita, sin límite territorial, y se extiende al tiempo de difusión del proyecto y a su
   conservación en el archivo documental de la asociación. No se cederán las imágenes a
   terceros con fines comerciales. Esta casilla es voluntaria, no influye en la selección, y
   puedo revocarla en cualquier momento escribiendo a paula@estrellasdelsur.eu, sin que la
   revocación afecte a los usos ya realizados ni a los ejemplares ya distribuidos.
7. Quiero recibir información sobre futuras convocatorias y actividades de la asociación.
   Puedo darme de baja en cualquier momento.

Las casillas 6 y 7 nunca se marcan como obligatorias. Un consentimiento que condiciona la
participación no es libre y, por tanto, no es válido, y mezclarlo con las obligatorias
arrastraría al resto.

La casilla 6 sustituye al PDF de autorización de imagen **solo para personas adultas**. El
RGPD no exige firma, sino un acto afirmativo específico, informado y demostrable, y la
casilla sin premarcar más la marca de tiempo de la respuesta lo cumplen. Se mantienen los
documentos firmados en dos casos, donde el consentimiento no lo da quien rellena el
formulario o requiere apoyos:

- Personas menores de edad: `Autorizacion_Imagen_Menores_Estrellas_del_Sur.pdf`, firmado por
  madre, padre o tutor legal.
- Personas con medidas de apoyo: `Autorizacion_Imagen_Medidas_Apoyo_Estrellas_del_Sur.pdf`.

Si alguien revoca la autorización, hay que retirar las imágenes de los canales propios y
dejar constancia de la fecha de la retirada junto al expediente del proyecto.

### Ajustes del formulario que conviene mantener

- Recopilar la dirección de correo de quien responde.
- Cabecera del formulario con la referencia de la versión legal aceptada
  (la de `src/lib/legal.js`, hoy 2026-08-01).
- Ninguna casilla premarcada.
- Al cerrar la convocatoria, descargar las respuestas y guardarlas junto al expediente
  del proyecto. El histórico de Google no es un archivo permanente.

## Checklist rápido al actualizar

- [ ] Texto editado en la página que corresponda.
- [ ] `LEGAL_VERSION` y `LEGAL_VERSION_LABEL` actualizados en `src/lib/legal.js`.
- [ ] Todo en el mismo commit, con un mensaje que describa el cambio legal.
- [ ] Si cambian las condiciones de participación, revisar los textos de las casillas
      del formulario de inscripción y actualizarlos también en el Google Form.
- [ ] `npm run build` sin errores.
- [ ] Push a `main` (GitHub Actions despliega en unos 2 minutos).
