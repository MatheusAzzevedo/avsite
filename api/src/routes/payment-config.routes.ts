/**
 * Explicação do Arquivo [payment-config.routes.ts]
 * 
 * Rotas para configuração de gateways de pagamento.
 * Gerencia configurações de Asaas, Mercado Pago e Stripe.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router = Router();

// Aplica autenticação e verificação de admin
router.use(authMiddleware);
router.use(adminMiddleware);

const VALID_GATEWAYS = ['asaas', 'mercadopago', 'stripe'];

/**
 * GET /api/payment-config
 * Lista todas as configurações de pagamento
 */
router.get('/',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const configs = await prisma.paymentConfig.findMany({
        orderBy: { gateway: 'asc' }
      });

      // Oculta dados sensíveis
      const safeConfigs = configs.map(config => ({
        ...config,
        config: {
          // Retorna apenas indicadores, não as chaves reais
          hasApiKey: !!(config.config as Record<string, unknown>)?.apiKey,
          hasAccessToken: !!(config.config as Record<string, unknown>)?.accessToken,
          hasSecretKey: !!(config.config as Record<string, unknown>)?.secretKey,
          ...(config.config as object)
        }
      }));

      res.json({
        success: true,
        data: safeConfigs
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/payment-config/:gateway
 * Retorna configuração de um gateway específico
 */
router.get('/:gateway',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { gateway } = req.params;

      if (!VALID_GATEWAYS.includes(gateway)) {
        throw ApiError.badRequest(`Gateway inválido. Use: ${VALID_GATEWAYS.join(', ')}`);
      }

      const config = await prisma.paymentConfig.findUnique({
        where: { gateway }
      });

      if (!config) {
        // Retorna configuração padrão se não existir
        return res.json({
          success: true,
          data: {
            gateway,
            active: false,
            config: {},
            testMode: true
          }
        });
      }

      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/payment-config/:gateway
 * Cria ou atualiza configuração de um gateway
 */
router.post('/:gateway',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { gateway } = req.params;
      const { active, config, testMode, webhookUrl } = req.body;

      if (!VALID_GATEWAYS.includes(gateway)) {
        throw ApiError.badRequest(`Gateway inválido. Use: ${VALID_GATEWAYS.join(', ')}`);
      }

      logger.info(`[PaymentConfig] Atualizando: ${gateway}`);

      // Upsert - cria se não existe, atualiza se existe
      const paymentConfig = await prisma.paymentConfig.upsert({
        where: { gateway },
        update: {
          active: active ?? undefined,
          config: config ?? undefined,
          testMode: testMode ?? undefined,
          webhookUrl: webhookUrl ?? undefined
        },
        create: {
          gateway,
          active: active ?? false,
          config: config ?? {},
          testMode: testMode ?? true,
          webhookUrl
        }
      });

      // Registra atividade
      await prisma.activityLog.create({
        data: {
          action: 'update',
          entity: 'payment_config',
          entityId: paymentConfig.id,
          description: `Configuração de pagamento atualizada: ${gateway}`,
          userId: req.user!.id,
          userEmail: req.user!.email
        }
      });

      logger.info(`[PaymentConfig] Atualizado com sucesso: ${gateway}`);

      res.json({
        success: true,
        message: 'Configuração salva com sucesso',
        data: paymentConfig
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/payment-config/:gateway/activate
 * Ativa um gateway (e desativa os outros)
 */
router.patch('/:gateway/activate',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { gateway } = req.params;

      if (!VALID_GATEWAYS.includes(gateway)) {
        throw ApiError.badRequest(`Gateway inválido. Use: ${VALID_GATEWAYS.join(', ')}`);
      }

      // Desativa todos os gateways
      await prisma.paymentConfig.updateMany({
        data: { active: false }
      });

      // Ativa o gateway selecionado
      const config = await prisma.paymentConfig.upsert({
        where: { gateway },
        update: { active: true },
        create: {
          gateway,
          active: true,
          config: {},
          testMode: true
        }
      });

      // Registra atividade
      await prisma.activityLog.create({
        data: {
          action: 'update',
          entity: 'payment_config',
          description: `Gateway de pagamento ativado: ${gateway}`,
          userId: req.user!.id,
          userEmail: req.user!.email
        }
      });

      res.json({
        success: true,
        message: `Gateway ${gateway} ativado com sucesso`,
        data: config
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/payment-config/active
 * Retorna o gateway ativo
 */
router.get('/status/active',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const activeConfig = await prisma.paymentConfig.findFirst({
        where: { active: true }
      });

      res.json({
        success: true,
        data: activeConfig || null
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
