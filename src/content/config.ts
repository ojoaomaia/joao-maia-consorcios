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
    hora: z.string().regex(/^(([01]\d|2[0-3]):(00|15|30|45))?$/, 'Use um horário de 15 em 15 minutos, ex.: 14:30').optional(),   /* horário de publicação (Brasília), para agendar */
    category: z.enum(['imovel', 'veiculo', 'lance', 'comparativo']),
    reading_time: z.number().int().min(1).max(30).optional(),   /* se ficar vazio, o site calcula pelo tamanho do texto */
    keyword: z.string().optional(),
    draft: z.boolean().default(false),
    agendada: z.boolean().optional(),   /* marcado sozinho pelo painel quando a data e o horário são futuros; a rotina de agendamento tira ao publicar */
    cover: z.string().optional(),            /* imagem de capa (opcional) */
    cover_alt: z.string().optional(),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([])
  })
});

export const collections = { blog };
