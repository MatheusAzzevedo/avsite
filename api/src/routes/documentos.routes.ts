/**
 * Explicação do Arquivo [documentos.routes.ts]
 *
 * Rotas públicas para download de documentos (PDF, DOCX, XLS, XLSX) de excursões pedagógicas.
 * Serve arquivos da pasta uploads/documentos/ com mensagem amigável quando o arquivo não existe.
 *
 * Motivo: Em ambientes como Railway, o filesystem é efêmero — arquivos podem ser perdidos
 * após deploy. Esta rota permite retornar mensagem clara ao usuário nesses casos.
 */

import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

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
    logger.warn('[Documentos] Arquivo não encontrado:', { filename });
    return res.status(404).json({
      error: 'Documento não disponível',
      message: 'O arquivo não foi encontrado. Ele pode ter sido removido ou estar temporariamente indisponível após atualização do servidor. Entre em contato com a equipe Avoar Turismo.'
    });
  }

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
