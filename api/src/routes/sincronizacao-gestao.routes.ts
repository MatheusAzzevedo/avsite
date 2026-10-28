/**
 * Explicação do Arquivo [sincronizacao-gestao.routes.ts]
 *
 * Rota usada pela gestão (avoar) para o botão de sincronização da listagem de
 * registros: devolve, numa chamada só, o id e a data da última edição de cada
 * excursão do site. A gestão compara com a data que guardou no último envio.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router = Router();
router.use(authMiddleware);

/**
 * Explicação da API [GET /api/admin/sincronizacao]:
 * { pedagogicas: [{ id, updatedAt }], convencionais: [{ id, updatedAt }] }.
 * Só id e data: a listagem da gestão chama isso toda vez que abre.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [pedagogicas, convencionais] = await Promise.all([
      prisma.excursaoPedagogica.findMany({ select: { id: true, updatedAt: true } }),
      prisma.excursao.findMany({ select: { id: true, updatedAt: true } })
    ]);

    logger.info('[AVSITE-API] 🔄 Sincronização com a gestão consultada', {
      context: { userEmail: req.user?.email, pedagogicas: pedagogicas.length, convencionais: convencionais.length }
    });

    res.json({ success: true, data: { pedagogicas, convencionais } });
  } catch (error) {
    next(error);
  }
});

export default router;
