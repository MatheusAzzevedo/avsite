/**
 * Explicação do Arquivo [lista-alunos.routes.ts]
 * 
 * Rotas para gerenciamento de listas de alunos por excursão pedagógica.
 * Permite admin visualizar e exportar listas de alunos matriculados.
 * 
 * Rotas disponíveis:
 * - GET /api/admin/listas/excursoes - Listar excursões pedagógicas com contagem de alunos
 * - GET /api/admin/listas/excursao/:id/alunos - Buscar alunos de uma excursão específica
 * - GET /api/admin/listas/excursao/:id/exportar - Exportar Excel de alunos
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';
import ExcelJS from 'exceljs';
import { consultarPagamentoAsaas, verificarConfigAsaas } from '../config/asaas';

const router = Router();

// Aplica autenticação de admin em todas as rotas
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * Explicação da API [GET /api/admin/listas/excursoes]
 * 
 * Lista todas as excursões pedagógicas com contagem de alunos.
 * Retorna informações úteis para o admin escolher qual lista visualizar/exportar.
 * 
 * Query params:
 * - status (opcional): filtrar por status (ATIVO, INATIVO)
 * 
 * Response: { success, data: [{ excursao, totalAlunos, totalPedidos, statusPedidos }] }
 */
router.get('/excursoes',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.query;

      logger.info('[Listas] Listando excursões pedagógicas com contagem de alunos', {
        context: { adminId: req.user!.id, status: status || 'todos' }
      });

      const where: any = {};
      if (status && typeof status === 'string') {
        where.status = status;
      }

      // Busca excursões com pedidos e itens
      const excursoes = await prisma.excursaoPedagogica.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          pedidos: {
            include: {
              itens: true
            }
          }
        }
      });

      // Processa dados para incluir estatísticas
      const data = excursoes.map(excursao => {
        // Conta total de alunos (itens de pedido)
        const totalAlunos = excursao.pedidos.reduce((sum, pedido) => sum + pedido.itens.length, 0);
        
        // Conta total de pedidos
        const totalPedidos = excursao.pedidos.length;
        
        // Agrupa pedidos por status
        const statusPedidos = excursao.pedidos.reduce((acc, pedido) => {
          acc[pedido.status] = (acc[pedido.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Conta alunos por status de pedido
        const alunosPorStatus = excursao.pedidos.reduce((acc, pedido) => {
          const count = pedido.itens.length;
          acc[pedido.status] = (acc[pedido.status] || 0) + count;
          return acc;
        }, {} as Record<string, number>);

        return {
          id: excursao.id,
          codigo: excursao.codigo,
          titulo: excursao.titulo,
          subtitulo: excursao.subtitulo,
          status: excursao.status,
          imagemCapa: excursao.imagemCapa,
          preco: Number(excursao.preco),
          local: excursao.local,
          horario: excursao.horario,
          duracao: excursao.duracao,
          createdAt: excursao.createdAt,
          totalAlunos,
          totalPedidos,
          statusPedidos,
          alunosPorStatus
        };
      });

      logger.info('[Listas] Excursões listadas com sucesso', {
        context: { 
          adminId: req.user!.id,
          total: data.length,
          totalAlunos: data.reduce((sum, e) => sum + e.totalAlunos, 0)
        }
      });

      res.json({
        success: true,
        data
      });
    } catch (error) {
      logger.error('[Listas] Erro ao listar excursões', {
        context: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          adminId: req.user?.id
        }
      });
      next(error);
    }
  }
);

/**
 * Explicação da API [GET /api/admin/listas/excursao/:id/alunos]
 * 
 * Busca lista de alunos de uma excursão pedagógica específica.
 * Retorna dados completos de cada aluno com informações do pedido.
 * 
 * Params: { id: string } - ID da excursão pedagógica
 * Query params:
 * - statusPedido (opcional): filtrar por status do pedido (PENDENTE, PAGO, CONFIRMADO, etc.)
 * 
 * Response: { success, data: { excursao, alunos: [...] } }
 */
router.get('/excursao/:id/alunos',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { statusPedido } = req.query;

      logger.info('[Listas] Buscando alunos de excursão pedagógica', {
        context: { 
          adminId: req.user!.id, 
          excursaoId: id,
          statusPedido: statusPedido || 'todos'
        }
      });

      // Busca excursão
      const excursao = await prisma.excursaoPedagogica.findUnique({
        where: { id },
        select: {
          id: true,
          codigo: true,
          titulo: true,
          subtitulo: true,
          status: true,
          preco: true,
          local: true,
          horario: true,
          duracao: true
        }
      });

      if (!excursao) {
        logger.warn('[Listas] Excursão pedagógica não encontrada', {
          context: { excursaoId: id }
        });
        throw ApiError.notFound('Excursão pedagógica não encontrada');
      }

      // Filtro de pedidos
      const wherePedido: any = { excursaoPedagogicaId: id };
      if (statusPedido && typeof statusPedido === 'string') {
        wherePedido.status = statusPedido;
      }

      // Busca pedidos com itens e dados do cliente
      const pedidos = await prisma.pedido.findMany({
        where: wherePedido,
        orderBy: { createdAt: 'desc' },
        include: {
          itens: true,
          cliente: {
            select: {
              id: true,
              nome: true,
              email: true,
              telefone: true
            }
          }
        }
      });

      // Mapeia alunos com informações do pedido
      const alunos = pedidos.flatMap(pedido => 
        pedido.itens.map(item => ({
          // Dados do aluno
          id: item.id,
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
          observacoes: item.observacoes,
          alergiasCuidados: item.alergiasCuidados,
          planoSaude: item.planoSaude,
          medicamentosFebre: item.medicamentosFebre,
          medicamentosAlergia: item.medicamentosAlergia,
          
          // Dados do pedido
          pedidoId: pedido.id,
          statusPedido: pedido.status,
          dataPedido: pedido.createdAt,
          dataPagamento: pedido.dataPagamento,
          dataConfirmacao: pedido.dataConfirmacao,
          valorUnitario: Number(pedido.valorUnitario),
          
          // Dados do cliente
          cliente: pedido.cliente
        }))
      );

      logger.info('[Listas] Alunos listados com sucesso', {
        context: { 
          adminId: req.user!.id,
          excursaoId: id,
          totalAlunos: alunos.length,
          totalPedidos: pedidos.length
        }
      });

      res.json({
        success: true,
        data: {
          excursao: {
            ...excursao,
            preco: Number(excursao.preco)
          },
          alunos,
          totalAlunos: alunos.length,
          totalPedidos: pedidos.length
        }
      });
    } catch (error) {
      logger.error('[Listas] Erro ao buscar alunos', {
        context: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          excursaoId: req.params.id,
          adminId: req.user?.id
        }
      });
      next(error);
    }
  }
);

/**
 * Explicação da API [POST /api/admin/listas/excursao/:id/atualizar-pagamentos]
 *
 * Sincroniza status de pagamento com o Asaas para pedidos da excursão que estão
 * AGUARDANDO_PAGAMENTO ou PENDENTE. Consulta o Asaas e atualiza para PAGO quando
 * a cobrança foi confirmada. Permite ao admin forçar atualização imediata sem
 * aguardar o polling de 4 horas.
 *
 * Params: { id: string } - ID da excursão pedagógica
 * Response: { success, data: { atualizados, total } }
 */
router.post('/excursao/:id/atualizar-pagamentos',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      logger.info('[Listas] Admin solicitando atualização de pagamentos', {
        context: { adminId: req.user!.id, excursaoId: id }
      });

      const excursao = await prisma.excursaoPedagogica.findUnique({
        where: { id },
        select: { id: true, titulo: true }
      });

      if (!excursao) {
        throw ApiError.notFound('Excursão pedagógica não encontrada');
      }

      if (!verificarConfigAsaas()) {
        throw ApiError.internal('Gateway de pagamento não configurado');
      }

      const pedidos = await prisma.pedido.findMany({
        where: {
          excursaoPedagogicaId: id,
          status: { in: ['PENDENTE', 'AGUARDANDO_PAGAMENTO'] },
          codigoPagamento: { not: null }
        },
        select: { id: true, codigoPagamento: true, status: true, dataPagamento: true }
      });

      let atualizados = 0;

      for (const pedido of pedidos) {
        if (!pedido.codigoPagamento) continue;

        try {
          const asaasResult = await consultarPagamentoAsaas(pedido.codigoPagamento);
          const statusAsaasPago = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH', 'CONFIRMED_BY_CUSTOMER'];

          if (asaasResult?.status && statusAsaasPago.includes(asaasResult.status)) {
            await prisma.pedido.update({
              where: { id: pedido.id },
              data: {
                status: 'PAGO',
                dataPagamento: pedido.dataPagamento || new Date()
              }
            });
            atualizados++;

            logger.info('[Listas] Pagamento confirmado no Asaas; pedido atualizado', {
              context: { pedidoId: pedido.id, cobrancaId: pedido.codigoPagamento }
            });
          }
        } catch (err) {
          logger.warn('[Listas] Erro ao consultar Asaas para pedido', {
            context: { pedidoId: pedido.id, error: err instanceof Error ? err.message : 'Unknown' }
          });
        }
      }

      res.json({
        success: true,
        data: {
          atualizados,
          total: pedidos.length
        }
      });
    } catch (error) {
      logger.error('[Listas] Erro ao atualizar pagamentos', {
        context: {
          error: error instanceof Error ? error.message : 'Unknown',
          excursaoId: req.params.id,
          adminId: req.user?.id
        }
      });
      next(error);
    }
  }
);

/**
 * Explicação da API [GET /api/admin/listas/excursao/:id/exportar]
 * 
 * Exporta lista de alunos em formato Excel (.xlsx).
 * Gera arquivo conforme especificação da Lista de Chamada.
 * 
 * Params: { id: string } - ID da excursão pedagógica
 * Query params:
 * - statusPedido (opcional): filtrar por status do pedido (PENDENTE, PAGO, CONFIRMADO, etc.)
 * 
 * Response: arquivo Excel (.xlsx)
 */
router.get('/excursao/:id/exportar',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { statusPedido } = req.query;

      logger.info('[Listas] Iniciando exportação de Excel', {
        context: { 
          adminId: req.user!.id, 
          excursaoId: id,
          statusPedido: statusPedido || 'todos'
        }
      });

      // Busca excursão
      const excursao = await prisma.excursaoPedagogica.findUnique({
        where: { id },
        select: {
          id: true,
          codigo: true,
          titulo: true
        }
      });

      if (!excursao) {
        logger.warn('[Listas] Excursão pedagógica não encontrada para exportação', {
          context: { excursaoId: id }
        });
        throw ApiError.notFound('Excursão pedagógica não encontrada');
      }

      // Filtro de pedidos
      const wherePedido: any = { excursaoPedagogicaId: id };
      if (statusPedido && typeof statusPedido === 'string') {
        wherePedido.status = statusPedido;
      }

      // Busca pedidos com itens
      const pedidos = await prisma.pedido.findMany({
        where: wherePedido,
        orderBy: { createdAt: 'asc' },
        include: {
          itens: {
            orderBy: { nomeAluno: 'asc' }
          }
        }
      });

      // Extrai alunos
      const alunos = pedidos.flatMap(pedido => pedido.itens);

      if (alunos.length === 0) {
        logger.warn('[Listas] Nenhum aluno encontrado para exportação', {
          context: { excursaoId: id }
        });
        throw ApiError.badRequest('Nenhum aluno encontrado para exportar');
      }

      // Cria workbook e worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Lista de Alunos');

      // Define colunas conforme especificação
      worksheet.columns = [
        { header: 'Nome', key: 'nome', width: 30 },
        { header: 'Turma', key: 'turma', width: 15 },
        { header: 'Série', key: 'serie', width: 15 },
        { header: 'CPF', key: 'cpf', width: 20 },
        { header: 'Telefone', key: 'telefone', width: 20 },
        { header: 'Celular', key: 'celular', width: 20 }
      ];

      // Estiliza cabeçalho
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Adiciona dados dos alunos
      alunos.forEach(aluno => {
        // Ignora linhas sem nome ou com nome muito curto
        if (!aluno.nomeAluno || aluno.nomeAluno.trim().length < 2) {
          return;
        }

        worksheet.addRow({
          nome: aluno.nomeAluno,
          turma: aluno.turma || '',
          serie: aluno.serieAluno || '',
          cpf: aluno.cpfAluno || '',
          telefone: '', // Campo telefone vazio (não temos no modelo)
          celular: aluno.telefoneResponsavel || ''
        });
      });

      // Nome do arquivo
      const nomeArquivo = `lista_${excursao.codigo}_${new Date().toISOString().split('T')[0]}.xlsx`;

      logger.info('[Listas] Excel gerado com sucesso', {
        context: { 
          adminId: req.user!.id,
          excursaoId: id,
          excursaoCodigo: excursao.codigo,
          totalAlunos: alunos.filter(a => a.nomeAluno && a.nomeAluno.trim().length >= 2).length,
          nomeArquivo
        }
      });

      // Define headers para download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);

      // Gera e envia o arquivo
      await workbook.xlsx.write(res);
      res.end();

      // Log de atividade
      await prisma.activityLog.create({
        data: {
          action: 'export',
          entity: 'lista_alunos',
          entityId: excursao.id,
          description: `Lista de alunos exportada: ${excursao.titulo} (${alunos.length} alunos)`,
          userId: req.user!.id,
          userEmail: req.user!.email
        }
      });

    } catch (error) {
      logger.error('[Listas] Erro ao exportar Excel', {
        context: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          excursaoId: req.params.id,
          adminId: req.user?.id
        }
      });
      next(error);
    }
  }
);

export default router;
