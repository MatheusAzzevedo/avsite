/**
 * Explicação do Arquivo [public.routes.ts]
 * 
 * Rotas públicas da API - não requerem autenticação.
 * Disponibiliza dados para:
 * - Site público (frontend)
 * - Integrações externas
 * 
 * Esta é a API que outros sistemas devem usar para
 * receber dados de excursões, posts, etc.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ExcursaoStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

// ===========================================
// EXCURSÕES PÚBLICAS
// ===========================================

/**
 * GET /api/public/excursoes
 * Lista excursões ativas para o site e integrações
 * 
 * Query params:
 * - categoria: filtrar por categoria
 * - limit: quantidade de resultados (default: 20, max: 100)
 * - page: página para paginação
 */
router.get('/excursoes',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('[Public API] 🏝️ GET /excursoes - requisição recebida (site público)', {
        context: { query: req.query }
      });

      const { categoria, limit = '20', page = '1' } = req.query;
      const take = Math.min(parseInt(limit as string) || 20, 100);
      const skip = (parseInt(page as string) - 1) * take;

      const where: { status: ExcursaoStatus; categoria?: string } = {
        status: ExcursaoStatus.ATIVO
      };

      if (categoria && String(categoria).trim()) {
        where.categoria = String(categoria).trim();
      }

      const [excursoes, total] = await Promise.all([
        prisma.excursao.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          select: {
            id: true,
            titulo: true,
            slug: true,
            subtitulo: true,
            preco: true,
            duracao: true,
            categoria: true,
            imagemCapa: true,
            imagemPrincipal: true,
            local: true,
            horario: true,
            tags: true,
            createdAt: true,
            galeria: {
              select: { url: true, ordem: true },
              orderBy: { ordem: 'asc' }
            }
          }
        }),
        prisma.excursao.count({ where })
      ]);

      // Formata dados para resposta
      const data = excursoes.map(e => ({
        ...e,
        preco: Number(e.preco),
        galeria: e.galeria.map(g => g.url)
      }));

      logger.info(`[Public API] 🏝️ Excursões Públicas - RETORNANDO`, {
        context: {
          encontradas: data.length,
          total,
          ids: excursoes.map(e => e.id),
          categoria: categoria || 'todas',
          page: parseInt(page as string),
          limit: take
        }
      });

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.json({
        success: true,
        data,
        pagination: {
          page: parseInt(page as string),
          limit: take,
          total,
          totalPages: Math.ceil(total / take)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/public/excursoes/:slug
 * Retorna detalhes de uma excursão pelo slug
 */
router.get('/excursoes/:slug',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;

      const excursao = await prisma.excursao.findFirst({
        where: {
          slug,
          status: ExcursaoStatus.ATIVO
        },
        include: {
          galeria: {
            orderBy: { ordem: 'asc' }
          }
        }
      });

      if (!excursao) {
        return res.status(404).json({
          success: false,
          error: 'Excursão não encontrada'
        });
      }

      // Formata dados
      const data = {
        ...excursao,
        preco: Number(excursao.preco),
        galeria: excursao.galeria.map(g => g.url)
      };

      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/public/excursoes/categoria/:categoria
 * Lista excursões por categoria
 */
router.get('/excursoes/categoria/:categoria',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { categoria } = req.params;

      const excursoes = await prisma.excursao.findMany({
        where: {
          categoria,
          status: ExcursaoStatus.ATIVO
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          titulo: true,
          slug: true,
          subtitulo: true,
          preco: true,
          duracao: true,
          categoria: true,
          imagemCapa: true,
          tags: true
        }
      });

      const data = excursoes.map(e => ({
        ...e,
        preco: Number(e.preco)
      }));

      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// POSTS/BLOG PÚBLICOS
// ===========================================

/**
 * GET /api/public/posts
 * Lista posts publicados para o site
 */
router.get('/posts',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { categoria, limit = '20', page = '1' } = req.query;
      const take = Math.min(parseInt(limit as string) || 20, 100);
      const skip = (parseInt(page as string) - 1) * take;

      const where: Record<string, unknown> = {
        status: 'PUBLICADO'
      };

      if (categoria) {
        where.categoria = categoria;
      }

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where,
          orderBy: { data: 'desc' },
          skip,
          take,
          select: {
            id: true,
            titulo: true,
            slug: true,
            autor: true,
            data: true,
            categoria: true,
            imagemCapa: true,
            resumo: true,
            tags: true,
            createdAt: true
          }
        }),
        prisma.post.count({ where })
      ]);

      logger.info(`[Public API] Posts: ${posts.length} de ${total}`);

      res.json({
        success: true,
        data: posts,
        pagination: {
          page: parseInt(page as string),
          limit: take,
          total,
          totalPages: Math.ceil(total / take)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/public/posts/:slug
 * Retorna detalhes de um post pelo slug
 */
router.get('/posts/:slug',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;

      const post = await prisma.post.findFirst({
        where: { 
          slug,
          status: 'PUBLICADO'
        }
      });

      if (!post) {
        return res.status(404).json({
          success: false,
          error: 'Post não encontrado'
        });
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
 * GET /api/public/posts/recent
 * Retorna posts mais recentes
 */
router.get('/posts/recent/:limit',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Math.min(parseInt(req.params.limit) || 5, 20);

      const posts = await prisma.post.findMany({
        where: { status: 'PUBLICADO' },
        orderBy: { data: 'desc' },
        take: limit,
        select: {
          id: true,
          titulo: true,
          slug: true,
          autor: true,
          data: true,
          categoria: true,
          imagemCapa: true,
          resumo: true
        }
      });

      res.json({
        success: true,
        data: posts
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// ESTATÍSTICAS PÚBLICAS
// ===========================================

/**
 * GET /api/public/stats
 * Retorna estatísticas públicas do site
 */
router.get('/stats',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const [
        totalExcursoes,
        totalPosts,
        categorias
      ] = await Promise.all([
        prisma.excursao.count({ where: { status: 'ATIVO' } }),
        prisma.post.count({ where: { status: 'PUBLICADO' } }),
        prisma.excursao.groupBy({
          by: ['categoria'],
          where: { status: 'ATIVO' },
          _count: true
        })
      ]);

      res.json({
        success: true,
        data: {
          excursoes: totalExcursoes,
          posts: totalPosts,
          categorias: categorias.map(c => ({
            nome: c.categoria,
            quantidade: c._count
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// EXCURSÕES PEDAGÓGICAS PÚBLICAS
// ===========================================

/**
 * GET /api/public/excursoes-pedagogicas
 * Lista excursões pedagógicas ativas para o site e integrações
 * 
 * Query params:
 * - categoria: filtrar por categoria
 * - codigo: filtrar por código
 * - limit: quantidade de resultados (default: 20, max: 100)
 * - page: página para paginação
 */
router.get('/excursoes-pedagogicas',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('[Public API] 📚 GET /excursoes-pedagogicas - requisição recebida (site público)', {
        context: { query: req.query }
      });

      const { categoria, codigo, limit = '20', page = '1' } = req.query;
      const take = Math.min(parseInt(limit as string) || 20, 100);
      const skip = (parseInt(page as string) - 1) * take;

      const where: Prisma.ExcursaoPedagogicaWhereInput = {
        status: ExcursaoStatus.ATIVO
      };

      if (categoria && String(categoria).trim()) {
        where.categoria = String(categoria).trim();
      }

      if (codigo && String(codigo).trim()) {
        where.codigo = { contains: String(codigo).trim(), mode: 'insensitive' };
      }

      const [excursoes, total] = await Promise.all([
        prisma.excursaoPedagogica.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          select: {
            id: true,
            codigo: true,
            titulo: true,
            slug: true,
            subtitulo: true,
            preco: true,
            duracao: true,
            categoria: true,
            imagemCapa: true,
            imagemPrincipal: true,
            local: true,
            horario: true,
            tags: true,
            createdAt: true,
            galeria: {
              select: { url: true, ordem: true },
              orderBy: { ordem: 'asc' }
            }
          }
        }),
        prisma.excursaoPedagogica.count({ where })
      ]);

      // Formata dados para resposta
      const data = excursoes.map((e: { galeria: { url: string }[]; preco: { toNumber?: () => number } | number }) => ({
        ...e,
        preco: Number(e.preco),
        galeria: e.galeria.map((g: { url: string }) => g.url)
      }));

      logger.info(`[Public API] 📚 Excursões Pedagógicas Públicas - RETORNANDO`, {
        context: {
          encontradas: data.length,
          total,
          ids: excursoes.map(e => e.id),
          codigos: excursoes.map(e => e.codigo),
          categoria: categoria || 'todas',
          page: parseInt(page as string),
          limit: take
        }
      });

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.json({
        success: true,
        data,
        pagination: {
          page: parseInt(page as string),
          limit: take,
          total,
          totalPages: Math.ceil(total / take)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/public/excursoes-pedagogicas/:slug
 * Retorna detalhes de uma excursão pedagógica pelo slug
 */
router.get('/excursoes-pedagogicas/:slug',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;

      const excursao = await prisma.excursaoPedagogica.findFirst({
        where: {
          slug,
          status: ExcursaoStatus.ATIVO
        },
        include: {
          galeria: {
            orderBy: { ordem: 'asc' }
          }
        }
      });

      if (!excursao) {
        return res.status(404).json({
          success: false,
          error: 'Excursão pedagógica não encontrada'
        });
      }

      // Formata dados
      const data = {
        ...excursao,
        preco: Number(excursao.preco),
        galeria: excursao.galeria.map(g => g.url)
      };

      logger.info('[Public API] 📚 Excursão Pedagógica por slug - RETORNANDO', {
        context: { slug, id: excursao.id, codigo: excursao.codigo, titulo: excursao.titulo }
      });

      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/public/excursoes-pedagogicas/codigo/:codigo
 * Retorna detalhes de uma excursão pedagógica pelo código
 */
router.get('/excursoes-pedagogicas/codigo/:codigo',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { codigo } = req.params;

      const excursao = await prisma.excursaoPedagogica.findFirst({
        where: {
          codigo,
          status: ExcursaoStatus.ATIVO
        },
        include: {
          galeria: {
            orderBy: { ordem: 'asc' }
          }
        }
      });

      if (!excursao) {
        return res.status(404).json({
          success: false,
          error: 'Excursão pedagógica não encontrada'
        });
      }

      // Formata dados
      const data = {
        ...excursao,
        preco: Number(excursao.preco),
        galeria: excursao.galeria.map(g => g.url)
      };

      logger.info('[Public API] 📚 Excursão Pedagógica por código - RETORNANDO', {
        context: { codigo, id: excursao.id, titulo: excursao.titulo }
      });

      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// CATEGORIAS
// ===========================================

/**
 * GET /api/public/categorias
 * Lista categorias disponíveis
 */
router.get('/categorias',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const categorias = await prisma.excursao.groupBy({
        by: ['categoria'],
        where: { status: 'ATIVO' },
        _count: true
      });

      const data = categorias.map(c => ({
        nome: c.categoria,
        slug: c.categoria.toLowerCase(),
        quantidade: c._count
      }));

      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
