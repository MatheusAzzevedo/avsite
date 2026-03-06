/**
 * Explicação do Arquivo [excursao-pedagogica.routes.ts]
 * 
 * Rotas CRUD para gerenciamento de excursões pedagógicas.
 * Todas as rotas requerem autenticação.
 * Similar às rotas de excursões normais, mas com campo 'codigo' obrigatório e único.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import { 
  createExcursaoPedagogicaSchema, 
  updateExcursaoPedagogicaSchema, 
  filterExcursaoPedagogicaSchema,
  FilterExcursaoPedagogicaInput
} from '../schemas/excursao-pedagogica.schema';
import { slugify, generateUniqueSlug, generateCodigoFromDestino } from '../utils/slug';
import { logger } from '../utils/logger';

const router = Router();

// Aplica autenticação em todas as rotas
router.use(authMiddleware);

/**
 * GET /api/excursoes-pedagogicas
 * Lista todas as excursões pedagógicas com filtros e paginação
 */
router.get('/',
  validateQuery(filterExcursaoPedagogicaSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { codigo, categoria, status, search, page, limit } = req.query as unknown as FilterExcursaoPedagogicaInput;
      const userId = req.user?.id;
      const userEmail = req.user?.email;

      logger.info(`[AVSITE-API] 📚 Excursões Pedagógicas - Listagem INICIADA`, {
        context: { 
          userId, 
          userEmail, 
          codigo: codigo || 'todos',
          categoria: categoria || 'todas', 
          status: status || 'todos', 
          busca: search || 'sem filtro',
          page, 
          limit 
        }
      });

      const skip = (page - 1) * limit;

      // Monta filtros
      const where: Record<string, unknown> = {};

      if (codigo && codigo.trim()) {
        where.codigo = { contains: codigo, mode: 'insensitive' };
      }

      if (categoria && categoria !== 'todos' && categoria.trim()) {
        where.categoria = categoria;
      }

      if (status) {
        where.status = status;
      }

      if (search && search.trim()) {
        where.OR = [
          { titulo: { contains: search, mode: 'insensitive' } },
          { subtitulo: { contains: search, mode: 'insensitive' } },
          { descricao: { contains: search, mode: 'insensitive' } },
          { codigo: { contains: search, mode: 'insensitive' } }
        ];
      }

      logger.info(`[AVSITE-API] 🔍 QUERY PRISMA - WHERE`, {
        context: { where, skip, limit }
      });

      // Busca excursões pedagógicas e total
      const [excursoes, total] = await Promise.all([
        prisma.excursaoPedagogica.findMany({
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
        prisma.excursaoPedagogica.count({ where })
      ]);

      logger.info(`[AVSITE-API] 📊 RESULTADO PRISMA`, {
        context: {
          totalNoBanco: total,
          quantidadeRetornada: excursoes.length,
          primeiros3Ids: excursoes.slice(0, 3).map((e: { id: string; titulo: string; codigo: string }) => 
            `${e.id.substring(0, 8)}... [${e.codigo}] (${e.titulo})`)
        }
      });

      // Serializa para JSON limpo (evita Decimal/Prisma na resposta)
      const data = excursoes.map((e: { preco: unknown; [key: string]: unknown }) => ({
        ...e,
        preco: e.preco != null ? Number(e.preco) : e.preco
      }));

      logger.info(`[AVSITE-API] 🔄 SERIALIZANDO RESPOSTA`, {
        context: {
          dataLength: data.length,
          dataIsArray: Array.isArray(data),
          primeiros2: data.slice(0, 2).map((e) => ({
            id: String((e as Record<string, unknown>).id),
            codigo: String((e as Record<string, unknown>).codigo ?? ''),
            titulo: String((e as Record<string, unknown>).titulo ?? '')
          }))
        }
      });

      const resposta = {
        success: true,
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };

      logger.info(`[AVSITE-API] ✅ Excursões Pedagógicas - Listagem CONCLUÍDA - ENVIANDO RESPOSTA`, {
        context: {
          userId,
          userEmail,
          'resposta.success': resposta.success,
          'resposta.data.length': resposta.data.length,
          'resposta.pagination.total': resposta.pagination.total,
          encontradas: excursoes.length,
          total,
          ids: excursoes.map((e: { id: string }) => e.id.substring(0, 8)),
          page,
          limit,
          filtrosAplicados: JSON.stringify(where),
          timestamp: new Date().toISOString()
        }
      });

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.json(resposta);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/excursoes-pedagogicas/:id
 * Retorna uma excursão pedagógica por ID
 */
router.get('/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const excursao = await prisma.excursaoPedagogica.findUnique({
        where: { id },
        include: {
          galeria: {
            orderBy: { ordem: 'asc' }
          }
        }
      });

      if (!excursao) {
        throw ApiError.notFound('Excursão pedagógica não encontrada');
      }

      res.json({
        success: true,
        data: {
          ...excursao,
          preco: Number(excursao.preco)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/excursoes-pedagogicas
 * Cria nova excursão pedagógica
 */
router.post('/',
  validateBody(createExcursaoPedagogicaSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const userId = req.user?.id;
      const userEmail = req.user?.email;

      // Código: manual (admin) ou gerado a partir de destino + dataDestino (API)
      let codigoFinal: string;
      let destinoFinal: string | null = null;
      let dataDestinoFinal: Date | null = null;

      if (data.codigo != null && String(data.codigo).trim().length > 0) {
        codigoFinal = String(data.codigo).trim();
      } else if (data.destino != null && data.dataDestino != null &&
                 String(data.destino).trim().length > 0 && String(data.dataDestino).trim().length > 0) {
        const destino = String(data.destino).trim();
        const dataDestinoStr = String(data.dataDestino).trim();
        const existingCodigos = (await prisma.excursaoPedagogica.findMany({ select: { codigo: true } })).map(e => e.codigo);
        codigoFinal = generateCodigoFromDestino(destino, dataDestinoStr, existingCodigos);
        destinoFinal = destino;
        dataDestinoFinal = new Date(dataDestinoStr + 'T12:00:00.000Z');
      } else {
        throw ApiError.badRequest('Informe codigo ou destino e dataDestino (formato YYYY-MM-DD)');
      }

      logger.info(`[AVSITE-API] 📚 Excursão Pedagógica - Criação INICIADA`, {
        context: {
          userId,
          userEmail,
          codigo: codigoFinal,
          titulo: data.titulo,
          preco: data.preco,
          categoria: data.categoria,
          status: data.status || 'ATIVO',
          duracao: data.duracao,
          destino: destinoFinal ?? data.codigo ? 'N/A (codigo manual)' : undefined,
          dataDestino: dataDestinoFinal?.toISOString().slice(0, 10),
          timestamp: new Date().toISOString()
        }
      });

      const codigoExists = await prisma.excursaoPedagogica.findUnique({
        where: { codigo: codigoFinal }
      });

      if (codigoExists) {
        logger.warn(`[AVSITE-API] ⚠️ Excursão Pedagógica - Criação FALHOU - Código já existe`, {
          context: { codigo: codigoFinal, userId, userEmail }
        });
        throw ApiError.badRequest(`Código '${codigoFinal}' já está em uso`);
      }

      const baseSlug = slugify(data.titulo);
      const existingSlugs = (await prisma.excursaoPedagogica.findMany({
        where: { slug: { startsWith: baseSlug } },
        select: { slug: true }
      })).map(e => e.slug);

      const slug = generateUniqueSlug(baseSlug, existingSlugs);

      const { galeria, codigo, destino, dataDestino, dataFimInscricoes, ...excursaoData } = data;

      const parseDateStr = (s: unknown): Date | undefined => {
        if (s == null || String(s).trim() === '') return undefined;
        const str = String(s).trim();
        return /^\d{4}-\d{2}-\d{2}$/.test(str) ? new Date(str + 'T12:00:00.000Z') : undefined;
      };
      const dataDestinoValue = dataDestinoFinal ?? parseDateStr(dataDestino);
      const dataFimInscricoesValue = parseDateStr(dataFimInscricoes);

      const excursao = await prisma.excursaoPedagogica.create({
        data: {
          ...excursaoData,
          codigo: codigoFinal,
          destino: destinoFinal ?? undefined,
          dataDestino: dataDestinoValue,
          dataFimInscricoes: dataFimInscricoesValue,
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
          entity: 'excursao_pedagogica',
          entityId: excursao.id,
          description: `Excursão Pedagógica criada: [${excursao.codigo}] ${excursao.titulo}`,
          userId: req.user!.id,
          userEmail: req.user!.email
        }
      });

      logger.info(`[AVSITE-API] ✅ Excursão Pedagógica - Criação CONCLUÍDA`, {
        context: { 
          userId, 
          userEmail, 
          excursaoId: excursao.id,
          codigo: excursao.codigo,
          titulo: excursao.titulo,
          slug: excursao.slug,
          preco: excursao.preco,
          categoria: excursao.categoria,
          status: excursao.status,
          galeriaImagens: excursao.galeria?.length || 0,
          timestamp: new Date().toISOString()
        }
      });

      res.status(201).json({
        success: true,
        message: 'Excursão pedagógica criada com sucesso',
        data: {
          ...excursao,
          preco: Number(excursao.preco)
        }
      });
    } catch (error) {
      logger.error(`[AVSITE-API] ❌ Excursão Pedagógica - Criação FALHOU`, {
        context: { 
          userId: req.user?.id,
          userEmail: req.user?.email,
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      next(error);
    }
  }
);

/**
 * PUT /api/excursoes-pedagogicas/:id
 * Atualiza uma excursão pedagógica
 */
router.put('/:id',
  validateBody(updateExcursaoPedagogicaSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const userId = req.user?.id;
      const userEmail = req.user?.email;

      logger.info(`[AVSITE-API] 📚 Excursão Pedagógica - Atualização INICIADA`, {
        context: { 
          excursaoId: id, 
          userId, 
          userEmail,
          camposAtualizados: Object.keys(data),
          timestamp: new Date().toISOString()
        }
      });

      // Verifica se excursão existe
      const existing = await prisma.excursaoPedagogica.findUnique({
        where: { id }
      });

      if (!existing) {
        logger.warn(`[AVSITE-API] ⚠️ Excursão Pedagógica - Atualização FALHOU - Excursão não encontrada`, {
          context: { excursaoId: id, userId, userEmail }
        });
        throw ApiError.notFound('Excursão pedagógica não encontrada');
      }

      // Se código mudou, verifica se novo código já existe
      if (data.codigo && data.codigo !== existing.codigo) {
        const codigoExists = await prisma.excursaoPedagogica.findUnique({
          where: { codigo: data.codigo }
        });

        if (codigoExists) {
          logger.warn(`[AVSITE-API] ⚠️ Excursão Pedagógica - Atualização FALHOU - Código já existe`, {
            context: { codigo: data.codigo, userId, userEmail }
          });
          throw ApiError.badRequest(`Código '${data.codigo}' já está em uso`);
        }
      }

      // Se título mudou, gera novo slug
      let slug = existing.slug;
      if (data.titulo && data.titulo !== existing.titulo) {
        const baseSlug = slugify(data.titulo);
        const existingSlugs = (await prisma.excursaoPedagogica.findMany({
          where: { 
            slug: { startsWith: baseSlug },
            id: { not: id }
          },
          select: { slug: true }
        })).map(e => e.slug);
        
        slug = generateUniqueSlug(baseSlug, existingSlugs);
      }

      const { galeria, dataDestino, dataFimInscricoes, ...excursaoData } = data;
      const updateData: Record<string, unknown> = { ...excursaoData, slug };
      if (dataDestino != null && String(dataDestino).trim() !== '') {
        const str = String(dataDestino).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
          updateData.dataDestino = new Date(str + 'T12:00:00.000Z');
        }
      }
      if (dataFimInscricoes != null) {
        if (String(dataFimInscricoes).trim() === '') {
          updateData.dataFimInscricoes = null;
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(String(dataFimInscricoes).trim())) {
          updateData.dataFimInscricoes = new Date(String(dataFimInscricoes).trim() + 'T12:00:00.000Z');
        }
      }

      const excursao = await prisma.excursaoPedagogica.update({
        where: { id },
        data: updateData as Parameters<typeof prisma.excursaoPedagogica.update>[0]['data'],
        include: {
          galeria: {
            orderBy: { ordem: 'asc' }
          }
        }
      });

      // Se galeria foi enviada, atualiza
      if (galeria !== undefined) {
        // Remove galeria antiga
        await prisma.excursaoPedagogicaImagem.deleteMany({
          where: { excursaoPedagogicaId: id }
        });

        // Cria nova galeria
        if (galeria.length > 0) {
          await prisma.excursaoPedagogicaImagem.createMany({
            data: galeria.map((url: string, index: number) => ({
              excursaoPedagogicaId: id,
              url,
              ordem: index
            }))
          });
        }
      }

      // Busca excursão atualizada com galeria
      const excursaoAtualizada = await prisma.excursaoPedagogica.findUnique({
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
          entity: 'excursao_pedagogica',
          entityId: excursao.id,
          description: `Excursão Pedagógica atualizada: [${excursao.codigo}] ${excursao.titulo}`,
          userId: req.user!.id,
          userEmail: req.user!.email
        }
      });

      logger.info(`[AVSITE-API] ✅ Excursão Pedagógica - Atualização CONCLUÍDA`, {
        context: { 
          excursaoId: id,
          codigo: excursaoAtualizada?.codigo,
          titulo: excursaoAtualizada?.titulo,
          slug: excursaoAtualizada?.slug,
          status: excursaoAtualizada?.status,
          galeriaImagens: excursaoAtualizada?.galeria?.length || 0,
          userId, 
          userEmail,
          timestamp: new Date().toISOString()
        }
      });

      res.json({
        success: true,
        message: 'Excursão pedagógica atualizada com sucesso',
        data: {
          ...excursaoAtualizada,
          preco: excursaoAtualizada ? Number(excursaoAtualizada.preco) : 0
        }
      });
    } catch (error) {
      logger.error(`[AVSITE-API] ❌ Excursão Pedagógica - Atualização FALHOU`, {
        context: { 
          excursaoId: req.params.id,
          userId: req.user?.id,
          userEmail: req.user?.email,
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      next(error);
    }
  }
);

/**
 * DELETE /api/excursoes-pedagogicas/:id
 * Exclui uma excursão pedagógica
 */
router.delete('/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userEmail = req.user?.email;

      logger.info(`[AVSITE-API] 🗑️ Excursão Pedagógica - Exclusão INICIADA`, {
        context: { 
          excursaoId: id,
          userId,
          userEmail,
          timestamp: new Date().toISOString()
        }
      });

      // Verifica se excursão existe
      const existing = await prisma.excursaoPedagogica.findUnique({
        where: { id },
        include: { galeria: true }
      });

      if (!existing) {
        logger.warn(`[AVSITE-API] ⚠️ Excursão Pedagógica - Exclusão FALHOU - Excursão não encontrada`, {
          context: { excursaoId: id, userId, userEmail }
        });
        throw ApiError.notFound('Excursão pedagógica não encontrada');
      }

      // Desvincula pedidos e salva snapshot para manter histórico do cliente
      const pedidosCount = await prisma.pedido.count({
        where: { excursaoPedagogicaId: id }
      });
      if (pedidosCount > 0) {
        const snapshot = {
          titulo: existing.titulo,
          codigo: existing.codigo,
          documentoUrl: existing.documentoUrl ?? null,
          documentoNome: existing.documentoNome ?? null
        };
        await prisma.pedido.updateMany({
          where: { excursaoPedagogicaId: id },
          data: {
            excursaoPedagogicaId: null,
            excursaoPedagogicaSnapshot: snapshot as object
          }
        });
        logger.info(`[AVSITE-API] 📋 Excursão Pedagógica - Snapshot salvo em ${pedidosCount} pedido(s) para histórico`, {
          context: { excursaoId: id, codigo: existing.codigo, pedidosCount }
        });
      }

      // Exclui excursão (galeria é excluída em cascata)
      await prisma.excursaoPedagogica.delete({
        where: { id }
      });

      // Registra atividade
      await prisma.activityLog.create({
        data: {
          action: 'delete',
          entity: 'excursao_pedagogica',
          entityId: id,
          description: `Excursão Pedagógica excluída: [${existing.codigo}] ${existing.titulo}`,
          userId: req.user!.id,
          userEmail: req.user!.email
        }
      });

      logger.info(`[AVSITE-API] ✅ Excursão Pedagógica - Exclusão CONCLUÍDA`, {
        context: { 
          excursaoId: id,
          codigo: existing.codigo,
          titulo: existing.titulo,
          categoria: existing.categoria,
          imagensExcluidas: existing.galeria?.length || 0,
          userId,
          userEmail,
          timestamp: new Date().toISOString()
        }
      });

      res.json({
        success: true,
        message: 'Excursão pedagógica excluída com sucesso'
      });
    } catch (error) {
      logger.error(`[AVSITE-API] ❌ Excursão Pedagógica - Exclusão FALHOU`, {
        context: { 
          excursaoId: req.params.id,
          userId: req.user?.id,
          userEmail: req.user?.email,
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      next(error);
    }
  }
);

/**
 * PATCH /api/excursoes-pedagogicas/:id/status
 * Altera o status de uma excursão pedagógica
 */
router.patch('/:id/status',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['ATIVO', 'INATIVO'].includes(status)) {
        throw ApiError.badRequest('Status inválido. Use ATIVO ou INATIVO');
      }

      const excursao = await prisma.excursaoPedagogica.update({
        where: { id },
        data: { status }
      });

      // Registra atividade
      await prisma.activityLog.create({
        data: {
          action: 'update',
          entity: 'excursao_pedagogica',
          entityId: id,
          description: `Status alterado para ${status}: [${excursao.codigo}] ${excursao.titulo}`,
          userId: req.user!.id,
          userEmail: req.user!.email
        }
      });

      res.json({
        success: true,
        message: `Excursão pedagógica ${status === 'ATIVO' ? 'ativada' : 'desativada'} com sucesso`,
        data: {
          ...excursao,
          preco: Number(excursao.preco)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
