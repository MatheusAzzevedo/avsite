import axios from 'axios';
import QRCode from 'qrcode';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/api-error';

const PAGHIPER_API_URL = 'https://api.paghiper.com';

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

  return { apiKey, token };
};

export const verificarConfigPagHiper = (): boolean => {
  return !!process.env.PAGHIPER_API_KEY && !!process.env.PAGHIPER_TOKEN;
};

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

export const criarCobrancaPixPagHiper = async (params: CriarPixPagHiperParams) => {
  try {
    const config = getPagHiperConfig();

    const payload = {
      apiKey: config.apiKey,
      order_id: params.order_id,
      payer_email: params.payer_email,
      payer_name: params.payer_name,
      payer_cpf_cnpj: params.payer_cpf_cnpj.replace(/\D/g, ''),
      payer_phone: params.payer_phone?.replace(/\D/g, ''),
      days_due_date: params.days_due_date || 1, // Vencimento em 1 dia por padrão
      type_bank_slip: 'pix', // Indica que é PIX
      items: params.items
    };

    const response = await axios.post(`${PAGHIPER_API_URL}/transaction/create/`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const data = response.data;

    if (data.create_request.result === 'reject') {
      throw new Error(data.create_request.response_message || 'Erro ao criar transação no PagHiper');
    }

    const pixCode = data.create_request.bank_slip.pix_code;
    const pixImageUrl = await QRCode.toDataURL(pixCode);

    return {
      id: data.create_request.transaction_id,
      transaction_id: data.create_request.transaction_id,
      order_id: data.create_request.order_id,
      value_cents: data.create_request.value_cents,
      pixData: {
        qrCode: pixCode,
        qrCodeImage: pixImageUrl,
      },
      invoiceUrl: data.create_request.bank_slip.url_slip_pdf
    };
  } catch (error) {
    logger.error('[PagHiper] Erro ao criar cobrança PIX', {
      context: { error: error instanceof Error ? error.message : 'Unknown' }
    });
    throw error;
  }
};

export const consultarTransacaoPagHiper = async (transactionId: string) => {
  try {
    const config = getPagHiperConfig();

    const payload = {
      apiKey: config.apiKey,
      token: config.token,
      transaction_id: transactionId
    };

    const response = await axios.post(`${PAGHIPER_API_URL}/transaction/status/`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const data = response.data;

    if (data.status_request.result === 'reject') {
      throw new Error(data.status_request.response_message || 'Erro ao consultar transação no PagHiper');
    }

    return {
      status: data.status_request.status, // ex: 'pending', 'paid', 'canceled'
      transaction_id: data.status_request.transaction_id,
      order_id: data.status_request.order_id
    };
  } catch (error) {
    logger.error('[PagHiper] Erro ao consultar transação', {
      context: { transactionId, error: error instanceof Error ? error.message : 'Unknown' }
    });
    throw error;
  }
};

export const processarRetornoPagHiper = async (notificationId: string, transactionId: string) => {
  try {
    const config = getPagHiperConfig();

    const payload = {
      apiKey: config.apiKey,
      token: config.token,
      notification_id: notificationId,
      transaction_id: transactionId
    };

    const response = await axios.post(`${PAGHIPER_API_URL}/transaction/notification/`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const data = response.data;

    if (data.status_request.result === 'reject') {
      throw new Error(data.status_request.response_message || 'Erro ao processar notificação no PagHiper');
    }

    return {
      status: data.status_request.status,
      transaction_id: data.status_request.transaction_id,
      order_id: data.status_request.order_id
    };
  } catch (error) {
    logger.error('[PagHiper Webhook] Erro ao validar notificação', {
      context: { notificationId, transactionId, error: error instanceof Error ? error.message : 'Unknown' }
    });
    throw error;
  }
};
