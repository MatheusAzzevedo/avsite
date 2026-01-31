/**
 * Explicação do Arquivo [logger.ts]
 * 
 * Sistema de logging robusto com Winston.
 * Fornece logs estruturados visíveis no Railway logs.
 * 
 * Características:
 * - Logs estruturados em JSON em produção
 * - Logs coloridos em desenvolvimento
 * - Prefixo "AVSITE-API" em todos os logs
 * - Diferentes níveis: info, warn, error, debug
 * - Captura de stack traces em erros
 */

import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

// Define cores para cada nível de log (desenvolvimento)
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue'
};

winston.addColors(colors);

// Formato customizado com prefixo AVSITE-API
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    const timestamp = info.timestamp;
    const level = info.level.toUpperCase();
    const service = '[AVSITE-API]';
    const message = info.message;
    
    // Se houver erro com stack trace
    if (info.stack) {
      return `${timestamp} ${service} [${level}] ${message}\n${info.stack}`;
    }
    
    // Se houver dados adicionais (contexto)
    if (info.context) {
      return `${timestamp} ${service} [${level}] ${message} | ${JSON.stringify(info.context)}`;
    }
    
    return `${timestamp} ${service} [${level}] ${message}`;
  })
);

// Logger Winston
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: customFormat,
  defaultMeta: { service: 'avsite-api' },
  transports: [
    // Console (visível no Railway logs)
    new winston.transports.Console({
      format: isProduction
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            customFormat
          )
    })
  ]
});

// Interface compatível com logger anterior (para não quebrar código existente)
export const legacyLogger = {
  info: (message: string, context?: unknown) => {
    logger.info(message, { context });
  },
  
  warn: (message: string, context?: unknown) => {
    logger.warn(message, { context });
  },
  
  error: (message: string, context?: unknown) => {
    logger.error(message, { context });
  },
  
  debug: (message: string, context?: unknown) => {
    logger.debug(message, { context });
  }
};

export default logger;

