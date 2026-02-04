/**
 * Explicação do Arquivo [excursao-pedagogica.schema.ts]
 * 
 * Schemas de validação Zod para excursões pedagógicas.
 * Valida dados de criação, atualização e filtros.
 * Adiciona validação do campo 'codigo' obrigatório e único.
 */

import { z } from 'zod';

/**
 * Schema base para excursão pedagógica
 * Similar ao schema de excursão normal, mas com campo 'codigo' obrigatório
 */
const excursaoPedagogicaBaseSchema = {
  codigo: z
    .string({ required_error: 'Código é obrigatório' })
    .min(1, 'Código é obrigatório')
    .max(50, 'Código deve ter no máximo 50 caracteres')
    .regex(/^[A-Za-z0-9_-]+$/, 'Código deve conter apenas letras, números, hífen e underscore'),
  titulo: z
    .string({ required_error: 'Título é obrigatório' })
    .min(3, 'Título deve ter no mínimo 3 caracteres')
    .max(200, 'Título deve ter no máximo 200 caracteres'),
  subtitulo: z
    .string()
    .max(500, 'Subtítulo deve ter no máximo 500 caracteres')
    .optional()
    .nullable(),
  preco: z
    .number({ required_error: 'Preço é obrigatório' })
    .positive('Preço deve ser maior que zero'),
  duracao: z
    .string()
    .max(100, 'Duração deve ter no máximo 100 caracteres')
    .optional()
    .nullable(),
  categoria: z
    .string({ required_error: 'Categoria é obrigatória' })
    .min(1, 'Categoria é obrigatória'),
  status: z.enum(['ATIVO', 'INATIVO']).optional().default('ATIVO'),
  imagemCapa: z.string().optional().nullable(),
  imagemPrincipal: z.string().optional().nullable(),
  descricao: z.string().optional().nullable(),
  inclusos: z.string().optional().nullable(),
  recomendacoes: z.string().optional().nullable(),
  local: z.string().max(200).optional().nullable(),
  horario: z.string().max(100).optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  galeria: z.array(z.string()).optional().default([])
};

/**
 * Schema para criação de excursão pedagógica
 */
export const createExcursaoPedagogicaSchema = z.object(excursaoPedagogicaBaseSchema);

/**
 * Schema para atualização de excursão pedagógica
 * Todos os campos são opcionais, exceto quando especificado
 */
export const updateExcursaoPedagogicaSchema = z.object({
  ...Object.fromEntries(
    Object.entries(excursaoPedagogicaBaseSchema).map(([key, schema]) => [key, schema.optional()])
  )
});

/**
 * Schema para filtros de listagem
 */
export const filterExcursaoPedagogicaSchema = z.object({
  codigo: z.string().optional(),
  categoria: z.string().optional(),
  status: z.enum(['ATIVO', 'INATIVO']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().positive().optional().default(1),
  limit: z.coerce.number().positive().max(100).optional().default(20)
});

// Tipos inferidos dos schemas
export type CreateExcursaoPedagogicaInput = z.infer<typeof createExcursaoPedagogicaSchema>;
export type UpdateExcursaoPedagogicaInput = z.infer<typeof updateExcursaoPedagogicaSchema>;
export type FilterExcursaoPedagogicaInput = z.infer<typeof filterExcursaoPedagogicaSchema>;
