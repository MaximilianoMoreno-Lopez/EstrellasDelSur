import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    type: z.enum(['Intercambio', 'Voluntariado', 'Formación']),
    status: z.enum(['active', 'past']),
    flag: z.string(),
    description: z.string(),
    image: z.string().optional(),   // ruta relativa a public/, ej: "images/projects/green-glow.jpg"
    location: z.string().optional(),
    year: z.number().optional(),
    order: z.number().default(99),
  }),
});

export const collections = { projects };
