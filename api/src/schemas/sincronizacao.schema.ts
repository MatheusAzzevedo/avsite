/**
 * Explicação do Arquivo [sincronizacao.schema.ts]
 *
 * Validação das consultas que a gestão (avoar) faz ao site para espelhar dados.
 */

import { z } from 'zod';

/** Query de GET /api/admin/sincronizacao/alunos: de qual excursão listar os alunos pagos. */
export const alunosPagosQuerySchema = z.object({
  tipo: z.enum(['PEDAGOGICA', 'CONVENCIONAL']),
  excursaoId: z.string().min(1).max(100)
});
