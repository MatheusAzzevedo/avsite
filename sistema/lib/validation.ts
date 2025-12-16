import { z } from 'zod';

// Schemas de Validação de Autenticação
export const loginSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .toLowerCase(),
  password: z
    .string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export const createUserSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres'),
});

// Schemas de Validação de Blog
export const createBlogPostSchema = z.object({
  title: z
    .string()
    .min(3, 'Título deve ter pelo menos 3 caracteres')
    .max(200, 'Título não pode exceder 200 caracteres'),
  subtitle: z
    .string()
    .min(1, 'Subtítulo é obrigatório')
    .max(300, 'Subtítulo não pode exceder 300 caracteres'),
  content: z
    .string()
    .min(10, 'Conteúdo deve ter pelo menos 10 caracteres'),
  published: z.boolean().default(false),
});

export const updateBlogPostSchema = createBlogPostSchema.partial();

// Schemas de Validação de Excursões
export const createExcursaoSchema = z.object({
  title: z
    .string()
    .min(3, 'Título deve ter pelo menos 3 caracteres')
    .max(200, 'Título não pode exceder 200 caracteres'),
  subtitle: z
    .string()
    .min(1, 'Subtítulo é obrigatório')
    .max(300, 'Subtítulo não pode exceder 300 caracteres'),
  description: z
    .string()
    .min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  price: z
    .number()
    .positive('Preço deve ser maior que zero'),
  image_url: z
    .string()
    .url('URL de imagem inválida')
    .optional()
    .nullable(),
  featured_image_url: z
    .string()
    .url('URL de imagem destaque inválida')
    .optional()
    .nullable(),
  active: z.boolean().default(true),
});

export const updateExcursaoSchema = createExcursaoSchema.partial();

// Schemas de Validação de Pagamento
export const paymentConfigSchema = z.object({
  provider: z
    .enum(['stripe', 'mercado_pago', 'asaas', 'paypal'])
    .describe('Provedor de pagamento'),
  api_key: z
    .string()
    .min(1, 'API Key é obrigatória'),
  secret_key: z
    .string()
    .min(1, 'Secret Key é obrigatória'),
  webhook_url: z
    .string()
    .url('URL do webhook inválida')
    .optional()
    .nullable(),
  active: z.boolean().default(false),
});

// Types exportados para uso em toda a aplicação
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateBlogPost = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPost = z.infer<typeof updateBlogPostSchema>;
export type CreateExcursao = z.infer<typeof createExcursaoSchema>;
export type UpdateExcursao = z.infer<typeof updateExcursaoSchema>;
export type PaymentConfig = z.infer<typeof paymentConfigSchema>;
