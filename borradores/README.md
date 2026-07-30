# Expediente del Plan de Igualdad 2026-2030

Documentos de trabajo del Plan de Igualdad de la Asociación Cultural Estrellas del Sur.
Ninguno está firmado ni inscrito todavía.

## Documentos

| Fichero | Fuente | Uso |
|---|---|---|
| `Plan_Igualdad_2026-2030_BORRADOR.pdf` | `scripts/plan-igualdad.html` | El plan. Publicable e inscribible en REGCON |
| `Plan_Igualdad_Cuaderno_BORRADOR.pdf` | `scripts/plan-igualdad-cuaderno.html` | Modelos del expediente negociador e instrumentos de diagnóstico. Interno |

El registro retributivo y la auditoría retributiva **no están en este repositorio**, porque contienen
retribuciones individualizables y el repositorio es público. Viven en `scripts/registro-retributivo.html`
y en `borradores/INTERNO_Registro_Retributivo_Auditoria.pdf`, ambos excluidos por `.gitignore`.
No los añadas al control de versiones ni los subas al portal.

## Cómo regenerar los PDF

Con Chrome headless y rutas absolutas estilo Windows, según el pipeline documentado en `LEGAL.md`:

```
chrome --headless=new --disable-gpu --no-pdf-header-footer \
  --user-data-dir=<temp-unico> \
  --print-to-pdf=C:/.../borradores/<salida>.pdf \
  C:/.../scripts/<entrada>.html
```

## Estado y decisiones tomadas

- **Naturaleza.** Plan voluntario. No se alcanza el umbral de 50 personas del art. 45.2 de la LO 3/2007
  y el convenio no lo impone. Su inscripción sí es obligatoria por el art. 11.1 del RD 901/2020.
- **Convenio.** IV Convenio colectivo marco estatal de ocio educativo y animación sociocultural,
  código 99100055012011, BOE de 11/03/2026. Jornada de 1.742 h anuales y 38 h 30 min semanales.
- **Comisión negociadora.** Por la entidad, Pablo Sánchez Ruiz y una persona socia por designar,
  ninguna con relación laboral, composición equilibrada. Convocatoria a CC.OO., UGT y USO.
- **Auditoría retributiva.** Sin brecha de género. Las tres personas perciben la misma retribución
  equiparada a jornada completa.
- **Diagnóstico y auditoría** van dentro del texto del plan, de modo que serán públicos al inscribirlo.
  Los importes no, están solo en el documento interno.

## Pendiente antes de firmar

1. Designar a la persona socia que integra la comisión negociadora, y a la persona referente de igualdad
   en acta de la Junta Directiva.
2. Convocar a las tres organizaciones sindicales. Plazo de respuesta hasta el 21/08/2026 y sesión
   constitutiva el 31/08/2026, según el modelo 3 del cuaderno.
3. Solicitar al CMAC un certificado de representatividad referido al convenio 99100055012011. El que
   consta se pidió sobre otro sector.
4. Consultar a la Comisión Paritaria del convenio, C/ Albasanz 3, 2ª planta, 28037 Madrid, la adscripción
   al ámbito funcional, el encuadramiento de los tres puestos y si corresponde la tabla A o la tabla B.
5. Corregir las dos incidencias de la auditoría: el coeficiente de parcialidad calculado sobre 40 h en
   lugar de 38,5 h, y los grupos de cotización distintos con la misma categoría.
6. Regularizar la cláusula octava de los tres contratos, que declara la inexistencia de convenio.
7. Decidir la adecuación a las tablas salariales del convenio.
8. Determinar cuántos centros de trabajo existen y unificar el domicilio en toda la documentación.
9. Cumplimentar la fecha de firma y suprimir la fila de estado de borrador de la ficha técnica.

## Al publicar

El PDF que se enlaza desde `/transparencia/` es `public/docs/Plan_Igualdad_Estrellas_del_Sur.pdf`.
Sustituirlo por la versión firmada y actualizar la descripción en `src/pages/transparencia.astro`,
donde hoy figura el texto del plan anterior.
