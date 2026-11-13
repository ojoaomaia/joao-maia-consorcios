/* Agendamento de matérias: uma matéria só aparece no site quando não é rascunho
   e a data e o horário dela (horário de Brasília) já chegaram.
   "hora" é opcional, de 15 em 15 minutos (ex.: "14:30"). Sem hora, vale 00:00 do dia.
   Matéria agendada entra no ar sozinha pela rotina .github/workflows/publicar-agendadas.yml. */
export function momentoPublicacao(data: { date: Date; hora?: string }): Date {
  const dia = data.date.toISOString().slice(0, 10);
  return new Date(`${dia}T${data.hora || '00:00'}:00-03:00`);
}
export function publicado(data: { draft?: boolean; date: Date; hora?: string }): boolean {
  return !data.draft && momentoPublicacao(data).getTime() <= Date.now();
}
