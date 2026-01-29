/**
 * Explicação do Arquivo [post.schema.ts]
 * 
 * Schemas de validação Zod para posts do blog.
 * Valida dados de criação, atualização e filtros.
 */

import { z } from 'zod';

/**
 * Schema base para post
 */
const postBaseSchema = {
  titulo: z
    .string({ required_error: 'Título é obrigatório' })
    .min(3, 'Título deve ter no mínimo 3 caracteres')
    .max(200, 'Título deve ter no máximo 200 caracteres'),
  autor: z
    .string()
    .max(100, 'Autor deve ter no máximo 100 caracteres')
    .optional()
    .default('Admin'),
  data: z
    .string()
    .or(z.date())
    .optional()
    .transform(val => val ? new Date(val) : new Date()),
  categoria: z
    .string({ required_error: 'Categoria é obrigatória' })
    .min(1, 'Categoria é obrigatória'),
  status: z.enum(['PUBLICADO', 'RASCUNHO']).optional().default('RASCUNHO'),
  imagemCapa: z.string().optional().nullable(),
  resumo: z.string().max(500, 'Resumo deve ter no máximo 500 caracteres').optional().nullable(),
  conteudo: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([])
};

/**
 * Schema para criação de post
 */
export const createPostSchema = z.object(postBaseSchema);

/**
 * Schema para atualização de post
 */
export const updatePostSchema = z.object({
  titulo: postBaseSchema.titulo.optional(),
  autor: z.string().max(100).optional(),
  data: z.string().or(z.date()).optional().transform(val => val ? new Date(val) : undefined),
  categoria: z.string().optional(),
  status: z.enum(['PUBLICADO', 'RASCUNHO']).optional(),
  imagemCapa: z.string().optional().nullable(),
  resumo: z.string().max(500).optional().nullable(),
  conteudo: z.string().optional().nullable(),
  tags: z.array(z.string()).optional()
});

/**
 * Schema para filtros de listagem
 */
export const filterPostSchema = z.object({
  categoria: z.string().optional(),
  status: z.enum(['PUBLICADO', 'RASCUNHO']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().positive().optional().default(1),
  limit: z.coerce.number().positive().max(100).optional().default(20)
});

// Tipos inferidos dos schemas
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type FilterPostInput = z.infer<typeof filterPostSchema>;
