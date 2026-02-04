/**
 * Explicação do Arquivo [cliente-auth.middleware.ts]
 * 
 * Middleware de autenticação para clientes.
 * Valida tokens JWT de clientes e adiciona dados do cliente à requisição.
 * Separado do auth.middleware.ts (que é para admins) para manter clareza e segurança.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { logger } from '../utils/logger';

// Extende o tipo Request para incluir cliente
declare global {
  namespace Express {
    interface Request {
      cliente?: {
        id: string;
        email: string;
        nome: string;
        authProvider: string;
      };
    }
  }
}

/**
 * Explicação da função [clienteAuthMiddleware]
 * 
 * Middleware que verifica se o cliente está autenticado.
 * Valida o token JWT do header Authorization.
 * Diferente do authMiddleware (admin), este busca na tabela 'clientes'.
 * 
 * Fluxo:
 * 1. Extrai token do header Authorization
 * 2. Valida formato Bearer token
 * 3. Verifica assinatura JWT
 * 4. Busca cliente no banco de dados
 * 5. Verifica se cliente está ativo
 * 6. Adiciona dados do cliente ao req.cliente
 * 
 * @throws {ApiError} 401 se token não fornecido ou inválido
 * @throws {ApiError} 401 se cliente não encontrado ou inativo
 */
export async function clienteAuthMiddleware(
  req: Request, 
  _res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    logger.info('[Cliente Auth] Verificando autenticação de cliente', {
      context: { 
        path: req.path, 
        method: req.method,
        hasAuthHeader: !!authHeader 
      }
    });

    if (!authHeader) {
      logger.warn('[Cliente Auth] Token não fornecido', {
        context: { path: req.path, ip: req.ip }
      });
      throw ApiError.unauthorized('Token não fornecido');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      logger.warn('[Cliente Auth] Formato de token inválido', {
        context: { path: req.path, type, hasToken: !!token }
      });
      throw ApiError.unauthorized('Formato de token inválido');
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('[Cliente Auth] JWT_SECRET não configurado');
      throw ApiError.internal('JWT_SECRET não configurado');
    }

    try {
      // Decodifica o token JWT
      const decoded = jwt.verify(token, jwtSecret) as {
        id: string;
        email: string;
        nome: string;
        authProvider: string;
        type: string; // 'cliente' ou 'admin' para diferenciar
      };

      // Verifica se o token é de cliente (não de admin)
      if (decoded.type !== 'cliente') {
        logger.warn('[Cliente Auth] Token não é de cliente', {
          context: { tokenType: decoded.type, path: req.path }
        });
        throw ApiError.unauthorized('Token inválido para área de cliente');
      }

      logger.info('[Cliente Auth] Token decodificado com sucesso', {
        context: { clienteId: decoded.id, email: decoded.email }
      });

      // Verifica se cliente ainda existe e está ativo
      const cliente = await prisma.cliente.findUnique({
        where: { id: decoded.id },
        select: { 
          id: true, 
          email: true, 
          nome: true, 
          authProvider: true, 
          active: true 
        }
      });

      if (!cliente || !cliente.active) {
        logger.warn('[Cliente Auth] Cliente não encontrado ou inativo', {
          context: { 
            clienteId: decoded.id, 
            found: !!cliente, 
            active: cliente?.active 
          }
        });
        throw ApiError.unauthorized('Cliente não encontrado ou inativo');
      }

      // Adiciona cliente à requisição
      req.cliente = {
        id: cliente.id,
        email: cliente.email,
        nome: cliente.nome,
        authProvider: cliente.authProvider
      };

      logger.info('[Cliente Auth] Autenticação bem-sucedida', {
        context: { 
          clienteId: cliente.id, 
          email: cliente.email,
          path: req.path 
        }
      });

      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        logger.warn('[Cliente Auth] Token expirado', {
          context: { path: req.path, expiredAt: jwtError.expiredAt }
        });
        throw ApiError.unauthorized('Token expirado');
      }
      if (jwtError instanceof jwt.JsonWebTokenError) {
        logger.warn('[Cliente Auth] Token JWT inválido', {
          context: { path: req.path, error: jwtError.message }
        });
        throw ApiError.unauthorized('Token inválido');
      }
      throw jwtError;
    }
  } catch (error) {
    logger.error('[Cliente Auth] Erro no middleware de autenticação', {
      context: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
    next(error);
  }
}

/**
 * Explicação da função [optionalClienteAuthMiddleware]
 * 
 * Middleware que opcionalmente verifica autenticação de cliente.
 * Se token presente e válido, adiciona cliente à requisição.
 * Se não presente ou inválido, continua sem erro.
 * Útil para rotas que podem ser acessadas com ou sem autenticação.
 */
export async function optionalClienteAuthMiddleware(
  req: Request, 
  _res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return next();
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as {
        id: string;
        email: string;
        nome: string;
        authProvider: string;
        type: string;
      };

      if (decoded.type !== 'cliente') {
        return next();
      }

      const cliente = await prisma.cliente.findUnique({
        where: { id: decoded.id },
        select: { 
          id: true, 
          email: true, 
          nome: true, 
          authProvider: true, 
          active: true 
        }
      });

      if (cliente && cliente.active) {
        req.cliente = {
          id: cliente.id,
          email: cliente.email,
          nome: cliente.nome,
          authProvider: cliente.authProvider
        };

        logger.info('[Cliente Auth Optional] Cliente autenticado opcionalmente', {
          context: { clienteId: cliente.id }
        });
      }
    } catch {
      // Token inválido - continua sem autenticação
      logger.debug('[Cliente Auth Optional] Token inválido, continuando sem autenticação');
    }

    next();
  } catch (error) {
    next(error);
  }
}

export default clienteAuthMiddleware;
