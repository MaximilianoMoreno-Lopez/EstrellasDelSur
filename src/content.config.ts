import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/_*.md'], base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    type: z.enum(['Intercambio', 'Voluntariado', 'Formación', 'Participación', 'Cooperación']),
    status: z.enum(['active', 'past']),
    flag: z.string(),
    description: z.string(),
    image: z.string().optional(),
    location: z.string().optional(),
    year: z.number().optional(),
    order: z.number().default(99),
    dates: z.string().optional(),
    poster: z.string().optional(),
    infopack: z.string().optional(),
    apply: z.string().optional(),
    edad: z.string().optional(),
    idioma: z.string().optional(),
    coste: z.string().optional(),
    localInitiative: z.boolean().default(false),
    coordinated: z.boolean().default(false),
  }),
});

const noticias = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/_*.md'], base: './src/content/noticias' }),
  schema: z.object({
    title: z.string(),
    type: z.enum(['Intercambio', 'Voluntariado', 'Formación', 'Participación', 'Cooperación']),
    status: z.string().default('past'),
    order: z.number().default(99),
    date: z.string().optional(),
    dates: z.string().optional(),
    location: z.string().optional(),
    description: z.string().optional(),
    cover: z.string().optional(),
  }),
});

export const collections = { projects, noticias };
