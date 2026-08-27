/**
 * Explicação do Arquivo [contato.routes.ts]
 *
 * Recebe o formulário de contato do site e encaminha por e-mail à equipe.
 *
 * É a única rota pública, sem autenticação, que dispara e-mail — por isso tem
 * limite de envio próprio, bem mais restrito que o global. Sem ele, o endereço
 * da Avoar viraria destino de spam automatizado.
 *
 * As mensagens não são gravadas em banco: a decisão foi entregá-las por e-mail,
 * que é onde a equipe já trabalha. Se um dia for preciso histórico, o ponto de
 * extensão é aqui, antes do envio.
 */

import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';
import { validateBody } from '../middleware/validate.middleware';
import { contatoSchema, DadosContato } from '../schemas/contato.schema';
import { enviarEmailViaBrevo, getSender, verificarConfigEmail } from '../config/email';
import { gerarAssuntoContato, gerarTemplateContato, gerarTextoContato } from '../templates/email-contato';

const router = Router();

/**
 * Explicação da função [destinoContato]
 * Endereço que recebe as mensagens do formulário.
 *
 * Configurável por ambiente para que trocar o destino seja uma mudança de
 * variável, não de código. Sem `CONTATO_EMAIL_DESTINO`, cai no remetente
 * verificado do Brevo, que é a caixa institucional da Avoar.
 */
function destinoContato(): string {
  // `getSender().email` e não `getFromAddress()`: o segundo devolve o formato
  // de cabeçalho ("Avoar Turismo" <contato@...>), que a API do Brevo recusa no
  // campo de destinatário com "email is not valid in to".
  return process.env.CONTATO_EMAIL_DESTINO?.trim() || getSender().email;
}

/**
 * Limite dedicado: 5 mensagens por IP a cada 15 minutos.
 *
 * Generoso para quem erra e reenvia, restritivo para envio automatizado. O
 * limite global de 100 req/15min não serve aqui, porque cada requisição desta
 * rota custa um e-mail.
 */
const limiteContato = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Muitas mensagens enviadas',
    message: 'Você já enviou várias mensagens. Aguarde alguns minutos antes de tentar de novo.'
  }
});

/**
 * Explicação da API [POST /api/public/contato]
 *
 * Body: { nome, sobrenome?, email, escola?, municipio?, telefone?, roteiro?, serie, mensagem? }
 * Response: { success, message }
 */
router.post('/contato',
  limiteContato,
  validateBody(contatoSchema),
  async (req: Request, res: Response) => {
    const dados = req.body as DadosContato;
    const ip = req.ip || req.socket.remoteAddress || 'desconhecido';

    logger.info('[Contato] Mensagem recebida pelo formulário do site', {
      context: { nome: dados.nome, email: dados.email, escola: dados.escola, ip }
    });

    if (!verificarConfigEmail()) {
      // Sem e-mail configurado a mensagem se perderia em silêncio. Melhor
      // avisar o visitante para procurar outro canal do que fingir sucesso.
      logger.error('[Contato] Envio impossível: e-mail não configurado', { context: { ip } });
      return res.status(503).json({
        error: 'Envio indisponível',
        message: 'Não foi possível enviar sua mensagem agora. Tente novamente mais tarde ou fale conosco pelo WhatsApp.'
      });
    }

    const recebidoEm = new Date();
    const resultado = await enviarEmailViaBrevo({
      para: destinoContato(),
      assunto: gerarAssuntoContato(dados),
      html: gerarTemplateContato(dados, recebidoEm),
      texto: gerarTextoContato(dados, recebidoEm)
    });

    if (!resultado.success) {
      logger.error('[Contato] Falha ao enviar a mensagem', {
        context: { email: dados.email, erro: resultado.error, ip }
      });
      return res.status(502).json({
        error: 'Falha no envio',
        message: 'Não conseguimos enviar sua mensagem agora. Tente novamente em alguns minutos.'
      });
    }

    logger.info('[Contato] Mensagem encaminhada por e-mail', {
      context: { email: dados.email, destino: destinoContato(), messageId: resultado.messageId }
    });

    res.json({
      success: true,
      message: 'Mensagem enviada! Em breve a equipe da Avoar entra em contato.'
    });
  }
);

export default router;
