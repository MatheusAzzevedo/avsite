/**
 * Explicação do Arquivo [documentos.routes.ts]
 *
 * Rotas públicas para download de documentos (PDF, DOCX, XLS, XLSX) de excursões pedagógicas.
 *
 * Atende duas origens, nesta ordem:
 * 1. Disco (`uploads/documentos/`) — documentos anteriores à migração, que ainda
 *    possam existir no container.
 * 2. Cloudflare R2 — para onde vão todos os envios novos.
 *
 * O frontend monta o link a partir do nome do arquivo
 * (`documentoUrl.split('/').pop()`), então esta rota continua sendo o ponto de
 * entrada nos dois casos e nenhuma tela precisou mudar.
 *
 * O download é forçado nas duas origens: em disco pelo cabeçalho escrito aqui,
 * e no R2 pelo `Content-Disposition` gravado no objeto durante o upload.
 */

import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';
import { getPublicUrl, verificarConfigR2 } from '../config/r2';

const router = Router();

const DOCS_DIR = path.join(__dirname, '../../uploads/documentos');

/** Valida filename para evitar path traversal (apenas UUID + extensão permitidos) */
function isValidFilename(filename: string): boolean {
  return /^[a-f0-9-]+\.(pdf|docx|xls|xlsx)$/i.test(filename);
}

/**
 * GET /api/documentos/download/:filename
 * Faz download de documento por nome de arquivo (ex: 27c37ec9-7426-45f8-b8fd-39dee953166d.pdf)
 * Público - não requer autenticação. O link é compartilhado apenas com clientes que têm pedido.
 */
router.get('/download/:filename', (req: Request, res: Response) => {
  const { filename } = req.params;

  if (!isValidFilename(filename)) {
    logger.warn('[Documentos] Nome de arquivo inválido:', { filename });
    return res.status(400).json({
      error: 'Parâmetro inválido',
      message: 'Nome de arquivo inválido.'
    });
  }

  const filePath = path.join(DOCS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    // Não está em disco: é um documento no R2 (todos os envios novos vão para lá).
    if (verificarConfigR2()) {
      const urlR2 = getPublicUrl(`documentos/${filename}`);
      logger.info('[Documentos] Redirecionando para o R2', { context: { filename } });
      return res.redirect(302, urlR2);
    }

    logger.warn('[Documentos] Arquivo não encontrado e R2 não configurado:', { filename });
    return res.status(404).json({
      error: 'Documento não disponível',
      message: 'O arquivo não foi encontrado. Ele pode ter sido removido ou estar temporariamente indisponível após atualização do servidor. Entre em contato com a equipe Avoar Turismo.'
    });
  }

  logger.info('[Documentos] Servindo documento legado do disco', { context: { filename } });

  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const stream = fs.createReadStream(filePath);
  stream.on('error', (err) => {
    logger.error('[Documentos] Erro ao ler arquivo:', { filename, error: err.message });
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Erro ao acessar documento',
        message: 'Não foi possível ler o arquivo. Tente novamente mais tarde.'
      });
    }
  });
  stream.pipe(res);
});

export default router;
