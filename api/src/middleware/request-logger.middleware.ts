/**
 * Explicação do Arquivo [request-logger.middleware.ts]
 * 
 * Middleware para logging detalhado de requisições na API Avorar Turismo.
 * Captura:
 * - Método HTTP (GET, POST, PUT, DELETE, PATCH)
 * - URL e endpoint
 * - IP do cliente
 * - Tempo de resposta
 * - Status HTTP
 * - Usuário autenticado (se houver)
 * - Tamanho do body (para POST/PUT)
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface RequestMetadata {
  method: string;
  path: string;
  ip: string;
  userId?: string;
  userEmail?: string;
  statusCode?: number;
  responseTime?: number;
  bodySize?: number;
  queryParams?: Record<string, unknown>;
}

export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Captura o tempo de início
  const startTime = Date.now();
  
  // Extrai informações da requisição
  const method = req.method;
  const path = req.path;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const queryParams = Object.keys(req.query).length > 0 ? req.query : undefined;
  const bodySize = req.headers['content-length']
    ? parseInt(String(req.headers['content-length']), 10)
    : undefined;
  
  // Usuário autenticado (se houver)
  const userId = req.user?.id;
  const userEmail = req.user?.email;
  
  // Intercepta o método res.json para capturar o status code
  const originalJson = res.json;
  res.json = function (data: unknown) {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    const metadata: RequestMetadata = {
      method,
      path,
      ip,
      statusCode,
      responseTime,
      ...(userId && { userId }),
      ...(userEmail && { userEmail }),
      ...(bodySize && { bodySize }),
      ...(queryParams && { queryParams })
    };
    
    // Log baseado no status code
    if (statusCode >= 400) {
      // Erro (400-599)
      logger.error(
        `[${method}] ${path} → ${statusCode} (${responseTime}ms) - Requisição falhou`,
        metadata
      );
    } else if (statusCode >= 300) {
      // Redirect (300-399)
      logger.warn(
        `[${method}] ${path} → ${statusCode} (${responseTime}ms) - Redirecionamento`,
        metadata
      );
    } else {
      // Sucesso (200-299)
      logger.info(
        `[${method}] ${path} → ${statusCode} (${responseTime}ms)`,
        metadata
      );
    }
    
    // Chama o json original
    return originalJson.call(this, data);
  };
  
  next();
}

export default requestLoggerMiddleware;
