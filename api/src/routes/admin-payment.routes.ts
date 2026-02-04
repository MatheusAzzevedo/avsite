/**
 * Explicação do Arquivo [admin-payment.routes.ts]
 * 
 * Rotas administrativas para gerenciamento de pagamentos.
 * - Verificação de status dos gateways
 * - Criação de pagamentos de teste
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';
import { verificarConfigAsaas, criarCobrancaAsaas } from '../config/asaas';
import { ApiError } from '../utils/api-error';

const router = Router();

/**
 * Explicação da API [GET /status]
 * 
 * Verifica o status de configuração dos gateways de pagamento.
 * Retorna se o Asaas está configurado e em qual ambiente.
 */
router.get('/status', authMiddleware, async (req, res, next) => {
  try {
    logger.info('[Admin Payment] Verificando status dos gateways', {
      context: { adminId: req.userId }
    });

    const asaasConfigured = verificarConfigAsaas();
    const asaasEnvironment = process.env.ASAAS_ENVIRONMENT || 'production';

    res.json({
      asaas: {
        configured: asaasConfigured,
        environment: asaasEnvironment,
        webhookUrl: process.env.ASAAS_WEBHOOK_URL || null
      }
    });
  } catch (error) {
    logger.error('[Admin Payment] Erro ao verificar status', {
      context: { error: error instanceof Error ? error.message : 'Unknown' }
    });
    next(error);
  }
});

/**
 * Explicação da API [POST /test]
 * 
 * Cria um pagamento de teste real de R$ 1,00 via PIX.
 * Usado pelo admin para validar integração com Asaas.
 * 
 * Body: { metodo: 'PIX' | 'CREDIT_CARD' }
 */
router.post('/test', authMiddleware, async (req, res, next) => {
  try {
    const { metodo = 'PIX' } = req.body;

    logger.info('[Admin Payment] Criando pagamento de teste', {
      context: {
        adminId: req.userId,
        metodo
      }
    });

    // Verifica se Asaas está configurado
    if (!verificarConfigAsaas()) {
      throw ApiError.badRequest('Asaas não está configurado. Configure a API Key nas variáveis de ambiente.');
    }

    // Cria cobrança de teste
    const cobranca = await criarCobrancaAsaas({
      clienteEmail: 'teste@avoarturismo.com.br',
      clienteNome: 'Teste Administrativo',
      clienteCpf: '12345678900',
      clienteTelefone: '31999999999',
      valor: 1.00,
      descricao: 'Pagamento de teste administrativo',
      metodoPagamento: metodo as 'PIX' | 'CREDIT_CARD' | 'BOLETO',
      externalReference: `TEST-${Date.now()}`
    });

    logger.info('[Admin Payment] Pagamento de teste criado', {
      context: {
        paymentId: cobranca.id,
        metodo,
        status: cobranca.status
      }
    });

    res.json({
      success: true,
      payment: {
        id: cobranca.id,
        status: cobranca.status,
        value: cobranca.value,
        billingType: cobranca.billingType,
        invoiceUrl: cobranca.invoiceUrl,
        bankSlipUrl: cobranca.bankSlipUrl,
        pixData: cobranca.pixData
      }
    });
  } catch (error) {
    logger.error('[Admin Payment] Erro ao criar pagamento de teste', {
      context: {
        error: error instanceof Error ? error.message : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    next(error);
  }
});

export default router;
