/**
 * Explicação do Arquivo [email.ts]
 *
 * Configuração do serviço de e-mail via API Brevo (HTTPS).
 * Usa a API REST do Brevo em vez de SMTP — ideal para Railway Hobby (SMTP bloqueado).
 *
 * Variáveis de ambiente necessárias (configurar no Railway):
 * - BREVO_API_KEY: Chave API do Brevo (obtenha em https://app.brevo.com/settings/keys/api)
 * - BREVO_FROM_NAME: Nome exibido no remetente (ex.: Avoar Turismo)
 * - BREVO_FROM_EMAIL: E-mail do remetente (ex.: contato@avoarturismo.com.br)
 */

import { logger } from '../utils/logger';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Explicação da função [getFromAddress]:
 * Retorna o endereço de e-mail do remetente formatado com nome.
 * Ex.: "Avoar Turismo <contato@avoarturismo.com.br>"
 */
export function getFromAddress(): string {
  const fromName = process.env.BREVO_FROM_NAME || 'Avoar Turismo';
  const fromEmail = process.env.BREVO_FROM_EMAIL || '';
  return `"${fromName}" <${fromEmail}>`;
}

/**
 * Explicação da função [getSender]:
 * Retorna objeto sender para a API Brevo.
 */
export function getSender(): { name: string; email: string } {
  const name = process.env.BREVO_FROM_NAME || 'Avoar Turismo';
  const email = process.env.BREVO_FROM_EMAIL || '';
  return { name, email };
}

/**
 * Explicação da função [verificarConfigEmail]:
 * Verifica se as variáveis de ambiente do Brevo estão configuradas.
 */
export function verificarConfigEmail(): boolean {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL;

  if (!apiKey || !apiKey.trim()) {
    logger.error('[Email] ❌ Configuração incompleta', {
      context: {
        hasApiKey: !!apiKey,
        solution: 'Configure BREVO_API_KEY nas Variables do Railway'
      }
    });
    return false;
  }

  if (!fromEmail || !fromEmail.trim()) {
    logger.error('[Email] ❌ BREVO_FROM_EMAIL não definido', {
      context: { solution: 'Configure BREVO_FROM_EMAIL nas Variables do Railway' }
    });
    return false;
  }

  return true;
}

/**
 * Explicação da função [healthCheckEmail]:
 * Valida a API key do Brevo via GET /account (não envia e-mail).
 */
export async function healthCheckEmail(): Promise<{ ok: boolean; error?: string }> {
  if (!verificarConfigEmail()) {
    return { ok: false, error: 'Configuração incompleta (BREVO_API_KEY ou BREVO_FROM_EMAIL ausente)' };
  }

  const sender = getSender();

  logger.info('[Email] 🔄 Iniciando health check Brevo API...', {
    context: { fromEmail: sender.email }
  });

  try {
    const res = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY!.trim()
      }
    });

    const data = await res.json().catch(() => ({})) as { email?: string; message?: string };

    if (res.ok) {
      logger.info('[Email] ✅ Health check OK — API Brevo funcionando', {
        context: { fromEmail: sender.email }
      });
      return { ok: true };
    }

    const msg = data?.message || `HTTP ${res.status}`;
    logger.error('[Email] ❌ Health check FALHOU', {
      context: {
        status: res.status,
        error: msg,
        fromEmail: sender.email,
        solucao: [
          '1. Verifique se BREVO_API_KEY está correta (https://app.brevo.com/settings/keys/api)',
          '2. Confirme que BREVO_FROM_EMAIL é um remetente verificado no Brevo',
          '3. Domínio deve estar autenticado em Remetentes e Domínios'
        ]
      }
    });
    return { ok: false, error: msg };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('[Email] ❌ Health check FALHOU — erro de rede', {
      context: { error: msg, fromEmail: sender.email }
    });
    return { ok: false, error: msg };
  }
}

/**
 * Explicação da função [enviarEmailViaBrevo]:
 * Envia e-mail via API REST do Brevo.
 * Usado internamente pelo email-service.ts.
 */
export async function enviarEmailViaBrevo(params: {
  para: string;
  assunto: string;
  html: string;
  texto?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const sender = getSender();

  if (!apiKey || !sender.email) {
    return {
      success: false,
      error: 'Configuração incompleta (BREVO_API_KEY ou BREVO_FROM_EMAIL)'
    };
  }

  const body: Record<string, unknown> = {
    sender: { name: sender.name, email: sender.email },
    to: [{ email: params.para }],
    subject: params.assunto,
    htmlContent: params.html
  };

  if (params.texto) {
    body.textContent = params.texto;
  }

  const res = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify(body)
  });

  const data = await res.json().catch(() => ({})) as { messageId?: string; message?: string; code?: string };

  if (res.ok) {
    return { success: true, messageId: data.messageId };
  }

  const errorMsg = data.message || data.code || `HTTP ${res.status}`;
  return { success: false, error: errorMsg };
}
