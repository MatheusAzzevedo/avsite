/**
 * Explicação do Arquivo [equipe.routes.ts]
 * 
 * Rotas CRUD para gerenciamento de membros da equipe.
 * Todas as rotas requerem autenticação.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { createEquipeSchema, updateEquipeSchema } from '../schemas/equipe.schema';
import { logger } from '../utils/logger';

const router = Router();

// Aplica autenticação em todas as rotas
router.use(authMiddleware);

/**
 * GET /api/admin/equipe
 * Lista todos os membros da equipe (admin)
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const equipe = await prisma.equipe.findMany({
      orderBy: { nome: 'asc' }
    });

    res.json({
      success: true,
      data: equipe
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/equipe
 * Cria novo membro da equipe
 */
router.post('/', validateBody(createEquipeSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    logger.info(`[AVSITE-API] 👥 Equipe - Criação INICIADA`, {
      context: { userId, userEmail, nome: data.nome, funcao: data.funcao }
    });

    const membro = await prisma.equipe.create({
      data
    });

    // Registra atividade
    await prisma.activityLog.create({
      data: {
        action: 'create',
        entity: 'equipe',
        entityId: membro.id,
        description: `Membro da equipe criado: ${membro.nome}`,
        userId: req.user!.id,
        userEmail: req.user!.email
      }
    });

    logger.info(`[AVSITE-API] ✅ Equipe - Criação CONCLUÍDA`, {
      context: { userId, userEmail, membroId: membro.id, nome: membro.nome }
    });

    res.status(201).json({
      success: true,
      message: 'Membro da equipe criado com sucesso',
      data: membro
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/equipe/:id
 * Atualiza um membro da equipe
 */
router.put('/:id', validateBody(updateEquipeSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    const existing = await prisma.equipe.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Membro da equipe não encontrado');
    }

    const membro = await prisma.equipe.update({
      where: { id },
      data
    });

    // Registra atividade
    await prisma.activityLog.create({
      data: {
        action: 'update',
        entity: 'equipe',
        entityId: id,
        description: `Membro da equipe atualizado: ${membro.nome}`,
        userId: req.user!.id,
        userEmail: req.user!.email
      }
    });

    res.json({
      success: true,
      message: 'Membro da equipe atualizado com sucesso',
      data: membro
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/equipe/:id
 * Exclui um membro da equipe
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    const existing = await prisma.equipe.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Membro da equipe não encontrado');
    }

    await prisma.equipe.delete({ where: { id } });

    // Registra atividade
    await prisma.activityLog.create({
      data: {
        action: 'delete',
        entity: 'equipe',
        entityId: id,
        description: `Membro da equipe excluído: ${existing.nome}`,
        userId: req.user!.id,
        userEmail: req.user!.email
      }
    });

    res.json({
      success: true,
      message: 'Membro da equipe excluído com sucesso'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
