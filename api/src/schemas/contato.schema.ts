/**
 * Explicação do Arquivo [contato.schema.ts]
 *
 * Validação da mensagem enviada pelo formulário de contato do site.
 *
 * É a única entrada pública não autenticada que dispara e-mail, então a
 * validação aqui faz dois trabalhos: garantir que a equipe receba dados
 * utilizáveis, e limitar o que um robô consegue injetar no corpo da mensagem.
 *
 * Os campos espelham o formulário em `public/contact.html`. Obrigatórios são
 * apenas os que a Avoar precisa para retornar o contato — o resto é opcional,
 * para não travar quem quer só mandar uma pergunta rápida.
 */

import { z } from 'zod';

/** Séries oferecidas, conforme os botões de rádio do formulário. */
export const SERIES = ['ensino-infantil', 'ensino-fundamental', 'ensino-medio', 'todas'] as const;

const textoOpcional = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal('')).transform((v) => v || undefined);

export const contatoSchema = z.object({
  nome: z
    .string({ required_error: 'Nome é obrigatório' })
    .trim()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),

  sobrenome: textoOpcional(100),

  email: z
    .string({ required_error: 'E-mail é obrigatório' })
    .trim()
    .toLowerCase()
    .email('E-mail inválido')
    .max(150),

  escola: textoOpcional(150),
  municipio: textoOpcional(100),

  telefone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined)
    .refine(
      (v) => v === undefined || v.replace(/\D/g, '').length >= 10,
      'Telefone deve ter DDD e número'
    ),

  roteiro: textoOpcional(200),

  serie: z.enum(SERIES, { errorMap: () => ({ message: 'Selecione uma opção de série' }) }),

  mensagem: textoOpcional(2000)
});

export type DadosContato = z.infer<typeof contatoSchema>;
