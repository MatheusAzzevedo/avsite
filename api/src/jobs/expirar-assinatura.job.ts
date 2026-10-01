/**
 * Explicação do Arquivo [expirar-assinatura.job.ts]
 *
 * Expiração de assinaturas de contrato (Clicksign) não concluídas a tempo.
 *
 * O pedido reserva a vaga assim que criado (status PENDENTE), antes mesmo de o
 * cliente assinar. Se a excursão exige contrato e o cliente abandona a tela de
 * assinatura, a vaga ficaria presa indefinidamente sem esta varredura — mesmo
 * padrão já usado para o PIX vencido (`expirar-pix.job.ts`).
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';

/** Prazo para concluir a assinatura, em minutos. Ajustável por variável de ambiente. */
export const ASSINATURA_EXPIRACAO_MINUTOS = Number(process.env.ASSINATURA_EXPIRACAO_MINUTOS) || 5;

/** Intervalo entre varreduras automáticas. */
const INTERVALO_VARREDURA_MS = 2 * 60 * 1000; // 2 minutos

/** Teto de assinaturas tratadas por varredura, para não segurar o processo. */
const LOTE_MAXIMO = 50;

/** Status do pedido em que ainda faz sentido expirar por falta de assinatura. */
const STATUS_PEDIDO_EXPIRAVEIS = ['PENDENTE', 'AGUARDANDO_PAGAMENTO'] as const;

/**
 * Explicação da função [expirarAssinatura]
 * Marca a assinatura vencida como EXPIRADO e expira o pedido junto, liberando a
 * vaga — sem contrato assinado o pedido não pode prosseguir de qualquer forma.
 */
export async function expirarAssinatura(assinaturaId: string): Promise<'expirado' | 'mantido'> {
  const assinatura = await prisma.assinatura.findUnique({
    where: { id: assinaturaId },
    include: { pedido: { select: { id: true, status: true } } }
  });

  if (!assinatura) return 'mantido';

  const venceu = assinatura.expiraEm.getTime() <= Date.now();
  if (assinatura.status !== 'PENDENTE' || !venceu) {
    return 'mantido';
  }

  await prisma.assinatura.update({
    where: { id: assinatura.id },
    data: { status: 'EXPIRADO' }
  });

  if (STATUS_PEDIDO_EXPIRAVEIS.includes(assinatura.pedido.status as (typeof STATUS_PEDIDO_EXPIRAVEIS)[number])) {
    await prisma.pedido.update({
      where: { id: assinatura.pedido.id },
      data: { status: 'EXPIRADO' }
    });

    await prisma.activityLog.create({
      data: {
        action: 'signature_expired',
        entity: 'pedido',
        entityId: assinatura.pedido.id,
        description: `Assinatura do contrato não concluída em ${ASSINATURA_EXPIRACAO_MINUTOS} min; pedido expirado`
      }
    });
  }

  logger.info('[Expiração Assinatura] Assinatura vencida; pedido expirado e vaga liberada', {
    context: { assinaturaId: assinatura.id, pedidoId: assinatura.pedido.id }
  });

  return 'expirado';
}

/**
 * Explicação da função [varrerAssinaturasVencidas]
 * Busca assinaturas pendentes vencidas e aplica a expiração a cada uma.
 */
export async function varrerAssinaturasVencidas(): Promise<void> {
  const vencidas = await prisma.assinatura.findMany({
    where: { status: 'PENDENTE', expiraEm: { lte: new Date() } },
    select: { id: true },
    orderBy: { expiraEm: 'asc' },
    take: LOTE_MAXIMO
  });

  if (vencidas.length === 0) return;

  logger.info('[Expiração Assinatura] Varredura encontrou assinaturas vencidas', {
    context: { quantidade: vencidas.length }
  });

  for (const { id } of vencidas) {
    try {
      await expirarAssinatura(id);
    } catch (error) {
      logger.error('[Expiração Assinatura] Erro ao expirar assinatura', {
        context: { assinaturaId: id, error: error instanceof Error ? error.message : 'Unknown' }
      });
    }
  }
}

/**
 * Explicação da função [iniciarVarreduraAssinaturasVencidas]
 * Agenda a varredura periódica, no mesmo processo da API (1 réplica no Railway).
 */
export function iniciarVarreduraAssinaturasVencidas(): void {
  const executar = () => {
    varrerAssinaturasVencidas().catch((err) => {
      logger.error('[Expiração Assinatura] Varredura falhou', {
        context: { error: err instanceof Error ? err.message : 'Unknown' }
      });
    });
  };

  const timer = setInterval(executar, INTERVALO_VARREDURA_MS);
  timer.unref();

  logger.info('[Expiração Assinatura] Varredura automática iniciada', {
    context: { intervaloMinutos: INTERVALO_VARREDURA_MS / 60000, prazoExpiracaoMinutos: ASSINATURA_EXPIRACAO_MINUTOS }
  });

  executar();
}
