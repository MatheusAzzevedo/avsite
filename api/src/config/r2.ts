import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { logger } from '../utils/logger';

export const getR2Client = () => {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Credenciais do Cloudflare R2 não estão configuradas corretamente nas variáveis de ambiente.');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

export const getBucketName = () => {
  const bucketName = process.env.R2_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('Variável R2_BUCKET_NAME não definida no .env');
  }
  return bucketName;
};

/**
 * Explicação da função [verificarConfigR2]
 * Indica se o R2 está configurado a ponto de ser possível montar uma URL pública.
 *
 * Só `R2_PUBLIC_URL` é verificada porque a leitura pública não passa por
 * credencial — quem serve o objeto é a Cloudflare, não a nossa API.
 */
export const verificarConfigR2 = (): boolean => {
  return !!process.env.R2_PUBLIC_URL?.trim();
};

export const getPublicUrl = (filename: string) => {
  const publicUrlBase = process.env.R2_PUBLIC_URL;
  if (!publicUrlBase) {
    throw new Error('Variável R2_PUBLIC_URL não definida no .env (ex: https://pub-xxxx.r2.dev)');
  }
  // Remove trailing slash se houver
  const baseUrl = publicUrlBase.endsWith('/') ? publicUrlBase.slice(0, -1) : publicUrlBase;
  return `${baseUrl}/${filename}`;
};

/**
 * Explicação da função [montarContentDisposition]
 * Monta o cabeçalho que faz o navegador baixar o arquivo em vez de abri-lo,
 * com um nome legível para quem recebe.
 *
 * O nome vai duas vezes, conforme a RFC 6266: uma versão ASCII simples para
 * navegadores antigos e a `filename*` codificada em UTF-8 para acentos. Sem a
 * segunda, "Lista de Alunos — Cristo Redentor.pdf" chega truncado ou ilegível.
 */
export const montarContentDisposition = (nomeOriginal: string): string => {
  const seguro = nomeOriginal
    .replace(/[\r\n"\\]/g, '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '_')
    .trim() || 'documento';

  return `attachment; filename="${seguro}"; filename*=UTF-8''${encodeURIComponent(nomeOriginal)}`;
};

/**
 * Faz upload de um buffer de arquivo para o Cloudflare R2.
 *
 * `contentDisposition` grava o cabeçalho no próprio objeto. Isso é o que
 * permite entregar um documento por link direto e ainda assim forçar o
 * download — sem ele o PDF abriria dentro do navegador.
 */
export const uploadBufferToR2 = async (
  buffer: Buffer,
  filename: string,
  mimetype: string,
  contentDisposition?: string
): Promise<string> => {
  const s3 = getR2Client();
  const bucket = getBucketName();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: filename,
    Body: buffer,
    ContentType: mimetype,
    ...(contentDisposition ? { ContentDisposition: contentDisposition } : {}),
  });

  try {
    await s3.send(command);
    return getPublicUrl(filename);
  } catch (error) {
    logger.error('[R2 Upload] Erro ao fazer upload para o Cloudflare R2', {
      context: { filename, error: error instanceof Error ? error.message : 'Unknown' },
    });
    throw error;
  }
};

/**
 * Deleta um arquivo do Cloudflare R2
 */
export const deleteFileFromR2 = async (filename: string): Promise<void> => {
  const s3 = getR2Client();
  const bucket = getBucketName();

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: filename,
  });

  try {
    await s3.send(command);
    logger.info(`[R2 Delete] Arquivo removido do R2: ${filename}`);
  } catch (error) {
    logger.error('[R2 Delete] Erro ao deletar arquivo do Cloudflare R2', {
      context: { filename, error: error instanceof Error ? error.message : 'Unknown' },
    });
    throw error;
  }
};
