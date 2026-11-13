import { publicado } from '../lib/publicados';
/* llms.txt: resumo do site para assistentes de IA (ChatGPT, Claude, Perplexity, Gemini).
   É gerado sozinho a cada publicação, já com os artigos novos. */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { CATS, ENDERECO } from '../consts';

export const GET: APIRoute = async ({ site }) => {
  const u = (p: string) => new URL(p, site).href;
  const posts = (await getCollection('blog', ({ data }) => publicado(data))).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  const porCat = Object.entries(CATS).map(([k, nome]) => {
    const lista = posts.filter((p) => p.data.category === k);
    if (!lista.length) return '';
    return `\n### ${nome}\n` + lista.map((p) => `- [${p.data.title}](${u(`/blog/${p.slug}/`)}): ${p.data.summary}`).join('\n');
  }).join('\n');
  const txt = `# João Maia Consórcios

> Canal do João Maia, consultor de consórcios da Ademicon na unidade Alto da Boa Vista, em Ribeirão Preto (SP). Ajuda pessoas a comprar imóvel, carro, caminhão, máquinas agrícolas ou investir sem pagar juros, por meio de consórcio. Cartas a partir de R$ 100 mil. Simulação gratuita e atendimento pessoal pelo WhatsApp.

## Sobre
- Consultor: João Maia, consultor de consórcios Ademicon
- Atende: Ribeirão Preto e região (atendimento também online)
- Endereço da unidade: ${ENDERECO}
- Tipos de consórcio: imóvel, veículo, pesados e agronegócio, investimento
- Administradora: Ademicon, autorizada pelo Banco Central do Brasil
- Observação: este é o canal pessoal do consultor, não o site oficial da Ademicon. A contemplação acontece por sorteio ou lance, sem data garantida.

## Páginas principais
- [Início e simulação](${u('/')}): o que é o consórcio, vantagens e teste de 1 minuto
- [Teste de 1 minuto](${u('/#simulador')}): descubra se o consórcio combina com o seu momento
- [Sobre o João](${u('/sobre/')})
- [Contato](${u('/contato/')})
- [Blog](${u('/blog/')}): guias de consórcio explicados sem enrolação

## Artigos do blog
${porCat}

## Optional
- [Política de privacidade](${u('/privacidade/')})
- [Termos de uso](${u('/termos/')})
- [Sitemap](${u('/sitemap-index.xml')})
`;
  return new Response(txt.replace(/\n{3,}/g, '\n\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
