/**
 * Sistema de Logging Estruturado
 * Fornece logging consistente para toda a aplicação
 */

// Níveis de log em ordem de severidade
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

// Configuração de níveis
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

// Cores para console (ambiente de desenvolvimento)
const LOG_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m'  // Red
}
const RESET_COLOR = '\x1b[0m'

// Contexto do log
export interface LogContext {
  module?: string
  action?: string
  userId?: string
  requestId?: string
  sessionId?: string
  ip?: string
  path?: string
  method?: string
  duration?: number
  [key: string]: unknown
}

// Entrada de log estruturada
export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

// Configuração do logger
interface LoggerConfig {
  minLevel: LogLevel
  enableConsole: boolean
  enableStructured: boolean
  pretty: boolean
}

// Configuração padrão baseada no ambiente
const defaultConfig: LoggerConfig = {
  minLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  enableConsole: true,
  enableStructured: process.env.NODE_ENV === 'production',
  pretty: process.env.NODE_ENV !== 'production'
}

class Logger {
  private config: LoggerConfig
  private context: LogContext = {}

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  /**
   * Cria um novo logger com contexto adicional
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger(this.config)
    childLogger.context = { ...this.context, ...context }
    return childLogger
  }

  /**
   * Define o nível mínimo de log
   */
  setLevel(level: LogLevel): void {
    this.config.minLevel = level
  }

  /**
   * Verifica se o nível está habilitado
   */
  private isLevelEnabled(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel]
  }

  /**
   * Formata e emite o log
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.isLevelEnabled(level)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context }
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    }

    this.emit(entry)
  }

  /**
   * Emite o log para o destino apropriado
   */
  private emit(entry: LogEntry): void {
    if (!this.config.enableConsole) return

    if (this.config.enableStructured) {
      // Log estruturado (JSON) para produção
      console.log(JSON.stringify(entry))
    } else if (this.config.pretty) {
      // Log formatado para desenvolvimento
      this.emitPretty(entry)
    } else {
      // Log simples
      console.log(`[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`)
    }
  }

  /**
   * Emite log formatado bonito para desenvolvimento
   */
  private emitPretty(entry: LogEntry): void {
    const color = LOG_COLORS[entry.level]
    const levelPadded = entry.level.toUpperCase().padEnd(5)
    const time = entry.timestamp.split('T')[1].split('.')[0]

    let output = `${color}[${time}] ${levelPadded}${RESET_COLOR} ${entry.message}`

    // Adiciona contexto relevante
    if (entry.context) {
      const { module, action, duration, ...rest } = entry.context
      const contextParts: string[] = []

      if (module) contextParts.push(`module=${module}`)
      if (action) contextParts.push(`action=${action}`)
      if (duration !== undefined) contextParts.push(`duration=${duration}ms`)

      // Adiciona outros campos se houver
      const otherKeys = Object.keys(rest).filter(k => rest[k] !== undefined)
      if (otherKeys.length > 0) {
        const others = otherKeys.map(k => `${k}=${rest[k]}`).join(' ')
        contextParts.push(others)
      }

      if (contextParts.length > 0) {
        output += ` (${contextParts.join(', ')})`
      }
    }

    // Usa o método apropriado do console
    switch (entry.level) {
      case 'debug':
        console.debug(output)
        break
      case 'info':
        console.info(output)
        break
      case 'warn':
        console.warn(output)
        break
      case 'error':
        console.error(output)
        if (entry.error?.stack) {
          console.error(entry.error.stack)
        }
        break
    }
  }

  // Métodos de log por nível

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context)
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const err = error instanceof Error ? error : undefined
    if (error && !(error instanceof Error)) {
      context = { ...context, errorDetails: String(error) }
    }
    this.log('error', message, context, err)
  }

  // Métodos de conveniência

  /**
   * Log de início de operação
   */
  start(action: string, context?: LogContext): () => void {
    const startTime = Date.now()
    this.debug(`Iniciando: ${action}`, { ...context, action })

    // Retorna função para log de conclusão
    return () => {
      const duration = Date.now() - startTime
      this.debug(`Concluído: ${action}`, { ...context, action, duration })
    }
  }

  /**
   * Log de requisição HTTP
   */
  request(method: string, path: string, context?: LogContext): void {
    this.info(`${method} ${path}`, { ...context, method, path })
  }

  /**
   * Log de resposta HTTP
   */
  response(method: string, path: string, status: number, duration: number, context?: LogContext): void {
    const level: LogLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info'
    this.log(level, `${method} ${path} ${status}`, { ...context, method, path, status, duration })
  }

  /**
   * Log de query de banco de dados
   */
  query(operation: string, model: string, duration: number, context?: LogContext): void {
    this.debug(`DB: ${operation} ${model}`, { ...context, operation, model, duration })
  }

  /**
   * Log de cache
   */
  cache(operation: 'hit' | 'miss' | 'set' | 'delete', key: string, context?: LogContext): void {
    this.debug(`Cache ${operation}: ${key}`, { ...context, cacheOperation: operation, cacheKey: key })
  }

  /**
   * Log de autenticação
   */
  auth(action: string, userId?: string, success?: boolean, context?: LogContext): void {
    const level: LogLevel = success === false ? 'warn' : 'info'
    this.log(level, `Auth: ${action}`, { ...context, action, userId, success })
  }

  /**
   * Log de auditoria (ações de usuário)
   */
  audit(action: string, userId: string, resource: string, resourceId?: string, context?: LogContext): void {
    this.info(`Audit: ${action}`, {
      ...context,
      action,
      userId,
      resource,
      resourceId,
      audit: true
    })
  }
}

// Instância singleton do logger
export const logger = new Logger()

// Factory para criar loggers com módulo específico
export function createLogger(module: string, context?: LogContext): Logger {
  return logger.child({ module, ...context })
}

// Loggers pré-configurados para diferentes módulos
export const apiLogger = createLogger('api')
export const authLogger = createLogger('auth')
export const dbLogger = createLogger('db')
export const cacheLogger = createLogger('cache')

// Exporta a classe para casos especiais
export { Logger }

// Tipo para middleware de logging
export type LogMiddleware = (entry: LogEntry) => void

// Helper para medir tempo de execução
export async function withTiming<T>(
  operation: string,
  fn: () => Promise<T>,
  log: Logger = logger
): Promise<T> {
  const done = log.start(operation)
  try {
    const result = await fn()
    done()
    return result
  } catch (error) {
    log.error(`Falha: ${operation}`, error)
    throw error
  }
}
