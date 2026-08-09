/**
 * Explicação do Arquivo [expirar-pix.job.ts]
 *
 * Expiração de cobranças PIX que passaram do prazo.
 *
 * Por que existe: o PagHiper não aceita vencimento em horas — `days_due_date` é
 * contado em dias, então a cobrança nasce válida por 1 dia. Para valer um prazo
 * menor (2h), é o nosso servidor que precisa invalidá-la no gateway.
 *
 * Antes existia apenas um temporizador no navegador, que cancelava o pedido no
 * nosso banco e deixava o PIX pagável no PagHiper. Pior: se o cliente fechasse a
 * aba, nada acontecia. Aqui a regra passa a valer independentemente do frontend.
 *
 * Duas portas de entrada:
 * - `expirarPedidoPix`: aplica a regra a um pedido específico (usado também pela
 *   rota de consulta de status, para resposta imediata).
 * - `iniciarVarreduraPixVencidos`: varre periodicamente os vencidos, garantindo o
 *   prazo mesmo sem ninguém acessar o sistema.
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { consultarTransacaoPagHiper, cancelarCobrancaPixPagHiper, verificarConfigPagHiper } from '../config/paghiper';
import { enviarEmailConfirmacaoPedido } from '../utils/enviar-email-confirmacao';

/** Prazo de validade do PIX, em minutos. Ajustável por variável de ambiente. */
export const PIX_EXPIRACAO_MINUTOS = Number(process.env.PIX_EXPIRACAO_MINUTOS) || 120;

/** Intervalo entre varreduras automáticas. */
const INTERVALO_VARREDURA_MS = 10 * 60 * 1000; // 10 minutos

/** Teto de pedidos tratados por varredura, para não segurar o processo. */
const LOTE_MAXIMO = 50;

/** Status do PagHiper que indicam dinheiro reconhecido. */
const STATUS_PAGOS = ['paid', 'completed', 'reserved'];

/**
 * Explicação da função [calcularExpiracaoPix]
 * Devolve o instante em que a cobrança gerada agora deixa de valer.
 */
export function calcularExpiracaoPix(): Date {
  return new Date(Date.now() + PIX_EXPIRACAO_MINUTOS * 60 * 1000);
}

export type ResultadoExpiracao = 'pago' | 'expirado' | 'mantido' | 'erro';

/**
 * Explicação da função [expirarPedidoPix]
 * Aplica a regra de expiração a um pedido cujo prazo já passou.
 *
 * A ordem importa: consultamos o status no gateway ANTES de cancelar. Sem isso,
 * um pagamento feito nos minutos finais seria cancelado junto — o cliente teria
 * pago e ficado sem a vaga. Se o pagamento apareceu, o pedido é confirmado em vez
 * de expirado.
 *
 * @returns 'pago' se o pagamento apareceu, 'expirado' se foi invalidado,
 *          'mantido' se ainda não venceu, 'erro' se o gateway falhou.
 */
export async function expirarPedidoPix(pedidoId: string): Promise<ResultadoExpiracao> {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    select: {
      id: true,
      status: true,
      codigoPagamento: true,
      metodoPagamento: true,
      pixExpiraEm: true,
      dataPagamento: true
    }
  });

  if (!pedido) return 'erro';

  const aguardando = pedido.status === 'PENDENTE' || pedido.status === 'AGUARDANDO_PAGAMENTO';
  const venceu = !!pedido.pixExpiraEm && pedido.pixExpiraEm.getTime() <= Date.now();

  if (!aguardando || !venceu || pedido.metodoPagamento !== 'pix') {
    return 'mantido';
  }

  // Sem código de pagamento não há o que cancelar no gateway.
  if (!pedido.codigoPagamento) {
    await prisma.pedido.update({
      where: { id: pedido.id },
      data: { status: 'EXPIRADO' }
    });
    logger.info('[Expiração PIX] Pedido sem cobrança no gateway marcado como EXPIRADO', {
      context: { pedidoId: pedido.id }
    });
    return 'expirado';
  }

  try {
    // 1) O pagamento entrou no fim do prazo?
    const statusGateway = await consultarTransacaoPagHiper(pedido.codigoPagamento);

    if (STATUS_PAGOS.includes(statusGateway.status)) {
      await prisma.pedido.update({
        where: { id: pedido.id },
        data: {
          status: 'PAGO',
          dataPagamento: pedido.dataPagamento || new Date()
        }
      });

      logger.info('[Expiração PIX] Pagamento encontrado no limite do prazo; pedido confirmado em vez de expirado', {
        context: { pedidoId: pedido.id, statusGateway: statusGateway.status }
      });

      enviarEmailConfirmacaoPedido(pedido.id).catch((err) => {
        logger.error('[Expiração PIX] ❌ Erro ao disparar e-mail de confirmação', {
          context: { pedidoId: pedido.id, error: err instanceof Error ? err.message : 'Unknown' }
        });
      });

      return 'pago';
    }

    // 2) Não pago: invalida no gateway para que não seja mais pagável.
    await cancelarCobrancaPixPagHiper(pedido.codigoPagamento);

    await prisma.pedido.update({
      where: { id: pedido.id },
      data: { status: 'EXPIRADO' }
    });

    await prisma.activityLog.create({
      data: {
        action: 'payment_expired',
        entity: 'pedido',
        entityId: pedido.id,
        description: `PIX expirado após ${PIX_EXPIRACAO_MINUTOS} min e cancelado no PagHiper`
      }
    });

    logger.info('[Expiração PIX] Cobrança cancelada no gateway e pedido marcado como EXPIRADO', {
      context: { pedidoId: pedido.id, transactionId: pedido.codigoPagamento }
    });

    return 'expirado';
  } catch (error) {
    // O pedido é deixado como está: na próxima varredura tenta de novo.
    // Marcar EXPIRADO sem confirmar o cancelamento deixaria um PIX pagável
    // sem pedido correspondente — exatamente o que queremos evitar.
    logger.error('[Expiração PIX] Falha ao expirar pedido; será reprocessado na próxima varredura', {
      context: {
        pedidoId: pedido.id,
        transactionId: pedido.codigoPagamento,
        error: error instanceof Error ? error.message : 'Unknown'
      }
    });
    return 'erro';
  }
}

/**
 * Explicação da função [varrerPixVencidos]
 * Busca pedidos com PIX vencido e aplica a expiração a cada um.
 * Processa em série para não disparar várias chamadas simultâneas ao gateway.
 */
export async function varrerPixVencidos(): Promise<void> {
  if (!verificarConfigPagHiper()) return;

  const vencidos = await prisma.pedido.findMany({
    where: {
      status: { in: ['PENDENTE', 'AGUARDANDO_PAGAMENTO'] },
      metodoPagamento: 'pix',
      pixExpiraEm: { not: null, lte: new Date() }
    },
    select: { id: true },
    orderBy: { pixExpiraEm: 'asc' },
    take: LOTE_MAXIMO
  });

  if (vencidos.length === 0) return;

  logger.info('[Expiração PIX] Varredura encontrou cobranças vencidas', {
    context: { quantidade: vencidos.length, loteMaximo: LOTE_MAXIMO }
  });

  const contagem: Record<ResultadoExpiracao, number> = { pago: 0, expirado: 0, mantido: 0, erro: 0 };

  for (const { id } of vencidos) {
    try {
      contagem[await expirarPedidoPix(id)]++;
    } catch (error) {
      contagem.erro++;
      logger.error('[Expiração PIX] Erro inesperado ao processar pedido na varredura', {
        context: { pedidoId: id, error: error instanceof Error ? error.message : 'Unknown' }
      });
    }
  }

  logger.info('[Expiração PIX] Varredura concluída', { context: contagem });

  if (vencidos.length === LOTE_MAXIMO) {
    logger.warn('[Expiração PIX] Lote cheio — restaram pedidos vencidos para a próxima varredura', {
      context: { loteMaximo: LOTE_MAXIMO }
    });
  }
}

/**
 * Explicação da função [iniciarVarreduraPixVencidos]
 * Agenda a varredura periódica.
 *
 * Roda dentro do próprio processo da API — o Railway mantém 1 réplica
 * (`numReplicas: 1` em railway.json), então não há duas varreduras concorrendo.
 * Se um dia houver mais réplicas, isto precisa virar um job externo com trava.
 *
 * `unref()` evita que o timer segure o processo vivo no encerramento.
 */
export function iniciarVarreduraPixVencidos(): void {
  if (!verificarConfigPagHiper()) {
    logger.warn('[Expiração PIX] PagHiper não configurado — varredura não iniciada');
    return;
  }

  const executar = () => {
    varrerPixVencidos().catch((err) => {
      logger.error('[Expiração PIX] Varredura falhou', {
        context: { error: err instanceof Error ? err.message : 'Unknown' }
      });
    });
  };

  const timer = setInterval(executar, INTERVALO_VARREDURA_MS);
  timer.unref();

  logger.info('[Expiração PIX] Varredura automática iniciada', {
    context: {
      intervaloMinutos: INTERVALO_VARREDURA_MS / 60000,
      prazoExpiracaoMinutos: PIX_EXPIRACAO_MINUTOS
    }
  });

  executar(); // primeira passada no boot, limpa o que venceu enquanto estava fora do ar
}
