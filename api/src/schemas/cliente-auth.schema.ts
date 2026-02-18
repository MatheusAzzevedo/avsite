/**
 * Explicação do Arquivo [cliente-auth.schema.ts]
 * 
 * Schemas de validação Zod para autenticação de clientes.
 * Valida dados de registro, login e atualização de perfil de clientes.
 * Separado do auth.schema.ts (que é para admins) para manter clareza.
 */

import { z } from 'zod';

/**
 * Schema de validação para registro de cliente
 * Valida nome, email, senha, telefone e CPF opcional
 */
export const clienteRegisterSchema = z.object({
  nome: z
    .string({ required_error: 'Nome é obrigatório' })
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  email: z
    .string({ required_error: 'Email é obrigatório' })
    .email('Email inválido')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Senha é obrigatória' })
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'
    ),
  telefone: z
    .string({ required_error: 'Telefone é obrigatório' })
    .min(1, 'Telefone é obrigatório')
    .refine(
      (val) => /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/.test(val),
      'Telefone inválido. Use formato: (11) 98888-8888'
    ),
  cpf: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(val) || /^\d{11}$/.test(val),
      'CPF inválido. Use formato: 000.000.000-00 ou 00000000000'
    )
});

/**
 * Schema de validação para login de cliente
 * Apenas email e senha
 */
export const clienteLoginSchema = z.object({
  email: z
    .string({ required_error: 'Email é obrigatório' })
    .email('Email inválido')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Senha é obrigatória' })
    .min(1, 'Senha é obrigatória')
});

/**
 * Schema para atualização de perfil do cliente
 * Todos os campos são opcionais
 */
export const clienteUpdateProfileSchema = z.object({
  nome: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim()
    .optional(),
  telefone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/.test(val),
      'Telefone inválido. Use formato: (11) 98888-8888'
    ),
  cpf: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(val) || /^\d{11}$/.test(val),
      'CPF inválido. Use formato: 000.000.000-00 ou 00000000000'
    ),
  avatarUrl: z
    .string()
    .url('URL inválida')
    .optional()
});

/**
 * Schema para alteração de senha do cliente
 */
export const clienteChangePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: 'Senha atual é obrigatória' })
    .min(1, 'Senha atual é obrigatória'),
  newPassword: z
    .string({ required_error: 'Nova senha é obrigatória' })
    .min(8, 'Nova senha deve ter no mínimo 8 caracteres')
    .max(100, 'Nova senha deve ter no máximo 100 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Nova senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'
    )
});

/**
 * Schema para verificação de email
 */
export const clienteVerifyEmailSchema = z.object({
  token: z
    .string({ required_error: 'Token é obrigatório' })
    .min(1, 'Token é obrigatório')
});

/**
 * Schema para callback OAuth Google
 * Valida o código de autorização recebido do Google
 */
export const googleOAuthCallbackSchema = z.object({
  code: z
    .string({ required_error: 'Código de autorização é obrigatório' })
    .min(1, 'Código de autorização é obrigatório'),
  state: z
    .string()
    .optional() // State é usado para prevenir CSRF, mas é opcional
});

/**
 * Schema para vincular conta Google a uma conta existente
 * Cliente já logado quer conectar sua conta Google
 */
export const linkGoogleAccountSchema = z.object({
  googleToken: z
    .string({ required_error: 'Token do Google é obrigatório' })
    .min(1, 'Token do Google é obrigatório')
});

// Tipos inferidos dos schemas para uso no TypeScript
export type ClienteRegisterInput = z.infer<typeof clienteRegisterSchema>;
export type ClienteLoginInput = z.infer<typeof clienteLoginSchema>;
export type ClienteUpdateProfileInput = z.infer<typeof clienteUpdateProfileSchema>;
export type ClienteChangePasswordInput = z.infer<typeof clienteChangePasswordSchema>;
export type ClienteVerifyEmailInput = z.infer<typeof clienteVerifyEmailSchema>;
export type GoogleOAuthCallbackInput = z.infer<typeof googleOAuthCallbackSchema>;
export type LinkGoogleAccountInput = z.infer<typeof linkGoogleAccountSchema>;
