/**
 * Explicação do Arquivo [sincronizacao-gestao.routes.ts]
 *
 * Rotas usadas pela gestão (avoar) para espelhar o site:
 * - GET /: id e data da última edição de cada excursão (botão de sincronização).
 * - GET /alunos: alunos pagos de uma excursão (lista de chamada do Registro).
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';
import { validateQuery } from '../middleware/validate.middleware';
import { alunosPagosQuerySchema } from '../schemas/sincronizacao.schema';
import { STATUS_DE_PAGAMENTO } from '../utils/transicoes-pedido';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

/**
 * Explicação da API [GET /api/admin/sincronizacao]:
 * { pedagogicas: [{ id, updatedAt }], convencionais: [{ id, updatedAt }] }.
 * Só id e data: a listagem da gestão chama isso toda vez que abre.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [pedagogicas, convencionais] = await Promise.all([
      prisma.excursaoPedagogica.findMany({ select: { id: true, updatedAt: true } }),
      prisma.excursao.findMany({ select: { id: true, updatedAt: true } })
    ]);

    logger.info('[AVSITE-API] 🔄 Sincronização com a gestão consultada', {
      context: { userEmail: req.user?.email, pedagogicas: pedagogicas.length, convencionais: convencionais.length }
    });

    res.json({ success: true, data: { pedagogicas, convencionais } });
  } catch (error) {
    next(error);
  }
});

/**
 * Explicação da API [GET /api/admin/sincronizacao/alunos?tipo=&excursaoId=&completo=]:
 * alunos (ItemPedido) de uma excursão, pedagógica ou convencional. Só ADMIN:
 * devolve CPF e telefone.
 * - Sem `completo`: só pedidos PAGO/CONFIRMADO e só os campos da lista de
 *   chamada. A gestão espelha isso na lista "Inscritos pelo site"; o id do
 *   item é a ligação, então aluno removido ou pedido cancelado sai de lá.
 * - Com `completo=1`: todos os pedidos, com a ficha inteira do aluno e o
 *   resumo do pedido. É o painel "Inscrições no site" da gestão, de onde ela
 *   corrige, remove e muda status (inclusive dar baixa em quem não pagou).
 */
router.get('/alunos', adminMiddleware, validateQuery(alunosPagosQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tipo, excursaoId, completo } = req.query as unknown as z.infer<typeof alunosPagosQuerySchema>;
    const daExcursao = tipo === 'PEDAGOGICA' ? { excursaoPedagogicaId: excursaoId } : { excursaoId };

    if (completo) {
      const itens = await prisma.itemPedido.findMany({
        where: { pedido: daExcursao },
        orderBy: { nomeAluno: 'asc' },
        include: {
          pedido: {
            select: {
              id: true,
              status: true,
              createdAt: true,
              valorTotal: true,
              quantidade: true,
              cliente: { select: { nome: true, email: true } }
            }
          }
        }
      });

      const inscricoes = itens.map(({ pedido, ...item }) => ({
        ...item,
        pedido: { ...pedido, valorTotal: Number(pedido.valorTotal) }
      }));

      logger.info('[AVSITE-API] 🔄 Inscrições consultadas pela gestão', {
        context: { userEmail: req.user?.email, tipo, excursaoId, total: inscricoes.length }
      });

      res.json({ success: true, data: { inscricoes } });
      return;
    }

    const itens = await prisma.itemPedido.findMany({
      where: { pedido: { status: { in: STATUS_DE_PAGAMENTO }, ...daExcursao } },
      orderBy: { nomeAluno: 'asc' },
      select: {
        id: true,
        nomeAluno: true,
        cpfAluno: true,
        serieAluno: true,
        turma: true,
        unidadeColegio: true,
        telefoneResponsavel: true,
        pedido: { select: { id: true, status: true } }
      }
    });

    const alunos = itens.map((i) => ({
      id: i.id,
      nome: i.nomeAluno,
      cpf: i.cpfAluno,
      serie: i.serieAluno,
      turma: i.turma,
      unidade: i.unidadeColegio,
      telefone: i.telefoneResponsavel,
      pedidoId: i.pedido.id,
      statusPedido: i.pedido.status
    }));

    logger.info('[AVSITE-API] 🔄 Alunos pagos consultados pela gestão', {
      context: { userEmail: req.user?.email, tipo, excursaoId, total: alunos.length }
    });

    res.json({ success: true, data: { alunos } });
  } catch (error) {
    next(error);
  }
});

export default router;
