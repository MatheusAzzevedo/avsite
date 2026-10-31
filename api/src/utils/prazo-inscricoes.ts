/**
 * Explicação do Arquivo [prazo-inscricoes.ts]
 *
 * Diz se as inscrições de uma excursão pedagógica já encerraram pela data
 * "Inscrições até". O dia da data vale inteiro, no horário de Brasília: só
 * encerra a partir de 00:00 do dia seguinte. Sem data, nunca encerra.
 * A data é gravada como YYYY-MM-DDT12:00Z, então o dia é a parte UTC dela.
 */

const diaEmBrasilia = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

export function inscricoesEncerradas(dataFimInscricoes: Date | null | undefined, agora: Date = new Date()): boolean {
  if (!dataFimInscricoes) return false;
  const ultimoDia = dataFimInscricoes.toISOString().slice(0, 10);
  return diaEmBrasilia.format(agora) > ultimoDia;
}
