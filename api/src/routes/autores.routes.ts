import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { createAutorSchema, updateAutorSchema } from '../schemas/autor.schema';
import { logger } from '../utils/logger';
import { removerSeOrfas, urlsQueSairam } from '../utils/limpeza-r2';

const router = Router();

// Aplica autenticação em todas as rotas
router.use(authMiddleware);

/**
 * GET /api/admin/autores
 * Lista todos os autores (admin)
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const autores = await prisma.autor.findMany({
      orderBy: { nome: 'asc' }
    });

    res.json({
      success: true,
      data: autores
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/autores
 * Cria novo autor
 */
router.post('/', validateBody(createAutorSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    logger.info(`[AVSITE-API] 📝 Autor - Criação INICIADA`, {
      context: { userId, userEmail, nome: data.nome }
    });

    const autor = await prisma.autor.create({
      data
    });

    // Registra atividade
    await prisma.activityLog.create({
      data: {
        action: 'create',
        entity: 'autor',
        entityId: autor.id,
        description: `Autor criado: ${autor.nome}`,
        userId: req.user!.id,
        userEmail: req.user!.email
      }
    });

    logger.info(`[AVSITE-API] ✅ Autor - Criação CONCLUÍDA`, {
      context: { userId, userEmail, autorId: autor.id, nome: autor.nome }
    });

    res.status(201).json({
      success: true,
      message: 'Autor criado com sucesso',
      data: autor
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/autores/:id
 * Atualiza um autor
 */
router.put('/:id', validateBody(updateAutorSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const existing = await prisma.autor.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Autor não encontrado');
    }

    const autor = await prisma.autor.update({
      where: { id },
      data
    });

    // Se a foto foi trocada, a anterior deixa de ser usada neste registro.
    await removerSeOrfas(urlsQueSairam([existing.foto], [autor.foto]), `autor:${id}`);

    // Registra atividade
    await prisma.activityLog.create({
      data: {
        action: 'update',
        entity: 'autor',
        entityId: id,
        description: `Autor atualizado: ${autor.nome}`,
        userId: req.user!.id,
        userEmail: req.user!.email
      }
    });

    res.json({
      success: true,
      message: 'Autor atualizado com sucesso',
      data: autor
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/autores/:id
 * Exclui um autor
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const existing = await prisma.autor.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Autor não encontrado');
    }

    await prisma.autor.delete({ where: { id } });

    await removerSeOrfas([existing.foto], `autor:${id}`);

    // Registra atividade
    await prisma.activityLog.create({
      data: {
        action: 'delete',
        entity: 'autor',
        entityId: id,
        description: `Autor excluído: ${existing.nome}`,
        userId: req.user!.id,
        userEmail: req.user!.email
      }
    });

    res.json({
      success: true,
      message: 'Autor excluído com sucesso'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
