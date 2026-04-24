import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    type: z.enum(['Intercambio', 'Voluntariado', 'Formación']),
    status: z.enum(['active', 'past']),
    flag: z.string(),
    description: z.string(),
    image: z.string().optional(),
    location: z.string().optional(),
    year: z.number().optional(),
    order: z.number().default(99),
    infopack: z.string().optional(),
    apply: z.string().optional(),
  }),
});

export const collections = { projects };
