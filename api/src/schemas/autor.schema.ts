import { z } from 'zod';

export const createAutorSchema = z.object({
  nome: z.string().min(1, 'O nome é obrigatório'),
  profissao: z.string().optional(),
  descricao: z.string().optional(),
  foto: z.string().optional()
});

export const updateAutorSchema = createAutorSchema.partial();
