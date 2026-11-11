import { defineCollection, z } from 'astro:content';

/* Cada artigo do blog é um arquivo .md em src/content/blog.
   O nome do arquivo vira o endereço: src/content/blog/consorcio-ou-financiamento.md -> /blog/consorcio-ou-financiamento/ */
const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(10).max(110),
    seo_title: z.string().max(70).optional(),
    summary: z.string().min(40).max(160),
    date: z.coerce.date(),
    category: z.enum(['imovel', 'veiculo', 'lance', 'comparativo']),
    reading_time: z.number().int().min(1).max(30).default(5),
    keyword: z.string().optional(),
    draft: z.boolean().default(false),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([])
  })
});

export const collections = { blog };
