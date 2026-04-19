import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    type: z.enum(['Intercambio', 'Voluntariado', 'Formación']),
    status: z.enum(['active', 'past']),
    flag: z.string(),
    description: z.string(),
    location: z.string().optional(),
    year: z.number().optional(),
    order: z.number().default(99),
  }),
});

export const collections = { projects };
