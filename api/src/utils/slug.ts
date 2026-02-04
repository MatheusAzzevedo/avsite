/**
 * Explicação do Arquivo [slug.ts]
 * 
 * Utilitário para geração de slugs amigáveis para URLs.
 * Remove acentos, espaços e caracteres especiais.
 */

/**
 * Explicação da função [slugify]
 * Converte um texto em slug para URLs amigáveis.
 * 
 * @param text - Texto a ser convertido
 * @returns Slug formatado
 * 
 * @example
 * slugify('Cristo Redentor') // 'cristo-redentor'
 * slugify('São Paulo é Demais!') // 'sao-paulo-e-demais'
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')                   // Normaliza para forma de decomposição
    .replace(/[\u0300-\u036f]/g, '')   // Remove acentos
    .toLowerCase()                      // Converte para minúsculas
    .trim()                             // Remove espaços das extremidades
    .replace(/\s+/g, '-')              // Substitui espaços por hífens
    .replace(/[^\w-]+/g, '')           // Remove caracteres não-alfanuméricos
    .replace(/--+/g, '-')              // Remove hífens duplicados
    .replace(/^-+/, '')                // Remove hífens do início
    .replace(/-+$/, '');               // Remove hífens do final
}

/**
 * Explicação da função [generateUniqueSlug]
 * Gera um slug único adicionando um sufixo numérico se necessário.
 * 
 * @param baseSlug - Slug base
 * @param existingSlugs - Array de slugs existentes
 * @returns Slug único
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Explicação da função [generateCodigoFromDestino]
 * Gera código único para excursão pedagógica a partir do nome do destino e da data.
 * Usado quando outro sistema envia excursão via API sem codigo (codigo = destino + data).
 *
 * @param destino - Nome do destino da excursão
 * @param dataDestino - Data no formato YYYY-MM-DD
 * @param existingCodigos - Códigos já existentes (para garantir unicidade)
 * @returns Código no formato slug(destino)-YYYY-MM-DD, com sufixo -2, -3... se houver colisão
 */
export function generateCodigoFromDestino(
  destino: string,
  dataDestino: string,
  existingCodigos: string[]
): string {
  const base = `${slugify(destino)}-${dataDestino}`;
  const maxLen = 50;
  const baseTrunc = base.length > maxLen ? base.slice(0, maxLen).replace(/-+$/, '') : base;
  let codigo = baseTrunc;
  let counter = 1;
  while (existingCodigos.includes(codigo)) {
    const suffix = `-${counter}`;
    codigo = baseTrunc.length + suffix.length <= maxLen
      ? `${baseTrunc}-${counter}`
      : `${baseTrunc.slice(0, maxLen - suffix.length).replace(/-+$/, '')}${suffix}`;
    counter++;
  }
  return codigo;
}

export default slugify;
