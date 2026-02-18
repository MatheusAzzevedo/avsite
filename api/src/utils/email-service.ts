/**
 * Explicação do Arquivo [email-service.ts]
 *
 * Serviço de envio de e-mails transacionais via API Brevo (HTTPS).
 * Usa a API REST do Brevo — compatível com Railway Hobby (SMTP bloqueado).
 *
 * Funcionalidades:
 * - enviarEmail: Envio genérico de e-mail (HTML ou texto)
 * - Logs detalhados para debug de envio/falha
 * - Validação de configuração antes do envio
 */

import { getFromAddress, verificarConfigEmail, enviarEmailViaBrevo } from '../config/email';
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
 * Envia um e-mail usando a API Brevo (HTTPS).
 *
 * Fluxo:
 * 1. Verifica se a configuração está completa
 * 2. Monta o e-mail com remetente, destinatário, assunto e conteúdo
 * 3. Envia via API Brevo
 * 4. Registra log de sucesso ou falha
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

  if (!verificarConfigEmail()) {
    logger.error('[Email Service] ❌ Envio cancelado — configuração incompleta', {
      context: {
        para,
        assunto,
        BREVO_API_KEY: process.env.BREVO_API_KEY ? 'DEFINIDO' : 'NÃO DEFINIDO',
        BREVO_FROM_EMAIL: process.env.BREVO_FROM_EMAIL ? 'DEFINIDO' : 'NÃO DEFINIDO'
      }
    });
    return {
      success: false,
      error: 'Configuração incompleta. Configure BREVO_API_KEY e BREVO_FROM_EMAIL no Railway.'
    };
  }

  try {
    logger.info('[Email Service] 📤 Enviando via API Brevo...', {
      context: { de: from, para, assunto }
    });

    const resultado = await enviarEmailViaBrevo({
      para,
      assunto,
      html,
      texto: texto || assunto
    });

    if (resultado.success) {
      logger.info('[Email Service] ✅ E-mail enviado com sucesso', {
        context: {
          de: from,
          para,
          assunto,
          messageId: resultado.messageId
        }
      });
      return { success: true, messageId: resultado.messageId };
    }

    logger.error('[Email Service] ❌ Falha no envio', {
      context: {
        de: from,
        para,
        assunto,
        error: resultado.error
      }
    });
    return { success: false, error: resultado.error };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('[Email Service] ❌ Exceção ao enviar e-mail', {
      context: {
        de: from,
        para,
        assunto,
        error: msg,
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    return { success: false, error: msg };
  }
}
