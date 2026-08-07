/**
 * Explicação do Arquivo [paghiper.ts]
 *
 * Configuração e serviço de integração com o PagHiper (Gateway de Pagamento) para PIX.
 *
 * ATENÇÃO — o PIX do PagHiper usa host e caminhos próprios, diferentes do boleto:
 * - PIX:    https://pix.paghiper.com/invoice/{create,status,notification}/
 * - Boleto: https://api.paghiper.com/transaction/{create,status,notification}/
 * Usar o host de boleto para PIX retorna uma resposta com formato incompatível.
 *
 * Autenticação:
 * - Criação:  apenas `apiKey` no corpo da requisição.
 * - Status e notificação: `apiKey` + `token` no corpo.
 *
 * Formato das respostas:
 * - Criação:  { pix_create_request: { transaction_id, status, order_id, value_cents, pix_code: { emv, qrcode_base64, ... } } }
 * - Status/notificação: { status_request: { status, transaction_id, order_id, ... } }
 */

import axios from 'axios';
import QRCode from 'qrcode';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/api-error';

/** Host exclusivo do PIX (o boleto usa api.paghiper.com — não confundir) */
const PAGHIPER_PIX_API_URL = 'https://pix.paghiper.com';

/** Timeout das chamadas HTTP ao gateway, evita requisição pendurada travando a rota */
const PAGHIPER_TIMEOUT_MS = 20000;

const PAGHIPER_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

interface PagHiperConfig {
  apiKey: string;
  token: string;
}

export const getPagHiperConfig = (): PagHiperConfig => {
  const apiKey = process.env.PAGHIPER_API_KEY;
  const token = process.env.PAGHIPER_TOKEN;

  if (!apiKey || !token) {
    throw ApiError.internal('Configuração do PagHiper ausente (API Key ou Token)');
  }

  return { apiKey: apiKey.trim(), token: token.trim() };
};

export const verificarConfigPagHiper = (): boolean => {
  return !!process.env.PAGHIPER_API_KEY && !!process.env.PAGHIPER_TOKEN;
};

/**
 * Explicação da função [resolverNotificationUrl]
 * Monta a URL que o PagHiper chamará quando o status do PIX mudar.
 *
 * O gateway só notifica a URL informada no momento da criação da cobrança —
 * não existe painel para cadastrá-la depois. Sem ela, o webhook nunca dispara
 * e o pedido só é confirmado se o cliente mantiver a página aberta.
 *
 * Usa PAGHIPER_NOTIFICATION_URL quando definida; caso contrário deriva de
 * API_BASE_URL. Retorna null se o endereço for local, porque o PagHiper não
 * consegue alcançar localhost — nesse caso a cobrança é criada sem webhook
 * (útil em desenvolvimento) e o aviso fica registrado no log.
 */
export const resolverNotificationUrl = (): string | null => {
  const explicita = process.env.PAGHIPER_NOTIFICATION_URL?.trim();
  const base = process.env.API_BASE_URL?.trim();
  const url = explicita || (base ? `${base.replace(/\/+$/, '')}/api/webhooks/paghiper` : '');

  if (!url) {
    logger.warn('[PagHiper] Nenhuma URL de notificação configurada', {
      context: {
        efeito: 'O webhook não será chamado; o pedido só será confirmado pelo polling do frontend.',
        acao: 'Defina PAGHIPER_NOTIFICATION_URL ou API_BASE_URL.'
      }
    });
    return null;
  }

  if (/localhost|127\.0\.0\.1|0\.0\.0\.0|\.local(?::|\/|$)/i.test(url)) {
    logger.warn('[PagHiper] URL de notificação é local — o gateway não conseguirá alcançá-la', {
      context: {
        url,
        efeito: 'Cobrança será criada SEM webhook. O status depende do polling do frontend.',
        acao: 'Para testar o webhook localmente, exponha a API (ex.: túnel HTTPS) e defina PAGHIPER_NOTIFICATION_URL.'
      }
    });
    return null;
  }

  return url;
};

/**
 * Explicação da função [postPagHiper]
 * Executa um POST no PagHiper e devolve o corpo da resposta.
 *
 * Erros HTTP do axios são convertidos em Error com a mensagem retornada pelo
 * gateway (quando houver), para que a causa real apareça no log e não um
 * genérico "Request failed with status code 4xx".
 */
async function postPagHiper(endpoint: string, payload: Record<string, unknown>, escopo: string) {
  try {
    const response = await axios.post(`${PAGHIPER_PIX_API_URL}${endpoint}`, payload, {
      headers: PAGHIPER_HEADERS,
      timeout: PAGHIPER_TIMEOUT_MS
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const corpo = error.response?.data;
      const mensagemGateway =
        corpo?.pix_create_request?.response_message ??
        corpo?.status_request?.response_message ??
        (typeof corpo === 'string' ? corpo : undefined);

      logger.error(`[PagHiper] Falha HTTP em ${endpoint}`, {
        context: {
          escopo,
          httpStatus: error.response?.status,
          codigo: error.code,
          mensagemGateway,
          corpo: corpo ? JSON.stringify(corpo).slice(0, 1000) : undefined
        }
      });

      throw new Error(
        mensagemGateway || `Falha na comunicação com o PagHiper (${error.code || error.response?.status})`,
        { cause: error }
      );
    }
    throw error;
  }
}

/**
 * Explicação da função [extrairBloco]
 * Lê o objeto raiz esperado da resposta do PagHiper e valida o campo `result`.
 *
 * Se o formato vier diferente do previsto, loga a resposta bruta (truncada) —
 * sem isso, uma mudança de contrato do gateway vira um TypeError opaco.
 */
function extrairBloco(data: any, raiz: string, escopo: string) {
  const bloco = data?.[raiz];

  if (!bloco) {
    logger.error(`[PagHiper] Resposta sem o objeto "${raiz}"`, {
      context: {
        escopo,
        chavesRecebidas: data && typeof data === 'object' ? Object.keys(data) : typeof data,
        respostaBruta: JSON.stringify(data).slice(0, 1000)
      }
    });
    throw new Error(`Resposta inesperada do PagHiper (objeto "${raiz}" ausente)`);
  }

  if (bloco.result === 'reject') {
    throw new Error(bloco.response_message || 'Requisição rejeitada pelo PagHiper');
  }

  return bloco;
}

interface CriarPixPagHiperParams {
  order_id: string;
  payer_email: string;
  payer_name: string;
  payer_cpf_cnpj: string;
  payer_phone?: string;
  days_due_date?: number;
  items: Array<{
    item_id: string;
    description: string;
    price_cents: number;
    quantity: number;
  }>;
}

/**
 * Explicação da função [criarCobrancaPixPagHiper]
 * Cria uma cobrança PIX em POST https://pix.paghiper.com/invoice/create/.
 *
 * A criação autentica somente com `apiKey` (o `token` é usado apenas em
 * status/notificação). Não existe `type_bank_slip` no payload de PIX — esse
 * campo pertence ao boleto.
 *
 * Retorna o código copia-e-cola (`pix_code.emv`) e a imagem do QR Code. A
 * imagem vem pronta do gateway em `qrcode_base64`; só geramos localmente como
 * fallback caso o campo não venha.
 */
export const criarCobrancaPixPagHiper = async (params: CriarPixPagHiperParams) => {
  try {
    const config = getPagHiperConfig();

    const notificationUrl = resolverNotificationUrl();

    const payload = {
      apiKey: config.apiKey,
      order_id: params.order_id,
      payer_email: params.payer_email,
      payer_name: params.payer_name,
      payer_cpf_cnpj: params.payer_cpf_cnpj.replace(/\D/g, ''),
      payer_phone: params.payer_phone?.replace(/\D/g, ''),
      days_due_date: String(params.days_due_date || 1), // Vencimento em 1 dia por padrão
      // Só enviado quando público: o PagHiper valida o endereço na criação.
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
      items: params.items.map((item) => ({
        item_id: item.item_id,
        description: item.description,
        price_cents: String(item.price_cents),
        quantity: String(item.quantity)
      }))
    };

    logger.info('[PagHiper] Criando cobrança PIX', {
      context: {
        order_id: params.order_id,
        valor_cents: params.items.reduce((soma, i) => soma + i.price_cents * i.quantity, 0),
        days_due_date: payload.days_due_date,
        notification_url: notificationUrl ?? '(não enviada — webhook desativado neste ambiente)'
      }
    });

    const data = await postPagHiper('/invoice/create/', payload, 'criarCobrancaPix');
    const bloco = extrairBloco(data, 'pix_create_request', 'criarCobrancaPix');

    const pixCode = bloco.pix_code?.emv;
    if (!pixCode) {
      logger.error('[PagHiper] Cobrança criada sem código PIX (emv)', {
        context: {
          order_id: params.order_id,
          transaction_id: bloco.transaction_id,
          camposPixCode: bloco.pix_code ? Object.keys(bloco.pix_code) : null
        }
      });
      throw new Error('PagHiper não retornou o código PIX (emv)');
    }

    // O gateway já devolve o PNG do QR Code em base64; gerar localmente é só fallback.
    const qrCodeImage = bloco.pix_code.qrcode_base64
      ? `data:image/png;base64,${bloco.pix_code.qrcode_base64}`
      : await QRCode.toDataURL(pixCode);

    logger.info('[PagHiper] Cobrança PIX criada', {
      context: {
        order_id: bloco.order_id,
        transaction_id: bloco.transaction_id,
        status: bloco.status,
        value_cents: bloco.value_cents,
        qrCodeDoGateway: !!bloco.pix_code.qrcode_base64
      }
    });

    return {
      id: bloco.transaction_id,
      transaction_id: bloco.transaction_id,
      order_id: bloco.order_id,
      value_cents: Number(bloco.value_cents),
      status: bloco.status,
      pixData: {
        qrCode: pixCode,
        qrCodeImage
      },
      invoiceUrl: bloco.pix_code.pix_url
    };
  } catch (error) {
    logger.error('[PagHiper] Erro ao criar cobrança PIX', {
      context: {
        order_id: params.order_id,
        error: error instanceof Error ? error.message : 'Unknown'
      }
    });
    throw error;
  }
};

/**
 * Explicação da função [consultarTransacaoPagHiper]
 * Consulta o status de uma cobrança PIX em POST https://pix.paghiper.com/invoice/status/.
 * Autentica com `apiKey` + `token`.
 *
 * Valores possíveis de status: pending, reserved, paid, completed,
 * processing, canceled, refunded.
 */
export const consultarTransacaoPagHiper = async (transactionId: string) => {
  try {
    const config = getPagHiperConfig();

    const payload = {
      apiKey: config.apiKey,
      token: config.token,
      transaction_id: transactionId
    };

    const data = await postPagHiper('/invoice/status/', payload, 'consultarTransacao');
    const bloco = extrairBloco(data, 'status_request', 'consultarTransacao');

    return {
      status: bloco.status,
      transaction_id: bloco.transaction_id,
      order_id: bloco.order_id,
      value_cents: bloco.value_cents !== undefined ? Number(bloco.value_cents) : undefined
    };
  } catch (error) {
    logger.error('[PagHiper] Erro ao consultar transação', {
      context: { transactionId, error: error instanceof Error ? error.message : 'Unknown' }
    });
    throw error;
  }
};

/**
 * Explicação da função [processarRetornoPagHiper]
 * Valida uma notificação (webhook) em POST https://pix.paghiper.com/invoice/notification/.
 *
 * O PagHiper envia ao lojista apenas os identificadores da notificação; o
 * status real precisa ser buscado de volta na API com `apiKey` + `token`.
 * É isso que impede que um terceiro forje uma confirmação de pagamento.
 */
export const processarRetornoPagHiper = async (notificationId: string, transactionId: string) => {
  try {
    const config = getPagHiperConfig();

    const payload = {
      apiKey: config.apiKey,
      token: config.token,
      notification_id: notificationId,
      transaction_id: transactionId
    };

    const data = await postPagHiper('/invoice/notification/', payload, 'processarRetorno');
    const bloco = extrairBloco(data, 'status_request', 'processarRetorno');

    return {
      status: bloco.status,
      transaction_id: bloco.transaction_id,
      order_id: bloco.order_id,
      value_cents: bloco.value_cents !== undefined ? Number(bloco.value_cents) : undefined
    };
  } catch (error) {
    logger.error('[PagHiper Webhook] Erro ao validar notificação', {
      context: { notificationId, transactionId, error: error instanceof Error ? error.message : 'Unknown' }
    });
    throw error;
  }
};
