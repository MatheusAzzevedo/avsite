/**
 * Explicação do Arquivo [clicksign.ts]
 *
 * Configuração e serviço de integração com a Clicksign (API v3, JSON:API) para
 * assinatura do contrato em PDF antes da confirmação do pedido.
 *
 * Autenticação: header Authorization com o access_token puro (sem "Bearer").
 * Sandbox (sem validade jurídica): https://sandbox.clicksign.com
 * Produção: https://app.clicksign.com
 *
 * Fluxo de criação, nesta ordem — cada etapa depende do id retornado pela anterior:
 * 1. Criar Envelope            -> POST /envelopes
 * 2. Adicionar Documento       -> POST /envelopes/{id}/documents (PDF em base64)
 * 3. Adicionar Signatário      -> POST /envelopes/{id}/signers
 * 4. Requisito de Qualificação -> POST /envelopes/{id}/requirements (role: sign)
 * 5. Requisito de Autenticação -> POST /envelopes/{id}/requirements (auth: email)
 * 6. Ativar Envelope           -> PATCH /envelopes/{id} (status: running)
 *
 * Referência: https://developers.clicksign.com/docs/primeiros-passos
 */

import axios from 'axios';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/api-error';

interface ClicksignConfig {
  baseUrl: string;
  token: string;
}

export const getClicksignConfig = (): ClicksignConfig => {
  const token = process.env.CLICKSIGN_SANDBOX_TOKEN || process.env.CLICKSIGN_TOKEN;
  const environment = process.env.CLICKSIGN_ENVIRONMENT || 'sandbox'; // sandbox ou production

  if (!token) {
    throw ApiError.internal('Configuração da Clicksign ausente (access token)');
  }

  const baseUrl =
    environment === 'production'
      ? 'https://app.clicksign.com/api/v3'
      : 'https://sandbox.clicksign.com/api/v3';

  return { baseUrl, token: token.trim() };
};

export const verificarConfigClicksign = (): boolean => {
  return !!(process.env.CLICKSIGN_SANDBOX_TOKEN || process.env.CLICKSIGN_TOKEN);
};

/**
 * Explicação da função [verificarAssinaturaWebhook]
 * Confere o header `Content-Hmac` (`sha256=<hex>`) que a Clicksign envia em
 * todo disparo de webhook: HMAC-SHA256 do corpo bruto da requisição usando o
 * secret gerado no cadastro do webhook (https://developers.clicksign.com/docs/seguranca-de-webhooks).
 *
 * Recebe o Buffer bruto (não o JSON já parseado — o hash quebra se o corpo for
 * reserializado com espaçamento diferente do que a Clicksign enviou) e usa
 * `timingSafeEqual` para não vazar o secret por diferença de tempo de resposta.
 *
 * Sem `CLICKSIGN_WEBHOOK_SECRET` configurado, falha fechado (retorna false):
 * o endpoint só passa a aceitar tráfego depois que o webhook for cadastrado de
 * verdade na Clicksign e o secret gerado por ela for colocado no `.env`.
 */
export const verificarAssinaturaWebhook = (corpoBruto: Buffer, headerRecebido: string | undefined): boolean => {
  const secret = process.env.CLICKSIGN_WEBHOOK_SECRET;
  if (!secret || !headerRecebido) return false;

  const esperado = `sha256=${crypto.createHmac('sha256', secret).update(corpoBruto).digest('hex')}`;
  const bufEsperado = Buffer.from(esperado);
  const bufRecebido = Buffer.from(headerRecebido);

  if (bufEsperado.length !== bufRecebido.length) return false;
  return crypto.timingSafeEqual(bufEsperado, bufRecebido);
};

/**
 * Explicação da função [getClicksignWidgetEndpoint]
 * Endpoint que o Widget Embedded (frontend) usa — mesmo sandbox/production
 * já resolvido para as chamadas de API, só que sem o `/api/v3`.
 */
export const getClicksignWidgetEndpoint = (): string => {
  const environment = process.env.CLICKSIGN_ENVIRONMENT || 'sandbox';
  return environment === 'production' ? 'https://app.clicksign.com' : 'https://sandbox.clicksign.com';
};

/**
 * Explicação da função [clicksignRequest]
 * Executa uma chamada JSON:API na Clicksign e devolve o corpo já desserializado.
 *
 * Erros HTTP viram Error com a mensagem de `errors[0].detail` do gateway, para
 * o motivo real aparecer no log em vez de um "Request failed with status 4xx".
 */
async function clicksignRequest(
  method: 'get' | 'post' | 'patch',
  path: string,
  body?: Record<string, unknown>
) {
  const { baseUrl, token } = getClicksignConfig();

  try {
    const response = await axios.request({
      method,
      url: `${baseUrl}${path}`,
      data: body,
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
        'Authorization': token
      },
      timeout: 20000
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const detalhe = error.response?.data?.errors?.[0]?.detail;
      logger.error(`[Clicksign] Falha em ${method.toUpperCase()} ${path}`, {
        context: {
          httpStatus: error.response?.status,
          detalhe,
          corpo: error.response?.data ? JSON.stringify(error.response.data).slice(0, 1000) : undefined
        }
      });
      throw new Error(
        detalhe || `Falha na comunicação com a Clicksign (${error.response?.status || error.code})`,
        { cause: error }
      );
    }
    throw error;
  }
}

export const criarEnvelope = async (nome: string): Promise<string> => {
  const data = await clicksignRequest('post', '/envelopes', {
    data: {
      type: 'envelopes',
      attributes: {
        name: nome,
        locale: 'pt-BR',
        auto_close: true,
        remind_interval: 3
      }
    }
  });
  return data.data.id as string;
};

export const adicionarDocumento = async (
  envelopeId: string,
  filename: string,
  conteudoBase64: string
): Promise<string> => {
  const data = await clicksignRequest('post', `/envelopes/${envelopeId}/documents`, {
    data: {
      type: 'documents',
      attributes: {
        filename,
        content_base64: conteudoBase64
      }
    }
  });
  return data.data.id as string;
};

interface SignatarioParams {
  nome: string;
  email: string;
  telefone?: string;
}

/**
 * Explicação da função [formatarTelefoneClicksign]
 * O telefone é guardado no banco como o usuário digitou (`(31) 98888-8888`),
 * mas a Clicksign exige `phone_number` com só 10 ou 11 dígitos, sem DDI nem
 * pontuação (https://developers.clicksign.com/reference/api-criar-signatario)
 * — com a formatação original ela rejeita a criação do signatário com 400.
 */
function formatarTelefoneClicksign(telefone?: string): string | undefined {
  const digitos = telefone?.replace(/\D/g, '');
  if (!digitos || (digitos.length !== 10 && digitos.length !== 11)) return undefined;
  return digitos;
}

export const adicionarSignatario = async (
  envelopeId: string,
  signatario: SignatarioParams
): Promise<string> => {
  const data = await clicksignRequest('post', `/envelopes/${envelopeId}/signers`, {
    data: {
      type: 'signers',
      attributes: {
        name: signatario.nome,
        email: signatario.email,
        phone_number: formatarTelefoneClicksign(signatario.telefone),
        has_documentation: false,
        communicate_events: { document_signed: 'email', signature_request: 'email' }
      }
    }
  });
  return data.data.id as string;
};

export const adicionarRequisitoQualificacao = async (
  envelopeId: string,
  documentId: string,
  signerId: string
): Promise<void> => {
  await clicksignRequest('post', `/envelopes/${envelopeId}/requirements`, {
    data: {
      type: 'requirements',
      attributes: { action: 'agree', role: 'sign' },
      relationships: {
        document: { data: { type: 'documents', id: documentId } },
        signer: { data: { type: 'signers', id: signerId } }
      }
    }
  });
};

export const adicionarRequisitoAutenticacao = async (
  envelopeId: string,
  documentId: string,
  signerId: string,
  auth: string = 'email'
): Promise<void> => {
  await clicksignRequest('post', `/envelopes/${envelopeId}/requirements`, {
    data: {
      type: 'requirements',
      attributes: { action: 'provide_evidence', auth },
      relationships: {
        document: { data: { type: 'documents', id: documentId } },
        signer: { data: { type: 'signers', id: signerId } }
      }
    }
  });
};

export const ativarEnvelope = async (envelopeId: string): Promise<void> => {
  await clicksignRequest('patch', `/envelopes/${envelopeId}`, {
    data: {
      id: envelopeId,
      type: 'envelopes',
      attributes: { status: 'running' }
    }
  });
};

/**
 * Explicação da função [obterStatusEnvelope]
 * Consulta o status atual do envelope ('draft' | 'running' | 'closed' | 'canceled').
 * Com `auto_close: true` e um único signatário, o envelope fecha sozinho assim que
 * ele assina — é esse fechamento que confirma a assinatura no fluxo síncrono
 * (o cliente confirma na hora, sem depender do webhook já estar cadastrado).
 */
export const obterStatusEnvelope = async (envelopeId: string): Promise<string> => {
  const data = await clicksignRequest('get', `/envelopes/${envelopeId}`);
  return data.data.attributes.status as string;
};

interface CriarEnvelopeAssinaturaParams {
  nomeEnvelope: string;
  contratoFilename: string;
  contratoBase64: string; // no formato "data:application/pdf;base64,...."
  signatario: SignatarioParams;
}

/**
 * Explicação da função [criarEnvelopeDeAssinatura]
 * Orquestra a criação do envelope completo (documento + signatário + os dois
 * requisitos) e já ativa o envelope, deixando pronto para o cliente assinar.
 */
export const criarEnvelopeDeAssinatura = async (params: CriarEnvelopeAssinaturaParams) => {
  const envelopeId = await criarEnvelope(params.nomeEnvelope);
  const documentId = await adicionarDocumento(envelopeId, params.contratoFilename, params.contratoBase64);
  const signerId = await adicionarSignatario(envelopeId, params.signatario);
  await adicionarRequisitoQualificacao(envelopeId, documentId, signerId);
  await adicionarRequisitoAutenticacao(envelopeId, documentId, signerId);
  await ativarEnvelope(envelopeId);

  logger.info('[Clicksign] Envelope de assinatura criado e ativado', {
    context: { envelopeId, documentId, signerId }
  });

  return { envelopeId, documentId, signerId };
};
