/**
 * Explicação do Arquivo [trava-contrato.ts]
 *
 * Marca o contrato da excursão como travado depois da 1ª assinatura.
 * Usa SQL direto de propósito: o update do Prisma mexeria no updatedAt, e a
 * gestão (avoar) usa o updatedAt para saber se alguém editou a excursão no
 * site. Assinar contrato não é edição da excursão.
 */

import { Prisma } from '@prisma/client';

type Cliente = Pick<Prisma.TransactionClient, '$executeRaw'>;

export async function travarContrato(
  tx: Cliente,
  alvo: { excursaoId?: string | null; excursaoPedagogicaId?: string | null }
): Promise<void> {
  if (alvo.excursaoPedagogicaId) {
    await tx.$executeRaw`UPDATE "excursoes_pedagogicas" SET "contratoTravado" = true WHERE "id" = ${alvo.excursaoPedagogicaId}`;
  } else if (alvo.excursaoId) {
    await tx.$executeRaw`UPDATE "excursoes" SET "contratoTravado" = true WHERE "id" = ${alvo.excursaoId}`;
  }
}
