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
import { ExcursaoStatus, PedidoStatus } from '@prisma/client';
import { gerarTemplateComprovante } from '../templates/comprovante-template';
import {
  avaliarTodasAsTransicoes,
  avaliarTransicao,
  STATUS_QUE_OCUPAM_VAGA,
  STATUS_ANTES_DO_PAGAMENTO,
  ContextoTransicao,
  TokenConfirmacao
} from '../utils/transicoes-pedido';
import { consultarTransacaoPagHiper, cancelarCobrancaPixPagHiper, verificarConfigPagHiper } from '../config/paghiper';
import { consultarPagamentoAsaas, verificarConfigAsaas } from '../config/asaas';

const router = Router();

/** Monta excursaoPedagogica a partir do snapshot quando a excursão foi excluída (histórico do cliente) */
function resolveExcursaoPedagogicaParaCliente(pedido: { excursaoPedagogica: unknown; excursaoPedagogicaSnapshot?: unknown }): Record<string, unknown> | null {
  if (pedido.excursaoPedagogica) {
    return pedido.excursaoPedagogica as Record<string, unknown>;
  }
  const snap = pedido.excursaoPedagogicaSnapshot as { titulo?: string; codigo?: string; documentoUrl?: string | null; documentoNome?: string | null } | null;
  if (snap && typeof snap === 'object' && snap.titulo) {
    return {
      titulo: snap.titulo,
      codigo: snap.codigo ?? '',
      documentoUrl: snap.documentoUrl ?? null,
      documentoNome: snap.documentoNome ?? null
    };
  }
  return null;
}

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

      // Busca excursão ativa por código (seleção mínima para busca/detalhes)
      const excursao = await prisma.excursaoPedagogica.findFirst({
        where: {
          codigo,
          status: ExcursaoStatus.ATIVO
        },
        select: {
          id: true,
          codigo: true,
          titulo: true,
          subtitulo: true,
          preco: true,
          duracao: true,
          categoria: true,
          status: true,
          imagemCapa: true,
          local: true,
          horario: true,
          descricao: true,
          inclusos: true,
          recomendacoes: true,
          vagas: true,
          maxInstallments: true,
          documentoUrl: true,
          documentoNome: true,
          slug: true,
          dataDestino: true
        }
      });

      if (!excursao) {
        logger.warn('[Pedidos] Excursão não encontrada', {
          context: { codigo }
        });
        throw ApiError.notFound('Excursão não encontrada ou inativa');
      }

      // Conta vagas ocupadas
      let vagasDisponiveis = null;
      if (excursao.vagas !== null) {
        const ocupadas = await prisma.pedido.aggregate({
          where: {
            excursaoPedagogicaId: excursao.id,
            status: { in: ['PAGO', 'CONFIRMADO', 'PENDENTE', 'AGUARDANDO_PAGAMENTO'] }
          },
          _sum: { quantidade: true }
        });
        const totalOcupadas = ocupadas._sum.quantidade || 0;
        vagasDisponiveis = Math.max(0, excursao.vagas - totalOcupadas);
      }

      // Formata dados
      const data = {
        ...excursao,
        preco: Number(excursao.preco),
        galeria: [excursao.imagemCapa].filter(Boolean), // Mock para compatibilidade, sem carregar tabela galeria
        vagasDisponiveis
      };

      logger.info('[Pedidos] Excursão encontrada', {
        context: { codigo, excursaoId: excursao.id, titulo: excursao.titulo, vagasDisponiveis }
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
          preco: Number(excursao.preco),
          vagas: excursao.vagas
        }
      });

      // Validação de Vagas
      if (excursao.vagas !== null) {
        const ocupadas = await prisma.pedido.aggregate({
          where: {
            excursaoPedagogicaId: excursao.id,
            status: { in: ['PAGO', 'CONFIRMADO', 'PENDENTE', 'AGUARDANDO_PAGAMENTO'] }
          },
          _sum: { quantidade: true }
        });

        const totalOcupadas = ocupadas._sum.quantidade || 0;
        if (totalOcupadas + quantidade > excursao.vagas) {
          logger.warn('[Pedidos] Limite de vagas atingido', {
            context: { 
              excursaoId: excursao.id, 
              vagas: excursao.vagas, 
              ocupadas: totalOcupadas, 
              tentativa: quantidade 
            }
          });
          throw ApiError.badRequest(`Desculpe, restam apenas ${excursao.vagas - totalOcupadas} vagas para esta excursão.`);
        }
      }

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
 * Lista todos os pedidos do cliente autenticado (todos os status, inclusive não pagos).
 * Requer autenticação de cliente.
 *
 * Query params:
 * - status (opcional): filtrar por status (se omitido, retorna PENDENTE, AGUARDANDO_PAGAMENTO, PAGO, CONFIRMADO, etc.)
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
        context: { clienteId, status: status || 'todos', limit: take, page: parseInt(page as string) }
      });

      const where: { clienteId: string; status?: PedidoStatus } = { clienteId };

      if (status && typeof status === 'string') {
        where.status = status as PedidoStatus;
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
                horario: true,
                documentoUrl: true,
                documentoNome: true
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
                nomeAluno: true
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

      if (pedidos.length === 0 && total === 0) {
        logger.debug('[Pedidos] Nenhum pedido encontrado para cliente - verifique se pedidos foram criados com este clienteId', {
          context: { clienteId }
        });
      }

      // Formata dados (usa snapshot quando excursão pedagógica foi excluída)
      const data = pedidos.map(p => {
        const excursaoPedagogica = resolveExcursaoPedagogicaParaCliente(p);
        return {
          ...p,
          valorUnitario: Number(p.valorUnitario),
          valorTotal: Number(p.valorTotal),
          excursaoPedagogica: excursaoPedagogica
        };
      });

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

      // Formata dados (usa snapshot quando excursão pedagógica foi excluída)
      const excursaoPedagogicaResolved = resolveExcursaoPedagogicaParaCliente(pedido);
      const data = {
        ...pedido,
        valorUnitario: Number(pedido.valorUnitario),
        valorTotal: Number(pedido.valorTotal),
        excursaoPedagogica: pedido.excursaoPedagogica
          ? { ...pedido.excursaoPedagogica, preco: Number(pedido.excursaoPedagogica.preco) }
          : excursaoPedagogicaResolved,
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
 * Explicação da API [GET /api/cliente/pedidos/:id/comprovante]
 * 
 * Retorna o comprovante de inscrição em HTML (preparado para download PDF).
 * Requer autenticação de cliente.
 * Apenas pedidos com status PAGO podem gerar comprovante.
 */
router.get('/:id/comprovante',
  clienteAuthMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const clienteId = req.cliente!.id;

      logger.info('[Pedidos] Gerando comprovante para pedido', {
        context: { pedidoId: id, clienteId }
      });

      const pedido = await prisma.pedido.findFirst({
        where: {
          id,
          clienteId,
          status: 'PAGO' // Somente status PAGO, conforme solicitado
        },
        include: {
          excursaoPedagogica: true,
          excursao: true,
          itens: true,
          cliente: true
        }
      });

      if (!pedido) {
        logger.warn('[Pedidos] Pedido não encontrado ou não está PAGO', {
          context: { pedidoId: id, clienteId }
        });
        throw ApiError.notFound('Comprovante indisponível. O pedido precisa estar com pagamento confirmado.');
      }

      // Prepara dados para o template
      const dadosResp = pedido.dadosResponsavelFinanceiro as any;
      const html = gerarTemplateComprovante({
        numeroPedido: pedido.id,
        dataPedido: pedido.createdAt,
        dataPagamento: pedido.dataPagamento,
        nomeCliente: pedido.cliente.nome,
        nomeProduto: pedido.excursaoPedagogica?.titulo || pedido.excursao?.titulo || 'Viagem',
        codigoExcursao: pedido.excursaoPedagogica?.codigo || pedido.excursao?.slug || '-',
        quantidade: pedido.quantidade,
        valorUnitario: Number(pedido.valorUnitario),
        valorTotal: Number(pedido.valorTotal),
        metodoPagamento: pedido.metodoPagamento || '-',
        observacoes: pedido.observacoes || undefined,
        estudantes: pedido.itens.map(item => ({
          nomeAluno: item.nomeAluno,
          idadeAluno: item.idadeAluno,
          dataNascimento: item.dataNascimento,
          escolaAluno: item.escolaAluno,
          serieAluno: item.serieAluno,
          turma: item.turma,
          unidadeColegio: item.unidadeColegio,
          cpfAluno: item.cpfAluno,
          rgAluno: item.rgAluno,
          responsavel: item.responsavel,
          telefoneResponsavel: item.telefoneResponsavel,
          emailResponsavel: item.emailResponsavel,
          alergiasCuidados: item.alergiasCuidados,
          planoSaude: item.planoSaude,
          medicamentosFebre: item.medicamentosFebre,
          medicamentosAlergia: item.medicamentosAlergia,
          observacoes: item.observacoes
        })),
        responsavelFinanceiro: dadosResp ? {
          nome: dadosResp.nome || dadosResp.nomeCompleto || pedido.cliente.nome,
          sobrenome: dadosResp.sobrenome || '',
          cpf: dadosResp.cpf || '',
          telefone: dadosResp.telefone || pedido.cliente.telefone || '',
          email: dadosResp.email || pedido.cliente.email,
          endereco: dadosResp.endereco || '',
          numero: dadosResp.numero || '',
          complemento: dadosResp.complemento || '',
          bairro: dadosResp.bairro || '',
          cidade: dadosResp.cidade || '',
          estado: dadosResp.estado || '',
          cep: dadosResp.cep || ''
        } : undefined
      });

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      logger.error('[Pedidos] Erro ao gerar comprovante', {
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
 * Explicação da função [consultarGateway]
 * Pergunta ao gateway o que ele sabe sobre a cobrança atual do pedido.
 *
 * Devolve `null` quando não há cobrança ou a consulta falha. É de propósito que
 * a falha não derrube nada: o operador ainda pode decidir, só perde uma
 * informação — e a tela avisa que ela faltou, em vez de fingir que consultou.
 */
async function consultarGateway(
  metodoPagamento: string | null,
  codigoPagamento: string | null
): Promise<ContextoTransicao['gateway']> {
  // Sem cobrança registrada é situação normal — venda manual, por exemplo — e
  // não uma falha. As duas produzem frases diferentes na tela.
  if (!codigoPagamento || !metodoPagamento) return { situacao: 'sem_cobranca' };

  try {
    if (metodoPagamento === 'pix') {
      if (!verificarConfigPagHiper()) return { situacao: 'indisponivel' };
      const resultado = await consultarTransacaoPagHiper(codigoPagamento);
      const pagos = ['paid', 'completed', 'reserved'];
      const vivos = ['pending', 'processing'];
      return {
        situacao: 'consultado',
        reconheceuPagamento: pagos.includes(resultado.status),
        cobrancaAtiva: vivos.includes(resultado.status),
        statusBruto: resultado.status
      };
    }

    if (metodoPagamento === 'cartao') {
      if (!verificarConfigAsaas()) return { situacao: 'indisponivel' };
      const resultado = await consultarPagamentoAsaas(codigoPagamento);
      const pagos = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH', 'CONFIRMED_BY_CUSTOMER'];
      const vivos = ['PENDING', 'AWAITING_RISK_ANALYSIS'];
      const status = String(resultado?.status || 'DESCONHECIDO');
      return {
        situacao: 'consultado',
        reconheceuPagamento: pagos.includes(status),
        cobrancaAtiva: vivos.includes(status),
        statusBruto: status
      };
    }

    return { situacao: 'sem_cobranca' };
  } catch (error) {
    logger.warn('[Pedidos Admin] Não foi possível consultar o gateway', {
      context: {
        metodoPagamento,
        codigoPagamento,
        error: error instanceof Error ? error.message : 'Unknown'
      }
    });
    return { situacao: 'indisponivel' };
  }
}

/**
 * Explicação da função [montarContextoTransicao]
 * Reúne o retrato do pedido e da excursão que as regras de transição consultam.
 *
 * As vagas são contadas SEM este pedido. É o que permite responder "cabe se eu
 * reativar?" sem que o próprio pedido apareça nos dois lados da conta.
 */
async function montarContextoTransicao(pedidoId: string) {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: {
      cliente: { select: { id: true, email: true, nome: true } },
      excursao: { select: { id: true, titulo: true, vagas: true } },
      excursaoPedagogica: { select: { id: true, titulo: true, vagas: true } }
    }
  });

  if (!pedido) return null;

  const excursao = pedido.excursaoPedagogica ?? pedido.excursao;

  let vagasOcupadasPorOutros = 0;
  if (excursao) {
    const filtroExcursao = pedido.excursaoPedagogicaId
      ? { excursaoPedagogicaId: pedido.excursaoPedagogicaId }
      : { excursaoId: pedido.excursaoId };

    const soma = await prisma.pedido.aggregate({
      where: {
        ...filtroExcursao,
        id: { not: pedido.id },
        status: { in: STATUS_QUE_OCUPAM_VAGA }
      },
      _sum: { quantidade: true }
    });
    vagasOcupadasPorOutros = soma._sum.quantidade || 0;
  }

  const gateway = await consultarGateway(pedido.metodoPagamento, pedido.codigoPagamento);

  const contexto: ContextoTransicao = {
    statusAtual: pedido.status,
    quantidade: pedido.quantidade,
    valorTotal: Number(pedido.valorTotal),
    dataPagamento: pedido.dataPagamento,
    dataConfirmacao: pedido.dataConfirmacao,
    vagasTotais: excursao?.vagas ?? null,
    vagasOcupadasPorOutros,
    gateway
  };

  return { pedido, excursao, contexto };
}

/**
 * Explicação da API [GET /api/admin/pedidos/:id/opcoes-status]
 *
 * Devolve os seis status já avaliados para ESTE pedido: o que é permitido, o
 * que exige confirmação, o que está bloqueado, e o motivo de cada um.
 *
 * Existe para que a tela mostre a consequência antes da escolha, em vez de
 * aceitar qualquer valor e devolver erro depois. Consulta as vagas da excursão
 * e o gateway no momento da abertura.
 *
 * Response: { success, data: { pedido, excursao, gateway, opcoes[] } }
 */
router.get('/:id/opcoes-status',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const montado = await montarContextoTransicao(id);

      if (!montado) {
        throw ApiError.notFound('Pedido não encontrado');
      }

      const { pedido, excursao, contexto } = montado;
      const opcoes = avaliarTodasAsTransicoes(contexto);

      logger.info('[Pedidos Admin] Opções de status avaliadas', {
        context: {
          pedidoId: id,
          statusAtual: pedido.status,
          gateway: contexto.gateway.situacao,
          bloqueadas: opcoes.filter((o) => o.veredito === 'bloqueado').map((o) => o.status)
        }
      });

      res.json({
        success: true,
        data: {
          pedido: {
            id: pedido.id,
            status: pedido.status,
            quantidade: pedido.quantidade,
            valorTotal: Number(pedido.valorTotal),
            dataPagamento: pedido.dataPagamento,
            dataConfirmacao: pedido.dataConfirmacao,
            metodoPagamento: pedido.metodoPagamento,
            clienteNome: pedido.cliente?.nome ?? null,
            clienteEmail: pedido.cliente?.email ?? null
          },
          excursao: excursao
            ? {
                titulo: excursao.titulo,
                vagasTotais: excursao.vagas,
                vagasOcupadasPorOutros: contexto.vagasOcupadasPorOutros
              }
            : null,
          gateway: contexto.gateway,
          opcoes
        }
      });
    } catch (error) {
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
      const { status, observacoes, confirmacoes, avisarCliente } = req.body;
      const confirmacoesRecebidas: TokenConfirmacao[] = confirmacoes || [];

      logger.info('[Pedidos Admin] Atualizando status do pedido', {
        context: { 
          pedidoId: id, 
          novoStatus: status,
          confirmacoes: confirmacoesRecebidas,
          avisarCliente: !!avisarCliente,
          adminId: req.user!.id
        }
      });

      // Monta o mesmo retrato que a tela usou para exibir as opções, e avalia a
      // transição de novo aqui. Reavaliar não é redundância: entre abrir o modal
      // e gravar, outra pessoa pode ter ocupado a última vaga ou o pagamento
      // pode ter entrado.
      const montado = await montarContextoTransicao(id);

      if (!montado) {
        logger.warn('[Pedidos Admin] Pedido não encontrado', {
          context: { pedidoId: id }
        });
        throw ApiError.notFound('Pedido não encontrado');
      }

      const { pedido: pedidoExistente, contexto } = montado;
      const avaliacao = avaliarTransicao(status as PedidoStatus, contexto);

      if (avaliacao.veredito === 'atual') {
        throw ApiError.badRequest('O pedido já está neste status.');
      }

      // Bloqueio só cede com o token correspondente. É assim que a falta de vaga
      // vira decisão consciente do dono do sistema em vez de barreira dura, sem
      // deixar de ser bloqueio para quem não sabe o que está fazendo.
      const faltando = avaliacao.confirmacoes.filter((t) => !confirmacoesRecebidas.includes(t));
      if (faltando.length > 0) {
        logger.warn('[Pedidos Admin] Transição recusada: consequências não confirmadas', {
          context: { pedidoId: id, novoStatus: status, faltando, motivos: avaliacao.motivos }
        });
        return res.status(400).json({
          success: false,
          error: 'Esta mudança exige confirmação das consequências.',
          data: { veredito: avaliacao.veredito, motivos: avaliacao.motivos, confirmacoesNecessarias: faltando }
        });
      }

      const dataToUpdate: any = { status };

      // Datas de pagamento e confirmação acompanham o status nos dois sentidos,
      // mas a limpeza vale só ao voltar para antes do pagamento.
      //
      // Antes elas só eram preenchidas, nunca limpas: um pedido devolvido de
      // PAGO para PENDENTE ficava com data de um pagamento que, segundo o
      // próprio status, não existe. A primeira correção foi longe demais e
      // limpava também ao CANCELAR — o que contradizia o próprio aviso da tela
      // ("não estorna nada") e apagava a evidência de que o dinheiro entrou.
      // Era ela que permitia achar pedido pago cancelado por engano.
      if (status === 'PAGO' && !pedidoExistente.dataPagamento) {
        dataToUpdate.dataPagamento = new Date();
      }

      if (status === 'CONFIRMADO' && !pedidoExistente.dataConfirmacao) {
        dataToUpdate.dataConfirmacao = new Date();
      }

      if (STATUS_ANTES_DO_PAGAMENTO.includes(status as PedidoStatus)) {
        if (pedidoExistente.dataPagamento) dataToUpdate.dataPagamento = null;
        if (pedidoExistente.dataConfirmacao) dataToUpdate.dataConfirmacao = null;
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

      // A tela informou que a cobrança viva seria invalidada; aqui isso acontece.
      // Sem esta parte, um pedido cancelado por dentro continuaria pagável no
      // gateway — foi exatamente assim que cobranças órfãs derrubaram pedidos
      // pagos no cartão.
      if (
        contexto.gateway.situacao === 'consultado' &&
        contexto.gateway.cobrancaAtiva &&
        pedidoExistente.metodoPagamento === 'pix' &&
        pedidoExistente.codigoPagamento &&
        !STATUS_QUE_OCUPAM_VAGA.includes(status as PedidoStatus)
      ) {
        try {
          await cancelarCobrancaPixPagHiper(pedidoExistente.codigoPagamento);
          logger.info('[Pedidos Admin] Cobrança PIX invalidada junto da mudança de status', {
            context: { pedidoId: id, transactionId: pedidoExistente.codigoPagamento }
          });
        } catch (error) {
          // Não desfaz a mudança de status: a varredura de expiração tenta de novo.
          logger.error('[Pedidos Admin] Falha ao invalidar a cobrança PIX no gateway', {
            context: {
              pedidoId: id,
              transactionId: pedidoExistente.codigoPagamento,
              error: error instanceof Error ? error.message : 'Unknown'
            }
          });
        }
      }

      // Registra atividade — com o motivo, e não só o destino. Meses depois, o
      // que importa saber é por que a exceção foi aberta.
      const descricaoLog = [
        `Status alterado de ${pedidoExistente.status} para ${status}`,
        confirmacoesRecebidas.length ? `Confirmações: ${confirmacoesRecebidas.join(', ')}` : null,
        avaliacao.motivos.length ? `Consequências exibidas: ${avaliacao.motivos.join(' | ')}` : null
      ].filter(Boolean).join('. ');

      await prisma.activityLog.create({
        data: {
          action: 'update',
          entity: 'pedido',
          entityId: pedido.id,
          description: descricaoLog,
          userId: req.user!.id,
          userEmail: req.user!.email
        }
      });

      // E-mail só sai quando pedido explicitamente: avisar o cliente é
      // irreversível e não pode ser efeito colateral de uma correção de status.
      if (avisarCliente) {
        enviarEmailConfirmacaoPedido(pedido.id).catch((err) => {
          logger.error('[Pedidos Admin] Falha ao enviar e-mail após mudança de status', {
            context: { pedidoId: id, error: err instanceof Error ? err.message : 'Unknown' }
          });
        });
      }

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

      // Validação de Vagas
      if (excursao.vagas !== null) {
        const ocupadas = await prisma.pedido.aggregate({
          where: {
            excursaoId: excursao.id,
            status: { in: ['PAGO', 'CONFIRMADO', 'PENDENTE', 'AGUARDANDO_PAGAMENTO'] }
          },
          _sum: { quantidade: true }
        });

        const totalOcupadas = ocupadas._sum.quantidade || 0;
        if (totalOcupadas + quantidade > excursao.vagas) {
          logger.warn('[Pedidos] Limite de vagas atingido (convencional)', {
            context: { 
              excursaoId: excursao.id, 
              vagas: excursao.vagas, 
              ocupadas: totalOcupadas, 
              tentativa: quantidade 
            }
          });
          throw ApiError.badRequest(`Desculpe, restam apenas ${excursao.vagas - totalOcupadas} vagas para esta viagem.`);
        }
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
