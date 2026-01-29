/**
 * Explicação do Arquivo [auth.schema.ts]
 * 
 * Schemas de validação Zod para autenticação.
 * Valida dados de login, registro e tokens JWT.
 */

import { z } from 'zod';

/**
 * Schema de validação para login
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email é obrigatório' })
    .email('Email inválido')
    .toLowerCase(),
  password: z
    .string({ required_error: 'Senha é obrigatória' })
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
});

/**
 * Schema de validação para registro de usuário
 */
export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Nome é obrigatório' })
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z
    .string({ required_error: 'Email é obrigatório' })
    .email('Email inválido')
    .toLowerCase(),
  password: z
    .string({ required_error: 'Senha é obrigatória' })
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres'),
  role: z.enum(['ADMIN', 'EDITOR']).optional().default('ADMIN')
});

/**
 * Schema para atualização de senha
 */
export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: 'Senha atual é obrigatória' }),
  newPassword: z
    .string({ required_error: 'Nova senha é obrigatória' })
    .min(6, 'Nova senha deve ter no mínimo 6 caracteres')
});

// Tipos inferidos dos schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
