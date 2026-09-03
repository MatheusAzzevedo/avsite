/**
 * Explicação do Arquivo [webhook.routes.ts]
 * 
 * Rotas de webhooks de gateways de pagamento.
 * Recebe notificações automáticas quando status de pagamento muda.
 * 
 * Webhooks implementados:
 * - POST /api/webhooks/asaas - Webhook do Asaas
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { processarWebhookAsaas } from '../config/asaas';
import { processarRetornoPagHiper } from '../config/paghiper';
import { enviarEmailConfirmacaoPedido } from '../utils/enviar-email-confirmacao';

const router = Router();

/**
 * Explicação da API [POST /api/webhooks/asaas]
 * 
 * Webhook do Asaas - recebe notificações de pagamento.
 * Rota pública (Asaas não envia token).
 * 
 * Fluxo:
 * 1. Recebe evento do Asaas (PAYMENT_RECEIVED, PAYMENT_CONFIRMED, etc)
 * 2. Extrai ID do pedido (externalReference)
 * 3. Processa evento e mapeia para status do sistema
 * 4. Atualiza pedido no banco
 * 5. Registra log de atividade
 * 6. Retorna 200 OK (Asaas requer confirmação)
 * 
 * Body: { event, payment: { id, status, value, externalReference } }
 * Response: { success: true }
 */
router.post('/asaas',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { event, payment } = req.body;
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

      logger.info('[Webhook Asaas] Webhook recebido', {
        context: {
          event,
          paymentId: payment?.id,
          status: payment?.status,
          value: payment?.value,
          reference: payment?.externalReference,
          ip: clientIp
        }
      });

      // Valida dados básicos
      if (!event || !payment || !payment.id) {
        logger.warn('[Webhook Asaas] Dados inválidos', {
          context: { event, payment }
        });
        throw new Error('Dados do webhook inválidos');
      }

      // Busca pedido pelo externalReference (ID do pedido)
      const pedidoId = payment.externalReference;
      if (!pedidoId) {
        logger.warn('[Webhook Asaas] ExternalReference ausente', {
          context: { paymentId: payment.id }
        });
        // Retorna 200 mesmo assim (Asaas pode reenviar)
        return res.json({ success: true, message: 'ExternalReference não encontrado' });
      }

      const pedido = await prisma.pedido.findUnique({
        where: { id: pedidoId },
        include: { cliente: true }
      });

      if (!pedido) {
        logger.warn('[Webhook Asaas] Pedido não encontrado', {
          context: { pedidoId, paymentId: payment.id }
        });
        return res.json({ success: true, message: 'Pedido não encontrado' });
      }

      // Processa evento e mapeia status
      const resultado = processarWebhookAsaas(event, payment);

      logger.info('[Webhook Asaas] Evento processado', {
        context: {
          event,
          pedidoId,
          statusAnterior: pedido.status,
          novoStatus: resultado.statusPedido
        }
      });

      // Prepara dados para atualização
      const updateData: any = {
        status: resultado.statusPedido
      };

      if (resultado.devePagar && !pedido.dataPagamento) {
        updateData.dataPagamento = new Date();
      }

      if (resultado.deveConfirmar && !pedido.dataConfirmacao) {
        updateData.dataConfirmacao = new Date();
      }

      // Atualiza pedido
      await prisma.pedido.update({
        where: { id: pedido.id },
        data: updateData
      });

      // Envia e-mail de confirmação quando pagamento é confirmado (PAGO)
      // Só envia se o status mudou para PAGO e antes não era PAGO/CONFIRMADO
      const statusAnteriorNaoPago = pedido.status !== 'PAGO' && pedido.status !== 'CONFIRMADO';
      const statusNovoIsPago = resultado.statusPedido === 'PAGO' || resultado.statusPedido === 'CONFIRMADO';

      logger.info('[Webhook Asaas] Avaliando envio de e-mail de confirmação', {
        context: {
          pedidoId: pedido.id,
          statusAnterior: pedido.status,
          statusNovo: resultado.statusPedido,
          statusAnteriorNaoPago,
          statusNovoIsPago,
          deveEnviarEmail: statusAnteriorNaoPago && statusNovoIsPago
        }
      });

      if (statusAnteriorNaoPago && statusNovoIsPago) {
        logger.info('[Webhook Asaas] ✉️ Disparando e-mail de confirmação para pedido', {
          context: { pedidoId: pedido.id, clienteEmail: pedido.cliente.email }
        });
        // Fire-and-forget: não bloqueia a resposta do webhook
        enviarEmailConfirmacaoPedido(pedido.id).catch((err) => {
          logger.error('[Webhook Asaas] ❌ Erro ao disparar e-mail de confirmação (catch externo)', {
            context: { pedidoId: pedido.id, error: err instanceof Error ? err.message : 'Unknown' }
          });
        });
      } else {
        logger.info('[Webhook Asaas] ⏭️ E-mail de confirmação NÃO enviado (condição não atendida)', {
          context: {
            pedidoId: pedido.id,
            motivo: !statusNovoIsPago
              ? `Status novo (${resultado.statusPedido}) não é PAGO/CONFIRMADO`
              : `Status anterior (${pedido.status}) já era PAGO/CONFIRMADO`
          }
        });
      }

      // Registra atividade
      await prisma.activityLog.create({
        data: {
          action: 'payment_webhook',
          entity: 'pedido',
          entityId: pedido.id,
          description: `Webhook Asaas: ${event} - Status atualizado para ${resultado.statusPedido}`,
          userEmail: pedido.cliente.email,
          ip: clientIp
        }
      });

      logger.info('[Webhook Asaas] Pedido atualizado com sucesso', {
        context: {
          event,
          pedidoId,
          novoStatus: resultado.statusPedido,
          paymentId: payment.id
        }
      });

      // Retorna 200 OK (Asaas exige confirmação)
      res.json({ success: true });
    } catch (error) {
      logger.error('[Webhook Asaas] Erro ao processar webhook', {
        context: {
          error: error instanceof Error ? error.message : 'Unknown',
          body: req.body
        }
      });

      // Retorna 200 mesmo com erro (evita reenvios infinitos do Asaas)
      res.json({ success: false, error: 'Erro ao processar webhook' });
    }
  }
);

/**
 * Explicação da API [POST /api/webhooks/paghiper]
 *
 * Webhook do PagHiper — recebe notificações de mudança de status do PIX.
 * Rota pública, registrada via `notification_url` no momento da criação da cobrança.
 *
 * O PagHiper envia um POST **form-encoded** (não JSON) contendo apenas
 * identificadores: apiKey, transaction_id, notification_id, notification_date,
 * source_api. O status real NÃO vem nesse POST — é preciso consultá-lo de volta
 * na API autenticando com apiKey + token. É esse retorno que impede que um
 * terceiro forje uma confirmação de pagamento.
 *
 * Códigos de resposta (o PagHiper reenvia a cada 2h por 24h quando não recebe
 * confirmação, então o status HTTP decide se haverá nova tentativa):
 * - 400: payload malformado — reenviar não resolve.
 * - 200: processado, ou situação permanente (pedido inexistente).
 * - 500: falha transitória (gateway fora, banco indisponível) — pede retentativa.
 *
 * Body: { notification_id, transaction_id, apiKey, ... }
 */
/**
 * Explicação da função [registrarNotificacaoIgnorada]
 * Grava no histórico do pedido que uma notificação do gateway foi recusada.
 *
 * Existe porque proteção silenciosa é indistinguível de proteção ausente. Quando
 * um pedido pago no cartão deixa de ser cancelado por um PIX abandonado, quem
 * olha o painel não tem como saber se a guarda agiu ou se o aviso nunca chegou —
 * e a resposta acaba dependendo de alguém ler o log da aplicação.
 *
 * Nunca lança: um webhook não pode falhar por causa do registro de auditoria.
 * O gateway reenviaria a notificação, e o reenvio é justamente o que a guarda
 * precisa continuar recusando.
 */
async function registrarNotificacaoIgnorada(
  pedidoId: string,
  clienteEmail: string,
  descricao: string
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        action: 'webhook_ignorado',
        entity: 'pedido',
        entityId: pedidoId,
        description: descricao,
        userEmail: clienteEmail
      }
    });
  } catch (error) {
    logger.error('[Webhook] Falha ao registrar notificação ignorada no histórico', {
      context: { pedidoId, error: error instanceof Error ? error.message : 'Unknown' }
    });
  }
}

router.post('/paghiper',
  async (req: Request, res: Response) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const { notification_id, transaction_id, apiKey } = req.body ?? {};

    logger.info('[Webhook PagHiper] Webhook recebido', {
      context: {
        notification_id,
        transaction_id,
        contentType: req.headers['content-type'],
        camposRecebidos: req.body ? Object.keys(req.body) : null,
        ip: clientIp
      }
    });

    if (!notification_id || !transaction_id) {
      logger.warn('[Webhook PagHiper] Payload sem notification_id/transaction_id', {
        context: { camposRecebidos: req.body ? Object.keys(req.body) : null, ip: clientIp }
      });
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    // Confere a apiKey recebida contra a nossa antes de gastar uma chamada ao gateway.
    // Não é a defesa principal (essa é a revalidação abaixo), apenas descarte barato.
    const apiKeyEsperada = process.env.PAGHIPER_API_KEY?.trim();
    if (apiKey && apiKeyEsperada && apiKey !== apiKeyEsperada) {
      logger.warn('[Webhook PagHiper] apiKey da notificação não confere — ignorando', {
        context: { transaction_id, ip: clientIp }
      });
      return res.status(401).json({ error: 'Credencial inválida' });
    }

    try {
      // Revalida a notificação na API do PagHiper — o status confiável vem daqui.
      const resultado = await processarRetornoPagHiper(notification_id, transaction_id);

      const pedidoId = resultado.order_id;
      if (!pedidoId) {
        logger.warn('[Webhook PagHiper] Transação sem order_id', { context: { transaction_id } });
        return res.json({ success: true, message: 'Pedido (order_id) ausente' });
      }

      const pedido = await prisma.pedido.findUnique({
        where: { id: pedidoId },
        include: { cliente: true }
      });

      if (!pedido) {
        logger.warn('[Webhook PagHiper] Pedido não encontrado no banco', { context: { pedidoId } });
        return res.json({ success: true, message: 'Pedido não encontrado' });
      }

      logger.info('[Webhook PagHiper] Notificação validada', {
        context: { pedidoId, novoStatus: resultado.status }
      });

      // A notificação só vale para a cobrança que o pedido está usando agora.
      //
      // Um mesmo pedido pode ter gerado uma cobrança PIX e, depois, ser pago no
      // cartão pelo Asaas — nesse caso `codigoPagamento` passa a ser o id do
      // Asaas e a cobrança PIX fica órfã no PagHiper. Um a dois dias depois ela
      // vence e o gateway avisa `canceled`. Sem esta checagem, o aviso de uma
      // cobrança abandonada derruba um pedido que foi pago no cartão.
      if (pedido.codigoPagamento && pedido.codigoPagamento !== transaction_id) {
        logger.warn('[Webhook PagHiper] Notificação de cobrança que não é a atual do pedido — ignorada', {
          context: {
            pedidoId,
            transactionIdNotificado: transaction_id,
            codigoPagamentoAtual: pedido.codigoPagamento,
            statusGateway: resultado.status,
            statusPedido: pedido.status
          }
        });

        // Registra a recusa no histórico do pedido, e não apenas no log da
        // aplicação. Sem esta linha, a proteção é invisível para quem olha o
        // pedido pelo painel: diante de um pedido que "deveria" ter sido
        // cancelado e não foi, não há como distinguir a guarda funcionando de
        // um webhook que nunca chegou — foi exatamente essa dúvida que apareceu
        // ao investigar um pedido pago no cartão depois de um PIX abandonado.
        await registrarNotificacaoIgnorada(pedido.id, pedido.cliente.email,
          `Notificação do PagHiper ignorada: refere-se à cobrança ${transaction_id} ` +
          `(status "${resultado.status}"), que não é mais a cobrança deste pedido ` +
          `(${pedido.codigoPagamento}). Pedido preservado em ${pedido.status}.`);

        return res.json({ success: true, message: 'Notificação não corresponde à cobrança atual do pedido' });
      }

      // Mapeamento status PagHiper → status do pedido.
      // Status possíveis: pending, reserved, paid, completed, processing, canceled, refunded.
      let novoStatusPedido = pedido.status;
      let devePagar = false;

      if (resultado.status === 'paid' || resultado.status === 'completed' || resultado.status === 'reserved') {
        novoStatusPedido = 'PAGO';
        devePagar = true;

        // 'reserved' é PRÉ-confirmação bancária, não compensação (≈2% não compensam).
        // Hoje conta como PAGO e dispara o e-mail ao cliente — log explícito para
        // tornar essa decisão auditável enquanto a regra não é revista.
        if (resultado.status === 'reserved') {
          logger.warn('[Webhook PagHiper] Status "reserved" tratado como PAGO (pré-confirmação, não compensado)', {
            context: { pedidoId, transaction_id }
          });
        }
      } else if (resultado.status === 'canceled') {
        // Quando a expiração cancela a cobrança no gateway, o PagHiper nos
        // notifica de volta do nosso próprio cancelamento. Sobrescrever
        // EXPIRADO com CANCELADO apagaria a distinção entre prazo esgotado e
        // desistência do cliente — ambos terminais, mas EXPIRADO é mais preciso.
        // Segunda barreira: dinheiro reconhecido não volta atrás por aviso de
        // cancelamento. A checagem acima já barra a cobrança órfã, mas o custo de
        // errar aqui é o cliente pagar e perder a vaga.
        const STATUS_INTOCAVEIS: string[] = ['PAGO', 'CONFIRMADO'];
        if (STATUS_INTOCAVEIS.includes(pedido.status)) {
          logger.warn('[Webhook PagHiper] Cancelamento ignorado: pedido já está pago', {
            context: { pedidoId, statusPedido: pedido.status, transaction_id }
          });
          await registrarNotificacaoIgnorada(pedido.id, pedido.cliente.email,
            `Notificação de cancelamento do PagHiper ignorada: o pedido já está em ` +
            `${pedido.status}, com pagamento reconhecido. Cobrança ${transaction_id}.`);
        } else {
          novoStatusPedido = pedido.status === 'EXPIRADO' ? 'EXPIRADO' : 'CANCELADO';
        }
      } else {
        logger.info('[Webhook PagHiper] Status sem mapeamento — pedido mantido como está', {
          context: { pedidoId, statusGateway: resultado.status, statusPedido: pedido.status }
        });
      }

      if (novoStatusPedido === pedido.status) {
        // Reenvio da mesma notificação, ou mudança que não altera o pedido.
        logger.info('[Webhook PagHiper] Nenhuma alteração a aplicar (idempotente)', {
          context: { pedidoId, statusGateway: resultado.status, statusPedido: pedido.status }
        });
      }

      if (novoStatusPedido !== pedido.status) {
        const updateData: any = { status: novoStatusPedido };
        if (devePagar && !pedido.dataPagamento) {
          updateData.dataPagamento = new Date();
        }

        await prisma.pedido.update({
          where: { id: pedido.id },
          data: updateData
        });

        // Envia e-mail se foi pago e não era antes
        if (devePagar && pedido.status !== 'PAGO' && pedido.status !== 'CONFIRMADO') {
          enviarEmailConfirmacaoPedido(pedido.id).catch((err) => {
            logger.error('[Webhook PagHiper] ❌ Erro ao disparar e-mail de confirmação', {
              context: { pedidoId: pedido.id, error: err instanceof Error ? err.message : 'Unknown' }
            });
          });
        }

        await prisma.activityLog.create({
          data: {
            action: 'payment_webhook',
            entity: 'pedido',
            entityId: pedido.id,
            description: `Webhook PagHiper: Status atualizado para ${novoStatusPedido}`,
            userEmail: pedido.cliente.email,
            ip: clientIp
          }
        });
      }

      res.json({ success: true });
    } catch (error) {
      // 500 (e não 200) para que o PagHiper reenvie: as falhas prováveis aqui são
      // transitórias — gateway indisponível na revalidação ou banco fora do ar.
      // Responder 200 encerraria as retentativas e o pagamento ficaria perdido.
      logger.error('[Webhook PagHiper] Erro ao processar webhook — solicitando retentativa', {
        context: {
          error: error instanceof Error ? error.message : 'Unknown',
          notification_id,
          transaction_id
        }
      });
      res.status(500).json({ success: false, error: 'Erro ao processar webhook' });
    }
  }
);

export default router;
