/**
 * Rotas admin para CRUD de categorias de excursão (Viagens).
 * Nomes controlados pelo admin e refletidos na página Viagens.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

const createSchema = z.object({
  slug: z.string().min(1, 'Slug é obrigatório').regex(/^[a-z0-9áéíóúâêôãõç\-]+$/i, 'Slug: apenas letras, números e hífen'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  ordem: z.number().int().min(0).optional().default(0)
});

const updateSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9áéíóúâêôãõç\-]+$/i).optional(),
  nome: z.string().min(1).optional(),
  ordem: z.number().int().min(0).optional()
});

/**
 * GET /api/admin/categorias-excursao
 * Lista todas as categorias (para admin e para select do editor).
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categorias = await prisma.categoriaExcursao.findMany({
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }]
    });
    return res.json({ success: true, data: categorias });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/categorias-excursao
 * Cria nova categoria.
 */
router.post('/', validateBody(createSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug, nome, ordem } = req.body as z.infer<typeof createSchema>;
    const slugLower = String(slug).trim().toLowerCase();
    const existing = await prisma.categoriaExcursao.findUnique({ where: { slug: slugLower } });
    if (existing) {
      throw ApiError.badRequest('Já existe uma categoria com este slug.');
    }
    const created = await prisma.categoriaExcursao.create({
      data: { slug: slugLower, nome: String(nome).trim(), ordem: ordem ?? 0 }
    });
    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/categorias-excursao/:id
 * Atualiza categoria.
 */
router.put('/:id', validateBody(updateSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const body = req.body as z.infer<typeof updateSchema>;
    const existing = await prisma.categoriaExcursao.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Categoria não encontrada.');
    }
    const slugLower = body.slug != null ? String(body.slug).trim().toLowerCase() : undefined;
    if (slugLower && slugLower !== existing.slug) {
      const conflict = await prisma.categoriaExcursao.findUnique({ where: { slug: slugLower } });
      if (conflict) throw ApiError.badRequest('Já existe uma categoria com este slug.');
    }
    const updated = await prisma.categoriaExcursao.update({
      where: { id },
      data: {
        ...(body.nome != null && { nome: String(body.nome).trim() }),
        ...(slugLower != null && { slug: slugLower }),
        ...(body.ordem != null && { ordem: body.ordem })
      }
    });
    return res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/categorias-excursao/:id
 * Remove categoria. Não remove se houver excursões usando (opcional: bloquear ou migrar).
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const cat = await prisma.categoriaExcursao.findUnique({ where: { id } });
    if (!cat) {
      throw ApiError.notFound('Categoria não encontrada.');
    }
    const count = await prisma.excursao.count({ where: { categoria: cat.slug } });
    if (count > 0) {
      throw ApiError.badRequest(`Não é possível excluir: existem ${count} excursão(ões) com esta categoria. Altere-as antes.`);
    }
    await prisma.categoriaExcursao.delete({ where: { id } });
    return res.json({ success: true, message: 'Categoria excluída.' });
  } catch (error) {
    next(error);
  }
});

export default router;
