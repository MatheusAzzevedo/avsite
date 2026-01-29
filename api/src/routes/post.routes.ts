/**
 * Explicação do Arquivo [post.routes.ts]
 * 
 * Rotas CRUD para gerenciamento de posts do blog.
 * Todas as rotas requerem autenticação.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import { 
  createPostSchema, 
  updatePostSchema, 
  filterPostSchema,
  FilterPostInput
} from '../schemas/post.schema';
import { slugify, generateUniqueSlug } from '../utils/slug';
import { logger } from '../utils/logger';

const router = Router();

// Aplica autenticação em todas as rotas
router.use(authMiddleware);

/**
 * GET /api/posts
 * Lista todos os posts com filtros e paginação
 */
router.get('/',
  validateQuery(filterPostSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { categoria, status, search, page, limit } = req.query as unknown as FilterPostInput;

      const skip = (page - 1) * limit;

      // Monta filtros
      const where: Record<string, unknown> = {};

      if (categoria) {
        where.categoria = categoria;
      }

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { titulo: { contains: search, mode: 'insensitive' } },
          { resumo: { contains: search, mode: 'insensitive' } },
          { conteudo: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Busca posts e total
      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where,
          orderBy: { data: 'desc' },
          skip,
          take: limit
        }),
        prisma.post.count({ where })
      ]);

      logger.info(`[Posts] Listagem: ${posts.length} de ${total}`);

      res.json({
        success: true,
        data: posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/posts/:id
 * Retorna um post por ID
 */
router.get('/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const post = await prisma.post.findUnique({
        where: { id }
      });

      if (!post) {
        throw ApiError.notFound('Post não encontrado');
      }

      res.json({
        success: true,
        data: post
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/posts
 * Cria novo post
 */
router.post('/',
  validateBody(createPostSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;

      logger.info(`[Posts] Criando: ${data.titulo}`);

      // Gera slug único
      const baseSlug = slugify(data.titulo);
      const existingSlugs = (await prisma.post.findMany({
        where: { slug: { startsWith: baseSlug } },
        select: { slug: true }
      })).map(p => p.slug);
      
      const slug = generateUniqueSlug(baseSlug, existingSlugs);

      // Cria post
      const post = await prisma.post.create({
        data: {
          ...data,
          slug,
          authorId: req.user!.id
        }
      });

      // Registra atividade
      await prisma.activityLog.create({
        data: {
          action: 'create',
          entity: 'post',
          entityId: post.id,
          description: `Post criado: ${post.titulo}`,
          userId: req.user!.id,
          userEmail: req.user!.email
        }
      });

      logger.info(`[Posts] Criado com sucesso: ${post.id}`);

      res.status(201).json({
        success: true,
        message: 'Post criado com sucesso',
        data: post
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/posts/:id
 * Atualiza um post
 */
router.put('/:id',
  validateBody(updatePostSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = req.body;

      logger.info(`[Posts] Atualizando: ${id}`);

      // Verifica se post existe
      const existing = await prisma.post.findUnique({
        where: { id }
      });

      if (!existing) {
        throw ApiError.notFound('Post não encontrado');
      }

      // Se título mudou, gera novo slug
      let slug = existing.slug;
      if (data.titulo && data.titulo !== existing.titulo) {
        const baseSlug = slugify(data.titulo);
        const existingSlugs = (await prisma.post.findMany({
          where: { 
            slug: { startsWith: baseSlug },
            id: { not: id }
          },
          select: { slug: true }
        })).map(p => p.slug);
        
        slug = generateUniqueSlug(baseSlug, existingSlugs);
      }

      // Atualiza post
      const post = await prisma.post.update({
        where: { id },
        data: {
          ...data,
          slug
        }
      });

      // Registra atividade
      await prisma.activityLog.create({
        data: {
          action: 'update',
          entity: 'post',
          entityId: post.id,
          description: `Post atualizado: ${post.titulo}`,
          userId: req.user!.id,
          userEmail: req.user!.email
        }
      });

      logger.info(`[Posts] Atualizado com sucesso: ${id}`);

      res.json({
        success: true,
        message: 'Post atualizado com sucesso',
        data: post
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/posts/:id
 * Exclui um post
 */
router.delete('/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      logger.info(`[Posts] Excluindo: ${id}`);

      // Verifica se post existe
      const existing = await prisma.post.findUnique({
        where: { id }
      });

      if (!existing) {
        throw ApiError.notFound('Post não encontrado');
      }

      // Exclui post
      await prisma.post.delete({
        where: { id }
      });

      // Registra atividade
      await prisma.activityLog.create({
        data: {
          action: 'delete',
          entity: 'post',
          entityId: id,
          description: `Post excluído: ${existing.titulo}`,
          userId: req.user!.id,
          userEmail: req.user!.email
        }
      });

      logger.info(`[Posts] Excluído com sucesso: ${id}`);

      res.json({
        success: true,
        message: 'Post excluído com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/posts/:id/status
 * Altera o status de um post
 */
router.patch('/:id/status',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['PUBLICADO', 'RASCUNHO'].includes(status)) {
        throw ApiError.badRequest('Status inválido. Use PUBLICADO ou RASCUNHO');
      }

      const post = await prisma.post.update({
        where: { id },
        data: { status }
      });

      // Registra atividade
      await prisma.activityLog.create({
        data: {
          action: 'update',
          entity: 'post',
          entityId: id,
          description: `Status alterado para ${status}: ${post.titulo}`,
          userId: req.user!.id,
          userEmail: req.user!.email
        }
      });

      res.json({
        success: true,
        message: `Post ${status === 'PUBLICADO' ? 'publicado' : 'despublicado'} com sucesso`,
        data: post
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
