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
import requestLoggerMiddleware from './middleware/request-logger.middleware';

const app = express();
const PORT = process.env.PORT || 3001;

// ===========================================
// MIDDLEWARES GLOBAIS
// ===========================================

// Configurar trust proxy (necessário para Railway e outros ambientes com proxy reverso)
// Isso permite que o Express reconheça o IP real do cliente através do header X-Forwarded-For
app.set('trust proxy', 1);

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

// Parser JSON (limite maior para excursões com imagens em base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/css', express.static(path.join(__dirname, '../public/css')));
app.use('/js', express.static(path.join(__dirname, '../public/js')));
app.use('/images', express.static(path.join(__dirname, '../public/images')));
app.use('/fonts', express.static(path.join(__dirname, '../public/fonts')));
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));

// Middleware de logging detalhado para API (após middlewares de parser)
app.use('/api/', requestLoggerMiddleware);

// ===========================================
// ROTAS DO SITE (URLs amigáveis)
// ===========================================

const publicDir = path.join(__dirname, '../public');

/** Mapa: URL amigável → arquivo HTML */
const siteRoutes: Record<string, string> = {
  '/': 'index-10.html',
  '/inicio': 'index-10.html',
  '/biologia-marinha': 'index-11.html',
  '/sobre-nos': 'about.html',
  '/blog': 'blog.html',
  '/contato': 'contact.html',
  '/excursoes': 'portfolio.html'
};

/** Serve uma página do site por path amigável */
function serveSitePage(urlPath: string, res: Response): void {
  const htmlFile = siteRoutes[urlPath];
  if (!htmlFile) {
    res.status(404).json({ error: 'Página não encontrada', message: 'A página solicitada não existe' });
    return;
  }
  const filePath = path.join(publicDir, htmlFile);
  res.sendFile(filePath, (err) => {
    if (err) {
      logger.error(`Erro ao servir ${urlPath}: ${err.message}`);
      res.status(500).json({ error: 'Erro ao carregar página', message: 'Não foi possível carregar a página' });
    }
  });
}

// Rotas amigáveis do site
app.get('/', (_req: Request, res: Response) => serveSitePage('/', res));
app.get('/inicio', (_req: Request, res: Response) => serveSitePage('/inicio', res));
app.get('/biologia-marinha', (_req: Request, res: Response) => serveSitePage('/biologia-marinha', res));
app.get('/sobre-nos', (_req: Request, res: Response) => serveSitePage('/sobre-nos', res));
app.get('/blog', (_req: Request, res: Response) => serveSitePage('/blog', res));
app.get('/contato', (_req: Request, res: Response) => serveSitePage('/contato', res));
app.get('/excursoes', (_req: Request, res: Response) => serveSitePage('/excursoes', res));

// Redirect: URLs antigas (.html) → URLs amigáveis
app.get('/index-10.html', (_req: Request, res: Response) => res.redirect(301, '/inicio'));
app.get('/index-11.html', (_req: Request, res: Response) => res.redirect(301, '/biologia-marinha'));
app.get('/about.html', (_req: Request, res: Response) => res.redirect(301, '/sobre-nos'));
app.get('/blog.html', (_req: Request, res: Response) => res.redirect(301, '/blog'));
app.get('/contact.html', (_req: Request, res: Response) => res.redirect(301, '/contato'));
app.get('/portfolio.html', (_req: Request, res: Response) => res.redirect(301, '/excursoes'));

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

// Páginas que permanecem com .html (blog post, excursão individual)
app.get('/blog-single.html', (req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'blog-single.html'), (err) => {
    if (err) res.status(404).json({ error: 'Página não encontrada' });
  });
});
app.get('/portfolio-single.html', (req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'portfolio-single.html'), (err) => {
    if (err) res.status(404).json({ error: 'Página não encontrada' });
  });
});

// Rota não encontrada
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: 'A rota solicitada não existe nesta API'
  });
});

// Handler de erros global
app.use((err: Error & { status?: number; statusCode?: number } | ApiError, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(`Erro: ${err.message}`);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details
    });
  }

  // Request entity too large (body maior que o limite)
  const isTooLarge = err.status === 413 || err.statusCode === 413 ||
    (typeof err.message === 'string' && err.message.toLowerCase().includes('entity too large'));
  if (isTooLarge) {
    return res.status(413).json({
      error: 'Requisição muito grande',
      message: 'O tamanho do corpo da requisição excede o limite. Tente enviar imagens menores ou use upload separado.'
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
