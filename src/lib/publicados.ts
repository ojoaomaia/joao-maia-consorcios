/* Agendamento de matérias: uma matéria só aparece no site quando não é rascunho
   e a data dela já chegou (dia de hoje no horário de Brasília).
   Matéria com data futura fica escondida e é publicada sozinha no dia, pela
   rotina .github/workflows/publicar-agendadas.yml. */
export function hojeBrasilia(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}
export function publicado(data: { draft?: boolean; date: Date }): boolean {
  return !data.draft && data.date.toISOString().slice(0, 10) <= hojeBrasilia();
}
