// Sistema de monitoramento de APIs
export interface ApiMetrics {
  endpoint: string
  method: string
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  lastRequest?: Date
  status: 'healthy' | 'degraded' | 'down'
}

export interface HealthCheck {
  name: string
  status: 'healthy' | 'unhealthy'
  responseTime: number
  lastCheck: Date
  error?: string
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'down'
  services: HealthCheck[]
  uptime: number
  lastUpdated: Date
}

class ApiMonitor {
  private metrics: Map<string, ApiMetrics> = new Map()
  private healthChecks: HealthCheck[] = []
  private startTime: Date = new Date()

  // Métricas de requisições
  recordRequest(endpoint: string, method: string, success: boolean, responseTime: number) {
    const key = `${method}:${endpoint}`
    const existing = this.metrics.get(key)

    if (existing) {
      existing.totalRequests++
      if (success) {
        existing.successfulRequests++
      } else {
        existing.failedRequests++
      }
      
      // Calcular média de tempo de resposta
      existing.averageResponseTime = 
        (existing.averageResponseTime * (existing.totalRequests - 1) + responseTime) / 
        existing.totalRequests
      
      existing.lastRequest = new Date()
      
      // Determinar status
      const errorRate = existing.failedRequests / existing.totalRequests
      if (errorRate > 0.5) {
        existing.status = 'down'
      } else if (errorRate > 0.1 || existing.averageResponseTime > 2000) {
        existing.status = 'degraded'
      } else {
        existing.status = 'healthy'
      }
    } else {
      this.metrics.set(key, {
        endpoint,
        method,
        totalRequests: 1,
        successfulRequests: success ? 1 : 0,
        failedRequests: success ? 0 : 1,
        averageResponseTime: responseTime,
        lastRequest: new Date(),
        status: success ? 'healthy' : 'degraded'
      })
    }
  }

  // Health checks
  async performHealthCheck(name: string, checkFunction: () => Promise<boolean>): Promise<HealthCheck> {
    const start = Date.now()
    
    try {
      const isHealthy = await checkFunction()
      const responseTime = Date.now() - start
      
      const healthCheck: HealthCheck = {
        name,
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime,
        lastCheck: new Date()
      }
      
      // Atualizar ou adicionar health check
      const existingIndex = this.healthChecks.findIndex(h => h.name === name)
      if (existingIndex >= 0) {
        this.healthChecks[existingIndex] = healthCheck
      } else {
        this.healthChecks.push(healthCheck)
      }
      
      return healthCheck
    } catch (error) {
      const responseTime = Date.now() - start
      
      const healthCheck: HealthCheck = {
        name,
        status: 'unhealthy',
        responseTime,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
      
      const existingIndex = this.healthChecks.findIndex(h => h.name === name)
      if (existingIndex >= 0) {
        this.healthChecks[existingIndex] = healthCheck
      } else {
        this.healthChecks.push(healthCheck)
      }
      
      return healthCheck
    }
  }

  // Obter métricas
  getMetrics(): ApiMetrics[] {
    return Array.from(this.metrics.values())
  }

  getMetricsForEndpoint(endpoint: string): ApiMetrics | undefined {
    return Array.from(this.metrics.values()).find(m => m.endpoint === endpoint)
  }

  // Obter health do sistema
  getSystemHealth(): SystemHealth {
    const uptime = Date.now() - this.startTime.getTime()
    
    // Determinar status geral
    let overall: 'healthy' | 'degraded' | 'down' = 'healthy'
    
    if (this.healthChecks.some(h => h.status === 'unhealthy')) {
      overall = 'degraded'
    }
    
    if (this.healthChecks.every(h => h.status === 'unhealthy') || 
        Array.from(this.metrics.values()).some(m => m.status === 'down')) {
      overall = 'down'
    }
    
    return {
      overall,
      services: [...this.healthChecks],
      uptime,
      lastUpdated: new Date()
    }
  }

  // Limpar métricas antigas
  clearOldMetrics(maxAge: number = 24 * 60 * 60 * 1000) { // 24 horas
    const cutoff = new Date(Date.now() - maxAge)
    
    const keysToDelete: string[] = []
    this.metrics.forEach((metric, key) => {
      if (metric.lastRequest && metric.lastRequest < cutoff) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach(key => this.metrics.delete(key))
    
    // Limpar health checks antigos (manter apenas os últimos 100)
    if (this.healthChecks.length > 100) {
      this.healthChecks.sort((a, b) => b.lastCheck.getTime() - a.lastCheck.getTime())
      this.healthChecks = this.healthChecks.slice(0, 100)
    }
  }

  // Estatísticas resumidas
  getSummary() {
    const metrics = this.getMetrics()
    const systemHealth = this.getSystemHealth()
    
    const totalRequests = metrics.reduce((sum, m) => sum + m.totalRequests, 0)
    const totalSuccessful = metrics.reduce((sum, m) => sum + m.successfulRequests, 0)
    const totalFailed = metrics.reduce((sum, m) => sum + m.failedRequests, 0)
    const averageResponseTime = metrics.length > 0 
      ? metrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / metrics.length 
      : 0
    
    const successRate = totalRequests > 0 ? (totalSuccessful / totalRequests) * 100 : 0
    
    return {
      totalRequests,
      totalSuccessful,
      totalFailed,
      successRate: Math.round(successRate * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime),
      uptime: Math.round(systemHealth.uptime / 1000), // em segundos
      overallStatus: systemHealth.overall,
      healthyServices: this.healthChecks.filter(h => h.status === 'healthy').length,
      totalServices: this.healthChecks.length
    }
  }
}

// Instância global do monitor
export const apiMonitor = new ApiMonitor()

// Middleware para monitoramento automático
export function withMonitoring(
  handler: (request: Request) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    const start = Date.now()
    const url = new URL(request.url)
    const endpoint = url.pathname
    const method = request.method
    
    try {
      const response = await handler(request)
      const responseTime = Date.now() - start
      const success = response.status < 400
      
      apiMonitor.recordRequest(endpoint, method, success, responseTime)
      
      return response
    } catch (error) {
      const responseTime = Date.now() - start
      
      apiMonitor.recordRequest(endpoint, method, false, responseTime)
      
      throw error
    }
  }
}

// Health checks específicos
export const healthChecks = {
  // Verificar se o banco de dados está acessível
  async database(): Promise<boolean> {
    try {
      // Aqui você faria uma consulta simples ao banco
      // Por enquanto, vamos simular
      await new Promise(resolve => setTimeout(resolve, 100))
      return true
    } catch {
      return false
    }
  },

  // Verificar se os serviços externos estão funcionando
  async externalServices(): Promise<boolean> {
    try {
      // Verificar APIs externas se necessário
      return true
    } catch {
      return false
    }
  },

  // Verificar espaço em disco
  async diskSpace(): Promise<boolean> {
    try {
      // Implementar verificação de espaço em disco
      return true
    } catch {
      return false
    }
  },

  // Verificar memória disponível
  async memory(): Promise<boolean> {
    try {
      // Implementar verificação de memória
      return true
    } catch {
      return false
    }
  }
}

// Função para executar todos os health checks
export async function runAllHealthChecks(): Promise<HealthCheck[]> {
  const checks = [
    { name: 'Database', check: healthChecks.database },
    { name: 'External Services', check: healthChecks.externalServices },
    { name: 'Disk Space', check: healthChecks.diskSpace },
    { name: 'Memory', check: healthChecks.memory }
  ]

  const results = await Promise.all(
    checks.map(async ({ name, check }) => 
      await apiMonitor.performHealthCheck(name, check)
    )
  )

  return results
}

// Função para obter alertas
export function getAlerts(): Array<{
  type: 'error' | 'warning' | 'info'
  message: string
  timestamp: Date
}> {
  const alerts: Array<{
    type: 'error' | 'warning' | 'info'
    message: string
    timestamp: Date
  }> = []

  const metrics = apiMonitor.getMetrics()
  const systemHealth = apiMonitor.getSystemHealth()

  // Verificar métricas de API
  for (const metric of metrics) {
    const errorRate = metric.failedRequests / metric.totalRequests
    
    if (errorRate > 0.5) {
      alerts.push({
        type: 'error',
        message: `API ${metric.method} ${metric.endpoint} com alta taxa de erro (${Math.round(errorRate * 100)}%)`,
        timestamp: metric.lastRequest || new Date()
      })
    } else if (errorRate > 0.1) {
      alerts.push({
        type: 'warning',
        message: `API ${metric.method} ${metric.endpoint} com taxa de erro elevada (${Math.round(errorRate * 100)}%)`,
        timestamp: metric.lastRequest || new Date()
      })
    }

    if (metric.averageResponseTime > 5000) {
      alerts.push({
        type: 'warning',
        message: `API ${metric.method} ${metric.endpoint} com tempo de resposta lento (${Math.round(metric.averageResponseTime)}ms)`,
        timestamp: metric.lastRequest || new Date()
      })
    }
  }

  // Verificar health checks
  for (const service of systemHealth.services) {
    if (service.status === 'unhealthy') {
      alerts.push({
        type: 'error',
        message: `Serviço ${service.name} está indisponível`,
        timestamp: service.lastCheck
      })
    }
  }

  // Verificar status geral
  if (systemHealth.overall === 'down') {
    alerts.push({
      type: 'error',
      message: 'Sistema está fora do ar',
      timestamp: new Date()
    })
  } else if (systemHealth.overall === 'degraded') {
    alerts.push({
      type: 'warning',
      message: 'Sistema com degradação de performance',
      timestamp: new Date()
    })
  }

  return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}
