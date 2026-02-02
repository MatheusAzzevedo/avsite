/**
 * Explicação do Arquivo [upload.routes.ts]
 * 
 * Rotas para upload de arquivos/imagens.
 * Gerencia upload, processamento e armazenamento.
 */

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { authMiddleware } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router = Router();

// Diretório de uploads
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Garante que o diretório existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configuração do Multer
const storage = multer.memoryStorage();

const fileFilter = (
  _req: Express.Request, 
  file: Express.Multer.File, 
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,image/gif').split(',');
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '20971520', 10) // 20MB - tamanho livre
  }
});

// Aplica autenticação
router.use(authMiddleware);

/**
 * POST /api/uploads
 * Upload de uma única imagem
 */
router.post('/',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw ApiError.badRequest('Nenhum arquivo enviado');
      }

      logger.info(`[Upload] Processando: ${req.file.originalname}`);

      // Gera nome único
      const filename = `${uuidv4()}.webp`;
      const filepath = path.join(UPLOAD_DIR, filename);

      // Converte para WebP preservando dimensões originais (qualquer tamanho)
      await sharp(req.file.buffer)
        .webp({ quality: 85 })
        .toFile(filepath);

      // Obtém info do arquivo processado
      const stats = fs.statSync(filepath);

      // Salva no banco
      const uploadRecord = await prisma.upload.create({
        data: {
          filename,
          originalName: req.file.originalname,
          mimetype: 'image/webp',
          size: stats.size,
          url: `/uploads/${filename}`,
          path: filepath
        }
      });

      const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;

      logger.info(`[Upload] Sucesso: ${filename}`);

      res.status(201).json({
        success: true,
        message: 'Upload realizado com sucesso',
        data: {
          id: uploadRecord.id,
          filename: uploadRecord.filename,
          originalName: uploadRecord.originalName,
          url: `${baseUrl}${uploadRecord.url}`,
          size: uploadRecord.size
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/uploads/multiple
 * Upload de múltiplas imagens
 */
router.post('/multiple',
  upload.array('files', 10), // máximo 10 arquivos
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        throw ApiError.badRequest('Nenhum arquivo enviado');
      }

      logger.info(`[Upload] Processando ${files.length} arquivos`);

      const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
      const results = [];

      for (const file of files) {
        const filename = `${uuidv4()}.webp`;
        const filepath = path.join(UPLOAD_DIR, filename);

        // Converte para WebP preservando dimensões originais (qualquer tamanho)
        await sharp(file.buffer)
          .webp({ quality: 85 })
          .toFile(filepath);

        const stats = fs.statSync(filepath);

        // Salva no banco
        const uploadRecord = await prisma.upload.create({
          data: {
            filename,
            originalName: file.originalname,
            mimetype: 'image/webp',
            size: stats.size,
            url: `/uploads/${filename}`,
            path: filepath
          }
        });

        results.push({
          id: uploadRecord.id,
          filename: uploadRecord.filename,
          originalName: uploadRecord.originalName,
          url: `${baseUrl}${uploadRecord.url}`,
          size: uploadRecord.size
        });
      }

      logger.info(`[Upload] Sucesso: ${results.length} arquivos`);

      res.status(201).json({
        success: true,
        message: `${results.length} arquivo(s) enviado(s) com sucesso`,
        data: results
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/uploads/:id
 * Exclui uma imagem
 */
router.delete('/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const upload = await prisma.upload.findUnique({
        where: { id }
      });

      if (!upload) {
        throw ApiError.notFound('Arquivo não encontrado');
      }

      // Remove arquivo físico
      if (fs.existsSync(upload.path)) {
        fs.unlinkSync(upload.path);
      }

      // Remove do banco
      await prisma.upload.delete({
        where: { id }
      });

      logger.info(`[Upload] Excluído: ${upload.filename}`);

      res.json({
        success: true,
        message: 'Arquivo excluído com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/uploads
 * Lista todos os uploads
 */
router.get('/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const [uploads, total] = await Promise.all([
        prisma.upload.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.upload.count()
      ]);

      const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;

      const data = uploads.map(u => ({
        ...u,
        url: `${baseUrl}${u.url}`
      }));

      res.json({
        success: true,
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
