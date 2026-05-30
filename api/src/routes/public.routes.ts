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
            preco: true,
            categoria: true,
            categorias: {
              select: {
                nome: true,
                slug: true
              }
            },
            imagemCapa: true,
            vagas: true
          }
        }),
        prisma.excursao.count({ where })
      ]);

      // Otimização: Busca ocupação de todas as excursões em uma única consulta (evita N+1)
      const excursionIds = excursoes.map(e => e.id);
      const occupancyData = await prisma.pedido.groupBy({
        by: ['excursaoId'],
        where: {
          excursaoId: { in: excursionIds },
          status: { in: ['PAGO', 'CONFIRMADO', 'PENDENTE', 'AGUARDANDO_PAGAMENTO'] }
        },
        _sum: { quantidade: true }
      });

      const occupancyMap = new Map(
        occupancyData
          .filter(o => o.excursaoId !== null)
          .map(o => [o.excursaoId as string, o._sum.quantidade || 0])
      );

      // Filtra e formata dados para resposta
      const data = excursoes
        .filter(e => {
          if (e.vagas === null) return true;
          const occupied = occupancyMap.get(e.id) || 0;
          return occupied < e.vagas;
        })
        .map(e => ({
          ...e,
          preco: Number(e.preco)
        }));

      logger.info(`[Public API] 🏝️ Excursões Públicas - RETORNANDO`, {
        context: {
          encontradas: data.length,
          total,
          ids: data.map(e => e.id),
          categoria: categoria || 'todas',
          page: parseInt(page as string),
          limit: take
        }
      });

      res.setHeader('Cache-Control', 'public, max-age=60'); // Cache de 1 minuto para performance
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
          categorias: true,
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
          categorias: {
            some: {
              slug: categoria
            }
          },
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
          categorias: {
            select: {
              nome: true,
              slug: true
            }
          },
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
            createdAt: true,
            author: {
              select: {
                name: true
              }
            }
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
            preco: true,
            categoria: true,
            imagemCapa: true,
            vagas: true
          }
        }),
        prisma.excursaoPedagogica.count({ where })
      ]);

      // Otimização: Busca ocupação de todas as excursões em uma única consulta (evita N+1)
      const excursionIds = excursoes.map(e => e.id);
      const occupancyData = await prisma.pedido.groupBy({
        by: ['excursaoPedagogicaId'],
        where: {
          excursaoPedagogicaId: { in: excursionIds },
          status: { in: ['PAGO', 'CONFIRMADO', 'PENDENTE', 'AGUARDANDO_PAGAMENTO'] }
        },
        _sum: { quantidade: true }
      });

      const occupancyMap = new Map(
        occupancyData
          .filter(o => o.excursaoPedagogicaId !== null)
          .map(o => [o.excursaoPedagogicaId as string, o._sum.quantidade || 0])
      );

      // Filtra e formata dados para resposta
      const data = excursoes
        .filter(e => {
          if (e.vagas === null) return true;
          const occupied = occupancyMap.get(e.id) || 0;
          return occupied < e.vagas;
        })
        .map(e => ({
          ...e,
          preco: Number(e.preco)
        }));

      logger.info(`[Public API] 📚 Excursões Pedagógicas Públicas - RETORNANDO`, {
        context: {
          encontradas: data.length,
          total,
          ids: data.map(e => e.id),
          codigos: data.map(e => (e as any).codigo),
          categoria: categoria || 'todas',
          page: parseInt(page as string),
          limit: take
        }
      });

      res.setHeader('Cache-Control', 'public, max-age=60'); // Cache de 1 minuto para performance
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
 * Lista categorias de excursão (nomes controlados pelo admin) para filtro na página Viagens.
 */
router.get('/categorias',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const categorias = await prisma.categoriaExcursao.findMany({
        orderBy: [{ ordem: 'asc' }, { nome: 'asc' }]
      });

      const data = categorias.map(c => ({
        slug: c.slug,
        nome: c.nome
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
// EQUIPE PÚBLICA
// ===========================================

/**
 * GET /api/public/equipe
 * Lista membros da equipe ativos
 */
router.get('/equipe',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const equipe = await prisma.equipe.findMany({
        where: { ativo: true },
        orderBy: { nome: 'asc' },
        select: {
          id: true,
          nome: true,
          funcao: true,
          fotoPerfil: true
        }
      });

      res.json({
        success: true,
        data: equipe
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
