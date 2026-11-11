/* Minutos de leitura: usa o valor do artigo ou calcula (200 palavras por minuto). */
export function minutosLeitura(post: { body: string; data: { reading_time?: number } }): number {
  if (post.data.reading_time) return post.data.reading_time;
  const palavras = (post.body || '').replace(/[#>*_`\[\]()-]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(palavras / 200));
}
