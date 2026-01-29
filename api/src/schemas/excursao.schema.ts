/**
 * Explicação do Arquivo [excursao.schema.ts]
 * 
 * Schemas de validação Zod para excursões.
 * Valida dados de criação, atualização e filtros.
 */

import { z } from 'zod';

/**
 * Schema base para excursão
 */
const excursaoBaseSchema = {
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
 * Schema para criação de excursão
 */
export const createExcursaoSchema = z.object(excursaoBaseSchema);

/**
 * Schema para atualização de excursão
 */
export const updateExcursaoSchema = z.object({
  ...Object.fromEntries(
    Object.entries(excursaoBaseSchema).map(([key, schema]) => [key, schema.optional()])
  )
});

/**
 * Schema para filtros de listagem
 */
export const filterExcursaoSchema = z.object({
  categoria: z.string().optional(),
  status: z.enum(['ATIVO', 'INATIVO']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().positive().optional().default(1),
  limit: z.coerce.number().positive().max(100).optional().default(20)
});

// Tipos inferidos dos schemas
export type CreateExcursaoInput = z.infer<typeof createExcursaoSchema>;
export type UpdateExcursaoInput = z.infer<typeof updateExcursaoSchema>;
export type FilterExcursaoInput = z.infer<typeof filterExcursaoSchema>;
