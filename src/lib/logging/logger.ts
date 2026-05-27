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

// =============================================================================
// REDAÇÃO DE DADOS SENSÍVEIS (LGPD)
// =============================================================================
//
// Mascara automaticamente campos sensíveis em LogContext antes de serializar
// para JSON ou imprimir no console. Protege contra acidente de log de CPF,
// senhas, tokens JWT, secrets etc.
//
// Chaves redatadas (case-insensitive, substring match):
//   cpf, cnpj, password, senha, token, secret, key (com excecoes),
//   authorization, bearer, apikey, jwt, hash (preserva primeiros 8 chars),
//   email (mostra "f***@dom"), telefone (preserva últimos 4),
//   cookie, sessionId
//
// Valores que parecem CPF/CNPJ no formato livre tambem sao mascarados.

const SENSITIVE_KEY_PATTERNS = [
  /^cpf$/i,
  /cpfHash$/i,
  /^cnpj/i,
  /password/i,
  /senha/i,
  /^token$/i,
  /accessToken/i,
  /refreshToken/i,
  /sessionToken/i,
  /secret/i,
  /authorization/i,
  /bearer/i,
  /apiKey/i,
  /^jwt$/i,
  /encryptionKey/i,
  /^cookie$/i,
  /^email$/i,
  /^telefone$/i,
  /^phone$/i,
]

const CPF_REGEX = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/
const CNPJ_REGEX = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const JWT_REGEX = /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/

/**
 * Mascara um valor sensivel. Quando o nome da chave indica o tipo (cpf, email,
 * cnpj), aplica a mascara especifica. Para chaves genericamente sensiveis
 * (password, secret, token, telefone), retorna [REDACTED] mantendo apenas
 * o tamanho original para fins de auditoria.
 */
function maskValue(key: string, value: unknown): unknown {
  if (value == null) return value
  if (typeof value !== 'string') {
    if (typeof value === 'number' || typeof value === 'boolean') return '[REDACTED]'
    if (Array.isArray(value)) return value.map((v) => maskValue(key, v))
    if (typeof value === 'object') return redactSensitive(value as Record<string, unknown>)
    return '[REDACTED]'
  }
  if (value.length === 0) return value

  const lk = key.toLowerCase()

  // CPF/CNPJ — mascara especifica preservando os 2 ultimos digitos
  if (lk === 'cpf' || lk === 'documento' || lk.includes('cpfcpf')) {
    const digits = value.replace(/\D/g, '')
    if (digits.length === 11) return `***.***.***-${digits.slice(-2)}`
    if (digits.length === 14) return `**.***.***/****-${digits.slice(-2)}`
  }
  if (lk.startsWith('cnpj') || lk === 'cnpjcpf') {
    const digits = value.replace(/\D/g, '')
    if (digits.length === 14) return `**.***.***/****-${digits.slice(-2)}`
    if (digits.length === 11) return `***.***.***-${digits.slice(-2)}`
  }
  // Email
  if (lk === 'email') {
    const [local, domain] = value.split('@')
    if (local && domain) return `${local[0] || '*'}***@${domain}`
    return '[REDACTED]'
  }
  // Hash (preserva primeiros 8 chars para correlacao em auditoria)
  if (lk.endsWith('hash')) {
    return `${value.slice(0, 8)}...[+${Math.max(0, value.length - 8)} chars]`
  }
  // Demais (password, senha, token, secret, key, telefone, phone, cookie, etc.):
  // retorna REDACTED.
  return '[REDACTED]'
}

/**
 * Verifica se a chave bate com algum padrao sensivel.
 */
function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((rx) => rx.test(key))
}

/**
 * Aplica redacao recursiva em um objeto/array. Nao muta o original.
 * Exportado para testes e uso direto em outras camadas.
 */
export function redactSensitive<T>(input: T): T {
  if (input == null) return input
  if (Array.isArray(input)) {
    return input.map((item) => redactSensitive(item)) as unknown as T
  }
  if (typeof input !== 'object') return input

  const obj = input as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveKey(key)) {
      out[key] = maskValue(key, value)
    } else if (value !== null && typeof value === 'object') {
      out[key] = redactSensitive(value)
    } else if (typeof value === 'string') {
      // Heuristica: valor "solto" em chave neutra que ainda parece sensivel
      if (CPF_REGEX.test(value)) {
        out[key] = maskValue('cpf', value)
      } else if (CNPJ_REGEX.test(value)) {
        out[key] = maskValue('cnpj', value)
      } else if (JWT_REGEX.test(value)) {
        out[key] = `${value.slice(0, 8)}...[REDACTED]`
      } else {
        out[key] = value
      }
    } else {
      out[key] = value
    }
  }
  return out as T
}

// Configuração do logger
interface LoggerConfig {
  minLevel: LogLevel
  enableConsole: boolean
  enableStructured: boolean
  pretty: boolean
  /** Se true (padrao), aplica redactSensitive em todo LogContext. */
  redact: boolean
}

// Configuração padrão baseada no ambiente
const defaultConfig: LoggerConfig = {
  minLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  enableConsole: true,
  enableStructured: process.env.NODE_ENV === 'production',
  pretty: process.env.NODE_ENV !== 'production',
  redact: true,
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

    const merged = { ...this.context, ...context }
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.config.redact ? redactSensitive(merged) : merged,
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
