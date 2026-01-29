/**
 * Explicação do Arquivo [auth.middleware.ts]
 * 
 * Middlewares de autenticação e autorização.
 * Valida tokens JWT e verifica permissões de acesso.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';

// Extende o tipo Request para incluir usuário
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
      };
    }
  }
}

/**
 * Explicação da função [authMiddleware]
 * Middleware que verifica se o usuário está autenticado.
 * Valida o token JWT do header Authorization.
 * 
 * @throws {ApiError} 401 se token não fornecido ou inválido
 */
export async function authMiddleware(
  req: Request, 
  _res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw ApiError.unauthorized('Token não fornecido');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw ApiError.unauthorized('Formato de token inválido');
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw ApiError.internal('JWT_SECRET não configurado');
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as {
        id: string;
        email: string;
        name: string;
        role: string;
      };

      // Verifica se usuário ainda existe e está ativo
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, name: true, role: true, active: true }
      });

      if (!user || !user.active) {
        throw ApiError.unauthorized('Usuário não encontrado ou inativo');
      }

      // Adiciona usuário à requisição
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      };

      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        throw ApiError.unauthorized('Token expirado');
      }
      if (jwtError instanceof jwt.JsonWebTokenError) {
        throw ApiError.unauthorized('Token inválido');
      }
      throw jwtError;
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Explicação da função [optionalAuthMiddleware]
 * Middleware que opcionalmente verifica autenticação.
 * Se token presente e válido, adiciona usuário à requisição.
 * Se não presente, continua sem erro.
 */
export async function optionalAuthMiddleware(
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
        name: string;
        role: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, name: true, role: true, active: true }
      });

      if (user && user.active) {
        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    } catch {
      // Token inválido - continua sem autenticação
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Explicação da função [adminMiddleware]
 * Middleware que verifica se usuário é ADMIN.
 * Deve ser usado após authMiddleware.
 * 
 * @throws {ApiError} 403 se usuário não for ADMIN
 */
export function adminMiddleware(
  req: Request, 
  _res: Response, 
  next: NextFunction
): void {
  if (!req.user) {
    throw ApiError.unauthorized('Não autenticado');
  }

  if (req.user.role !== 'ADMIN') {
    throw ApiError.forbidden('Acesso restrito a administradores');
  }

  next();
}

export default authMiddleware;
