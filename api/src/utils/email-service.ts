/**
 * Explicação do Arquivo [email-service.ts]
 * 
 * Serviço de envio de e-mails transacionais.
 * Utiliza o transporter configurado em config/email.ts.
 * 
 * Funcionalidades:
 * - enviarEmail: Envio genérico de e-mail (HTML ou texto)
 * - Logs detalhados para debug de envio/falha
 * - Validação de configuração antes do envio
 */

import { transporter, getFromAddress, verificarConfigEmail } from '../config/email';
import { logger } from './logger';

/**
 * Interface para os parâmetros de envio de e-mail
 */
interface EnviarEmailParams {
  /** E-mail do destinatário */
  para: string;
  /** Assunto do e-mail */
  assunto: string;
  /** Conteúdo HTML do e-mail */
  html: string;
  /** Conteúdo texto puro (fallback para clientes que não suportam HTML) */
  texto?: string;
}

/**
 * Explicação da função [enviarEmail]:
 * Envia um e-mail usando o transporter SMTP configurado.
 * 
 * Fluxo:
 * 1. Verifica se a configuração SMTP está completa
 * 2. Monta o e-mail com remetente, destinatário, assunto e conteúdo
 * 3. Envia via transporter (Nodemailer)
 * 4. Registra log de sucesso ou falha
 * 
 * @param params - Dados do e-mail (para, assunto, html, texto)
 * @returns { success: boolean, messageId?: string, error?: string }
 */
export async function enviarEmail(params: EnviarEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const { para, assunto, html, texto } = params;

  const from = getFromAddress();

  logger.info('[Email Service] Preparando envio de e-mail', {
    context: {
      de: from,
      para,
      assunto,
      htmlLength: html.length,
      temTexto: !!texto
    }
  });

  // Verifica configuração
  if (!verificarConfigEmail()) {
    logger.error('[Email Service] ❌ Envio cancelado — configuração SMTP incompleta', {
      context: {
        para,
        assunto,
        SMTP_HOST: process.env.SMTP_HOST || 'NÃO DEFINIDO',
        SMTP_PORT: process.env.SMTP_PORT || 'NÃO DEFINIDO',
        SMTP_USER: process.env.SMTP_USER ? 'DEFINIDO' : 'NÃO DEFINIDO',
        SMTP_PASS: process.env.SMTP_PASS ? 'DEFINIDO' : 'NÃO DEFINIDO'
      }
    });
    return { success: false, error: 'Configuração SMTP incompleta. Configure SMTP_USER e SMTP_PASS no Railway.' };
  }

  try {
    logger.info('[Email Service] 📤 Chamando transporter.sendMail()...', {
      context: { de: from, para, assunto }
    });

    const resultado = await transporter.sendMail({
      from,
      to: para,
      subject: assunto,
      html,
      text: texto || assunto // Fallback: usa o assunto como texto puro se não fornecido
    });

    logger.info('[Email Service] ✅ transporter.sendMail() retornou sucesso', {
      context: {
        de: from,
        para,
        assunto,
        messageId: resultado.messageId,
        response: resultado.response,
        accepted: resultado.accepted,
        rejected: resultado.rejected
      }
    });

    return { success: true, messageId: resultado.messageId };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    const errorCode = (error as any)?.code || 'SEM_CODIGO';
    const errorCommand = (error as any)?.command || 'SEM_COMANDO';

    logger.error('[Email Service] ❌ transporter.sendMail() lançou exceção', {
      context: {
        de: from,
        para,
        assunto,
        error: msg,
        errorCode,
        errorCommand,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined,
        smtpConfig: {
          host: process.env.SMTP_HOST || 'smtp.hostinger.com',
          port: process.env.SMTP_PORT || '465',
          secure: process.env.SMTP_SECURE !== 'false',
          user: process.env.SMTP_USER || 'NÃO DEFINIDO'
        }
      }
    });

    return { success: false, error: msg };
  }
}
