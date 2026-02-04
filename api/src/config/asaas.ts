/**
 * Explicação do Arquivo [asaas.ts]
 * 
 * Configuração e serviço de integração com Asaas (Gateway de Pagamento).
 * Gerencia criação de cobranças, consulta de status e processamento de webhooks.
 * 
 * Métodos de pagamento suportados:
 * - PIX (instantâneo)
 * - Cartão de Crédito
 * - Boleto (opcional)
 */

import Asaas from 'asaas';
import { logger } from '../utils/logger';

/**
 * Cliente Asaas configurado com API Key
 */
const asaasApiKey = process.env.ASAAS_API_KEY || '';
const asaasEnv = process.env.ASAAS_ENVIRONMENT || 'production'; // production ou sandbox

export const asaasClient = new Asaas(asaasApiKey, {
  sandbox: asaasEnv === 'sandbox'
});

/**
 * Explicação da função [criarCobrancaAsaas]
 * 
 * Cria uma cobrança no Asaas para PIX ou Cartão.
 * 
 * Fluxo:
 * 1. Cria cliente no Asaas (se não existir)
 * 2. Cria cobrança com valor e descrição
 * 3. Retorna dados da cobrança (ID, QR Code PIX, link de pagamento)
 * 
 * @param dados - Dados da cobrança
 * @returns Dados da cobrança criada
 */
export async function criarCobrancaAsaas(dados: {
  clienteEmail: string;
  clienteNome: string;
  clienteCpf?: string;
  clienteTelefone?: string;
  valor: number;
  descricao: string;
  metodoPagamento: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
  externalReference?: string; // ID do pedido no nosso sistema
  dueDate?: Date; // Data de vencimento (para boleto)
}) {
  try {
    logger.info('[Asaas] Criando cobrança', {
      context: {
        email: dados.clienteEmail,
        valor: dados.valor,
        metodo: dados.metodoPagamento,
        reference: dados.externalReference
      }
    });

    // 1. Criar ou buscar cliente no Asaas
    const customerData = {
      name: dados.clienteNome,
      email: dados.clienteEmail,
      cpfCnpj: dados.clienteCpf || undefined,
      phone: dados.clienteTelefone || undefined
    };

    logger.info('[Asaas] Criando/buscando cliente no Asaas', {
      context: { email: dados.clienteEmail }
    });

    // Busca cliente existente por email
    let asaasCustomer;
    try {
      const customers = await asaasClient.customers.list({ email: dados.clienteEmail });
      if (customers.data && customers.data.length > 0) {
        asaasCustomer = customers.data[0];
        logger.info('[Asaas] Cliente já existe', {
          context: { customerId: asaasCustomer.id }
        });
      }
    } catch (error) {
      logger.warn('[Asaas] Erro ao buscar cliente, criando novo', {
        context: { error: error instanceof Error ? error.message : 'Unknown' }
      });
    }

    // Cria cliente se não existir
    if (!asaasCustomer) {
      asaasCustomer = await asaasClient.customers.create(customerData);
      logger.info('[Asaas] Novo cliente criado no Asaas', {
        context: { customerId: asaasCustomer.id }
      });
    }

    // 2. Criar cobrança
    const paymentData: any = {
      customer: asaasCustomer.id,
      billingType: dados.metodoPagamento,
      value: dados.valor,
      description: dados.descricao,
      externalReference: dados.externalReference,
      dueDate: dados.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias se não informado
    };

    logger.info('[Asaas] Criando cobrança', {
      context: {
        customerId: asaasCustomer.id,
        billingType: dados.metodoPagamento,
        value: dados.valor
      }
    });

    const payment = await asaasClient.payments.create(paymentData);

    logger.info('[Asaas] Cobrança criada com sucesso', {
      context: {
        paymentId: payment.id,
        status: payment.status,
        billingType: payment.billingType,
        value: payment.value
      }
    });

    // 3. Para PIX, buscar QR Code
    let pixData = null;
    if (dados.metodoPagamento === 'PIX') {
      try {
        logger.info('[Asaas] Buscando QR Code PIX', {
          context: { paymentId: payment.id }
        });

        const pixResponse = await asaasClient.payments.getPixQrCode(payment.id);
        pixData = {
          qrCode: pixResponse.payload,
          qrCodeImage: pixResponse.encodedImage,
          expirationDate: pixResponse.expirationDate
        };

        logger.info('[Asaas] QR Code PIX obtido', {
          context: { paymentId: payment.id, hasQrCode: !!pixData.qrCode }
        });
      } catch (error) {
        logger.error('[Asaas] Erro ao buscar QR Code PIX', {
          context: {
            paymentId: payment.id,
            error: error instanceof Error ? error.message : 'Unknown'
          }
        });
      }
    }

    return {
      id: payment.id,
      status: payment.status,
      value: payment.value,
      billingType: payment.billingType,
      invoiceUrl: payment.invoiceUrl,
      bankSlipUrl: payment.bankSlipUrl,
      pixData,
      dueDate: payment.dueDate
    };
  } catch (error) {
    logger.error('[Asaas] Erro ao criar cobrança', {
      context: {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        dados: {
          email: dados.clienteEmail,
          valor: dados.valor,
          metodo: dados.metodoPagamento
        }
      }
    });
    throw error;
  }
}

/**
 * Explicação da função [consultarPagamentoAsaas]
 * 
 * Consulta status de um pagamento no Asaas.
 * 
 * @param paymentId - ID do pagamento no Asaas
 * @returns Dados do pagamento
 */
export async function consultarPagamentoAsaas(paymentId: string) {
  try {
    logger.info('[Asaas] Consultando pagamento', {
      context: { paymentId }
    });

    const payment = await asaasClient.payments.getById(paymentId);

    logger.info('[Asaas] Pagamento consultado', {
      context: {
        paymentId: payment.id,
        status: payment.status,
        value: payment.value
      }
    });

    return {
      id: payment.id,
      status: payment.status,
      value: payment.value,
      billingType: payment.billingType,
      confirmedDate: payment.confirmedDate,
      paymentDate: payment.paymentDate
    };
  } catch (error) {
    logger.error('[Asaas] Erro ao consultar pagamento', {
      context: {
        paymentId,
        error: error instanceof Error ? error.message : 'Unknown'
      }
    });
    throw error;
  }
}

/**
 * Explicação da função [processarWebhookAsaas]
 * 
 * Processa webhook do Asaas.
 * Asaas envia notificações quando status do pagamento muda.
 * 
 * Eventos importantes:
 * - PAYMENT_RECEIVED: Pagamento confirmado
 * - PAYMENT_CONFIRMED: Pagamento creditado
 * - PAYMENT_OVERDUE: Pagamento vencido
 * - PAYMENT_DELETED: Pagamento deletado
 * 
 * @param event - Tipo do evento
 * @param payment - Dados do pagamento
 * @returns Status mapeado para o sistema
 */
export function processarWebhookAsaas(event: string, payment: any): {
  statusPedido: string;
  devePagar: boolean;
  deveConfirmar: boolean;
} {
  logger.info('[Asaas Webhook] Processando evento', {
    context: {
      event,
      paymentId: payment.id,
      status: payment.status,
      value: payment.value
    }
  });

  // Mapeia status do Asaas para status do Pedido
  const statusMap: Record<string, { statusPedido: string; devePagar: boolean; deveConfirmar: boolean }> = {
    'PAYMENT_RECEIVED': { statusPedido: 'PAGO', devePagar: true, deveConfirmar: false },
    'PAYMENT_CONFIRMED': { statusPedido: 'CONFIRMADO', devePagar: true, deveConfirmar: true },
    'PAYMENT_OVERDUE': { statusPedido: 'EXPIRADO', devePagar: false, deveConfirmar: false },
    'PAYMENT_DELETED': { statusPedido: 'CANCELADO', devePagar: false, deveConfirmar: false }
  };

  const result = statusMap[event] || { statusPedido: 'PENDENTE', devePagar: false, deveConfirmar: false };

  logger.info('[Asaas Webhook] Evento processado', {
    context: {
      event,
      paymentId: payment.id,
      novoStatus: result.statusPedido
    }
  });

  return result;
}

/**
 * Explicação da função [verificarConfigAsaas]
 * 
 * Verifica se a API Key do Asaas está configurada.
 * 
 * @returns true se configurado
 */
export function verificarConfigAsaas(): boolean {
  if (!process.env.ASAAS_API_KEY) {
    logger.error('[Asaas] ASAAS_API_KEY não configurada');
    return false;
  }

  logger.info('[Asaas] Configuração verificada', {
    context: {
      environment: asaasEnv,
      keyPrefix: process.env.ASAAS_API_KEY.substring(0, 20) + '...'
    }
  });

  return true;
}
