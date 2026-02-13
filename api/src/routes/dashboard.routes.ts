/**
 * Explicação do Arquivo [dashboard.routes.ts]
 *
 * Rotas para estatísticas do dashboard admin.
 *
 * Rotas disponíveis:
 * - GET /api/admin/dashboard/stats - Estatísticas para os bignumbers
 * - GET /api/admin/dashboard/excursoes-ativas - As 2 últimas excursões ativas (pedagógicas + convencionais)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * Explicação da API [GET /api/admin/dashboard/stats]
 *
 * Retorna estatísticas para os bignumbers do dashboard:
 * - pedagogicosAtivos: quantidade de excursões pedagógicas com status ATIVO
 * - convencionaisAtivos: quantidade de excursões convencionais com status ATIVO
 * - reservas: quantidade de alunos (itens de pedido) em pedidos com status PAGO ou CONFIRMADO
 */
router.get('/stats',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('[Dashboard] Buscando estatísticas', {
        context: { adminId: req.user!.id }
      });

      const [pedagogicosAtivos, convencionaisAtivos, reservas] = await Promise.all([
        prisma.excursaoPedagogica.count({ where: { status: 'ATIVO' } }),
        prisma.excursao.count({ where: { status: 'ATIVO' } }),
        prisma.itemPedido.count({
          where: {
            pedido: {
              status: { in: ['PAGO', 'CONFIRMADO'] }
            }
          }
        })
      ]);

      const stats = {
        pedagogicosAtivos,
        convencionaisAtivos,
        reservas
      };

      logger.info('[Dashboard] Estatísticas carregadas', {
        context: { stats }
      });

      res.json({ success: true, data: stats });
    } catch (error) {
      logger.error('[Dashboard] Erro ao carregar estatísticas', {
        context: { error: error instanceof Error ? error.message : 'Unknown' }
      });
      next(error);
    }
  }
);

/**
 * Explicação da API [GET /api/admin/dashboard/excursoes-ativas]
 *
 * Retorna as 2 últimas excursões cadastradas que estão ativas.
 * Combina excursões pedagógicas e convencionais, ordenadas por createdAt desc.
 */
router.get('/excursoes-ativas',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('[Dashboard] Buscando 2 últimas excursões ativas', {
        context: { adminId: req.user!.id }
      });

      const [pedagogicas, convencionais] = await Promise.all([
        prisma.excursaoPedagogica.findMany({
          where: { status: 'ATIVO' },
          select: {
            id: true,
            titulo: true,
            codigo: true,
            preco: true,
            createdAt: true,
            status: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.excursao.findMany({
          where: { status: 'ATIVO' },
          select: {
            id: true,
            titulo: true,
            slug: true,
            preco: true,
            categoria: true,
            createdAt: true,
            status: true
          },
          orderBy: { createdAt: 'desc' }
        })
      ]);

      const convencionaisFormatados = convencionais.map(e => ({
        ...e,
        tipo: 'CONVENCIONAL' as const,
        preco: Number(e.preco),
        identificador: e.slug
      }));

      const pedagogicasFormatadas = pedagogicas.map(e => ({
        ...e,
        tipo: 'PEDAGOGICA' as const,
        preco: Number(e.preco),
        identificador: e.codigo
      }));

      const unificadas = [
        ...convencionaisFormatados.map(e => ({ ...e, createdAt: e.createdAt })),
        ...pedagogicasFormatadas.map(e => ({ ...e, createdAt: e.createdAt }))
      ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const ultimas2 = unificadas.slice(0, 2);

      res.json({ success: true, data: ultimas2 });
    } catch (error) {
      logger.error('[Dashboard] Erro ao carregar excursões ativas', {
        context: { error: error instanceof Error ? error.message : 'Unknown' }
      });
      next(error);
    }
  }
);

export default router;
