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

export default router;
