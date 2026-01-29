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

export default slugify;
