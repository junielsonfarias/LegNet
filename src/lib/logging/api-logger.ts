// Sistema de logging para APIs
export interface LogEntry {
  id: string
  timestamp: Date
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  context?: {
    endpoint?: string
    method?: string
    userId?: string
    sessionId?: string
    ip?: string
    userAgent?: string
    requestId?: string
    duration?: number
    statusCode?: number
    error?: Error
    metadata?: Record<string, any>
  }
  tags?: string[]
}

export interface LogFilter {
  level?: string[]
  startDate?: Date
  endDate?: Date
  endpoint?: string
  method?: string
  userId?: string
  tags?: string[]
  search?: string
}

export interface LogStats {
  totalLogs: number
  logsByLevel: Record<string, number>
  logsByEndpoint: Record<string, number>
  averageResponseTime: number
  errorRate: number
  mostActiveUsers: Array<{ userId: string; count: number }>
  recentErrors: LogEntry[]
}

class ApiLogger {
  private logs: LogEntry[] = []
  private maxLogs: number = 10000 // Manter apenas os últimos 10k logs

  // Log levels
  debug(message: string, context?: LogEntry['context'], tags?: string[]) {
    this.addLog('debug', message, context, tags)
  }

  info(message: string, context?: LogEntry['context'], tags?: string[]) {
    this.addLog('info', message, context, tags)
  }

  warn(message: string, context?: LogEntry['context'], tags?: string[]) {
    this.addLog('warn', message, context, tags)
  }

  error(message: string, context?: LogEntry['context'], tags?: string[]) {
    this.addLog('error', message, context, tags)
  }

  // Log de requisição HTTP
  logRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    context?: Partial<LogEntry['context']>
  ) {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'
    const message = `${method} ${endpoint} - ${statusCode} (${duration}ms)`
    
    this.addLog(level, message, {
      endpoint,
      method,
      statusCode,
      duration,
      ...context
    }, ['http', 'api'])
  }

  // Log de erro de API
  logApiError(
    method: string,
    endpoint: string,
    error: Error,
    context?: Partial<LogEntry['context']>
  ) {
    this.addLog('error', `API Error: ${method} ${endpoint} - ${error.message}`, {
      endpoint,
      method,
      error,
      ...context
    }, ['http', 'api', 'error'])
  }

  // Log de autenticação
  logAuth(
    event: 'login' | 'logout' | 'token_refresh' | 'permission_denied',
    userId?: string,
    context?: Partial<LogEntry['context']>
  ) {
    const messages = {
      login: 'Usuário fez login',
      logout: 'Usuário fez logout',
      token_refresh: 'Token renovado',
      permission_denied: 'Acesso negado'
    }

    this.addLog('info', messages[event], {
      userId,
      ...context
    }, ['auth', event])
  }

  // Log de operação de dados
  logDataOperation(
    operation: 'create' | 'read' | 'update' | 'delete',
    entity: string,
    entityId?: string,
    userId?: string,
    context?: Partial<LogEntry['context']>
  ) {
    const message = `${operation.toUpperCase()} ${entity}${entityId ? ` (${entityId})` : ''}`
    
    this.addLog('info', message, {
      userId,
      ...context
    }, ['data', operation, entity])
  }

  // Log de performance
  logPerformance(
    operation: string,
    duration: number,
    context?: Partial<LogEntry['context']>
  ) {
    const level = duration > 5000 ? 'warn' : duration > 2000 ? 'info' : 'debug'
    const message = `Performance: ${operation} took ${duration}ms`
    
    this.addLog(level, message, {
      duration,
      ...context
    }, ['performance'])
  }

  // Métodos de consulta
  getLogs(filter?: LogFilter, limit: number = 100): LogEntry[] {
    let filteredLogs = [...this.logs]

    if (filter) {
      if (filter.level && filter.level.length > 0) {
        filteredLogs = filteredLogs.filter(log => filter.level!.includes(log.level))
      }

      if (filter.startDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.startDate!)
      }

      if (filter.endDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filter.endDate!)
      }

      if (filter.endpoint) {
        filteredLogs = filteredLogs.filter(log => 
          log.context?.endpoint?.includes(filter.endpoint!)
        )
      }

      if (filter.method) {
        filteredLogs = filteredLogs.filter(log => 
          log.context?.method === filter.method
        )
      }

      if (filter.userId) {
        filteredLogs = filteredLogs.filter(log => 
          log.context?.userId === filter.userId
        )
      }

      if (filter.tags && filter.tags.length > 0) {
        filteredLogs = filteredLogs.filter(log => 
          log.tags && filter.tags!.some(tag => log.tags!.includes(tag))
        )
      }

      if (filter.search) {
        const searchLower = filter.search.toLowerCase()
        filteredLogs = filteredLogs.filter(log => 
          log.message.toLowerCase().includes(searchLower) ||
          log.context?.endpoint?.toLowerCase().includes(searchLower) ||
          log.context?.method?.toLowerCase().includes(searchLower)
        )
      }
    }

    // Ordenar por timestamp (mais recente primeiro)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    return filteredLogs.slice(0, limit)
  }

  // Estatísticas dos logs
  getStats(timeRange?: { start: Date; end: Date }): LogStats {
    let logsToAnalyze = this.logs

    if (timeRange) {
      logsToAnalyze = logsToAnalyze.filter(log => 
        log.timestamp >= timeRange.start && log.timestamp <= timeRange.end
      )
    }

    const totalLogs = logsToAnalyze.length

    // Logs por nível
    const logsByLevel: Record<string, number> = {}
    logsToAnalyze.forEach(log => {
      logsByLevel[log.level] = (logsByLevel[log.level] || 0) + 1
    })

    // Logs por endpoint
    const logsByEndpoint: Record<string, number> = {}
    logsToAnalyze.forEach(log => {
      if (log.context?.endpoint) {
        logsByEndpoint[log.context.endpoint] = (logsByEndpoint[log.context.endpoint] || 0) + 1
      }
    })

    // Tempo médio de resposta
    const responseTimes = logsToAnalyze
      .filter(log => log.context?.duration)
      .map(log => log.context!.duration!)
    
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0

    // Taxa de erro
    const errorLogs = logsToAnalyze.filter(log => 
      log.level === 'error' || (log.context?.statusCode && log.context.statusCode >= 400)
    )
    const errorRate = totalLogs > 0 ? (errorLogs.length / totalLogs) * 100 : 0

    // Usuários mais ativos
    const userCounts: Record<string, number> = {}
    logsToAnalyze.forEach(log => {
      if (log.context?.userId) {
        userCounts[log.context.userId] = (userCounts[log.context.userId] || 0) + 1
      }
    })
    
    const mostActiveUsers = Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Erros recentes
    const recentErrors = logsToAnalyze
      .filter(log => log.level === 'error')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10)

    return {
      totalLogs,
      logsByLevel,
      logsByEndpoint,
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      mostActiveUsers,
      recentErrors
    }
  }

  // Limpar logs antigos
  clearOldLogs(maxAge: number = 7 * 24 * 60 * 60 * 1000) { // 7 dias
    const cutoff = new Date(Date.now() - maxAge)
    this.logs = this.logs.filter(log => log.timestamp > cutoff)
  }

  // Exportar logs
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'message', 'endpoint', 'method', 'userId', 'duration', 'statusCode']
      const csvRows = [headers.join(',')]
      
      this.logs.forEach(log => {
        const row = [
          log.timestamp.toISOString(),
          log.level,
          `"${log.message.replace(/"/g, '""')}"`,
          log.context?.endpoint || '',
          log.context?.method || '',
          log.context?.userId || '',
          log.context?.duration || '',
          log.context?.statusCode || ''
        ]
        csvRows.push(row.join(','))
      })
      
      return csvRows.join('\n')
    }
    
    return JSON.stringify(this.logs, null, 2)
  }

  // Método privado para adicionar log
  private addLog(
    level: LogEntry['level'],
    message: string,
    context?: LogEntry['context'],
    tags?: string[]
  ) {
    const logEntry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      message,
      context,
      tags
    }

    this.logs.unshift(logEntry)

    // Manter apenas os logs mais recentes
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // Log para console em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      const logMethod = {
        debug: console.debug,
        info: console.info,
        warn: console.warn,
        error: console.error
      }[level]

      logMethod(`[${level.toUpperCase()}] ${message}`, context)
    }
  }
}

// Instância global do logger
export const apiLogger = new ApiLogger()

// Middleware para logging automático de requisições
export function withLogging(
  handler: (request: Request) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    const start = Date.now()
    const url = new URL(request.url)
    const endpoint = url.pathname
    const method = request.method
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Log da requisição
    apiLogger.info(`Request started: ${method} ${endpoint}`, {
      endpoint,
      method,
      requestId,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    try {
      const response = await handler(request)
      const duration = Date.now() - start
      
      // Log da resposta
      apiLogger.logRequest(method, endpoint, response.status, duration, {
        requestId,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      })
      
      return response
    } catch (error) {
      const duration = Date.now() - start
      
      // Log do erro
      apiLogger.logApiError(
        method,
        endpoint,
        error instanceof Error ? error : new Error('Unknown error'),
        {
          requestId,
          duration,
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      )
      
      throw error
    }
  }
}

// Função para criar contexto de log
export function createLogContext(
  endpoint?: string,
  method?: string,
  userId?: string,
  sessionId?: string,
  requestId?: string,
  additionalContext?: Record<string, any>
): LogEntry['context'] {
  return {
    endpoint,
    method,
    userId,
    sessionId,
    requestId,
    ...additionalContext
  }
}
