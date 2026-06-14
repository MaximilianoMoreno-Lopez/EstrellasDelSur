import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

// Build a publish date from the noticia frontmatter. `date` may be a full
// date ("2026-04-11"), a month ("2026-04") or a year ("2026"); fall back to
// the dd/mm/yyyy start of `dates` when `date` is missing.
function pubDate(data) {
  if (data.date) {
    const d = new Date(data.date);
    if (!isNaN(d)) return d;
  }
  const m = data.dates?.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  return null;
}

export async function GET(context) {
  const articles = await getCollection('noticias');

  const items = articles
    .map((a) => ({ a, date: pubDate(a.data) }))
    .sort((x, y) => (y.date?.getTime() ?? 0) - (x.date?.getTime() ?? 0))
    .map(({ a, date }) => ({
      title: a.data.title,
      description:
        a.data.description ??
        `Crónica de ${a.data.title}: experiencias de jóvenes en proyectos Erasmus+ y voluntariados europeos gestionados por Estrellas del Sur.`,
      link: `/noticias/${a.id}/`,
      ...(date && { pubDate: date }),
    }));

  return rss({
    title: 'Estrellas del Sur · Noticias',
    description:
      'Experiencias de jóvenes en proyectos Erasmus+ y voluntariados del Cuerpo Europeo de Solidaridad gestionados por Estrellas del Sur (Córdoba).',
    site: context.site,
    items,
    customData: '<language>es-es</language>',
  });
}
