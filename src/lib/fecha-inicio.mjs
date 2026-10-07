// Fecha de inicio de un proyecto a partir del texto libre de `dates`, para
// ordenar los listados por cuándo empieza cada uno.
//
// `dates` se escribe a mano y tiene varios formatos: "15/10/2026 - 24/10/2026",
// "08/2026 - 12/2026", "Agosto a octubre de 2026", "Desde septiembre de 2026".
// Antes solo se entendía el primero; el resto caía al 31 de diciembre del año
// y los voluntariados del CES se colaban arriba del todo en "Todos".

const MESES = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7,
  agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

/** Milisegundos de la fecha de inicio, o 0 si no se puede saber. */
export function fechaInicio(data) {
  const txt = (data?.dates ?? '').toLowerCase();

  // 15/10/2026
  let m = txt.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]).getTime();

  // 08/2026
  m = txt.match(/\b(\d{1,2})\/(\d{4})\b/);
  if (m) return new Date(+m[2], +m[1] - 1, 1).getTime();

  // "agosto a octubre de 2026", "desde septiembre de 2026": el primer mes
  // que aparece y el primer año que viene detrás (o el campo `year`).
  m = txt.match(new RegExp(`\\b(${Object.keys(MESES).join('|')})\\b`));
  if (m) {
    const anio = txt.slice(m.index).match(/\b(20\d{2})\b/)?.[1] ?? data?.year;
    if (anio) return new Date(+anio, MESES[m[1]] - 1, 1).getTime();
  }

  // Solo el año: a principio de año, para no adelantarse a los que sí tienen fecha.
  if (data?.year) return new Date(data.year, 0, 1).getTime();
  return 0;
}
