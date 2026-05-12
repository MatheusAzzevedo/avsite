/**
 * Explicação do Arquivo [lista-alunos.routes.ts]
 * 
 * Rotas para gerenciamento de listas de alunos por excursão pedagógica.
 * Permite admin visualizar e exportar listas de alunos matriculados.
 * 
 * Rotas disponíveis:
 * - GET /api/admin/listas/excursoes - Listar excursões pedagógicas com contagem de alunos
 * - GET /api/admin/listas/excursao/:id/alunos - Buscar alunos de uma excursão específica
 * - GET /api/admin/listas/excursao/:id/exportar - Exportar Excel de alunos (lista resumida)
 * - GET /api/admin/listas/excursao/:id/exportar-completa - Exportar Excel com todas as informações preenchidas na compra
 * - POST /api/admin/listas/atualizar-pagamentos-todas - Atualizar status de pagamento de todas as listas (consulta Asaas)
 * - POST /api/admin/listas/excursao/:id/atualizar-pagamentos - Atualizar status de pagamento de uma excursão
 */

import path from 'path';
import fs from 'fs';
import { Router, Request, Response, NextFunction } from 'express';
import { PedidoStatus } from '@prisma/client';
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

      // Busca excursões (seleção mínima para listagem)
      const excursoes = await prisma.excursaoPedagogica.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          codigo: true,
          titulo: true,
          subtitulo: true,
          status: true,
          preco: true,
          local: true,
          horario: true,
          duracao: true,
          vagas: true,
          dataDestino: true,
          createdAt: true
        }
      });

      // Otimização: Busca estatísticas de todos os pedidos em uma única consulta agregada (evita N+1 e memória cheia)
      const excursionIds = excursoes.map(e => e.id);
      
      const ordersData = await prisma.pedido.findMany({
        where: {
          excursaoPedagogicaId: { in: excursionIds },
          status: { notIn: ['CANCELADO', 'EXPIRADO'] }
        },
        select: {
          excursaoPedagogicaId: true,
          status: true,
          metodoPagamento: true,
          _count: {
            select: { itens: true }
          }
        }
      });

      // Agrupa os dados em memória de forma eficiente
      const statsMap = new Map();
      excursionIds.forEach(id => {
        statsMap.set(id, {
          alunosInscritos: 0,
          alunosPix: 0,
          alunosCartao: 0,
          totalAlunosAtivos: 0,
          totalPedidosAtivos: 0,
          statusPedidos: {},
          alunosPorStatus: {}
        });
      });

      ordersData.forEach(p => {
        const id = p.excursaoPedagogicaId;
        if (!id || !statsMap.has(id)) return;
        
        const stats = statsMap.get(id);
        const numAlunos = p._count.itens;

        stats.totalPedidosAtivos++;
        stats.totalAlunosAtivos += numAlunos;
        stats.statusPedidos[p.status] = (stats.statusPedidos[p.status] || 0) + 1;
        stats.alunosPorStatus[p.status] = (stats.alunosPorStatus[p.status] || 0) + numAlunos;

        if (p.status === 'PAGO' || p.status === 'CONFIRMADO') {
          stats.alunosInscritos += numAlunos;
          if (p.metodoPagamento === 'pix') stats.alunosPix += numAlunos;
          if (p.metodoPagamento === 'cartao') stats.alunosCartao += numAlunos;
        }
      });

      const data = excursoes.map(e => ({
        ...e,
        preco: Number(e.preco),
        ...statsMap.get(e.id)
      }));

      logger.info('[Listas] Excursões listadas com sucesso (Otimizado)', {
        context: {
          adminId: req.user!.id,
          total: data.length,
          totalAlunos: data.reduce((sum, e) => sum + e.totalAlunosAtivos, 0)
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
          duracao: true,
          vagas: true
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
      const alunos = pedidos.flatMap(pedido => {
        const dadosResp = pedido.dadosResponsavelFinanceiro as Record<string, string> | null;

        return pedido.itens.map(item => ({
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
          responsavel: item.responsavel || (dadosResp ? `${dadosResp.nome || ''} ${dadosResp.sobrenome || ''}`.trim() : null),
          telefoneResponsavel: item.telefoneResponsavel || dadosResp?.telefone || null,
          emailResponsavel: item.emailResponsavel || dadosResp?.email || null,
          observacoes: item.observacoes || pedido.observacoes || null,
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
        }));
      });

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
 * Explicação da API [POST /api/admin/listas/atualizar-pagamentos-todas]
 *
 * Sincroniza status de pagamento com o Asaas para TODOS os pedidos de excursões
 * pedagógicas que estão AGUARDANDO_PAGAMENTO ou PENDENTE. Consulta o Asaas e
 * atualiza para PAGO quando a cobrança foi confirmada. Permite ao admin forçar
 * atualização imediata de todas as listas de uma vez.
 *
 * Response: { success, data: { atualizados, total } }
 */
router.post('/atualizar-pagamentos-todas',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('[Listas] Admin solicitando atualização de pagamentos de todas as listas', {
        context: { adminId: req.user!.id }
      });

      if (!verificarConfigAsaas()) {
        throw ApiError.internal('Gateway de pagamento não configurado');
      }

      const pedidos = await prisma.pedido.findMany({
        where: {
          excursaoPedagogicaId: { not: null },
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
      logger.error('[Listas] Erro ao atualizar pagamentos de todas as listas', {
        context: {
          error: error instanceof Error ? error.message : 'Unknown',
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
 * Explicação da API [GET /api/admin/listas/excursao/:id/exportar-completa]
 *
 * Exporta TODAS as informações preenchidas no ato da compra em Excel (.xlsx).
 * Inclui: dados do aluno, informações médicas, dados do pedido, cliente e responsável financeiro.
 *
 * Params: { id: string } - ID da excursão pedagógica
 * Sempre inclui apenas pedidos com pagamento confirmado (PAGO ou CONFIRMADO).
 *
 * Response: arquivo Excel (.xlsx)
 */
router.get('/excursao/:id/exportar-completa',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      logger.info('[Listas] Iniciando extração completa de Excel (apenas pagamento confirmado)', {
        context: {
          adminId: req.user!.id,
          excursaoId: id
        }
      });

      const excursao = await prisma.excursaoPedagogica.findUnique({
        where: { id },
        select: { id: true, codigo: true, titulo: true }
      });

      if (!excursao) {
        logger.warn('[Listas] Excursão não encontrada para extração completa', {
          context: { excursaoId: id }
        });
        throw ApiError.notFound('Excursão pedagógica não encontrada');
      }

      // Apenas pedidos com pagamento confirmado (PAGO ou CONFIRMADO)
      const wherePedido = {
        excursaoPedagogicaId: id,
        status: { in: ['PAGO', 'CONFIRMADO'] as PedidoStatus[] }
      };

      const pedidos = await prisma.pedido.findMany({
        where: wherePedido,
        orderBy: { createdAt: 'asc' },
        include: {
          itens: { orderBy: { nomeAluno: 'asc' } },
          cliente: {
            select: { nome: true, email: true, telefone: true }
          }
        }
      });

      const alunos = pedidos.flatMap(pedido =>
        pedido.itens.map(item => ({
          item,
          pedido,
          cliente: pedido.cliente,
          dadosResp: pedido.dadosResponsavelFinanceiro as Record<string, string> | null
        }))
      );

      if (alunos.length === 0) {
        logger.warn('[Listas] Nenhum aluno para extração completa', {
          context: { excursaoId: id }
        });
        throw ApiError.badRequest('Nenhum aluno encontrado para exportar');
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Extração Completa');

      const formatDate = (d: Date | null | undefined) =>
        d ? new Date(d).toLocaleDateString('pt-BR') : '';

      worksheet.columns = [
        { header: 'Nome do Aluno', key: 'nomeAluno', width: 25 },
        { header: 'Idade', key: 'idadeAluno', width: 8 },
        { header: 'Data Nascimento', key: 'dataNascimento', width: 14 },
        { header: 'Escola', key: 'escolaAluno', width: 25 },
        { header: 'Série', key: 'serieAluno', width: 15 },
        { header: 'Turma', key: 'turma', width: 10 },
        { header: 'Unidade Colégio', key: 'unidadeColegio', width: 18 },
        { header: 'CPF Aluno', key: 'cpfAluno', width: 18 },
        { header: 'RG Aluno', key: 'rgAluno', width: 15 },
        { header: 'Responsável', key: 'responsavel', width: 22 },
        { header: 'CPF Responsável', key: 'cpfResponsavel', width: 18 },
        { header: 'Tel. Responsável', key: 'telefoneResponsavel', width: 18 },
        { header: 'Email Responsável', key: 'emailResponsavel', width: 25 },
        { header: 'Endereço Responsável', key: 'enderecoResponsavel', width: 40 },
        { header: 'Observações', key: 'observacoes', width: 25 },
        { header: 'Alergias/Cuidados', key: 'alergiasCuidados', width: 30 },
        { header: 'Plano de Saúde', key: 'planoSaude', width: 20 },
        { header: 'Medic. Febre', key: 'medicamentosFebre', width: 18 },
        { header: 'Medic. Alergia', key: 'medicamentosAlergia', width: 18 },
        { header: 'Status Pedido', key: 'statusPedido', width: 18 },
        { header: 'Data Pedido', key: 'dataPedido', width: 14 },
        { header: 'Data Pagamento', key: 'dataPagamento', width: 14 },
        { header: 'Valor Unitário', key: 'valorUnitario', width: 14 },
        { header: 'Cliente (Nome)', key: 'clienteNome', width: 22 },
        { header: 'Cliente (Email)', key: 'clienteEmail', width: 25 },
        { header: 'Cliente (Tel)', key: 'clienteTelefone', width: 18 },
        // { header: 'Resp. Fin. Nome', key: 'respNome', width: 22 },
        // { header: 'Resp. Fin. CPF', key: 'respCpf', width: 18 },
        // { header: 'Resp. Fin. Email', key: 'respEmail', width: 25 },
        // { header: 'Resp. Fin. Endereço', key: 'respEndereco', width: 30 }
      ];

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      alunos.forEach(({ item, pedido, cliente, dadosResp }) => {
        if (!item.nomeAluno || item.nomeAluno.trim().length < 2) return;

        worksheet.addRow({
          nomeAluno: item.nomeAluno || '',
          idadeAluno: item.idadeAluno ?? '',
          dataNascimento: formatDate(item.dataNascimento),
          escolaAluno: item.escolaAluno || '',
          serieAluno: item.serieAluno || '',
          turma: item.turma || '',
          unidadeColegio: item.unidadeColegio || '',
          cpfAluno: item.cpfAluno || '',
          rgAluno: item.rgAluno || '',
          responsavel: dadosResp ? `${dadosResp.nome || ''} ${dadosResp.sobrenome || ''}`.trim() : '',
          cpfResponsavel: dadosResp?.cpf || '',
          telefoneResponsavel: dadosResp?.telefone || '',
          emailResponsavel: dadosResp?.email || '',
          enderecoResponsavel: dadosResp
            ? [dadosResp.endereco, dadosResp.numero, dadosResp.complemento, dadosResp.bairro, dadosResp.cidade, dadosResp.estado, dadosResp.cep]
              .filter(Boolean)
              .join(', ')
            : '',
          observacoes: pedido.observacoes || '',
          alergiasCuidados: item.alergiasCuidados || '',
          planoSaude: item.planoSaude || '',
          medicamentosFebre: item.medicamentosFebre || '',
          medicamentosAlergia: item.medicamentosAlergia || '',
          statusPedido: pedido.status || '',
          dataPedido: formatDate(pedido.createdAt),
          dataPagamento: formatDate(pedido.dataPagamento),
          valorUnitario: Number(pedido.valorUnitario).toFixed(2),
          clienteNome: cliente?.nome || '',
          clienteEmail: cliente?.email || '',
          clienteTelefone: cliente?.telefone || '',
          // respNome: dadosResp ? `${dadosResp.nome || ''} ${dadosResp.sobrenome || ''}`.trim() : '',
          // respCpf: dadosResp?.cpf || '',
          // respEmail: dadosResp?.email || '',
          // respEndereco: dadosResp
          //  ? [dadosResp.endereco, dadosResp.numero, dadosResp.complemento, dadosResp.bairro, dadosResp.cidade, dadosResp.estado, dadosResp.cep]
          //    .filter(Boolean)
          //    .join(', ')
          //  : ''
        });
      });

      const nomeArquivo = `extracao_completa_${excursao.codigo}_${new Date().toISOString().split('T')[0]}.xlsx`;

      logger.info('[Listas] Extração completa gerada com sucesso', {
        context: {
          adminId: req.user!.id,
          excursaoId: id,
          totalAlunos: alunos.filter(a => a.item.nomeAluno && a.item.nomeAluno.trim().length >= 2).length,
          nomeArquivo
        }
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);

      await workbook.xlsx.write(res);
      res.end();

      await prisma.activityLog.create({
        data: {
          action: 'export',
          entity: 'lista_alunos',
          entityId: excursao.id,
          description: `Extração completa exportada: ${excursao.titulo} (${alunos.length} alunos)`,
          userId: req.user!.id,
          userEmail: req.user!.email
        }
      });
    } catch (error) {
      logger.error('[Listas] Erro ao exportar extração completa', {
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
 * Explicação da API [GET /api/admin/listas/excursao/:id/exportar]
 * 
 * Exporta lista de alunos em formato Excel (.xlsx).
 * Gera arquivo conforme especificação da Lista de Chamada.
 * 
 * Params: { id: string } - ID da excursão pedagógica
 * Sempre inclui apenas pedidos com pagamento confirmado (PAGO ou CONFIRMADO).
 *
 * Response: arquivo Excel (.xlsx)
 */
router.get('/excursao/:id/exportar',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      logger.info('[Listas] Iniciando exportação de Excel (apenas pagamento confirmado)', {
        context: {
          adminId: req.user!.id,
          excursaoId: id
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

      // Apenas pedidos com pagamento confirmado (PAGO ou CONFIRMADO)
      const wherePedido = {
        excursaoPedagogicaId: id,
        status: { in: ['PAGO', 'CONFIRMADO'] as PedidoStatus[] }
      };

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

/**
 * Explicação da API [GET /api/admin/listas/excursao/:id/exportar-cancelados]
 * 
 * Exporta apenas pedidos CANCELADOS em formato Excel (.xlsx).
 * Útil para controle administrativo de desistências e estornos.
 * 
 * Params: { id: string } - ID da excursão pedagógica
 * 
 * Response: arquivo Excel (.xlsx)
 */
router.get('/excursao/:id/exportar-cancelados',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      logger.info('[Listas] Iniciando exportação de pedidos CANCELADOS', {
        context: {
          adminId: req.user!.id,
          excursaoId: id
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
        logger.warn('[Listas] Excursão pedagógica não encontrada para exportação de cancelados', {
          context: { excursaoId: id }
        });
        throw ApiError.notFound('Excursão pedagógica não encontrada');
      }

      // Apenas pedidos com status CANCELADO
      const wherePedido = {
        excursaoPedagogicaId: id,
        status: 'CANCELADO' as PedidoStatus
      };

      // Busca pedidos com itens e dados do cliente
      const pedidos = await prisma.pedido.findMany({
        where: wherePedido,
        orderBy: { updatedAt: 'desc' },
        include: {
          itens: {
            orderBy: { nomeAluno: 'asc' }
          },
          cliente: {
            select: { nome: true, email: true, telefone: true }
          }
        }
      });

      // Extrai alunos/itens
      const alunos = pedidos.flatMap(pedido =>
        pedido.itens.map(item => ({
          item,
          pedido,
          cliente: pedido.cliente
        }))
      );

      if (alunos.length === 0) {
        logger.warn('[Listas] Nenhum pedido cancelado encontrado para exportação', {
          context: { excursaoId: id }
        });
        throw ApiError.badRequest('Nenhum pedido cancelado encontrado para exportar');
      }

      // Cria workbook e worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Pedidos Cancelados');

      // Define colunas
      worksheet.columns = [
        { header: 'Nome do Aluno', key: 'nomeAluno', width: 30 },
        { header: 'Turma', key: 'turma', width: 15 },
        { header: 'Série', key: 'serie', width: 15 },
        { header: 'Responsável (Aluno)', key: 'responsavel', width: 25 },
        { header: 'Tel. Responsável', key: 'telResponsavel', width: 20 },
        { header: 'Comprador (Cliente)', key: 'clienteNome', width: 25 },
        { header: 'Email Comprador', key: 'clienteEmail', width: 25 },
        { header: 'Data Pedido', key: 'dataPedido', width: 15 },
        { header: 'Data Cancelamento', key: 'dataCancelamento', width: 15 },
        { header: 'Valor Pedido', key: 'valor', width: 15 }
      ];

      // Estiliza cabeçalho
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFCCCC' } // Fundo avermelhado para indicar cancelados
      };

      const formatDate = (d: Date | null | undefined) =>
        d ? new Date(d).toLocaleDateString('pt-BR') : '';

      // Adiciona dados
      alunos.forEach(({ item, pedido, cliente }) => {
        worksheet.addRow({
          nomeAluno: item.nomeAluno,
          turma: item.turma || '',
          serie: item.serieAluno || '',
          responsavel: item.responsavel || '',
          telResponsavel: item.telefoneResponsavel || '',
          clienteNome: cliente?.nome || '',
          clienteEmail: cliente?.email || '',
          dataPedido: formatDate(pedido.createdAt),
          dataCancelamento: formatDate(pedido.updatedAt),
          valor: Number(pedido.valorTotal).toFixed(2)
        });
      });

      // Nome do arquivo
      const nomeArquivo = `cancelados_${excursao.codigo}_${new Date().toISOString().split('T')[0]}.xlsx`;

      logger.info('[Listas] Excel de cancelados gerado com sucesso', {
        context: {
          adminId: req.user!.id,
          excursaoId: id,
          total: alunos.length,
          nomeArquivo
        }
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);

      await workbook.xlsx.write(res);
      res.end();

      // Log de atividade
      await prisma.activityLog.create({
        data: {
          action: 'export',
          entity: 'lista_alunos',
          entityId: excursao.id,
          description: `Lista de cancelados exportada: ${excursao.titulo} (${alunos.length} registros)`,
          userId: req.user!.id,
          userEmail: req.user!.email
        }
      });

    } catch (error) {
      logger.error('[Listas] Erro ao exportar Excel de cancelados', {
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
 * Explicação da API [GET /api/admin/listas/excursao/:id/exportar-escola]
 * Gera Excel no formato específico para a escola (Modelo ListaParaEscola)
 */
router.get('/excursao/:id/exportar-escola',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      logger.info('[Listas] Iniciando exportação para Escola', {
        context: {
          adminId: req.user!.id,
          excursaoId: id
        }
      });

      const excursao = await prisma.excursaoPedagogica.findUnique({
        where: { id },
        select: { 
          id: true, 
          titulo: true, 
          destino: true, 
          local: true, 
          dataDestino: true, 
          dataFimInscricoes: true 
        }
      });

      if (!excursao) {
        throw ApiError.notFound('Excursão pedagógica não encontrada');
      }

      const pedidos = await prisma.pedido.findMany({
        where: {
          excursaoPedagogicaId: id,
          status: { in: ['PAGO', 'CONFIRMADO'] as PedidoStatus[] }
        },
        include: {
          itens: { orderBy: { nomeAluno: 'asc' } }
        }
      });

      const itens = pedidos.flatMap(p => p.itens);

      if (itens.length === 0) {
        throw ApiError.badRequest('Nenhum aluno encontrado para exportar');
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Lista para Escola');

      const formatDate = (d: Date | null | undefined) =>
        d ? new Date(d).toLocaleDateString('pt-BR') : '';

      // Tentar adicionar o logo do cabeçalho
      try {
        const logoPath = path.join(process.cwd(), "api/public/images/header_logo.png");
        if (fs.existsSync(logoPath)) {
          const logoId = workbook.addImage({
            buffer: fs.readFileSync(logoPath) as any,
            extension: "png",
          });

          worksheet.addImage(logoId, {
            tl: { col: 0.1, row: 0.1 },
            ext: { width: 280, height: 96 }
          });
        }
      } catch (err) {
        logger.warn("[Listas] Erro ao carregar logo para Excel", { error: err });
      }

      // Título do Trabalho de Campo (Linha 1)
      const row1 = worksheet.getRow(1);
      row1.getCell(2).value = `TRABALHO DE CAMPO ${excursao.titulo.toUpperCase()}`;
      row1.font = { bold: true, size: 14 };
      worksheet.mergeCells('B1:H1');
      row1.getCell(2).alignment = { horizontal: 'center' };

      // Metadados (Linha 2)
      const escola = itens[0]?.escolaAluno || '';
      const destino = excursao.destino || excursao.local || '';
      const dataViagem = formatDate(excursao.dataDestino);
      const dataFim = formatDate(excursao.dataFimInscricoes);

      const row2 = worksheet.getRow(2);
      row2.getCell(2).value = `Colégio: ${escola}  - Destino: ${destino}   - Data: ${dataViagem}  - Inscrições até:  ${dataFim}`;
      row2.font = { size: 10 };
      worksheet.mergeCells('B2:H2');
      row2.getCell(2).alignment = { horizontal: 'center' };

      // Cabeçalho da Tabela (Linha 3)
      worksheet.getRow(3).values = [
        '', // Coluna A vazia como no modelo
        'Nº',
        'Nome do aluno',
        'Série',
        'Turma',
        'Unidade',
        'RG',
        'Data de Nascimento'
      ];
      
      const headerRow = worksheet.getRow(3);
      headerRow.font = { bold: true };
      headerRow.eachCell((cell, colNumber) => {
        if (colNumber > 1) {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
          };
        }
      });

      // Dados dos Alunos
      itens.forEach((item, index) => {
        const rowIndex = index + 4;
        const row = worksheet.getRow(rowIndex);
        row.values = [
          '',
          index + 1,
          item.nomeAluno,
          item.serieAluno,
          item.turma,
          item.unidadeColegio,
          item.rgAluno,
          formatDate(item.dataNascimento)
        ];

        row.eachCell((cell, colNumber) => {
          if (colNumber > 1) {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          }
        });
      });

      // Larguras das colunas
      worksheet.getColumn(1).width = 2;
      worksheet.getColumn(2).width = 5; // Nº
      worksheet.getColumn(3).width = 35; // Nome
      worksheet.getColumn(4).width = 15; // Série
      worksheet.getColumn(5).width = 10; // Turma
      worksheet.getColumn(6).width = 15; // Unidade
      worksheet.getColumn(7).width = 15; // RG
      worksheet.getColumn(8).width = 18; // Data Nasc

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=Lista_Escola_${excursao.titulo.replace(/\s+/g, '_')}.xlsx`
      );

      await workbook.xlsx.write(res);
      res.end();

    } catch (error) {
      logger.error('[Listas] Erro ao exportar Lista para Escola', {
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
 * Explicação da API [DELETE /api/admin/listas/aluno/:id]
 * Remove um aluno (ItemPedido) da listagem.
 * Se for o único aluno do pedido, remove o pedido inteiro.
 * Caso contrário, atualiza quantidade e valor total do pedido.
 */
router.delete('/aluno/:id', adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Busca o item para saber qual o pedido associado
    const item = await prisma.itemPedido.findUnique({
      where: { id },
      include: { pedido: true }
    });

    if (!item) {
      throw ApiError.notFound('Aluno não encontrado');
    }

    const pedidoId = item.pedidoId;

    // Verifica quantos itens o pedido tem
    const totalItens = await prisma.itemPedido.count({
      where: { pedidoId }
    });

    if (totalItens <= 1) {
      // Deleta o pedido inteiro (cascade deletará o item)
      await prisma.pedido.delete({
        where: { id: pedidoId }
      });
      
      logger.info('[Listas] Pedido removido por ser o último aluno', {
        context: { pedidoId, alunoId: id, adminId: req.user!.id }
      });
    } else {
      // Deleta apenas o item
      await prisma.itemPedido.delete({
        where: { id }
      });

      // Atualiza o pedido (quantidade e valor total)
      const novaQuantidade = totalItens - 1;
      const novoValorTotal = Number(item.pedido.valorUnitario) * novaQuantidade;

      await prisma.pedido.update({
        where: { id: pedidoId },
        data: {
          quantidade: novaQuantidade,
          valorTotal: novoValorTotal
        }
      });

      logger.info('[Listas] Aluno removido do pedido', {
        context: { pedidoId, alunoId: id, adminId: req.user!.id, novaQuantidade }
      });
    }

    // Log de atividade
    await prisma.activityLog.create({
      data: {
        action: 'delete',
        entity: 'aluno_lista',
        entityId: id,
        description: `Aluno ${item.nomeAluno} removido da lista pelo admin`,
        userId: req.user!.id,
        userEmail: req.user!.email
      }
    });

    res.json({ success: true, message: 'Aluno removido com sucesso' });

  } catch (error) {
    logger.error('[Listas] Erro ao deletar aluno', {
      context: {
        error: error instanceof Error ? error.message : 'Unknown error',
        alunoId: req.params.id,
        adminId: req.user?.id
      }
    });
    next(error);
  }
});

export default router;
