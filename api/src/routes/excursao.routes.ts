/**
 * Explicação do Arquivo [excursao.routes.ts]
 * 
 * Rotas CRUD para gerenciamento de excursões.
 * Todas as rotas requerem autenticação.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import { 
  createExcursaoSchema, 
  updateExcursaoSchema, 
  filterExcursaoSchema 
} from '../schemas/excursao.schema';
import { slugify, generateUniqueSlug } from '../utils/slug';
import { logger } from '../utils/logger';

const router = Router();

// Aplica autenticação em todas as rotas
router.use(authMiddleware);

/**
 * GET /api/excursoes
 * Lista todas as excursões com filtros e paginação
 */
router.get('/',
  validateQuery(filterExcursaoSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { categoria, status, search, page, limit } = req.query as {
        categoria?: string;
        status?: 'ATIVO' | 'INATIVO';
        search?: string;
        page: number;
        limit: number;
      };

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
          { subtitulo: { contains: search, mode: 'insensitive' } },
          { descricao: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Busca excursões e total
      const [excursoes, total] = await Promise.all([
        prisma.excursao.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            galeria: {
              orderBy: { ordem: 'asc' }
            }
          }
        }),
        prisma.excursao.count({ where })
      ]);

      logger.info(`[Excursões] Listagem: ${excursoes.length} de ${total}`);

      res.json({
        success: true,
        data: excursoes,
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
 * GET /api/excursoes/:id
 * Retorna uma excursão por ID
 */
router.get('/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const excursao = await prisma.excursao.findUnique({
        where: { id },
        include: {
          galeria: {
            orderBy: { ordem: 'asc' }
          }
        }
      });

      if (!excursao) {
        throw ApiError.notFound('Excursão não encontrada');
      }

      res.json({
        success: true,
        data: excursao
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/excursoes
 * Cria nova excursão
 */
router.post('/',
  validateBody(createExcursaoSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;

      logger.info(`[Excursões] Criando: ${data.titulo}`);

      // Gera slug único
      const baseSlug = slugify(data.titulo);
      const existingSlugs = (await prisma.excursao.findMany({
        where: { slug: { startsWith: baseSlug } },
        select: { slug: true }
      })).map(e => e.slug);
      
      const slug = generateUniqueSlug(baseSlug, existingSlugs);

      // Extrai galeria para criar separadamente
      const { galeria, ...excursaoData } = data;

      // Cria excursão
      const excursao = await prisma.excursao.create({
        data: {
          ...excursaoData,
          slug,
          authorId: req.user!.id,
          galeria: galeria?.length ? {
            create: galeria.map((url: string, index: number) => ({
              url,
              ordem: index
            }))
          } : undefined
        },
        include: {
          galeria: {
            orderBy: { ordem: 'asc' }
          }
        }
      });

      // Registra atividade
      await prisma.activityLog.create({
        data: {
          action: 'create',
          entity: 'excursao',
          entityId: excursao.id,
          description: `Excursão criada: ${excursao.titulo}`,
          userId: req.user!.id,
          userEmail: req.user!.email
        }
      });

      logger.info(`[Excursões] Criada com sucesso: ${excursao.id}`);

      res.status(201).json({
        success: true,
        message: 'Excursão criada com sucesso',
        data: excursao
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/excursoes/:id
 * Atualiza uma excursão
 */
router.put('/:id',
  validateBody(updateExcursaoSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = req.body;

      logger.info(`[Excursões] Atualizando: ${id}`);

      // Verifica se excursão existe
      const existing = await prisma.excursao.findUnique({
        where: { id }
      });

      if (!existing) {
        throw ApiError.notFound('Excursão não encontrada');
      }

      // Se título mudou, gera novo slug
      let slug = existing.slug;
      if (data.titulo && data.titulo !== existing.titulo) {
        const baseSlug = slugify(data.titulo);
        const existingSlugs = (await prisma.excursao.findMany({
          where: { 
            slug: { startsWith: baseSlug },
            id: { not: id }
          },
          select: { slug: true }
        })).map(e => e.slug);
        
        slug = generateUniqueSlug(baseSlug, existingSlugs);
      }

      // Extrai galeria para atualizar separadamente
      const { galeria, ...excursaoData } = data;

      // Atualiza excursão
      const excursao = await prisma.excursao.update({
        where: { id },
        data: {
          ...excursaoData,
          slug
        },
        include: {
          galeria: {
            orderBy: { ordem: 'asc' }
          }
        }
      });

      // Se galeria foi enviada, atualiza
      if (galeria !== undefined) {
        // Remove galeria antiga
        await prisma.excursaoImagem.deleteMany({
          where: { excursaoId: id }
        });

        // Cria nova galeria
        if (galeria.length > 0) {
          await prisma.excursaoImagem.createMany({
            data: galeria.map((url: string, index: number) => ({
              excursaoId: id,
              url,
              ordem: index
            }))
          });
        }
      }

      // Busca excursão atualizada com galeria
      const excursaoAtualizada = await prisma.excursao.findUnique({
        where: { id },
        include: {
          galeria: {
            orderBy: { ordem: 'asc' }
          }
        }
      });

      // Registra atividade
      await prisma.activityLog.create({
        data: {
          action: 'update',
          entity: 'excursao',
          entityId: excursao.id,
          description: `Excursão atualizada: ${excursao.titulo}`,
          userId: req.user!.id,
          userEmail: req.user!.email
        }
      });

      logger.info(`[Excursões] Atualizada com sucesso: ${id}`);

      res.json({
        success: true,
        message: 'Excursão atualizada com sucesso',
        data: excursaoAtualizada
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/excursoes/:id
 * Exclui uma excursão
 */
router.delete('/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      logger.info(`[Excursões] Excluindo: ${id}`);

      // Verifica se excursão existe
      const existing = await prisma.excursao.findUnique({
        where: { id }
      });

      if (!existing) {
        throw ApiError.notFound('Excursão não encontrada');
      }

      // Exclui excursão (galeria é excluída em cascata)
      await prisma.excursao.delete({
        where: { id }
      });

      // Registra atividade
      await prisma.activityLog.create({
        data: {
          action: 'delete',
          entity: 'excursao',
          entityId: id,
          description: `Excursão excluída: ${existing.titulo}`,
          userId: req.user!.id,
          userEmail: req.user!.email
        }
      });

      logger.info(`[Excursões] Excluída com sucesso: ${id}`);

      res.json({
        success: true,
        message: 'Excursão excluída com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/excursoes/:id/status
 * Altera o status de uma excursão
 */
router.patch('/:id/status',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['ATIVO', 'INATIVO'].includes(status)) {
        throw ApiError.badRequest('Status inválido. Use ATIVO ou INATIVO');
      }

      const excursao = await prisma.excursao.update({
        where: { id },
        data: { status }
      });

      // Registra atividade
      await prisma.activityLog.create({
        data: {
          action: 'update',
          entity: 'excursao',
          entityId: id,
          description: `Status alterado para ${status}: ${excursao.titulo}`,
          userId: req.user!.id,
          userEmail: req.user!.email
        }
      });

      res.json({
        success: true,
        message: `Excursão ${status === 'ATIVO' ? 'ativada' : 'desativada'} com sucesso`,
        data: excursao
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
