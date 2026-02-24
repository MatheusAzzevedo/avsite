/**
 * Explicação do Arquivo [admin-email.routes.ts]
 *
 * Rotas administrativas para envio de e-mails de teste.
 *
 * Rotas disponíveis:
 * - POST /api/admin/email/teste-confirmacao - Envia e-mail de confirmação de inscrição para endereços de teste
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';
import { enviarEmail } from '../utils/email-service';
import {
  gerarTemplateConfirmacaoPedido,
  gerarTextoConfirmacaoPedido,
  DadosEmailConfirmacao
} from '../templates/email-confirmacao-pedido';

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

/** E-mails fixos para teste de confirmação de inscrição */
const EMAILS_TESTE = ['azetus.io@gmail.com', 'dantydias@yahoo.com.br'] as const;

/**
 * Dados mock para o template de confirmação (apenas para teste visual/SMTP)
 */
function obterDadosMockEmailConfirmacao(): DadosEmailConfirmacao {
  const hoje = new Date();
  return {
    numeroPedido: 'TESTE-' + hoje.getTime().toString(36).toUpperCase(),
    dataPedido: hoje,
    nomeCliente: 'Cliente Teste',
    nomeProduto: 'Excursão Pedagógica - Teste de E-mail',
    quantidade: 2,
    valorUnitario: 150.0,
    valorTotal: 300.0,
    metodoPagamento: 'pix',
    observacoes: 'E-mail enviado automaticamente pelo botão de teste do painel admin.',
    estudantes: [
      {
        nomeAluno: 'Estudante Exemplo 1',
        dataNascimento: '2010-05-15',
        serieAluno: '8º ano',
        turma: 'A',
        alergiasCuidados: 'Nenhuma'
      },
      {
        nomeAluno: 'Estudante Exemplo 2',
        dataNascimento: '2011-03-20',
        serieAluno: '7º ano',
        turma: 'B'
      }
    ],
    endereco: {
      nome: 'Cliente Teste',
      rua: 'Rua Exemplo',
      numero: '123',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01234-567',
      telefone: '(11) 99999-9999',
      email: 'contato@avoarturismo.com.br'
    }
  };
}

/**
 * Explicação da API [POST /api/admin/email/teste-confirmacao]
 *
 * Envia o e-mail de confirmação de inscrição (com dados mock) para os endereços
 * azetus.io@gmail.com e dantydias@yahoo.com.br.
 * Usado para validar o template e a configuração SMTP (Brevo).
 */
router.post('/teste-confirmacao',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('[Admin Email] Enviando e-mails de teste de confirmação', {
        context: {
          adminId: req.user!.id,
          destinatarios: EMAILS_TESTE
        }
      });

      const dadosEmail = obterDadosMockEmailConfirmacao();
      const html = gerarTemplateConfirmacaoPedido(dadosEmail);
      const texto = gerarTextoConfirmacaoPedido(dadosEmail);
      const assunto = '[TESTE] Inscrição C-O-N-F-I-R-M-A-D-A❤️ Ficamos felizes em avisar que seu pedido foi concluído!';

      const resultados: Array<{ email: string; success: boolean; error?: string }> = [];

      for (const email of EMAILS_TESTE) {
        const resultado = await enviarEmail({
          para: email,
          assunto,
          html,
          texto
        });

        resultados.push({
          email,
          success: resultado.success,
          error: resultado.error
        });

        if (resultado.success) {
          logger.info('[Admin Email] E-mail de teste enviado com sucesso', {
            context: { para: email, messageId: resultado.messageId }
          });
        } else {
          logger.error('[Admin Email] Falha ao enviar e-mail de teste', {
            context: { para: email, error: resultado.error }
          });
        }
      }

      const todosSucesso = resultados.every(r => r.success);
      const algumSucesso = resultados.some(r => r.success);

      res.status(todosSucesso ? 200 : algumSucesso ? 207 : 500).json({
        success: algumSucesso,
        message: todosSucesso
          ? 'E-mails de teste enviados com sucesso.'
          : algumSucesso
            ? 'Alguns e-mails foram enviados. Verifique os erros.'
            : 'Falha ao enviar os e-mails de teste.',
        data: { resultados }
      });
    } catch (error) {
      logger.error('[Admin Email] Erro ao enviar e-mails de teste', {
        context: {
          adminId: req.user?.id,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      });
      next(error);
    }
  }
);

export default router;
