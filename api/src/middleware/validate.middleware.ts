/**
 * Explicação do Arquivo [validate.middleware.ts]
 * 
 * Middleware de validação usando Zod.
 * Valida body, params e query da requisição.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../utils/api-error';

type ValidationTarget = 'body' | 'params' | 'query';

/**
 * Explicação da função [validate]
 * Cria middleware de validação para um schema Zod.
 * 
 * @param schema - Schema Zod para validação
 * @param target - Alvo da validação (body, params ou query)
 * @returns Middleware Express
 * 
 * @example
 * router.post('/', validate(createPostSchema, 'body'), createPost)
 */
export function validate(
  schema: ZodSchema,
  target: ValidationTarget = 'body'
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = req[target];
      const result = schema.parse(data);
      
      // Substitui dados validados (com valores transformados/padrão)
      req[target] = result;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        throw ApiError.badRequest('Dados inválidos', errors);
      }
      
      next(error);
    }
  };
}

/**
 * Explicação da função [validateBody]
 * Atalho para validar body da requisição.
 */
export function validateBody(schema: ZodSchema) {
  return validate(schema, 'body');
}

/**
 * Explicação da função [validateParams]
 * Atalho para validar params da requisição.
 */
export function validateParams(schema: ZodSchema) {
  return validate(schema, 'params');
}

/**
 * Explicação da função [validateQuery]
 * Atalho para validar query da requisição.
 */
export function validateQuery(schema: ZodSchema) {
  return validate(schema, 'query');
}

export default validate;
