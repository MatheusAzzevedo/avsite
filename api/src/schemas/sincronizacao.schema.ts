/**
 * Explicação do Arquivo [sincronizacao.schema.ts]
 *
 * Validação das consultas que a gestão (avoar) faz ao site para espelhar dados.
 */

import { z } from 'zod';

/** Query de GET /api/admin/sincronizacao/alunos: de qual excursão listar os alunos. */
export const alunosPagosQuerySchema = z.object({
  tipo: z.enum(['PEDAGOGICA', 'CONVENCIONAL']),
  excursaoId: z.string().min(1).max(100),
  /** '1' = todos os pedidos e a ficha inteira (painel de inscrições da gestão) */
  completo: z.enum(['1']).optional()
});

/** Query opcional das rotas de lista que servem aos dois tipos (padrão: pedagógica). */
export const tipoExcursaoQuerySchema = z.object({
  tipo: z.enum(['PEDAGOGICA', 'CONVENCIONAL']).optional()
});
