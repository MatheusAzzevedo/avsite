/**
 * Explicação do Arquivo [pedido.routes.ts]
 * 
 * Rotas de pedidos de excursões pedagógicas.
 * Permite clientes buscar excursões por código e criar pedidos.
 * 
 * Rotas disponíveis:
 * - GET /api/cliente/pedidos/excursao/:codigo - Buscar excursão por código (público)
 * - POST /api/cliente/pedidos - Criar novo pedido (requer autenticação)
 * - GET /api/cliente/pedidos - Listar pedidos do cliente (requer autenticação)
 * - GET /api/cliente/pedidos/:id - Detalhes de um pedido (requer autenticação)
 * - PATCH /api/cliente/pedidos/:id/status - Atualizar status (admin)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { clienteAuthMiddleware } from '../middleware/cliente-auth.middleware';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { 
  createPedidoSchema,
  updatePedidoStatusSchema,
  filterPedidosSchema
} from '../schemas/pedido.schema';
import { logger } from '../utils/logger';
import { ExcursaoStatus } from '@prisma/client';

const router = Router();

/**
 * Explicação da API [GET /api/cliente/pedidos/excursao/:codigo]
 * 
 * Busca excursão pedagógica por código.
 * Rota pública - não requer autenticação.
 * Cliente pode visualizar excursão antes de fazer login.
 * 
 * Params: { codigo: string }
 * Response: { success, data: { excursão com detalhes } }
 */
router.get('/excursao/:codigo',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { codigo } = req.params;

      logger.info('[Pedidos] Buscando excursão por código', {
        context: { codigo, ip: req.ip }
      });

      // Busca excursão ativa por código
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
        logger.warn('[Pedidos] Excursão não encontrada', {
          context: { codigo }
        });
        throw ApiError.notFound('Excursão não encontrada ou inativa');
      }

      // Formata dados
      const data = {
        ...excursao,
        preco: Number(excursao.preco),
        galeria: excursao.galeria.map(g => g.url)
      };

      logger.info('[Pedidos] Excursão encontrada', {
        context: { codigo, excursaoId: excursao.id, titulo: excursao.titulo }
      });

      res.json({
        success: true,
        data
      });
    } catch (error) {
      logger.error('[Pedidos] Erro ao buscar excursão por código', {
        context: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          codigo: req.params.codigo
        }
      });
      next(error);
    }
  }
);

/**
 * Explicação da API [POST /api/cliente/pedidos]
 * 
 * Cria um novo pedido de excursão pedagógica.
 * Requer autenticação de cliente.
 * 
 * Fluxo:
 * 1. Valida dados de entrada (código, quantidade, dados dos alunos)
 * 2. Verifica se excursão existe e está ativa
 * 3. Calcula valor total (preço × quantidade)
 * 4. Cria pedido com status PENDENTE
 * 5. Cria itens do pedido (um para cada aluno)
 * 6. Registra log de atividade
 * 7. Retorna dados do pedido criado
 * 
 * Body: { codigoExcursao, quantidade, dadosAlunos: [...], observacoes? }
 * Response: { success, message, data: { pedido completo } }
 */
router.post('/',
  clienteAuthMiddleware,
  validateBody(createPedidoSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { codigoExcursao, quantidade, dadosAlunos, observacoes } = req.body;
      const clienteId = req.cliente!.id;
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

      logger.info('[Pedidos] Criando novo pedido', {
        context: { 
          clienteId, 
          codigoExcursao, 
          quantidade,
          qtdDadosAlunos: dadosAlunos.length,
          ip: clientIp 
        }
      });

      // Busca excursão pelo código
      const excursao = await prisma.excursaoPedagogica.findFirst({
        where: {
          codigo: codigoExcursao,
          status: ExcursaoStatus.ATIVO
        }
      });

      if (!excursao) {
        logger.warn('[Pedidos] Excursão não encontrada ao criar pedido', {
          context: { codigoExcursao, clienteId }
        });
        throw ApiError.notFound('Excursão não encontrada ou inativa');
      }

      logger.info('[Pedidos] Excursão encontrada', {
        context: { 
          excursaoId: excursao.id, 
          titulo: excursao.titulo,
          preco: Number(excursao.preco)
        }
      });

      // Calcula valor total
      const valorUnitario = excursao.preco;
      const valorTotal = Number(valorUnitario) * quantidade;

      logger.info('[Pedidos] Calculando valores', {
        context: { 
          valorUnitario: Number(valorUnitario),
          quantidade,
          valorTotal
        }
      });

      // Cria pedido com itens em uma transação
      const pedido = await prisma.$transaction(async (tx) => {
        // Cria pedido
        const novoPedido = await tx.pedido.create({
          data: {
            clienteId,
            excursaoPedagogicaId: excursao.id,
            quantidade,
            valorUnitario,
            valorTotal,
            status: 'PENDENTE',
            observacoes: observacoes || null
          }
        });

        logger.info('[Pedidos] Pedido criado', {
          context: { pedidoId: novoPedido.id }
        });

        // Cria itens do pedido (dados dos alunos)
        const itensData = dadosAlunos.map((aluno: any) => ({
          pedidoId: novoPedido.id,
          nomeAluno: aluno.nomeAluno,
          idadeAluno: aluno.idadeAluno || null,
          escolaAluno: aluno.escolaAluno || null,
          serieAluno: aluno.serieAluno || null,
          cpfAluno: aluno.cpfAluno || null,
          responsavel: aluno.responsavel || null,
          telefoneResponsavel: aluno.telefoneResponsavel || null,
          emailResponsavel: aluno.emailResponsavel || null,
          observacoes: aluno.observacoes || null
        }));

        await tx.itemPedido.createMany({
          data: itensData
        });

        logger.info('[Pedidos] Itens do pedido criados', {
          context: { pedidoId: novoPedido.id, qtdItens: itensData.length }
        });

        // Busca pedido completo com relacionamentos
        return await tx.pedido.findUnique({
          where: { id: novoPedido.id },
          include: {
            excursaoPedagogica: {
              select: {
                id: true,
                codigo: true,
                titulo: true,
                subtitulo: true,
                imagemCapa: true,
                local: true,
                horario: true,
                duracao: true
              }
            },
            itens: true
          }
        });
      });

      // Registra atividade
      await prisma.activityLog.create({
        data: {
          action: 'create',
          entity: 'pedido',
          entityId: pedido!.id,
          description: `Pedido criado: ${quantidade}x ${excursao.titulo}`,
          userEmail: req.cliente!.email,
          ip: clientIp
        }
      });

      logger.info('[Pedidos] Pedido criado com sucesso', {
        context: {
          pedidoId: pedido!.id,
          clienteId,
          excursaoId: excursao.id,
          quantidade,
          valorTotal,
          ip: clientIp
        }
      });

      // Formata resposta
      const data = {
        ...pedido,
        valorUnitario: Number(pedido!.valorUnitario),
        valorTotal: Number(pedido!.valorTotal)
      };

      res.status(201).json({
        success: true,
        message: 'Pedido criado com sucesso',
        data
      });
    } catch (error) {
      logger.error('[Pedidos] Erro ao criar pedido', {
        context: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          clienteId: req.cliente?.id,
          codigoExcursao: req.body?.codigoExcursao
        }
      });
      next(error);
    }
  }
);

/**
 * Explicação da API [GET /api/cliente/pedidos]
 * 
 * Lista todos os pedidos do cliente autenticado.
 * Requer autenticação de cliente.
 * 
 * Query params:
 * - status (opcional): filtrar por status
 * - limit (opcional): quantidade de resultados (default: 20, max: 100)
 * - page (opcional): página para paginação (default: 1)
 * 
 * Response: { success, data: [...], pagination: {...} }
 */
router.get('/',
  clienteAuthMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clienteId = req.cliente!.id;
      const { status, limit = '20', page = '1' } = req.query;
      const take = Math.min(parseInt(limit as string) || 20, 100);
      const skip = (parseInt(page as string) - 1) * take;

      logger.info('[Pedidos] Listando pedidos do cliente', {
        context: { clienteId, status, limit: take, page: parseInt(page as string) }
      });

      const where: any = { clienteId };

      if (status && typeof status === 'string') {
        where.status = status;
      }

      const [pedidos, total] = await Promise.all([
        prisma.pedido.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          include: {
            excursaoPedagogica: {
              select: {
                id: true,
                codigo: true,
                titulo: true,
                subtitulo: true,
                imagemCapa: true,
                local: true,
                horario: true
              }
            },
            itens: {
              select: {
                id: true,
                nomeAluno: true,
                idadeAluno: true,
                escolaAluno: true
              }
            }
          }
        }),
        prisma.pedido.count({ where })
      ]);

      logger.info('[Pedidos] Pedidos listados', {
        context: { 
          clienteId, 
          encontrados: pedidos.length, 
          total,
          status: status || 'todos' 
        }
      });

      // Formata dados
      const data = pedidos.map(p => ({
        ...p,
        valorUnitario: Number(p.valorUnitario),
        valorTotal: Number(p.valorTotal)
      }));

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
      logger.error('[Pedidos] Erro ao listar pedidos', {
        context: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          clienteId: req.cliente?.id
        }
      });
      next(error);
    }
  }
);

/**
 * Explicação da API [GET /api/cliente/pedidos/:id]
 * 
 * Retorna detalhes completos de um pedido específico.
 * Requer autenticação de cliente.
 * Cliente só pode ver seus próprios pedidos.
 * 
 * Params: { id: string }
 * Response: { success, data: { pedido completo com itens } }
 */
router.get('/:id',
  clienteAuthMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const clienteId = req.cliente!.id;

      logger.info('[Pedidos] Buscando detalhes do pedido', {
        context: { pedidoId: id, clienteId }
      });

      const pedido = await prisma.pedido.findFirst({
        where: {
          id,
          clienteId // Garante que cliente só vê seus próprios pedidos
        },
        include: {
          excursaoPedagogica: {
            select: {
              id: true,
              codigo: true,
              titulo: true,
              subtitulo: true,
              preco: true,
              imagemCapa: true,
              imagemPrincipal: true,
              descricao: true,
              inclusos: true,
              local: true,
              horario: true,
              duracao: true
            }
          },
          itens: true
        }
      });

      if (!pedido) {
        logger.warn('[Pedidos] Pedido não encontrado', {
          context: { pedidoId: id, clienteId }
        });
        throw ApiError.notFound('Pedido não encontrado');
      }

      logger.info('[Pedidos] Detalhes do pedido retornados', {
        context: { pedidoId: id, clienteId, status: pedido.status }
      });

      // Formata dados
      const data = {
        ...pedido,
        valorUnitario: Number(pedido.valorUnitario),
        valorTotal: Number(pedido.valorTotal),
        excursaoPedagogica: {
          ...pedido.excursaoPedagogica,
          preco: Number(pedido.excursaoPedagogica.preco)
        }
      };

      res.json({
        success: true,
        data
      });
    } catch (error) {
      logger.error('[Pedidos] Erro ao buscar detalhes do pedido', {
        context: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          pedidoId: req.params.id,
          clienteId: req.cliente?.id
        }
      });
      next(error);
    }
  }
);

/**
 * Explicação da API [PATCH /api/cliente/pedidos/:id/status]
 * 
 * Atualiza status de um pedido.
 * Requer autenticação de ADMIN.
 * 
 * Params: { id: string }
 * Body: { status: PedidoStatus, observacoes?: string }
 * Response: { success, message, data: { pedido atualizado } }
 */
router.patch('/:id/status',
  authMiddleware,
  adminMiddleware,
  validateBody(updatePedidoStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status, observacoes } = req.body;

      logger.info('[Pedidos Admin] Atualizando status do pedido', {
        context: { 
          pedidoId: id, 
          novoStatus: status,
          adminId: req.user!.id
        }
      });

      // Busca pedido
      const pedidoExistente = await prisma.pedido.findUnique({
        where: { id },
        include: {
          cliente: { select: { email: true } }
        }
      });

      if (!pedidoExistente) {
        logger.warn('[Pedidos Admin] Pedido não encontrado', {
          context: { pedidoId: id }
        });
        throw ApiError.notFound('Pedido não encontrado');
      }

      // Atualiza pedido
      const dataToUpdate: any = { status };

      // Se status é PAGO e não tinha dataPagamento, registra
      if (status === 'PAGO' && !pedidoExistente.dataPagamento) {
        dataToUpdate.dataPagamento = new Date();
      }

      // Se status é CONFIRMADO e não tinha dataConfirmacao, registra
      if (status === 'CONFIRMADO' && !pedidoExistente.dataConfirmacao) {
        dataToUpdate.dataConfirmacao = new Date();
      }

      // Atualiza observações se fornecidas
      if (observacoes) {
        dataToUpdate.observacoes = observacoes;
      }

      const pedido = await prisma.pedido.update({
        where: { id },
        data: dataToUpdate,
        include: {
          excursaoPedagogica: {
            select: { codigo: true, titulo: true }
          }
        }
      });

      // Registra atividade
      await prisma.activityLog.create({
        data: {
          action: 'update',
          entity: 'pedido',
          entityId: pedido.id,
          description: `Status alterado para ${status}`,
          userId: req.user!.id,
          userEmail: req.user!.email
        }
      });

      logger.info('[Pedidos Admin] Status do pedido atualizado', {
        context: {
          pedidoId: id,
          statusAnterior: pedidoExistente.status,
          novoStatus: status,
          adminId: req.user!.id
        }
      });

      // Formata resposta
      const data = {
        ...pedido,
        valorUnitario: Number(pedido.valorUnitario),
        valorTotal: Number(pedido.valorTotal)
      };

      res.json({
        success: true,
        message: 'Status do pedido atualizado com sucesso',
        data
      });
    } catch (error) {
      logger.error('[Pedidos Admin] Erro ao atualizar status do pedido', {
        context: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          pedidoId: req.params.id,
          adminId: req.user?.id
        }
      });
      next(error);
    }
  }
);

export default router;
