/**
 * Explicação do Arquivo [pagamento.routes.ts]
 * 
 * Rotas de pagamento via Asaas.
 * Gerencia criação de cobranças (PIX e Cartão) e webhooks.
 * 
 * Rotas disponíveis:
 * - POST /api/cliente/pagamento/pix - Criar cobrança PIX
 * - POST /api/cliente/pagamento/cartao - Pagar com cartão de crédito
 * - GET /api/cliente/pagamento/:pedidoId/status - Consultar status do pagamento
 * - POST /api/webhooks/asaas - Webhook do Asaas (público)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { clienteAuthMiddleware } from '../middleware/cliente-auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { 
  criarPagamentoPixSchema,
  criarPagamentoCartaoSchema,
  asaasWebhookSchema
} from '../schemas/pagamento.schema';
import { 
  criarCobrancaAsaas,
  criarCobrancaCartaoAsaas,
  consultarPagamentoAsaas,
  processarWebhookAsaas,
  verificarConfigAsaas
} from '../config/asaas';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Explicação da API [POST /api/cliente/pagamento/pix]
 * 
 * Cria cobrança PIX para um pedido.
 * Requer autenticação de cliente.
 * 
 * Fluxo:
 * 1. Valida pedido (existe, pertence ao cliente, status PENDENTE)
 * 2. Cria cobrança no Asaas
 * 3. Atualiza pedido com código de pagamento
 * 4. Retorna QR Code PIX e dados da cobrança
 * 
 * Body: { pedidoId: string }
 * Response: { success, data: { qrCode, qrCodeImage, valor, ... } }
 */
router.post('/pix',
  clienteAuthMiddleware,
  validateBody(criarPagamentoPixSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { pedidoId } = req.body;
      const clienteId = req.cliente!.id;
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

      logger.info('[Pagamento PIX] Criando cobrança PIX', {
        context: { pedidoId, clienteId, ip: clientIp }
      });

      // Verifica configuração Asaas
      if (!verificarConfigAsaas()) {
        throw ApiError.internal('Gateway de pagamento não configurado');
      }

      // Busca pedido
      const pedido = await prisma.pedido.findFirst({
        where: {
          id: pedidoId,
          clienteId // Garante que pedido pertence ao cliente
        },
        include: {
          cliente: true,
          excursaoPedagogica: true,
          excursao: true
        }
      });

      if (!pedido) {
        logger.warn('[Pagamento PIX] Pedido não encontrado', {
          context: { pedidoId, clienteId }
        });
        throw ApiError.notFound('Pedido não encontrado');
      }

      if (pedido.status !== 'PENDENTE' && pedido.status !== 'AGUARDANDO_PAGAMENTO') {
        logger.warn('[Pagamento PIX] Status do pedido não permite pagamento', {
          context: { pedidoId, status: pedido.status }
        });
        throw ApiError.badRequest(`Pedido já está com status: ${pedido.status}`);
      }

      // Cria cobrança no Asaas
      const cobranca = await criarCobrancaAsaas({
        clienteEmail: pedido.cliente.email,
        clienteNome: pedido.cliente.nome,
        clienteCpf: pedido.cliente.cpf || undefined,
        clienteTelefone: pedido.cliente.telefone || undefined,
        valor: Number(pedido.valorTotal),
        descricao: `Excursão: ${pedido.excursaoPedagogica?.titulo ?? pedido.excursao?.titulo ?? 'Excursão'} - ${pedido.quantidade}x passagens`,
        metodoPagamento: 'PIX',
        externalReference: pedido.id
      });

      // Atualiza pedido com código de pagamento
      await prisma.pedido.update({
        where: { id: pedido.id },
        data: {
          codigoPagamento: cobranca.id,
          metodoPagamento: 'pix',
          status: 'AGUARDANDO_PAGAMENTO'
        }
      });

      // Registra atividade
      await prisma.activityLog.create({
        data: {
          action: 'payment_initiated',
          entity: 'pedido',
          entityId: pedido.id,
          description: `Pagamento PIX iniciado - Valor: R$ ${Number(pedido.valorTotal).toFixed(2)}`,
          userEmail: pedido.cliente.email,
          ip: clientIp
        }
      });

      logger.info('[Pagamento PIX] Cobrança PIX criada com sucesso', {
        context: {
          pedidoId,
          clienteId,
          cobrancaId: cobranca.id,
          valor: Number(pedido.valorTotal)
        }
      });

      res.json({
        success: true,
        message: 'Cobrança PIX criada com sucesso',
        data: {
          pedidoId: pedido.id,
          cobrancaId: cobranca.id,
          valor: cobranca.value,
          qrCode: cobranca.pixData?.qrCode,
          qrCodeImage: cobranca.pixData?.qrCodeImage,
          expirationDate: cobranca.pixData?.expirationDate,
          invoiceUrl: cobranca.invoiceUrl
        }
      });
    } catch (error) {
      logger.error('[Pagamento PIX] Erro ao criar cobrança', {
        context: {
          error: error instanceof Error ? error.message : 'Unknown',
          pedidoId: req.body?.pedidoId,
          clienteId: req.cliente?.id
        }
      });
      next(error);
    }
  }
);

/**
 * Explicação da API [POST /api/cliente/pagamento/cartao]
 * 
 * Processa pagamento com cartão de crédito.
 * Requer autenticação de cliente.
 * 
 * Body: { pedidoId, creditCard: {...}, creditCardHolderInfo: {...} }
 * Response: { success, message, data: { status, transactionId } }
 */
router.post('/cartao',
  clienteAuthMiddleware,
  validateBody(criarPagamentoCartaoSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { pedidoId, creditCard, creditCardHolderInfo } = req.body;
      const clienteId = req.cliente!.id;

      logger.info('[Pagamento Cartão] Processando pagamento com cartão', {
        context: { pedidoId, clienteId }
      });

      if (!verificarConfigAsaas()) {
        throw ApiError.internal('Gateway de pagamento não configurado');
      }

      // Busca pedido
      const pedido = await prisma.pedido.findFirst({
        where: { id: pedidoId, clienteId },
        include: { cliente: true, excursaoPedagogica: true, excursao: true }
      });

      if (!pedido) {
        throw ApiError.notFound('Pedido não encontrado');
      }

      if (pedido.status !== 'PENDENTE' && pedido.status !== 'AGUARDANDO_PAGAMENTO') {
        throw ApiError.badRequest(`Pedido já está com status: ${pedido.status}`);
      }

      const tituloExcursao = pedido.excursaoPedagogica?.titulo ?? pedido.excursao?.titulo ?? 'Excursão';
      const descricao = `Excursão: ${tituloExcursao} - ${pedido.quantidade}x passagens`;

      const cobranca = await criarCobrancaCartaoAsaas({
        clienteEmail: pedido.cliente.email,
        clienteNome: pedido.cliente.nome,
        clienteCpf: pedido.cliente.cpf || undefined,
        clienteTelefone: pedido.cliente.telefone || undefined,
        valor: Number(pedido.valorTotal),
        descricao,
        externalReference: pedido.id,
        creditCard: {
          holderName: creditCard.holderName,
          number: creditCard.number,
          expiryMonth: creditCard.expiryMonth,
          expiryYear: creditCard.expiryYear,
          ccv: creditCard.ccv
        },
        creditCardHolderInfo: {
          name: creditCardHolderInfo.name,
          email: creditCardHolderInfo.email,
          cpfCnpj: creditCardHolderInfo.cpfCnpj,
          postalCode: creditCardHolderInfo.postalCode,
          addressNumber: creditCardHolderInfo.addressNumber,
          phone: creditCardHolderInfo.phone
        }
      });

      const statusPedido = cobranca.status === 'CONFIRMED' || cobranca.status === 'RECEIVED'
        ? 'PAGO'
        : 'AGUARDANDO_PAGAMENTO';

      await prisma.pedido.update({
        where: { id: pedido.id },
        data: {
          codigoPagamento: cobranca.id,
          metodoPagamento: 'cartao',
          status: statusPedido,
          ...(statusPedido === 'PAGO' && { dataPagamento: new Date() })
        }
      });

      logger.info('[Pagamento Cartão] Cobrança processada', {
        context: { pedidoId, cobrancaId: cobranca.id, status: cobranca.status }
      });

      res.json({
        success: true,
        message: statusPedido === 'PAGO' ? 'Pagamento aprovado' : 'Pagamento em processamento',
        data: {
          pedidoId: pedido.id,
          cobrancaId: cobranca.id,
          status: statusPedido,
          valor: Number(pedido.valorTotal)
        }
      });
    } catch (error) {
      logger.error('[Pagamento Cartão] Erro', {
        context: {
          error: error instanceof Error ? error.message : 'Unknown',
          pedidoId: req.body?.pedidoId
        }
      });
      next(error);
    }
  }
);

/**
 * Explicação da API [GET /api/cliente/pagamento/:pedidoId/status]
 * 
 * Consulta status do pagamento de um pedido.
 * Requer autenticação de cliente.
 * 
 * Params: { pedidoId: string }
 * Response: { success, data: { status, codigoPagamento, ... } }
 */
router.get('/:pedidoId/status',
  clienteAuthMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { pedidoId } = req.params;
      const clienteId = req.cliente!.id;

      logger.info('[Pagamento Status] Consultando status', {
        context: { pedidoId, clienteId }
      });

      // Busca pedido
      const pedido = await prisma.pedido.findFirst({
        where: { id: pedidoId, clienteId },
        select: {
          id: true,
          status: true,
          codigoPagamento: true,
          metodoPagamento: true,
          valorTotal: true,
          dataPagamento: true
        }
      });

      if (!pedido) {
        throw ApiError.notFound('Pedido não encontrado');
      }

      // Se tem código de pagamento, consulta Asaas
      let asaasStatus = null;
      if (pedido.codigoPagamento && verificarConfigAsaas()) {
        try {
          asaasStatus = await consultarPagamentoAsaas(pedido.codigoPagamento);
          
          logger.info('[Pagamento Status] Status consultado no Asaas', {
            context: {
              pedidoId,
              asaasStatus: asaasStatus.status
            }
          });
        } catch (error) {
          logger.error('[Pagamento Status] Erro ao consultar Asaas', {
            context: { error: error instanceof Error ? error.message : 'Unknown' }
          });
        }
      }

      res.json({
        success: true,
        data: {
          pedidoId: pedido.id,
          status: pedido.status,
          codigoPagamento: pedido.codigoPagamento,
          metodoPagamento: pedido.metodoPagamento,
          valorTotal: Number(pedido.valorTotal),
          dataPagamento: pedido.dataPagamento,
          asaasStatus: asaasStatus?.status
        }
      });
    } catch (error) {
      logger.error('[Pagamento Status] Erro', {
        context: {
          error: error instanceof Error ? error.message : 'Unknown',
          pedidoId: req.params.pedidoId
        }
      });
      next(error);
    }
  }
);

export default router;
