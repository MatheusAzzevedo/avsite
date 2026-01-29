/**
 * Explicação do Arquivo [logger.ts]
 * 
 * Utilitário de logging para a aplicação.
 * Fornece métodos padronizados para log com timestamps.
 * 
 * Em produção, considerar usar Winston ou Pino para
 * logs mais robustos e persistentes.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LoggerInterface {
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
}

const formatMessage = (level: LogLevel, message: string): string => {
  const timestamp = new Date().toISOString();
  const levelUpper = level.toUpperCase().padEnd(5);
  return `[${timestamp}] [${levelUpper}] ${message}`;
};

export const logger: LoggerInterface = {
  info: (message: string, ...args: unknown[]) => {
    console.log(formatMessage('info', message), ...args);
  },
  
  warn: (message: string, ...args: unknown[]) => {
    console.warn(formatMessage('warn', message), ...args);
  },
  
  error: (message: string, ...args: unknown[]) => {
    console.error(formatMessage('error', message), ...args);
  },
  
  debug: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatMessage('debug', message), ...args);
    }
  }
};

export default logger;
