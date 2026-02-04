/**
 * Explicação do Arquivo [cliente-auth.routes.ts]
 * 
 * Rotas de autenticação para clientes.
 * Gerencia registro, login, perfil e atualização de dados de clientes.
 * Separado das rotas de admin para manter segurança e clareza.
 * 
 * Rotas disponíveis:
 * - POST /api/cliente/auth/register - Registro de novo cliente
 * - POST /api/cliente/auth/login - Login de cliente
 * - GET /api/cliente/auth/me - Dados do cliente autenticado
 * - PUT /api/cliente/auth/profile - Atualizar perfil
 * - PUT /api/cliente/auth/change-password - Alterar senha
 * - POST /api/cliente/auth/verify - Verificar se token é válido
 */

import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { clienteAuthMiddleware } from '../middleware/cliente-auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { 
  clienteRegisterSchema, 
  clienteLoginSchema,
  clienteUpdateProfileSchema,
  clienteChangePasswordSchema
} from '../schemas/cliente-auth.schema';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Explicação da API [POST /api/cliente/auth/register]
 * 
 * Registra um novo cliente no sistema.
 * 
 * Fluxo:
 * 1. Valida dados de entrada com Zod
 * 2. Verifica se email já existe
 * 3. Hash da senha com bcrypt (10 rounds)
 * 4. Cria cliente no banco de dados
 * 5. Registra log de atividade
 * 6. Retorna dados do cliente (sem senha)
 * 
 * Body: { nome, email, password, telefone?, cpf? }
 * Response: { success, message, data: { id, email, nome, ... } }
 */
router.post('/register', 
  validateBody(clienteRegisterSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { nome, email, password, telefone, cpf } = req.body;
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

      logger.info('[Cliente Auth] Tentativa de registro de novo cliente', {
        context: { email, nome, ip: clientIp, timestamp: new Date().toISOString() }
      });

      // Verifica se email já existe (tanto em clientes quanto em admins para evitar confusão)
      const existingCliente = await prisma.cliente.findUnique({
        where: { email }
      });

      if (existingCliente) {
        logger.warn('[Cliente Auth] Email já cadastrado', {
          context: { email, ip: clientIp }
        });
        throw ApiError.conflict('Email já está em uso');
      }

      // Hash da senha
      logger.info('[Cliente Auth] Gerando hash de senha', {
        context: { email }
      });
      const hashedPassword = await bcrypt.hash(password, 10);

      // Cria cliente
      const cliente = await prisma.cliente.create({
        data: {
          nome,
          email,
          password: hashedPassword,
          telefone: telefone || null,
          cpf: cpf || null,
          authProvider: 'LOCAL'
        },
        select: {
          id: true,
          email: true,
          nome: true,
          telefone: true,
          cpf: true,
          authProvider: true,
          emailVerified: true,
          createdAt: true
        }
      });

      // Registra atividade
      await prisma.activityLog.create({
        data: {
          action: 'register',
          entity: 'cliente',
          entityId: cliente.id,
          description: `Cliente registrado: ${cliente.email}`,
          userEmail: cliente.email,
          ip: clientIp
        }
      });

      logger.info('[Cliente Auth] Cliente registrado com sucesso', {
        context: { 
          clienteId: cliente.id, 
          email: cliente.email,
          nome: cliente.nome,
          ip: clientIp 
        }
      });

      res.status(201).json({
        success: true,
        message: 'Cliente registrado com sucesso',
        data: cliente
      });
    } catch (error) {
      logger.error('[Cliente Auth] Erro ao registrar cliente', {
        context: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          email: req.body?.email 
        }
      });
      next(error);
    }
  }
);

/**
 * Explicação da API [POST /api/cliente/auth/login]
 * 
 * Realiza login do cliente e retorna token JWT.
 * 
 * Fluxo:
 * 1. Valida dados de entrada
 * 2. Busca cliente por email
 * 3. Verifica se cliente está ativo
 * 4. Compara senha com bcrypt
 * 5. Gera token JWT (7 dias de validade)
 * 6. Registra log de login
 * 7. Retorna token e dados do cliente
 * 
 * Body: { email, password }
 * Response: { success, message, data: { token, cliente: {...} } }
 */
router.post('/login', 
  validateBody(clienteLoginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

      logger.info('[Cliente Auth] Tentativa de login', {
        context: { email, ip: clientIp, timestamp: new Date().toISOString() }
      });

      // Busca cliente
      const cliente = await prisma.cliente.findUnique({
        where: { email }
      });

      if (!cliente) {
        logger.warn('[Cliente Auth] Login falhou - email não encontrado', {
          context: { email, ip: clientIp }
        });
        throw ApiError.unauthorized('Email ou senha incorretos');
      }

      if (!cliente.active) {
        logger.warn('[Cliente Auth] Login falhou - cliente desativado', {
          context: { email, clienteId: cliente.id, ip: clientIp }
        });
        throw ApiError.unauthorized('Cliente desativado');
      }

      // Verifica se é login local (tem senha)
      if (cliente.authProvider !== 'LOCAL' || !cliente.password) {
        logger.warn('[Cliente Auth] Login falhou - conta não é local', {
          context: { email, authProvider: cliente.authProvider }
        });
        throw ApiError.badRequest(
          `Esta conta foi criada com ${cliente.authProvider}. Por favor, faça login usando ${cliente.authProvider}.`
        );
      }

      // Verifica senha
      logger.info('[Cliente Auth] Verificando senha', {
        context: { email, clienteId: cliente.id }
      });
      const validPassword = await bcrypt.compare(password, cliente.password);

      if (!validPassword) {
        logger.warn('[Cliente Auth] Login falhou - senha incorreta', {
          context: { email, clienteId: cliente.id, ip: clientIp }
        });
        throw ApiError.unauthorized('Email ou senha incorretos');
      }

      // Gera token JWT
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        logger.error('[Cliente Auth] JWT_SECRET não configurado');
        throw ApiError.internal('JWT_SECRET não configurado');
      }

      const token = jwt.sign(
        {
          id: cliente.id,
          email: cliente.email,
          nome: cliente.nome,
          authProvider: cliente.authProvider,
          type: 'cliente' // Marca o token como sendo de cliente
        },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Registra atividade
      await prisma.activityLog.create({
        data: {
          action: 'login',
          entity: 'cliente',
          entityId: cliente.id,
          description: `Login realizado: ${cliente.email}`,
          userEmail: cliente.email,
          ip: clientIp
        }
      });

      logger.info('[Cliente Auth] Login bem-sucedido', {
        context: {
          clienteId: cliente.id,
          email: cliente.email,
          nome: cliente.nome,
          ip: clientIp,
          timestamp: new Date().toISOString()
        }
      });

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          token,
          cliente: {
            id: cliente.id,
            email: cliente.email,
            nome: cliente.nome,
            telefone: cliente.telefone,
            cpf: cliente.cpf,
            authProvider: cliente.authProvider,
            avatarUrl: cliente.avatarUrl,
            emailVerified: cliente.emailVerified
          }
        }
      });
    } catch (error) {
      logger.error('[Cliente Auth] Erro ao fazer login', {
        context: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          email: req.body?.email 
        }
      });
      next(error);
    }
  }
);

/**
 * Explicação da API [GET /api/cliente/auth/me]
 * 
 * Retorna dados do cliente autenticado.
 * Requer autenticação (token JWT).
 */
router.get('/me',
  clienteAuthMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cliente = await prisma.cliente.findUnique({
        where: { id: req.cliente!.id },
        select: {
          id: true,
          email: true,
          nome: true,
          telefone: true,
          cpf: true,
          authProvider: true,
          avatarUrl: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!cliente) {
        throw ApiError.notFound('Cliente não encontrado');
      }

      logger.info('[Cliente Auth] Dados do cliente recuperados', {
        context: { clienteId: cliente.id, email: cliente.email }
      });

      res.json({
        success: true,
        data: cliente
      });
    } catch (error) {
      logger.error('[Cliente Auth] Erro ao buscar dados do cliente', {
        context: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          clienteId: req.cliente?.id 
        }
      });
      next(error);
    }
  }
);

/**
 * Explicação da API [PUT /api/cliente/auth/profile]
 * 
 * Atualiza dados do perfil do cliente autenticado.
 * Requer autenticação.
 * 
 * Body: { nome?, telefone?, cpf?, avatarUrl? }
 */
router.put('/profile',
  clienteAuthMiddleware,
  validateBody(clienteUpdateProfileSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { nome, telefone, cpf, avatarUrl } = req.body;

      logger.info('[Cliente Auth] Atualizando perfil do cliente', {
        context: { clienteId: req.cliente!.id, campos: Object.keys(req.body) }
      });

      const cliente = await prisma.cliente.update({
        where: { id: req.cliente!.id },
        data: {
          ...(nome && { nome }),
          ...(telefone !== undefined && { telefone }),
          ...(cpf !== undefined && { cpf }),
          ...(avatarUrl !== undefined && { avatarUrl })
        },
        select: {
          id: true,
          email: true,
          nome: true,
          telefone: true,
          cpf: true,
          authProvider: true,
          avatarUrl: true,
          emailVerified: true,
          updatedAt: true
        }
      });

      // Registra atividade
      await prisma.activityLog.create({
        data: {
          action: 'update',
          entity: 'cliente',
          entityId: cliente.id,
          description: 'Perfil atualizado',
          userEmail: cliente.email
        }
      });

      logger.info('[Cliente Auth] Perfil atualizado com sucesso', {
        context: { clienteId: cliente.id, email: cliente.email }
      });

      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: cliente
      });
    } catch (error) {
      logger.error('[Cliente Auth] Erro ao atualizar perfil', {
        context: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          clienteId: req.cliente?.id 
        }
      });
      next(error);
    }
  }
);

/**
 * Explicação da API [PUT /api/cliente/auth/change-password]
 * 
 * Altera senha do cliente autenticado.
 * Requer autenticação.
 * 
 * Body: { currentPassword, newPassword }
 */
router.put('/change-password',
  clienteAuthMiddleware,
  validateBody(clienteChangePasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword } = req.body;

      logger.info('[Cliente Auth] Solicitação de alteração de senha', {
        context: { clienteId: req.cliente!.id }
      });

      // Busca cliente com senha
      const cliente = await prisma.cliente.findUnique({
        where: { id: req.cliente!.id }
      });

      if (!cliente) {
        throw ApiError.notFound('Cliente não encontrado');
      }

      // Verifica se conta é local
      if (cliente.authProvider !== 'LOCAL' || !cliente.password) {
        logger.warn('[Cliente Auth] Tentativa de alterar senha de conta OAuth', {
          context: { clienteId: cliente.id, authProvider: cliente.authProvider }
        });
        throw ApiError.badRequest(
          'Não é possível alterar senha de contas criadas via OAuth'
        );
      }

      // Verifica senha atual
      const validPassword = await bcrypt.compare(currentPassword, cliente.password);

      if (!validPassword) {
        logger.warn('[Cliente Auth] Senha atual incorreta ao tentar alterar', {
          context: { clienteId: cliente.id }
        });
        throw ApiError.badRequest('Senha atual incorreta');
      }

      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Atualiza senha
      await prisma.cliente.update({
        where: { id: cliente.id },
        data: { password: hashedPassword }
      });

      // Registra atividade
      await prisma.activityLog.create({
        data: {
          action: 'update',
          entity: 'cliente',
          entityId: cliente.id,
          description: 'Senha alterada',
          userEmail: cliente.email
        }
      });

      logger.info('[Cliente Auth] Senha alterada com sucesso', {
        context: { clienteId: cliente.id, email: cliente.email }
      });

      res.json({
        success: true,
        message: 'Senha alterada com sucesso'
      });
    } catch (error) {
      logger.error('[Cliente Auth] Erro ao alterar senha', {
        context: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          clienteId: req.cliente?.id 
        }
      });
      next(error);
    }
  }
);

/**
 * Explicação da API [POST /api/cliente/auth/verify]
 * 
 * Verifica se token JWT é válido.
 * Requer autenticação.
 */
router.post('/verify',
  clienteAuthMiddleware,
  (req: Request, res: Response) => {
    logger.info('[Cliente Auth] Token verificado com sucesso', {
      context: { clienteId: req.cliente!.id }
    });

    res.json({
      success: true,
      message: 'Token válido',
      data: {
        cliente: req.cliente
      }
    });
  }
);

export default router;
