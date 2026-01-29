/**
 * Explicação do Arquivo [api-error.ts]
 * 
 * Classe personalizada para erros da API.
 * Permite criar erros com código de status HTTP e detalhes adicionais.
 */

export class ApiError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(message: string, statusCode: number = 500, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
    
    // Mantém o stack trace correto
    Error.captureStackTrace(this, this.constructor);
  }

  // Métodos estáticos para erros comuns
  static badRequest(message: string = 'Requisição inválida', details?: unknown) {
    return new ApiError(message, 400, details);
  }

  static unauthorized(message: string = 'Não autorizado') {
    return new ApiError(message, 401);
  }

  static forbidden(message: string = 'Acesso negado') {
    return new ApiError(message, 403);
  }

  static notFound(message: string = 'Recurso não encontrado') {
    return new ApiError(message, 404);
  }

  static conflict(message: string = 'Conflito com recurso existente') {
    return new ApiError(message, 409);
  }

  static internal(message: string = 'Erro interno do servidor') {
    return new ApiError(message, 500);
  }
}

export default ApiError;
