/**
 * Explicação do Arquivo [excursao-pedagogica.schema.ts]
 *
 * Schemas de validação Zod para excursões pedagógicas.
 * Código: manual no admin; via API pode ser enviado ou gerado a partir de destino + dataDestino.
 */

import { z } from 'zod';

const codigoSchema = z
  .string()
  .min(1, 'Código é obrigatório')
  .max(50, 'Código deve ter no máximo 50 caracteres')
  .regex(/^[A-Za-z0-9_-]+$/, 'Código deve conter apenas letras, números, hífen e underscore');

const dataDestinoSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'dataDestino deve estar no formato YYYY-MM-DD');

/**
 * Schema base para excursão pedagógica
 * codigo: opcional na criação (se omitido, destino + dataDestino geram o código)
 */
const excursaoPedagogicaBaseSchema = {
  codigo: codigoSchema.optional(),
  destino: z.string().min(1, 'Destino é obrigatório quando codigo não é enviado').max(200).optional().nullable(),
  dataDestino: dataDestinoSchema.optional().nullable(),
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
 * Schema para criação de excursão pedagógica.
 * Ou envia codigo (manual/admin) ou destino + dataDestino (API gera o código).
 */
export const createExcursaoPedagogicaSchema = z
  .object(excursaoPedagogicaBaseSchema)
  .refine(
    (data) => {
      const hasCodigo = data.codigo != null && String(data.codigo).trim().length > 0;
      const hasDestinoData = data.destino != null && String(data.destino).trim().length > 0 && data.dataDestino != null && String(data.dataDestino).trim().length > 0;
      return hasCodigo || hasDestinoData;
    },
    { message: 'Informe codigo ou destino e dataDestino (formato YYYY-MM-DD)' }
  );

const baseSchemaForUpdate = {
  ...excursaoPedagogicaBaseSchema,
  codigo: codigoSchema.optional(),
  destino: z.string().max(200).optional().nullable(),
  dataDestino: dataDestinoSchema.optional().nullable()
};

/**
 * Schema para atualização de excursão pedagógica
 * Todos os campos são opcionais; codigo continua editável manualmente
 */
export const updateExcursaoPedagogicaSchema = z.object({
  ...Object.fromEntries(
    Object.entries(baseSchemaForUpdate).map(([key, schema]) => [key, schema.optional()])
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
