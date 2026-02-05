/**
 * Explicação do Arquivo [pedido.schema.ts]
 * 
 * Schemas de validação Zod para pedidos de excursões pedagógicas.
 * Valida dados de criação de pedido, dados dos alunos e filtros.
 */

import { z } from 'zod';

/**
 * Schema para dados do responsável financeiro (um por pedido)
 * Alinhado aos campos do admin/checkout.html
 */
export const dadosResponsavelFinanceiroSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100).trim(),
  sobrenome: z.string().min(2, 'Sobrenome deve ter no mínimo 2 caracteres').max(100).trim(),
  cpf: z
    .string()
    .refine(
      (val) => /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(val) || /^\d{11}$/.test(val),
      'CPF inválido. Use formato: 000.000.000-00'
    ),
  pais: z.string().min(2).max(50).trim(),
  cep: z.string().trim().regex(/^\d{5}-?\d{3}$/, 'CEP inválido. Use formato: 00000-000'),
  endereco: z.string().min(3, 'Endereço obrigatório').max(200).trim(),
  complemento: z.string().max(100).trim().optional(),
  numero: z.string().min(1, 'Número obrigatório').max(20).trim(),
  cidade: z.string().min(2).max(100).trim(),
  estado: z.string().length(2, 'Estado deve ser sigla (ex: SP)').trim(),
  bairro: z.string().max(100).trim().optional(),
  telefone: z
    .string()
    .refine(
      (val) => /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/.test(val),
      'Telefone inválido. Use formato: (11) 98888-8888'
    ),
  email: z.string().email('Email inválido').toLowerCase().trim()
});

/**
 * Schema para dados do aluno/participante da excursão
 * Usado ao criar item do pedido (informações do estudante + informações médicas)
 */
export const dadosAlunoSchema = z.object({
  nomeAluno: z
    .string({ required_error: 'Nome do aluno é obrigatório' })
    .min(3, 'Nome do aluno deve ter no mínimo 3 caracteres')
    .max(100, 'Nome do aluno deve ter no máximo 100 caracteres')
    .trim(),
  idadeAluno: z
    .number()
    .int('Idade deve ser um número inteiro')
    .min(1, 'Idade deve ser maior que 0')
    .max(120, 'Idade inválida')
    .optional(),
  dataNascimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento inválida. Use YYYY-MM-DD')
    .optional(),
  escolaAluno: z
    .string()
    .min(2, 'Nome da escola deve ter no mínimo 2 caracteres')
    .max(200, 'Nome da escola deve ter no máximo 200 caracteres')
    .trim()
    .optional(),
  serieAluno: z
    .string()
    .max(50, 'Série deve ter no máximo 50 caracteres')
    .trim()
    .optional(),
  turma: z.string().max(50).trim().optional(),
  unidadeColegio: z.string().max(200).trim().optional(),
  cpfAluno: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(val) || /^\d{11}$/.test(val),
      'CPF inválido. Use formato: 000.000.000-00 ou 00000000000'
    ),
  rgAluno: z.string().max(50).trim().optional(),
  responsavel: z
    .string()
    .min(3, 'Nome do responsável deve ter no mínimo 3 caracteres')
    .max(100, 'Nome do responsável deve ter no máximo 100 caracteres')
    .trim()
    .optional(),
  telefoneResponsavel: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/.test(val),
      'Telefone inválido. Use formato: (11) 98888-8888'
    ),
  emailResponsavel: z
    .string()
    .email('Email do responsável inválido')
    .toLowerCase()
    .trim()
    .optional(),
  observacoes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .trim()
    .optional(),
  // Informações médicas (por aluno)
  alergiasCuidados: z.string().max(2000, 'Máximo 2000 caracteres').trim().optional(),
  planoSaude: z.string().max(200).trim().optional(),
  medicamentosFebre: z.string().max(200).trim().optional(),
  medicamentosAlergia: z.string().max(200).trim().optional()
});

/**
 * Schema para criar pedido de excursão pedagógica (com código)
 * Cliente informa código da excursão, quantidade e dados dos alunos
 */
export const createPedidoSchema = z.object({
  codigoExcursao: z
    .string({ required_error: 'Código da excursão é obrigatório' })
    .min(1, 'Código da excursão é obrigatório')
    .trim(),
  quantidade: z
    .coerce
    .number({ required_error: 'Quantidade é obrigatória' })
    .int('Quantidade deve ser um número inteiro')
    .min(1, 'Quantidade deve ser no mínimo 1')
    .max(50, 'Quantidade máxima é 50 passagens por pedido'),
  dadosResponsavelFinanceiro: dadosResponsavelFinanceiroSchema.optional(),
  dadosAlunos: z
    .array(dadosAlunoSchema)
    .min(1, 'É necessário informar dados de pelo menos 1 aluno')
    .max(50, 'Máximo de 50 alunos por pedido'),
  observacoes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .trim()
    .optional()
}).refine(
  (data) => data.quantidade === data.dadosAlunos.length,
  {
    message: 'Quantidade de alunos informada deve corresponder ao número de dados fornecidos',
    path: ['dadosAlunos']
  }
);

/**
 * Schema para criar pedido de excursão normal (sem código, por slug)
 * Cliente informa slug da excursão, quantidade e dados dos participantes
 */
export const createPedidoExcursaoSchema = z.object({
  excursaoSlug: z
    .string({ required_error: 'Identificador da excursão é obrigatório' })
    .min(1, 'Identificador da excursão é obrigatório')
    .trim(),
  quantidade: z
    .number({ required_error: 'Quantidade é obrigatória' })
    .int('Quantidade deve ser um número inteiro')
    .min(1, 'Quantidade deve ser no mínimo 1')
    .max(50, 'Quantidade máxima é 50 passagens por pedido'),
  dadosAlunos: z
    .array(dadosAlunoSchema)
    .min(1, 'É necessário informar dados de pelo menos 1 participante')
    .max(50, 'Máximo de 50 participantes por pedido'),
  observacoes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .trim()
    .optional()
}).refine(
  (data) => data.quantidade === data.dadosAlunos.length,
  {
    message: 'Quantidade de participantes informada deve corresponder ao número de dados fornecidos',
    path: ['dadosAlunos']
  }
);

/**
 * Schema para atualizar status do pedido
 * Usado pelo admin para alterar status
 */
export const updatePedidoStatusSchema = z.object({
  status: z.enum([
    'PENDENTE',
    'AGUARDANDO_PAGAMENTO',
    'PAGO',
    'CONFIRMADO',
    'CANCELADO',
    'EXPIRADO'
  ], {
    required_error: 'Status é obrigatório',
    invalid_type_error: 'Status inválido'
  }),
  observacoes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .trim()
    .optional()
});

/**
 * Schema para filtrar pedidos
 * Usado para buscar pedidos por status, data, etc
 */
export const filterPedidosSchema = z.object({
  status: z
    .enum([
      'PENDENTE',
      'AGUARDANDO_PAGAMENTO',
      'PAGO',
      'CONFIRMADO',
      'CANCELADO',
      'EXPIRADO'
    ])
    .optional(),
  codigoExcursao: z
    .string()
    .trim()
    .optional(),
  dataInicio: z
    .string()
    .datetime('Data de início inválida')
    .optional(),
  dataFim: z
    .string()
    .datetime('Data de fim inválida')
    .optional(),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(20),
  page: z
    .number()
    .int()
    .min(1)
    .optional()
    .default(1)
});

/**
 * Schema para buscar excursão por código (antes de criar pedido)
 */
export const buscarPorCodigoSchema = z.object({
  codigo: z
    .string({ required_error: 'Código é obrigatório' })
    .min(1, 'Código é obrigatório')
    .trim()
});

// Tipos inferidos dos schemas para uso no TypeScript
export type DadosResponsavelFinanceiroInput = z.infer<typeof dadosResponsavelFinanceiroSchema>;
export type DadosAlunoInput = z.infer<typeof dadosAlunoSchema>;
export type CreatePedidoInput = z.infer<typeof createPedidoSchema>;
export type CreatePedidoExcursaoInput = z.infer<typeof createPedidoExcursaoSchema>;
export type UpdatePedidoStatusInput = z.infer<typeof updatePedidoStatusSchema>;
export type FilterPedidosInput = z.infer<typeof filterPedidosSchema>;
export type BuscarPorCodigoInput = z.infer<typeof buscarPorCodigoSchema>;
