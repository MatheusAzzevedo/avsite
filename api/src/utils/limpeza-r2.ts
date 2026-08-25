/**
 * Explicação do Arquivo [limpeza-r2.ts]
 *
 * Remove do Cloudflare R2 as imagens que deixaram de ser usadas — seja porque o
 * registro foi excluído, seja porque a imagem foi substituída por outra.
 *
 * Sem isto o bucket acumula lixo indefinidamente: cada troca de foto e cada
 * exclusão deixa para trás um objeto que ninguém mais referencia, e não há como
 * distinguir depois o que é órfão do que está em uso.
 *
 * O cuidado central é o **reuso**: a mesma URL pode aparecer em vários campos.
 * No cadastro de excursão, é comum a mesma foto servir de capa, de imagem
 * principal e de item da galeria. Apagar sem verificar destruiria a imagem de um
 * registro que ninguém tocou — e, sem o Base64 original no banco, sem volta.
 *
 * Por isso toda remoção passa por `removerSeOrfas`, que confere os 11 campos do
 * sistema antes de apagar qualquer coisa.
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { deleteFileFromR2, verificarConfigR2 } from '../config/r2';

/**
 * Explicação da função [ehUrlDoNossoR2]
 * Verdadeiro apenas para URLs do bucket configurado neste ambiente.
 *
 * Protege dois casos: URLs externas que o admin possa ter colado à mão, e
 * imagens de outro bucket (por exemplo, dados migrados num ambiente de teste
 * apontando para outro lugar). Em ambos, não é nosso para apagar.
 */
function ehUrlDoNossoR2(valor: string | null | undefined): boolean {
  const base = process.env.R2_PUBLIC_URL?.trim();
  if (!base || !valor) return false;
  return valor.startsWith(base.replace(/\/+$/, '') + '/');
}

/**
 * Explicação da função [urlParaChave]
 * Converte a URL pública na chave do objeto dentro do bucket.
 * Ex.: https://pub-xxx.r2.dev/posts/abc.webp → posts/abc.webp
 */
function urlParaChave(url: string): string {
  const base = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '');
  return url.slice(base.length + 1);
}

/**
 * Explicação da função [contarReferencias]
 * Conta em quantos lugares do sistema uma URL ainda é usada.
 *
 * Percorre os 11 campos que guardam imagem ou documento. A contagem é feita
 * DEPOIS de o registro já ter sido excluído ou atualizado, então qualquer
 * ocorrência restante significa que outro registro depende desta imagem.
 */
async function contarReferencias(url: string): Promise<number> {
  const [
    postsCapa, postsGaleria,
    excCapa, excPrincipal, excGaleria,
    pedCapa, pedPrincipal, pedGaleria, pedDoc,
    equipe, autores
  ] = await Promise.all([
    prisma.post.count({ where: { imagemCapa: url } }),
    prisma.postImagem.count({ where: { url } }),
    prisma.excursao.count({ where: { imagemCapa: url } }),
    prisma.excursao.count({ where: { imagemPrincipal: url } }),
    prisma.excursaoImagem.count({ where: { url } }),
    prisma.excursaoPedagogica.count({ where: { imagemCapa: url } }),
    prisma.excursaoPedagogica.count({ where: { imagemPrincipal: url } }),
    prisma.excursaoPedagogicaImagem.count({ where: { url } }),
    prisma.excursaoPedagogica.count({ where: { documentoUrl: url } }),
    prisma.equipe.count({ where: { fotoPerfil: url } }),
    prisma.autor.count({ where: { foto: url } })
  ]);

  return postsCapa + postsGaleria + excCapa + excPrincipal + excGaleria +
         pedCapa + pedPrincipal + pedGaleria + pedDoc + equipe + autores;
}

/**
 * Explicação da função [removerSeOrfas]
 * Apaga do bucket as URLs que não são mais referenciadas por nenhum registro.
 *
 * Deve ser chamada **depois** de a alteração no banco ter sido concluída. Se
 * fosse antes, uma falha na gravação deixaria o registro apontando para uma
 * imagem já apagada — a foto sumiria do site sem explicação. Fazendo depois, o
 * pior caso é sobrar um objeto órfão, que é reversível.
 *
 * Nunca lança: uma indisponibilidade do R2 não pode impedir o usuário de excluir
 * ou editar um registro. As falhas ficam no log, com a chave, para limpeza
 * posterior.
 *
 * @param urls  valores dos campos de imagem que deixaram de ser usados
 * @param contexto  identificação para o log (ex.: 'excursao:abc-123')
 */
export async function removerSeOrfas(
  urls: (string | null | undefined)[],
  contexto: string
): Promise<void> {
  if (!verificarConfigR2()) return;

  // Duplicatas são comuns: a mesma foto costuma ser capa e imagem principal.
  const candidatas = [...new Set(urls.filter(ehUrlDoNossoR2) as string[])];
  if (candidatas.length === 0) return;

  for (const url of candidatas) {
    try {
      const restantes = await contarReferencias(url);

      if (restantes > 0) {
        logger.info('[Limpeza R2] Imagem preservada: ainda em uso', {
          context: { contexto, url, referencias: restantes }
        });
        continue;
      }

      await deleteFileFromR2(urlParaChave(url));
      logger.info('[Limpeza R2] Imagem órfã removida do bucket', {
        context: { contexto, chave: urlParaChave(url) }
      });
    } catch (error) {
      logger.error('[Limpeza R2] Falha ao remover imagem; objeto pode ter ficado órfão', {
        context: {
          contexto,
          url,
          error: error instanceof Error ? error.message : 'Unknown'
        }
      });
    }
  }
}

/**
 * Explicação da função [urlsQueSairam]
 * Compara o estado anterior com o novo e devolve o que deixou de ser usado.
 *
 * Serve às rotas de atualização: quando o admin troca a foto de uma excursão, a
 * imagem antiga fica órfã na hora — e isso não passa por nenhuma exclusão. Sem
 * esta comparação, a troca de imagem seria a maior fonte de lixo no bucket,
 * porque acontece muito mais que a exclusão de registros.
 */
export function urlsQueSairam(
  antes: (string | null | undefined)[],
  depois: (string | null | undefined)[]
): string[] {
  const mantidas = new Set(depois.filter(Boolean) as string[]);
  return [...new Set(antes.filter(Boolean) as string[])].filter((u) => !mantidas.has(u));
}
