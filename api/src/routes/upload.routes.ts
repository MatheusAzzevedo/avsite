/**
 * Explicação do Arquivo [upload.routes.ts]
 * 
 * Rotas para upload de arquivos/imagens.
 * Gerencia upload, processamento e armazenamento.
 */

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';
import { ApiError } from '../utils/api-error';
import { authMiddleware } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';
import { uploadBufferToR2, deleteFileFromR2, montarContentDisposition } from '../config/r2';

const router = Router();

/**
 * Explicação da função [corrigirNomeArquivo]
 * Reinterpreta o nome do arquivo recebido do multer como UTF-8.
 *
 * O busboy, por baixo do multer, entrega `originalname` em latin1. Um nome com
 * acento ou travessão chega com os bytes UTF-8 lidos byte a byte — "Lista —
 * Cristo" vira "Lista â€" Cristo". Se esse texto for codificado de novo, o
 * resultado é duplamente corrompido e é isso que o cliente vê ao baixar.
 */
function corrigirNomeArquivo(nome: string): string {
  return Buffer.from(nome, 'latin1').toString('utf8');
}

/**
 * Limite da maior dimensão da imagem, em pixels, e qualidade do WebP.
 * Ajustáveis por variável de ambiente sem precisar de deploy de código.
 *
 * A escolha do padrão veio de medição sobre uma foto de 7990x5327 (23 MB):
 * redimensionar para 1920px e codificar a 90 gera 299 KB. A mesma foto sem
 * redimensionar, a 95, gera 11,6 MB. O peso vem da dimensão, não da
 * compressão — por isso dá para manter qualidade alta e ainda assim leve.
 */
const IMAGEM_DIMENSAO_MAXIMA = Number(process.env.IMAGEM_DIMENSAO_MAXIMA) || 1920;
const IMAGEM_QUALIDADE = Number(process.env.IMAGEM_QUALIDADE) || 90;

/**
 * Explicação da função [processarImagem]
 * Normaliza uma imagem enviada para entrega na web.
 *
 * Ordem das operações, cada uma por um motivo:
 * - `rotate()` sem argumento aplica a orientação do EXIF. Sem isso, fotos de
 *   celular aparecem deitadas quando os metadados são descartados adiante.
 * - `resize` com `withoutEnlargement` nunca amplia: imagem menor que o teto
 *   passa intacta, em vez de ser esticada e perder nitidez.
 * - `keepIccProfile` preserva o perfil de cor. O sharp descarta metadados por
 *   padrão, e uma foto em Display P3 lida como sRGB sai com as cores
 *   deslocadas — o que se percebe como "estranha" antes de se perceber
 *   qualquer perda de nitidez.
 *
 * O EXIF restante é descartado de propósito: essas fotos são de excursões
 * escolares e carregam coordenadas de GPS que não devem ir para um bucket público.
 */
async function processarImagem(buffer: Buffer, origem: string) {
  const original = await sharp(buffer).metadata();

  const saida = await sharp(buffer)
    .rotate()
    .resize(IMAGEM_DIMENSAO_MAXIMA, IMAGEM_DIMENSAO_MAXIMA, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({ quality: IMAGEM_QUALIDADE })
    .keepIccProfile()
    .toBuffer();

  const final = await sharp(saida).metadata();

  logger.info('[Upload] Imagem processada', {
    context: {
      origem,
      entrada: `${original.width}x${original.height} ${original.format} ${(buffer.length / 1024).toFixed(0)} KB`,
      saida: `${final.width}x${final.height} webp ${(saida.length / 1024).toFixed(0)} KB`,
      qualidade: IMAGEM_QUALIDADE,
      redimensionada: original.width !== final.width
    }
  });

  return saida;
}

// Usaremos apenas memória para upload, e de lá enviamos para a nuvem
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
    // 25 MB por arquivo. O limite pode ser generoso porque o servidor
    // redimensiona: um original de 24 MB vira ~300 KB no bucket. Apertar aqui
    // empurraria o usuário a comprimir por fora antes de enviar — que é
    // exatamente a origem da perda de qualidade que queremos eliminar.
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '26214400', 10)
  }
});

const documentMimeTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.ms-excel', // xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // xlsx
];

function getExtensionFromMime(mime: string): string {
  const map: Record<string, string> = {
    'application/pdf': '.pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx'
  };
  return map[mime] || '';
}

const documentFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (documentMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Use: PDF, DOCX, XLS ou XLSX'));
  }
};

const uploadDocument = multer({
  storage: multer.memoryStorage(),
  fileFilter: documentFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
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
      const filename = `images/${uuidv4()}.webp`;

      const webpBuffer = await processarImagem(req.file.buffer, req.file.originalname);

      // Faz o upload direto pro R2
      const publicUrl = await uploadBufferToR2(webpBuffer, filename, 'image/webp');

      // Salva no banco
      const uploadRecord = await prisma.upload.create({
        data: {
          filename,
          originalName: corrigirNomeArquivo(req.file.originalname),
          mimetype: 'image/webp',
          size: webpBuffer.length,
          url: publicUrl,
          path: filename // salva a key do S3 como path para podermos deletar depois
        }
      });



      logger.info(`[Upload] Sucesso: ${filename}`);

      res.status(201).json({
        success: true,
        message: 'Upload realizado com sucesso',
        data: {
          id: uploadRecord.id,
          filename: uploadRecord.filename,
          originalName: uploadRecord.originalName,
          url: uploadRecord.url,
          size: uploadRecord.size
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/uploads/document
 * Upload de documento (PDF, DOCX, XLS, XLSX) para excursões pedagógicas
 */
router.post('/document',
  uploadDocument.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw ApiError.badRequest('Nenhum arquivo enviado');
      }

      logger.info(`[Upload] Documento: ${req.file.originalname}`);

      const ext = getExtensionFromMime(req.file.mimetype);
      const filename = `documentos/${uuidv4()}${ext}`;

      // Upload do buffer diretamente pro R2
      // O cabeçalho de download é gravado no próprio objeto: assim o link do R2
      // baixa o arquivo com nome legível, em vez de abrir o PDF no navegador.
      const nomeOriginal = corrigirNomeArquivo(req.file.originalname);
      const publicUrl = await uploadBufferToR2(
        req.file.buffer,
        filename,
        req.file.mimetype,
        montarContentDisposition(nomeOriginal)
      );

      res.status(201).json({
        success: true,
        message: 'Documento enviado com sucesso',
        data: {
          url: publicUrl, // Como não vamos mais usar download proxy, entregamos a url direta
          fullUrl: publicUrl,
          originalName: nomeOriginal,
          filename: filename
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

      const results = [];

      for (const file of files) {
        const filename = `images/${uuidv4()}.webp`;

        const webpBuffer = await processarImagem(file.buffer, file.originalname);

        // Faz o upload direto pro R2
        const publicUrl = await uploadBufferToR2(webpBuffer, filename, 'image/webp');

        // Salva no banco
        const uploadRecord = await prisma.upload.create({
          data: {
            filename,
            originalName: corrigirNomeArquivo(file.originalname),
            mimetype: 'image/webp',
            size: webpBuffer.length,
            url: publicUrl,
            path: filename // key do R2 para exclusão
          }
        });

        results.push({
          id: uploadRecord.id,
          filename: uploadRecord.filename,
          originalName: uploadRecord.originalName,
          url: uploadRecord.url,
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

      // Remove arquivo do Cloudflare R2
      if (upload.path) {
        try {
          await deleteFileFromR2(upload.path);
        } catch (r2Error) {
          // O registro do banco é removido mesmo assim: manter a linha apontando
          // para um arquivo que talvez ainda exista deixaria a listagem quebrada.
          // O objeto órfão no bucket fica registrado aqui para limpeza posterior.
          logger.warn('[Upload] Falha ao deletar do R2; objeto pode ter ficado órfão no bucket', {
            context: {
              chave: upload.path,
              error: r2Error instanceof Error ? r2Error.message : 'Unknown'
            }
          });
        }
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

      const data = uploads.map(u => ({
        ...u,
        // Já retornamos a URL do cloudflare guardada, não precisa concatenar base url
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


/**
 * Explicação da função [tratarErroDeUpload]
 * Converte erros do multer em resposta clara para quem está enviando.
 *
 * Sem isto, um arquivo acima do limite chega ao handler global e vira
 * "Erro interno do servidor" — o usuário não descobre que o problema é o
 * tamanho, e tende a comprimir a imagem por fora até "funcionar", degradando-a.
 */
router.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    const limiteMb = (parseInt(process.env.MAX_FILE_SIZE || '26214400', 10) / 1024 / 1024).toFixed(0);
    const mensagens: Record<string, string> = {
      LIMIT_FILE_SIZE: `Arquivo muito grande. O limite é ${limiteMb} MB por arquivo.`,
      LIMIT_FILE_COUNT: 'Foram enviados arquivos demais de uma vez.',
      LIMIT_UNEXPECTED_FILE: 'Campo de arquivo inesperado no formulário.'
    };

    logger.warn('[Upload] Envio rejeitado pelo multer', {
      context: { codigo: err.code, campo: err.field }
    });

    return res.status(413).json({
      error: mensagens[err.code] || 'Não foi possível processar o arquivo enviado.',
      codigo: err.code
    });
  }
  return next(err);
});

export default router;
