/**
 * Explicação do Arquivo [google-oauth.ts]
 * 
 * Configuração e utilitários para Google OAuth 2.0.
 * Centraliza a lógica de autenticação com Google para facilitar uso nas rotas.
 * 
 * Fluxo OAuth:
 * 1. Cliente clica em "Login com Google"
 * 2. Redireciona para Google com client_id e redirect_uri
 * 3. Google autentica e retorna código de autorização
 * 4. Backend troca código por access_token
 * 5. Backend busca dados do usuário no Google
 * 6. Cria ou atualiza cliente no banco
 * 7. Retorna JWT do sistema
 */

import { google } from 'googleapis';
import { logger } from '../utils/logger';

/**
 * Cliente OAuth configurado com credenciais do Google
 */
export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/**
 * Escopos solicitados ao Google
 * - profile: Nome, foto de perfil
 * - email: Endereço de email
 */
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
];

/**
 * Explicação da função [getGoogleAuthUrl]
 * 
 * Gera URL de autenticação do Google OAuth.
 * Cliente deve ser redirecionado para esta URL.
 * 
 * @param state - String opcional para prevenir CSRF (pode ser usado para redirecionar após login)
 * @returns URL completa para redirecionar o cliente
 */
export function getGoogleAuthUrl(state?: string): string {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Solicita refresh_token
    scope: GOOGLE_SCOPES,
    state: state || '',
    prompt: 'select_account' // Sempre mostra seletor de conta
  });

  logger.info('[Google OAuth] URL de autenticação gerada', {
    context: { hasState: !!state, scopes: GOOGLE_SCOPES }
  });

  return url;
}

/**
 * Explicação da função [getGoogleUserInfo]
 * 
 * Troca código de autorização por access token e busca dados do usuário.
 * 
 * Fluxo:
 * 1. Troca código por tokens (access_token, refresh_token)
 * 2. Usa access_token para buscar dados do perfil do Google
 * 3. Retorna informações do usuário
 * 
 * @param code - Código de autorização recebido do Google
 * @returns Dados do usuário do Google
 * @throws Error se código inválido ou erro na API do Google
 */
export async function getGoogleUserInfo(code: string): Promise<{
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}> {
  try {
    logger.info('[Google OAuth] Trocando código por tokens', {
      context: { codeLength: code.length }
    });

    // Troca código por tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    logger.info('[Google OAuth] Tokens obtidos com sucesso', {
      context: { 
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token 
      }
    });

    // Busca informações do usuário
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2'
    });

    const { data } = await oauth2.userinfo.get();

    if (!data.id || !data.email) {
      logger.error('[Google OAuth] Dados incompletos recebidos do Google', {
        context: { hasId: !!data.id, hasEmail: !!data.email }
      });
      throw new Error('Dados incompletos recebidos do Google');
    }

    logger.info('[Google OAuth] Dados do usuário obtidos com sucesso', {
      context: { 
        googleId: data.id, 
        email: data.email,
        verified: data.verified_email 
      }
    });

    return {
      id: data.id,
      email: data.email,
      name: data.name || data.email.split('@')[0], // Usa parte do email se nome não disponível
      picture: data.picture || undefined,
      verified_email: data.verified_email || false
    };
  } catch (error) {
    logger.error('[Google OAuth] Erro ao obter dados do usuário', {
      context: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    throw error;
  }
}

/**
 * Explicação da função [verifyGoogleOAuthConfig]
 * 
 * Verifica se as variáveis de ambiente do Google OAuth estão configuradas.
 * Deve ser chamada na inicialização do servidor.
 * 
 * @returns true se configurado, false caso contrário
 */
export function verifyGoogleOAuthConfig(): boolean {
  const requiredVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    logger.warn('[Google OAuth] Variáveis de ambiente faltando', {
      context: { missing }
    });
    return false;
  }

  logger.info('[Google OAuth] Configuração verificada com sucesso', {
    context: { 
      clientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
      redirectUri: process.env.GOOGLE_REDIRECT_URI 
    }
  });

  return true;
}
