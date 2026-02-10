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
  verificarConfigAsaas,
  listarPagamentosPorReferencia
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

      // Asaas exige CPF/CNPJ do cliente para criar cobrança PIX
      const cpfLimpo = pedido.cliente.cpf?.replace(/\D/g, '');
      if (!cpfLimpo || cpfLimpo.length < 11) {
        logger.warn('[Pagamento PIX] Cliente sem CPF válido', { context: { pedidoId, clienteId } });
        return res.status(400).json({
          success: false,
          error: 'CPF é obrigatório para pagamento via PIX. Atualize seus dados no cadastro.'
        });
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
      const message = error instanceof Error ? error.message : 'Unknown';
      const pedidoIdFromBody = req.body?.pedidoId as string | undefined;

      logger.error('[Pagamento PIX] Erro ao criar cobrança', {
        context: {
          error: message,
          pedidoId: pedidoIdFromBody,
          clienteId: req.cliente?.id
        }
      });

      // Reconciliação: verificar se já existe cobrança PIX confirmada para este pedido
      if (pedidoIdFromBody && req.cliente?.id && verificarConfigAsaas()) {
        try {
          const pagamentos = await listarPagamentosPorReferencia(pedidoIdFromBody);
          const cobrancaConfirmada = pagamentos.find(
            (p) =>
              p.status === 'CONFIRMED' ||
              p.status === 'RECEIVED' ||
              p.status === 'RECEIVED_IN_CASH' ||
              p.status === 'CONFIRMED_BY_CUSTOMER'
          );
          if (cobrancaConfirmada) {
            const pedido = await prisma.pedido.findFirst({
              where: { id: pedidoIdFromBody, clienteId: req.cliente.id }
            });
            if (pedido) {
              await prisma.pedido.update({
                where: { id: pedido.id },
                data: {
                  codigoPagamento: cobrancaConfirmada.id,
                  metodoPagamento: 'pix',
                  status: 'PAGO',
                  dataPagamento: new Date()
                }
              });
              logger.info('[Pagamento PIX] Cobrança já existente no Asaas; pedido atualizado para PAGO', {
                context: { pedidoId: pedido.id, cobrancaId: cobrancaConfirmada.id }
              });
              return res.json({
                success: true,
                message: 'Pagamento já foi confirmado.',
                data: {
                  pedidoId: pedido.id,
                  cobrancaId: cobrancaConfirmada.id,
                  status: 'PAGO',
                  valor: Number(pedido.valorTotal)
                }
              });
            }
          }
        } catch (reconcileErr) {
          logger.warn('[Pagamento PIX] Reconciliação falhou', { context: { error: reconcileErr instanceof Error ? reconcileErr.message : 'Unknown' } });
        }
      }

      // Erros de validação do Asaas (valor mínimo, CPF, dueDate, etc.) retornam 400
      const asaasValidationPattern = /valor mínimo|mínimo|invalid|erro|cpfCnpj|cpf|cnpj|dueDate|required/i;
      if (error instanceof Error && asaasValidationPattern.test(message)) {
        return res.status(400).json({ success: false, error: message });
      }
      // Se o erro tiver response do axios (Asaas retornou 4xx), repassar como 400 quando fizer sentido
      const axiosErr = error as { response?: { status: number; data?: { errors?: Array<{ description?: string }> } } };
      if (axiosErr.response && axiosErr.response.status >= 400 && axiosErr.response.status < 500) {
        const desc = axiosErr.response.data?.errors?.[0]?.description || message;
        return res.status(400).json({ success: false, error: desc });
      }
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

      const valorTotal = Number(pedido.valorTotal);
      // Asaas exige valor mínimo de R$ 5,00 para cartão de crédito (regra do gateway)
      if (valorTotal < 5) {
        return res.status(400).json({
          success: false,
          error: 'O valor mínimo para cobranças via Cartão de Crédito é R$ 5,00 (regra do gateway Asaas). Para valores menores, use PIX.'
        });
      }

      const tituloExcursao = pedido.excursaoPedagogica?.titulo ?? pedido.excursao?.titulo ?? 'Excursão';
      const descricao = `Excursão: ${tituloExcursao} - ${pedido.quantidade}x passagens`;

      const cobranca = await criarCobrancaCartaoAsaas({
        clienteEmail: pedido.cliente.email,
        clienteNome: pedido.cliente.nome,
        clienteCpf: pedido.cliente.cpf || undefined,
        clienteTelefone: pedido.cliente.telefone || undefined,
        valor: valorTotal,
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
      const message = error instanceof Error ? error.message : 'Unknown';
      const pedidoIdFromBody = req.body?.pedidoId as string | undefined;

      logger.error('[Pagamento Cartão] Erro', {
        context: {
          error: message,
          pedidoId: pedidoIdFromBody
        }
      });

      // Reconciliação: às vezes o Asaas debita o cartão mas retorna 400 (ex.: "não autorizada").
      // Consultamos pagamentos por referência e, se existir cobrança confirmada, atualizamos o pedido.
      if (pedidoIdFromBody && verificarConfigAsaas()) {
        try {
          const pagamentos = await listarPagamentosPorReferencia(pedidoIdFromBody);
          const cobrancaConfirmada = pagamentos.find(
            (p) =>
              p.status === 'CONFIRMED' ||
              p.status === 'RECEIVED' ||
              p.status === 'RECEIVED_IN_CASH' ||
              p.status === 'CONFIRMED_BY_CUSTOMER'
          );
          if (cobrancaConfirmada) {
            const pedido = await prisma.pedido.findFirst({
              where: { id: pedidoIdFromBody, clienteId: req.cliente!.id }
            });
            if (pedido) {
              await prisma.pedido.update({
                where: { id: pedido.id },
                data: {
                  codigoPagamento: cobrancaConfirmada.id,
                  metodoPagamento: 'cartao',
                  status: 'PAGO',
                  dataPagamento: new Date()
                }
              });
              logger.info('[Pagamento Cartão] Cobrança encontrada no Asaas após erro; pedido atualizado para PAGO', {
                context: { pedidoId: pedido.id, cobrancaId: cobrancaConfirmada.id }
              });
              return res.json({
                success: true,
                message: 'Pagamento confirmado. A cobrança foi processada.',
                data: {
                  pedidoId: pedido.id,
                  cobrancaId: cobrancaConfirmada.id,
                  status: 'PAGO',
                  valor: Number(pedido.valorTotal)
                }
              });
            }
          }
        } catch (reconcileErr) {
          logger.warn('[Pagamento Cartão] Reconciliação falhou', {
            context: { error: reconcileErr instanceof Error ? reconcileErr.message : 'Unknown' }
          });
        }
      }

      // Erros de validação do Asaas (valor mínimo, etc.) retornam 400
      if (error instanceof Error && /valor mínimo|mínimo|invalid|erro|recusad|recusado|não autorizada/i.test(message)) {
        return res.status(400).json({ success: false, error: message });
      }
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
