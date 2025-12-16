/**
 * Utilitários para logging e debug
 * Otimizados para detectar erros e facilitar troubleshooting
 */

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
}

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Formata e registra uma mensagem
 * @param level - Nível do log
 * @param module - Nome do módulo/componente
 * @param message - Mensagem principal
 * @param data - Dados adicionais (opcional)
 */
function log(
  level: LogLevel,
  module: string,
  message: string,
  data?: any
): void {
  // Apenas registrar em desenvolvimento ou para erros
  if (isDevelopment || level === LogLevel.ERROR) {
    const prefix = getPrefix(level);
    console.log(`${prefix} [${module}] ${message}`, data ? data : '');
    
    // Se houver erro, registrar também
    if (level === LogLevel.ERROR && data instanceof Error) {
      console.error('Stack:', data.stack);
    }
  }

  // Em produção, você poderia enviar para um serviço de logging
  // como Sentry, LogRocket, etc.
}

/**
 * Retorna o prefixo visual para cada nível de log
 */
function getPrefix(level: LogLevel): string {
  switch (level) {
    case LogLevel.DEBUG:
      return '🔍';
    case LogLevel.INFO:
      return 'ℹ️ ';
    case LogLevel.WARN:
      return '⚠️ ';
    case LogLevel.ERROR:
      return '❌';
    case LogLevel.SUCCESS:
      return '✅';
    default:
      return '📌';
  }
}

export const logger = {
  /**
   * Log de debug - informações detalhadas
   */
  debug: (module: string, message: string, data?: any) =>
    log(LogLevel.DEBUG, module, message, data),

  /**
   * Log de informação - eventos normais
   */
  info: (module: string, message: string, data?: any) =>
    log(LogLevel.INFO, module, message, data),

  /**
   * Log de aviso - situações suspeitas
   */
  warn: (module: string, message: string, data?: any) =>
    log(LogLevel.WARN, module, message, data),

  /**
   * Log de erro - falhas
   */
  error: (module: string, message: string, error?: any) =>
    log(LogLevel.ERROR, module, message, error),

  /**
   * Log de sucesso - operações completadas
   */
  success: (module: string, message: string, data?: any) =>
    log(LogLevel.SUCCESS, module, message, data),
};

/**
 * Hook para medir performance
 * @param functionName - Nome da função
 * @param fn - Função a executar
 */
export async function measurePerformance<T>(
  functionName: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  logger.debug('PERF', `Iniciando: ${functionName}`);
  
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    if (duration > 1000) {
      logger.warn('PERF', `${functionName} levou ${duration.toFixed(2)}ms`);
    } else {
      logger.debug('PERF', `${functionName} concluído em ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logger.error('PERF', `${functionName} falhou após ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

/**
 * Decorator para adicionar logging automático em funções
 * Nota: Decorators não são suportados em Next.js Edge Runtime
 *
export function withLogging(module: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      logger.debug(module, `Chamando: ${propertyKey}`, { args });
      
      try {
        const result = await originalMethod.apply(this, args);
        logger.success(module, `${propertyKey} completado`);
        return result;
      } catch (error) {
        logger.error(module, `${propertyKey} falhou`, error);
        throw error;
      }
    };

    return descriptor;
  };
}
*/
