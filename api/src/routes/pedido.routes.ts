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
  createPedidoExcursaoSchema,
  createPedidoConvencionalSchema,
  updatePedidoStatusSchema,
  filterPedidosSchema
} from '../schemas/pedido.schema';
import { enviarEmailConfirmacaoPedido } from '../utils/enviar-email-confirmacao';
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
      const { codigoExcursao, quantidade, dadosResponsavelFinanceiro, dadosAlunos, observacoes } = req.body;
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
            observacoes: observacoes || null,
            dadosResponsavelFinanceiro: dadosResponsavelFinanceiro
              ? (dadosResponsavelFinanceiro as object)
              : undefined
          }
        });

        logger.info('[Pedidos] Pedido criado', {
          context: { pedidoId: novoPedido.id }
        });

        // Cria itens do pedido (dados dos alunos + informações médicas)
        const itensData = dadosAlunos.map((aluno: any) => ({
          pedidoId: novoPedido.id,
          nomeAluno: aluno.nomeAluno,
          idadeAluno: aluno.idadeAluno ?? null,
          dataNascimento: aluno.dataNascimento
            ? new Date(aluno.dataNascimento as string)
            : null,
          escolaAluno: aluno.escolaAluno || null,
          serieAluno: aluno.serieAluno || null,
          turma: aluno.turma || null,
          unidadeColegio: aluno.unidadeColegio || null,
          cpfAluno: aluno.cpfAluno || null,
          rgAluno: aluno.rgAluno || null,
          responsavel: aluno.responsavel || null,
          telefoneResponsavel: aluno.telefoneResponsavel || null,
          emailResponsavel: aluno.emailResponsavel || null,
          observacoes: aluno.observacoes || null,
          alergiasCuidados: aluno.alergiasCuidados || null,
          planoSaude: aluno.planoSaude || null,
          medicamentosFebre: aluno.medicamentosFebre || null,
          medicamentosAlergia: aluno.medicamentosAlergia || null
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
            excursao: {
              select: {
                id: true,
                titulo: true,
                slug: true,
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
          excursao: {
            select: {
              id: true,
              titulo: true,
              slug: true,
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

      // Formata dados (pedido pode ser de excursão pedagógica ou normal)
      const data = {
        ...pedido,
        valorUnitario: Number(pedido.valorUnitario),
        valorTotal: Number(pedido.valorTotal),
        excursaoPedagogica: pedido.excursaoPedagogica
          ? { ...pedido.excursaoPedagogica, preco: Number(pedido.excursaoPedagogica.preco) }
          : null,
        excursao: pedido.excursao
          ? { ...pedido.excursao, preco: Number(pedido.excursao.preco) }
          : null
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

/**
 * Explicação da API [GET /api/cliente/pedidos/excursao-normal/:slug]
 * Busca excursão normal por slug. Rota pública.
 */
router.get('/excursao-normal/:slug',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const excursao = await prisma.excursao.findUnique({
        where: { slug, status: 'ATIVO' },
        select: {
          id: true, titulo: true, slug: true, subtitulo: true, preco: true,
          duracao: true, categoria: true, imagemCapa: true, imagemPrincipal: true,
          descricao: true, inclusos: true, recomendacoes: true,
          local: true, horario: true, tags: true
        }
      });
      if (!excursao) throw ApiError.notFound('Excursão não encontrada');
      res.json({ success: true, data: excursao });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Explicação da API [POST /api/cliente/pedidos/excursao-normal]
 * Cria pedido de excursão normal (sem código). Requer autenticação.
 */
router.post('/excursao-normal',
  clienteAuthMiddleware,
  validateBody(createPedidoExcursaoSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { excursaoSlug, quantidade, dadosAlunos, observacoes } = req.body;
      const clienteId = req.cliente!.id;

      const excursao = await prisma.excursao.findUnique({ where: { slug: excursaoSlug } });
      if (!excursao) throw ApiError.notFound('Excursão não encontrada');

      const valorUnitario = Number(excursao.preco);
      const valorTotal = valorUnitario * quantidade;

      const pedido = await prisma.$transaction(async (tx) => {
        const novoPedido = await tx.pedido.create({
          data: {
            clienteId,
            excursaoId: excursao.id,
            quantidade,
            valorUnitario,
            valorTotal,
            observacoes,
            itens: {
              create: dadosAlunos.map((dados: any) => ({
                nomeAluno: dados.nomeAluno,
                idadeAluno: dados.idadeAluno,
                escolaAluno: dados.escolaAluno,
                serieAluno: dados.serieAluno,
                cpfAluno: dados.cpfAluno,
                responsavel: dados.responsavel,
                telefoneResponsavel: dados.telefoneResponsavel,
                emailResponsavel: dados.emailResponsavel,
                observacoes: dados.observacoes
              }))
            }
          },
          include: { excursao: true, itens: true }
        });
        return novoPedido;
      });

      res.status(201).json({ success: true, data: pedido });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Explicação da API [POST /api/cliente/pedidos/convencional]
 * 
 * Cria pedido de viagem convencional (sem dados de alunos).
 * Cliente informa slug da excursão, quantidade e dados dos passageiros.
 * 
 * Body: { excursaoSlug, quantidade, dadosPassageiros: [{ nome, sobrenome, cpf, ... }] }
 * Response: { success, data: { pedido com itens } }
 */
router.post('/convencional',
  clienteAuthMiddleware,
  validateBody(createPedidoConvencionalSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { excursaoSlug, quantidade, dadosPassageiros, observacoes } = req.body;
      const clienteId = req.cliente!.id;

      logger.info('[Pedidos] Criando pedido convencional', {
        context: { clienteId, excursaoSlug, quantidade, passageiros: dadosPassageiros.length }
      });

      // Busca excursão ativa por slug
      const excursao = await prisma.excursao.findFirst({
        where: {
          slug: excursaoSlug,
          status: ExcursaoStatus.ATIVO
        }
      });

      if (!excursao) {
        logger.warn('[Pedidos] Excursão convencional não encontrada', {
          context: { excursaoSlug }
        });
        throw ApiError.notFound('Viagem não encontrada ou inativa');
      }

      const valorUnitario = Number(excursao.preco);
      const valorTotal = valorUnitario * quantidade;

      // Cria pedido + itens (cada passageiro vira um item)
      const pedido = await prisma.$transaction(async (tx) => {
        const novoPedido = await tx.pedido.create({
          data: {
            clienteId,
            excursaoId: excursao.id,
            quantidade,
            valorUnitario,
            valorTotal,
            tipo: 'CONVENCIONAL',
            status: 'PENDENTE',
            observacoes,
            itens: {
              create: dadosPassageiros.map((dados: any) => ({
                // Armazena dados do passageiro como se fosse "aluno" (reutiliza estrutura)
                nomeAluno: `${dados.nome} ${dados.sobrenome}`,
                cpfAluno: dados.cpf,
                escolaAluno: null,
                serieAluno: null,
                responsavel: null,
                telefoneResponsavel: dados.telefone,
                emailResponsavel: dados.email,
                observacoes: JSON.stringify({
                  pais: dados.pais,
                  cep: dados.cep,
                  endereco: dados.endereco,
                  complemento: dados.complemento,
                  numero: dados.numero,
                  cidade: dados.cidade,
                  estado: dados.estado,
                  bairro: dados.bairro
                })
              }))
            }
          },
          include: { excursao: true, itens: true }
        });
        return novoPedido;
      });

      logger.info('[Pedidos] Pedido convencional criado', {
        context: { pedidoId: pedido.id, valorTotal: pedido.valorTotal }
      });

      res.status(201).json({ success: true, data: pedido });
    } catch (error) {
      logger.error('[Pedidos] Erro ao criar pedido convencional', {
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
 * Explicação da API [POST /api/admin/pedidos/:id/enviar-email]
 * 
 * Envia manualmente o e-mail de confirmação de inscrição para um pedido específico.
 * Requer autenticação de ADMIN.
 * 
 * Usa o mesmo template que é enviado automaticamente após pagamento confirmado.
 * Útil para reenviar e-mails ou enviar após criar/atualizar pedido manualmente.
 * 
 * Params: { id: string (pedidoId) }
 * Response: { success, message }
 */
router.post('/:id/enviar-email',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: pedidoId } = req.params;

      logger.info('[Pedidos Admin] Solicitação de envio manual de e-mail', {
        context: { pedidoId, adminId: req.user!.id, adminEmail: req.user!.email }
      });

      // Verifica se pedido existe
      const pedidoExistente = await prisma.pedido.findUnique({
        where: { id: pedidoId },
        select: { id: true, status: true, clienteId: true }
      });

      if (!pedidoExistente) {
        logger.warn('[Pedidos Admin] Pedido não encontrado para envio de e-mail', {
          context: { pedidoId }
        });
        throw ApiError.notFound('Pedido não encontrado');
      }

      // Reseta o lock para permitir reenvio
      await prisma.pedido.update({
        where: { id: pedidoId },
        data: { emailConfirmacaoEnviado: false }
      });

      // Envia e-mail (função já trata erros internamente e registra logs)
      await enviarEmailConfirmacaoPedido(pedidoId);

      // Registra atividade
      await prisma.activityLog.create({
        data: {
          action: 'email_send',
          entity: 'pedido',
          entityId: pedidoId,
          description: `E-mail de confirmação enviado manualmente`,
          userId: req.user!.id,
          userEmail: req.user!.email
        }
      });

      logger.info('[Pedidos Admin] E-mail de confirmação enviado manualmente com sucesso', {
        context: { pedidoId, adminId: req.user!.id }
      });

      res.json({
        success: true,
        message: 'E-mail de confirmação enviado com sucesso'
      });
    } catch (error) {
      logger.error('[Pedidos Admin] Erro ao enviar e-mail manual', {
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
