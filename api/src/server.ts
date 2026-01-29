/**
 * Explicação do Arquivo [server.ts]
 * 
 * Arquivo principal do servidor Express.
 * Configura middlewares, rotas e inicia o servidor.
 * 
 * Responsabilidades:
 * - Inicializar Express e middlewares
 * - Configurar CORS, Helmet, Rate Limiting
 * - Registrar todas as rotas da API
 * - Tratar erros globais
 * - Conectar ao banco de dados via Prisma
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

// Importa rotas
import authRoutes from './routes/auth.routes';
import excursaoRoutes from './routes/excursao.routes';
import postRoutes from './routes/post.routes';
import uploadRoutes from './routes/upload.routes';
import paymentConfigRoutes from './routes/payment-config.routes';
import publicRoutes from './routes/public.routes';

// Importa utilitários
import { prisma } from './config/database';
import { logger } from './utils/logger';
import { ApiError } from './utils/api-error';

const app = express();
const PORT = process.env.PORT || 3001;

// ===========================================
// MIDDLEWARES GLOBAIS
// ===========================================

// Helmet para segurança
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configurado
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' }
});
app.use('/api/', limiter);

// Parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve arquivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Log de requisições
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ===========================================
// ROTAS
// ===========================================

// Rota raiz - resposta amigável ao acessar o domínio
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Avorar Turismo API',
    message: 'API do sistema Avorar Turismo. Use os endpoints abaixo.',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      public: '/api/public',
      auth: '/api/auth',
      docs: 'Consulte API-DOCS.md para documentação completa'
    }
  });
});

// Rota de health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    message: 'API Avorar Turismo funcionando!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rotas públicas (para site e integrações externas)
app.use('/api/public', publicRoutes);

// Rotas de autenticação
app.use('/api/auth', authRoutes);

// Rotas protegidas (admin)
app.use('/api/excursoes', excursaoRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/payment-config', paymentConfigRoutes);

// ===========================================
// TRATAMENTO DE ERROS
// ===========================================

// Rota não encontrada
app.use((_req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Rota não encontrada',
    message: 'A rota solicitada não existe nesta API'
  });
});

// Handler de erros global
app.use((err: Error | ApiError, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(`Erro: ${err.message}`);
  
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details
    });
  }

  // Erro não tratado
  return res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Ocorreu um erro inesperado'
  });
});

// ===========================================
// INICIALIZAÇÃO DO SERVIDOR
// ===========================================

async function startServer() {
  try {
    // Testa conexão com o banco de dados
    await prisma.$connect();
    logger.info('✅ Conectado ao banco de dados PostgreSQL');

    // Inicia o servidor
    app.listen(PORT, () => {
      logger.info(`🚀 Servidor rodando em http://localhost:${PORT}`);
      logger.info(`📚 API disponível em http://localhost:${PORT}/api`);
      logger.info(`🔐 Rotas públicas em http://localhost:${PORT}/api/public`);
    });
  } catch (error) {
    logger.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('🛑 Encerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('🛑 Encerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

export default app;
