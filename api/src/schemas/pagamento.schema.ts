/**
 * Explicação do Arquivo [pagamento.schema.ts]
 * 
 * Schemas de validação Zod para pagamentos via Asaas.
 * Valida dados de criação de cobrança, pagamento com cartão e webhook.
 */

import { z } from 'zod';

/**
 * Schema para criar pagamento PIX
 */
export const criarPagamentoPixSchema = z.object({
  pedidoId: z
    .string({ required_error: 'ID do pedido é obrigatório' })
    .uuid('ID do pedido inválido')
});

/**
 * Schema para dados do cartão de crédito
 */
export const dadosCartaoSchema = z.object({
  holderName: z
    .string({ required_error: 'Nome do titular é obrigatório' })
    .min(3, 'Nome do titular deve ter no mínimo 3 caracteres'),
  number: z
    .string({ required_error: 'Número do cartão é obrigatório' })
    .regex(/^\d{13,19}$/, 'Número do cartão inválido'),
  expiryMonth: z
    .string({ required_error: 'Mês de validade é obrigatório' })
    .regex(/^(0[1-9]|1[0-2])$/, 'Mês inválido (use 01-12)'),
  expiryYear: z
    .string({ required_error: 'Ano de validade é obrigatório' })
    .regex(/^\d{4}$/, 'Ano inválido (use 4 dígitos)'),
  ccv: z
    .string({ required_error: 'CVV é obrigatório' })
    .regex(/^\d{3,4}$/, 'CVV inválido')
});

/**
 * Schema para criar pagamento com Cartão de Crédito
 */
export const criarPagamentoCartaoSchema = z.object({
  pedidoId: z
    .string({ required_error: 'ID do pedido é obrigatório' })
    .uuid('ID do pedido inválido'),
  creditCard: dadosCartaoSchema,
  creditCardHolderInfo: z.object({
    name: z.string().min(3, 'Nome completo é obrigatório'),
    email: z.string().email('Email inválido'),
    cpfCnpj: z.string().min(11, 'CPF é obrigatório'),
    postalCode: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
    addressNumber: z.string().min(1, 'Número do endereço é obrigatório'),
    phone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido (apenas números)')
  })
});

/**
 * Schema para webhook do Asaas
 */
export const asaasWebhookSchema = z.object({
  event: z.enum([
    'PAYMENT_CREATED',
    'PAYMENT_UPDATED',
    'PAYMENT_CONFIRMED',
    'PAYMENT_RECEIVED',
    'PAYMENT_OVERDUE',
    'PAYMENT_DELETED',
    'PAYMENT_RESTORED',
    'PAYMENT_REFUNDED',
    'PAYMENT_REFUND_IN_PROGRESS',
    'PAYMENT_RECEIVED_IN_CASH',
    'PAYMENT_CHARGEBACK_REQUESTED',
    'PAYMENT_CHARGEBACK_DISPUTE',
    'PAYMENT_AWAITING_CHARGEBACK_REVERSAL',
    'PAYMENT_DUNNING_RECEIVED',
    'PAYMENT_DUNNING_REQUESTED',
    'PAYMENT_BANK_SLIP_VIEWED',
    'PAYMENT_CHECKOUT_VIEWED'
  ]),
  payment: z.object({
    id: z.string(),
    status: z.string(),
    value: z.number(),
    externalReference: z.string().optional()
  })
});

// Tipos inferidos
export type CriarPagamentoPixInput = z.infer<typeof criarPagamentoPixSchema>;
export type CriarPagamentoCartaoInput = z.infer<typeof criarPagamentoCartaoSchema>;
export type AsaasWebhookInput = z.infer<typeof asaasWebhookSchema>;
export type DadosCartaoInput = z.infer<typeof dadosCartaoSchema>;
