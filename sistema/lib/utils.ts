/**
 * Formata um UUID para um ID legível
 * @param uuid - UUID completo
 * @returns ID formatado (últimos 8 caracteres)
 */
export function formatId(uuid: string): string {
  return uuid.slice(-8).toUpperCase();
}

/**
 * Formata uma data em formato legível
 * @param date - Data a formatar
 * @returns Data formatada (dd/mm/yyyy HH:mm)
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Formata um valor monetário em reais
 * @param value - Valor em formato numérico
 * @returns Valor formatado (R$ X.XXX,XX)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Trunca um texto com reticências
 * @param text - Texto a truncar
 * @param maxLength - Comprimento máximo
 * @returns Texto truncado
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Gera um slug a partir de um texto
 * @param text - Texto para gerar slug
 * @returns Slug formatado
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Valida se uma URL é válida
 * @param url - URL a validar
 * @returns True se a URL é válida
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Obtém a mensagem de erro amigável
 * @param error - Erro capturado
 * @returns Mensagem de erro formatada
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Erro desconhecido. Tente novamente.';
}
