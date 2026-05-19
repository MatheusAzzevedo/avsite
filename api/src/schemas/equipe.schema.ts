/**
 * Explicação do Arquivo [equipe.schema.ts]
 * 
 * Schemas de validação Zod para membros da equipe.
 * Valida dados de criação e atualização.
 */

import { z } from 'zod';

/**
 * Schema base para membro da equipe
 */
const equipeBaseSchema = {
  nome: z
    .string({ required_error: 'Nome é obrigatório' })
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  dataNascimento: z
    .string({ required_error: 'Data de nascimento é obrigatória' })
    .or(z.date())
    .transform(val => new Date(val)),
  funcao: z
    .string({ required_error: 'Função é obrigatória' })
    .min(2, 'Função deve ter no mínimo 2 caracteres')
    .max(100, 'Função deve ter no máximo 100 caracteres'),
  ativo: z.boolean().optional().default(true),
  fotoPerfil: z
    .string({ required_error: 'Foto de perfil é obrigatória' })
    .min(1, 'Foto de perfil é obrigatória')
};

/**
 * Schema para criação de membro da equipe
 */
export const createEquipeSchema = z.object(equipeBaseSchema);

/**
 * Schema para atualização de membro da equipe
 */
export const updateEquipeSchema = z.object({
  nome: equipeBaseSchema.nome.optional(),
  dataNascimento: z.string().or(z.date()).optional().transform(val => val ? new Date(val) : undefined),
  funcao: equipeBaseSchema.funcao.optional(),
  ativo: z.boolean().optional(),
  fotoPerfil: equipeBaseSchema.fotoPerfil.optional()
});

// Tipos inferidos
export type CreateEquipeInput = z.infer<typeof createEquipeSchema>;
export type UpdateEquipeInput = z.infer<typeof updateEquipeSchema>;
