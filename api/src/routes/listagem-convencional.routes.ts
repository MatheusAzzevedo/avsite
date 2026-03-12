/**
 * Explicação do Arquivo [listagem-convencional.routes.ts]
 *
 * Rotas admin para listagem de compras convencionais (viagens).
 * Lista pedidos tipo CONVENCIONAL com dados dos passageiros.
 *
 * Rotas disponíveis:
 * - GET /api/admin/listagem-convencional - Listar todos os pedidos convencionais
 * - GET /api/admin/listagem-convencional/exportar - Exportar Excel de todas as compras
 * - GET /api/admin/listagem-convencional/:id - Detalhes de um pedido
 * - DELETE /api/admin/listagem-convencional/:id - Excluir pedido
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';
import ExcelJS from 'exceljs';

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

/** Formata data para pt-BR */
const formatDate = (d: Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString('pt-BR') : '';

/** Status legível em português */
const statusLabels: Record<string, string> = {
  PENDENTE: 'Pendente',
  AGUARDANDO_PAGAMENTO: 'Aguardando Pagamento',
  PAGO: 'Pago',
  CONFIRMADO: 'Confirmado',
  CANCELADO: 'Cancelado',
  EXPIRADO: 'Expirado'
};

/**
 * GET /api/admin/listagem-convencional
 * Lista todos os pedidos de viagens convencionais com excursão e itens.
 */
router.get('/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('[Listagem Convencional] Listando pedidos', {
        context: { adminId: req.user!.id }
      });

      const pedidos = await prisma.pedido.findMany({
        where: { tipo: 'CONVENCIONAL' },
        orderBy: { createdAt: 'desc' },
        include: {
          excursao: {
            select: { id: true, titulo: true, slug: true, preco: true }
          },
          cliente: {
            select: { id: true, nome: true, email: true, telefone: true }
          },
          itens: { orderBy: { nomeAluno: 'asc' } }
        }
      });

      const data = pedidos.map(p => ({
        id: p.id,
        excursaoTitulo: p.excursao?.titulo || 'N/D',
        excursaoSlug: p.excursao?.slug || null,
        quantidade: p.quantidade,
        valorUnitario: Number(p.valorUnitario),
        valorTotal: Number(p.valorTotal),
        status: p.status,
        statusLabel: statusLabels[p.status] || p.status,
        dataPedido: p.createdAt,
        dataPedidoFormatada: formatDate(p.createdAt),
        cliente: p.cliente,
        totalPassageiros: p.itens.length,
        itens: p.itens.map(item => ({
          id: item.id,
          nomeAluno: item.nomeAluno,
          cpfAluno: item.cpfAluno,
          telefoneResponsavel: item.telefoneResponsavel,
          emailResponsavel: item.emailResponsavel,
          observacoes: item.observacoes
        }))
      }));

      res.json({ success: true, data });
    } catch (error) {
      logger.error('[Listagem Convencional] Erro ao listar', {
        context: { error: error instanceof Error ? error.message : 'Unknown', adminId: req.user?.id }
      });
      next(error);
    }
  }
);

/**
 * GET /api/admin/listagem-convencional/exportar
 * Exporta todos os pedidos convencionais em Excel (.xlsx).
 */
router.get('/exportar',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('[Listagem Convencional] Iniciando exportação Excel', {
        context: { adminId: req.user!.id }
      });

      const pedidos = await prisma.pedido.findMany({
        where: { tipo: 'CONVENCIONAL' },
        orderBy: { createdAt: 'desc' },
        include: {
          excursao: { select: { titulo: true, slug: true } },
          cliente: { select: { nome: true, email: true, telefone: true } },
          itens: { orderBy: { nomeAluno: 'asc' } }
        }
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Listagem Convencional');

      worksheet.columns = [
        { header: 'ID Pedido', key: 'pedidoId', width: 36 },
        { header: 'Viagem', key: 'excursaoTitulo', width: 30 },
        { header: 'Quantidade', key: 'quantidade', width: 12 },
        { header: 'Valor Total', key: 'valorTotal', width: 14 },
        { header: 'Status', key: 'status', width: 18 },
        { header: 'Data Pedido', key: 'dataPedido', width: 14 },
        { header: 'Cliente', key: 'clienteNome', width: 25 },
        { header: 'Cliente Email', key: 'clienteEmail', width: 28 },
        { header: 'Cliente Tel', key: 'clienteTelefone', width: 18 },
        { header: 'Nome Passageiro', key: 'nomePassageiro', width: 28 },
        { header: 'CPF', key: 'cpf', width: 18 },
        { header: 'Telefone', key: 'telefone', width: 18 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Endereço', key: 'endereco', width: 40 }
      ];

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      pedidos.forEach(pedido => {
        const excursaoTitulo = pedido.excursao?.titulo || 'N/D';
        const clienteNome = pedido.cliente?.nome || '';
        const clienteEmail = pedido.cliente?.email || '';
        const clienteTelefone = pedido.cliente?.telefone || '';
        const valorTotal = Number(pedido.valorTotal).toFixed(2);
        const dataPedido = formatDate(pedido.createdAt);
        const statusLabel = statusLabels[pedido.status] || pedido.status;

        pedido.itens.forEach((item, idx) => {
          let endereco = '';
          if (item.observacoes) {
            try {
              const obs = JSON.parse(item.observacoes) as Record<string, string>;
              const parts = [
                obs.endereco,
                obs.numero,
                obs.complemento,
                obs.bairro,
                obs.cidade,
                obs.estado,
                obs.cep
              ].filter(Boolean);
              endereco = parts.join(', ');
            } catch {
              endereco = item.observacoes;
            }
          }

          worksheet.addRow({
            pedidoId: idx === 0 ? pedido.id : '',
            excursaoTitulo: idx === 0 ? excursaoTitulo : '',
            quantidade: idx === 0 ? pedido.quantidade : '',
            valorTotal: idx === 0 ? valorTotal : '',
            status: idx === 0 ? statusLabel : '',
            dataPedido: idx === 0 ? dataPedido : '',
            clienteNome: idx === 0 ? clienteNome : '',
            clienteEmail: idx === 0 ? clienteEmail : '',
            clienteTelefone: idx === 0 ? clienteTelefone : '',
            nomePassageiro: item.nomeAluno || '',
            cpf: item.cpfAluno || '',
            telefone: item.telefoneResponsavel || '',
            email: item.emailResponsavel || '',
            endereco
          });
        });

        if (pedido.itens.length === 0) {
          worksheet.addRow({
            pedidoId: pedido.id,
            excursaoTitulo,
            quantidade: pedido.quantidade,
            valorTotal,
            status: statusLabel,
            dataPedido,
            clienteNome,
            clienteEmail,
            clienteTelefone,
            nomePassageiro: '(sem passageiros)',
            cpf: '',
            telefone: '',
            email: '',
            endereco: ''
          });
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const filename = `listagem_convencional_${new Date().toISOString().split('T')[0]}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(Buffer.from(buffer));
    } catch (error) {
      logger.error('[Listagem Convencional] Erro ao exportar', {
        context: { error: error instanceof Error ? error.message : 'Unknown', adminId: req.user?.id }
      });
      next(error);
    }
  }
);

/**
 * GET /api/admin/listagem-convencional/:id
 * Detalhes completos de um pedido convencional.
 */
router.get('/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const pedido = await prisma.pedido.findFirst({
        where: { id, tipo: 'CONVENCIONAL' },
        include: {
          excursao: true,
          cliente: { select: { id: true, nome: true, email: true, telefone: true } },
          itens: { orderBy: { nomeAluno: 'asc' } }
        }
      });

      if (!pedido) {
        throw ApiError.notFound('Pedido não encontrado');
      }

      const passageiros = pedido.itens.map(item => {
        let enderecoObj: Record<string, string> = {};
        if (item.observacoes) {
          try {
            enderecoObj = JSON.parse(item.observacoes) as Record<string, string>;
          } catch {
            enderecoObj = {};
          }
        }

        return {
          id: item.id,
          nome: item.nomeAluno,
          cpf: item.cpfAluno,
          telefone: item.telefoneResponsavel,
          email: item.emailResponsavel,
          endereco: enderecoObj
        };
      });

      res.json({
        success: true,
        data: {
          id: pedido.id,
          excursao: pedido.excursao
            ? { ...pedido.excursao, preco: Number(pedido.excursao.preco) }
            : null,
          quantidade: pedido.quantidade,
          valorUnitario: Number(pedido.valorUnitario),
          valorTotal: Number(pedido.valorTotal),
          status: pedido.status,
          statusLabel: statusLabels[pedido.status] || pedido.status,
          observacoes: pedido.observacoes,
          createdAt: pedido.createdAt,
          dataPagamento: pedido.dataPagamento,
          cliente: pedido.cliente,
          passageiros
        }
      });
    } catch (error) {
      logger.error('[Listagem Convencional] Erro ao buscar detalhes', {
        context: { pedidoId: req.params.id, error: error instanceof Error ? error.message : 'Unknown' }
      });
      next(error);
    }
  }
);

/**
 * DELETE /api/admin/listagem-convencional/:id
 * Exclui um pedido convencional (e seus itens por cascade).
 */
router.delete('/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const pedido = await prisma.pedido.findFirst({
        where: { id, tipo: 'CONVENCIONAL' },
        select: { id: true }
      });

      if (!pedido) {
        throw ApiError.notFound('Pedido não encontrado');
      }

      await prisma.pedido.delete({
        where: { id }
      });

      logger.info('[Listagem Convencional] Pedido excluído', {
        context: { adminId: req.user!.id, pedidoId: id }
      });

      res.json({ success: true, message: 'Pedido excluído com sucesso' });
    } catch (error) {
      logger.error('[Listagem Convencional] Erro ao excluir', {
        context: { pedidoId: req.params.id, error: error instanceof Error ? error.message : 'Unknown' }
      });
      next(error);
    }
  }
);

export default router;
