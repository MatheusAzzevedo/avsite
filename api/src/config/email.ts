/**
 * Explicação do Arquivo [email.ts]
 * 
 * Configuração do serviço de e-mail SMTP via Nodemailer.
 * Utiliza o SMTP da Hostinger para envio de e-mails transacionais.
 * 
 * Variáveis de ambiente necessárias (configurar no Railway):
 * - SMTP_HOST: Servidor SMTP (ex.: smtp.hostinger.com)
 * - SMTP_PORT: Porta SMTP (465 para SSL, 587 para TLS)
 * - SMTP_SECURE: true para SSL (porta 465), false para TLS (porta 587)
 * - SMTP_USER: E-mail completo (ex.: contato@avoarturismo.com.br)
 * - SMTP_PASS: Senha do e-mail
 * - SMTP_FROM_NAME: Nome exibido no remetente (ex.: Avoar Turismo)
 * - SMTP_FROM_EMAIL: E-mail do remetente (deve ser igual ao SMTP_USER)
 */

import dns from 'dns';
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

const { lookup } = dns.promises;

let _transporter: nodemailer.Transporter | null = null;

/**
 * Explicação da função [getTransporter]:
 * Retorna o transporter SMTP, resolvendo o host para IPv4 antes de conectar.
 * Força uso de IPv4 para evitar ENETUNREACH no Railway (que não suporta IPv6).
 */
export async function getTransporter(): Promise<nodemailer.Transporter> {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE !== 'false';
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  let connectHost = host;
  try {
    const { address } = await lookup(host, { family: 4 });
    connectHost = address;
    logger.info('[Email] Resolvido host para IPv4', { context: { host, ipv4: connectHost } });
  } catch (err) {
    logger.warn('[Email] Falha ao resolver IPv4, usando hostname', { context: { host, err } });
  }

  if (!user || !pass) {
    logger.warn('[Email] ⚠️ SMTP_USER ou SMTP_PASS não definidos. E-mails não serão enviados.');
  } else {
    logger.info('[Email] ✅ Configuração SMTP carregada', {
      context: { host: connectHost, port, secure, user }
    });
  }

  _transporter = nodemailer.createTransport({
    host: connectHost,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    tls: { rejectUnauthorized: true }
  });

  return _transporter;
}

/**
 * Explicação da função [getFromAddress]:
 * Retorna o endereço de e-mail do remetente formatado com nome.
 * Ex.: "Avoar Turismo <contato@avoarturismo.com.br>"
 * 
 * @returns String formatada com nome e e-mail do remetente
 */
export function getFromAddress(): string {
  const fromName = process.env.SMTP_FROM_NAME || 'Avoar Turismo';
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || '';
  return `"${fromName}" <${fromEmail}>`;
}

/**
 * Explicação da função [verificarConfigEmail]:
 * Verifica se as variáveis de ambiente do SMTP estão configuradas.
 * 
 * @returns true se configurado corretamente
 */
export function verificarConfigEmail(): boolean {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    logger.error('[Email] ❌ Configuração SMTP incompleta', {
      context: {
        hasUser: !!user,
        hasPass: !!pass,
        solution: 'Configure SMTP_USER e SMTP_PASS nas Variables do Railway'
      }
    });
    return false;
  }

  return true;
}

/**
 * Explicação da função [healthCheckEmail]:
 * Testa a conexão com o servidor SMTP.
 * Verifica se as credenciais estão corretas e o servidor está acessível.
 * Chamada na inicialização do servidor para diagnóstico.
 * 
 * @returns { ok: boolean, error?: string }
 */
export async function healthCheckEmail(): Promise<{ ok: boolean; error?: string }> {
  if (!verificarConfigEmail()) {
    return { ok: false, error: 'Configuração SMTP incompleta (SMTP_USER ou SMTP_PASS ausente)' };
  }

  try {
    const t = await getTransporter();
    await t.verify();
    logger.info('[Email] ✅ Health check OK — conexão SMTP funcionando', {
      context: {
        host: process.env.SMTP_HOST || 'smtp.hostinger.com',
        port: process.env.SMTP_PORT || '465',
        user: process.env.SMTP_USER
      }
    });
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('[Email] ❌ Health check FALHOU — erro na conexão SMTP', {
      context: {
        error: msg,
        host: process.env.SMTP_HOST || 'smtp.hostinger.com',
        port: process.env.SMTP_PORT || '465',
        user: process.env.SMTP_USER,
        solucao: [
          '1. Verifique se SMTP_USER e SMTP_PASS estão corretos no Railway',
          '2. Confirme que o e-mail existe no painel Hostinger',
          '3. Verifique se a porta 465 (SSL) está liberada',
          '4. Teste as credenciais em um cliente de e-mail (Outlook, Thunderbird)'
        ]
      }
    });
    return { ok: false, error: msg };
  }
}
