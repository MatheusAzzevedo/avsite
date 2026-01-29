/**
 * Explicação do Arquivo [auth.routes.ts]
 * 
 * Rotas de autenticação da API.
 * Gerencia login, registro e validação de tokens.
 */

import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { loginSchema, registerSchema, changePasswordSchema } from '../schemas/auth.schema';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/auth/login
 * Realiza login do usuário
 */
router.post('/login', 
  validateBody(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      logger.info(`[Auth] Tentativa de login: ${email}`);

      // Busca usuário
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        throw ApiError.unauthorized('Email ou senha incorretos');
      }

      if (!user.active) {
        throw ApiError.unauthorized('Usuário desativado');
      }

      // Verifica senha
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        throw ApiError.unauthorized('Email ou senha incorretos');
      }

      // Gera token JWT
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw ApiError.internal('JWT_SECRET não configurado');
      }

      // Necessário porque o tipo SignOptions do jsonwebtoken é restritivo com expiresIn como string
      // @ts-ignore
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
      );

      // Registra atividade
      await prisma.activityLog.create({
        data: {
          action: 'login',
          entity: 'user',
          entityId: user.id,
          description: `Login realizado: ${user.email}`,
          userId: user.id,
          userEmail: user.email
        }
      });

      logger.info(`[Auth] Login bem-sucedido: ${email}`);

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/register
 * Registra novo usuário (apenas admin pode registrar)
 */
router.post('/register',
  authMiddleware,
  validateBody(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, role } = req.body;

      logger.info(`[Auth] Registro de novo usuário: ${email}`);

      // Verifica se email já existe
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        throw ApiError.conflict('Email já está em uso');
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Cria usuário
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role || 'ADMIN'
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true
        }
      });

      // Registra atividade
      await prisma.activityLog.create({
        data: {
          action: 'create',
          entity: 'user',
          entityId: user.id,
          description: `Usuário criado: ${user.email}`,
          userId: req.user?.id,
          userEmail: req.user?.email
        }
      });

      logger.info(`[Auth] Usuário criado: ${email}`);

      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/auth/me
 * Retorna dados do usuário autenticado
 */
router.get('/me',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        throw ApiError.notFound('Usuário não encontrado');
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/auth/change-password
 * Altera senha do usuário autenticado
 */
router.put('/change-password',
  authMiddleware,
  validateBody(changePasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword } = req.body;

      // Busca usuário com senha
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id }
      });

      if (!user) {
        throw ApiError.notFound('Usuário não encontrado');
      }

      // Verifica senha atual
      const validPassword = await bcrypt.compare(currentPassword, user.password);

      if (!validPassword) {
        throw ApiError.badRequest('Senha atual incorreta');
      }

      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Atualiza senha
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });

      // Registra atividade
      await prisma.activityLog.create({
        data: {
          action: 'update',
          entity: 'user',
          entityId: user.id,
          description: 'Senha alterada',
          userId: user.id,
          userEmail: user.email
        }
      });

      logger.info(`[Auth] Senha alterada: ${user.email}`);

      res.json({
        success: true,
        message: 'Senha alterada com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/verify
 * Verifica se token é válido
 */
router.post('/verify',
  authMiddleware,
  (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Token válido',
      data: {
        user: req.user
      }
    });
  }
);

export default router;
