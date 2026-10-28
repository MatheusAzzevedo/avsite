/**
 * Explicação do Arquivo [bandeira-cartao.ts]
 *
 * Limite de parcelas do Asaas por bandeira: Visa e Mastercard aceitam até 21x,
 * as demais até 12x (https://docs.asaas.com/reference/criar-cobranca-com-cartao-de-credito).
 * Mesma regra do front (public/cliente/js/parcelas-bandeira.js); aqui é a que vale.
 */

export const LIMITE_PARCELAS_VISA_MASTER = 21;
export const LIMITE_PARCELAS_OUTRAS = 12;

// Elo usa alguns BINs que começam com 4; sem isso viraria "Visa" e o Asaas recusaria acima de 12x.
// shortcut: só os BINs Elo começados em 4 mais comuns; se aparecer recusa de Elo acima de 12x, ampliar a lista.
const BINS_ELO_COM_4 = ['401178', '401179', '431274', '438935', '451416', '457393', '457631', '457632'];

/**
 * Explicação da função [ehVisaOuMaster]:
 * true para Visa (começa com 4, fora dos BINs Elo) ou Mastercard (51-55 ou 2221-2720).
 */
export function ehVisaOuMaster(numero: string): boolean {
  const n = numero.replace(/\D/g, '');
  if (n.length < 6) return false;
  if (n.startsWith('4')) return !BINS_ELO_COM_4.includes(n.slice(0, 6));
  const dois = Number(n.slice(0, 2));
  const quatro = Number(n.slice(0, 4));
  return (dois >= 51 && dois <= 55) || (quatro >= 2221 && quatro <= 2720);
}

/**
 * Explicação da função [limiteParcelasPorBandeira]:
 * Máximo de parcelas que o Asaas aceita para o cartão informado.
 */
export function limiteParcelasPorBandeira(numero: string): number {
  return ehVisaOuMaster(numero) ? LIMITE_PARCELAS_VISA_MASTER : LIMITE_PARCELAS_OUTRAS;
}
