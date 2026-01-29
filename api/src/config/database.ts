/**
 * Explicação do Arquivo [database.ts]
 * 
 * Configuração e instância do Prisma Client.
 * Gerencia a conexão com o banco de dados PostgreSQL.
 * 
 * Responsabilidades:
 * - Criar instância única do Prisma (Singleton)
 * - Configurar logging em desenvolvimento
 * - Exportar cliente para uso em toda aplicação
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Evita múltiplas instâncias em desenvolvimento (Hot Reload)
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prismaClientOptions = {
  log: process.env.NODE_ENV === 'development' 
    ? [
        { emit: 'event' as const, level: 'query' as const },
        { emit: 'stdout' as const, level: 'error' as const },
        { emit: 'stdout' as const, level: 'warn' as const }
      ]
    : [{ emit: 'stdout' as const, level: 'error' as const }]
};

export const prisma = global.prisma || new PrismaClient(prismaClientOptions);

// Log de queries em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  // @ts-expect-error Prisma event typing issue
  prisma.$on('query', (e: { query: string; duration: number }) => {
    logger.debug(`Query: ${e.query}`);
    logger.debug(`Duration: ${e.duration}ms`);
  });
}

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
