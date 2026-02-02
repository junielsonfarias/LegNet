/**
 * Serviço de Alertas de Segurança com Persistência
 *
 * Detecta atividades suspeitas e envia alertas para administradores.
 * Integra com o sistema de auditoria e persiste alertas no banco de dados.
 *
 * IMPORTANTE: Este módulo é SERVER-ONLY.
 */

import { logWarn, logError, logInfo } from '@/lib/logging/structured-logger'
import { generateSecureId } from '@/lib/utils/secure-id'
import { prisma } from '@/lib/prisma'
import type { AlertSeverity as PrismaAlertSeverity, AlertStatus as PrismaAlertStatus, AlertType as PrismaAlertType } from '@prisma/client'

// Tipos de alerta (compatíveis com Prisma)
export type AlertSeverity = PrismaAlertSeverity
export type AlertStatus = PrismaAlertStatus
export type AlertType = PrismaAlertType

export interface SecurityAlert {
  id: string
  type: AlertType
  severity: AlertSeverity
  status: AlertStatus
  title: string
  description: string
  metadata: Record<string, any>
  sourceIp?: string | null
  userId?: string | null
  userName?: string | null
  createdAt: Date
  acknowledgedAt?: Date | null
  acknowledgedBy?: string | null
  resolvedAt?: Date | null
  resolvedBy?: string | null
  notes?: string | null
}

// Configuração de regras de detecção
interface DetectionRule {
  type: AlertType
  enabled: boolean
  threshold: number
  windowMinutes: number
  severity: AlertSeverity
  description: string
}

const DEFAULT_RULES: DetectionRule[] = [
  {
    type: 'BRUTE_FORCE_ATTEMPT',
    enabled: true,
    threshold: 5,
    windowMinutes: 15,
    severity: 'HIGH',
    description: 'Múltiplas tentativas de login falhadas do mesmo IP'
  },
  {
    type: 'UNUSUAL_ACCESS_PATTERN',
    enabled: true,
    threshold: 1,
    windowMinutes: 60,
    severity: 'MEDIUM',
    description: 'Acesso fora do horário comercial (22h-6h)'
  },
  {
    type: 'DATA_EXFILTRATION',
    enabled: true,
    threshold: 100,
    windowMinutes: 10,
    severity: 'CRITICAL',
    description: 'Download massivo de dados (mais de 100 registros em 10 min)'
  },
  {
    type: 'RATE_LIMIT_EXCEEDED',
    enabled: true,
    threshold: 10,
    windowMinutes: 5,
    severity: 'MEDIUM',
    description: 'Rate limit excedido múltiplas vezes'
  },
  {
    type: 'MASS_DELETE',
    enabled: true,
    threshold: 10,
    windowMinutes: 5,
    severity: 'CRITICAL',
    description: 'Exclusão em massa de registros'
  },
  {
    type: 'CONFIGURATION_CHANGE',
    enabled: true,
    threshold: 1,
    windowMinutes: 1,
    severity: 'HIGH',
    description: 'Alteração em configurações críticas do sistema'
  },
  {
    type: 'UNAUTHORIZED_ACCESS',
    enabled: true,
    threshold: 3,
    windowMinutes: 5,
    severity: 'HIGH',
    description: 'Tentativas de acesso a recursos não autorizados'
  }
]

// Webhooks para notificação
interface WebhookConfig {
  url: string
  enabled: boolean
  severities: AlertSeverity[]
  secret?: string
}

// Evento de auditoria para análise
interface AuditEvent {
  action: string
  entity: string
  userId?: string
  userName?: string
  ip?: string
  success: boolean
  timestamp: Date
  metadata?: Record<string, any>
}

class SecurityAlertService {
  private rules: DetectionRule[] = DEFAULT_RULES
  private eventBuffer: AuditEvent[] = []
  private webhooks: WebhookConfig[] = []
  private notificationCallback?: (alert: SecurityAlert) => Promise<void>
  private initialized = false

  constructor() {
    // Inicializa intervalos apenas no servidor
    if (typeof window === 'undefined') {
      // Limpa buffer de eventos a cada 5 minutos
      setInterval(() => this.cleanupEventBuffer(), 5 * 60 * 1000)

      // Executa análise de segurança a cada minuto
      setInterval(() => this.runSecurityAnalysis(), 60 * 1000)
    }
  }

  /**
   * Configura callback para notificações
   */
  setNotificationCallback(callback: (alert: SecurityAlert) => Promise<void>): void {
    this.notificationCallback = callback
  }

  /**
   * Adiciona webhook para notificações
   */
  addWebhook(config: WebhookConfig): void {
    this.webhooks.push(config)
  }

  /**
   * Registra evento para análise de segurança
   */
  recordEvent(event: AuditEvent): void {
    this.eventBuffer.push({
      ...event,
      timestamp: event.timestamp || new Date()
    })

    // Análise em tempo real para eventos críticos
    this.analyzeEventRealtime(event)
  }

  /**
   * Cria um alerta de segurança (persiste no banco)
   */
  async createAlert(
    type: AlertType,
    severity: AlertSeverity,
    title: string,
    description: string,
    metadata: Record<string, any> = {}
  ): Promise<SecurityAlert> {
    try {
      // Persiste no banco de dados
      const alert = await prisma.securityAlert.create({
        data: {
          type,
          severity,
          status: 'NEW',
          title,
          description,
          metadata,
          sourceIp: metadata.ip || null,
          userId: metadata.userId || null,
          userName: metadata.userName || null
        }
      })

      // Log do alerta
      const logFn = severity === 'CRITICAL' || severity === 'HIGH' ? logError : logWarn
      logFn({
        message: `[SECURITY ALERT] ${title}`,
        context: {
          alertId: alert.id,
          type,
          severity,
          ...metadata
        }
      })

      // Notificação assíncrona
      const securityAlert = this.mapToSecurityAlert(alert)
      this.sendNotifications(securityAlert)

      return securityAlert
    } catch (error) {
      logError({ message: 'Erro ao criar alerta de segurança', context: { error: String(error) } })

      // Fallback: retorna alerta sem persistir (para não quebrar o fluxo)
      return {
        id: generateSecureId('alert'),
        type,
        severity,
        status: 'NEW',
        title,
        description,
        metadata,
        sourceIp: metadata.ip,
        userId: metadata.userId,
        userName: metadata.userName,
        createdAt: new Date()
      }
    }
  }

  /**
   * Mapeia registro do Prisma para SecurityAlert
   */
  private mapToSecurityAlert(record: any): SecurityAlert {
    return {
      id: record.id,
      type: record.type,
      severity: record.severity,
      status: record.status,
      title: record.title,
      description: record.description,
      metadata: (record.metadata as Record<string, any>) || {},
      sourceIp: record.sourceIp,
      userId: record.userId,
      userName: record.userName,
      createdAt: record.createdAt,
      acknowledgedAt: record.acknowledgedAt,
      acknowledgedBy: record.acknowledgedBy,
      resolvedAt: record.resolvedAt,
      resolvedBy: record.resolvedBy,
      notes: record.notes
    }
  }

  /**
   * Análise em tempo real de eventos críticos
   */
  private analyzeEventRealtime(event: AuditEvent): void {
    // Detecta tentativas de SQL injection ou XSS em inputs
    if (event.metadata?.input) {
      const input = String(event.metadata.input)

      if (this.detectSqlInjection(input)) {
        this.createAlert(
          'SQL_INJECTION_ATTEMPT',
          'CRITICAL',
          'Tentativa de SQL Injection detectada',
          `Input malicioso detectado: ${input.substring(0, 100)}...`,
          { ip: event.ip, userId: event.userId, userName: event.userName }
        )
      }

      if (this.detectXss(input)) {
        this.createAlert(
          'XSS_ATTEMPT',
          'HIGH',
          'Tentativa de XSS detectada',
          `Input malicioso detectado: ${input.substring(0, 100)}...`,
          { ip: event.ip, userId: event.userId, userName: event.userName }
        )
      }
    }

    // Detecta alterações em configurações críticas
    if (event.action === 'UPDATE' && event.entity === 'CONFIGURACAO') {
      this.createAlert(
        'CONFIGURATION_CHANGE',
        'HIGH',
        'Configuração do sistema alterada',
        `Usuário ${event.userName} alterou configurações do sistema`,
        { userId: event.userId, userName: event.userName, changes: event.metadata }
      )
    }

    // Detecta acesso fora do horário comercial
    if (event.action === 'LOGIN' && event.success) {
      const hour = new Date().getHours()
      if (hour >= 22 || hour < 6) {
        this.createAlert(
          'UNUSUAL_ACCESS_PATTERN',
          'MEDIUM',
          'Login fora do horário comercial',
          `Usuário ${event.userName} fez login às ${hour}h`,
          { userId: event.userId, userName: event.userName, ip: event.ip }
        )
      }
    }
  }

  /**
   * Executa análise periódica de segurança
   */
  private async runSecurityAnalysis(): Promise<void> {
    const now = new Date()

    for (const rule of this.rules) {
      if (!rule.enabled) continue

      const windowStart = new Date(now.getTime() - rule.windowMinutes * 60 * 1000)
      const relevantEvents = this.eventBuffer.filter(e => e.timestamp >= windowStart)

      switch (rule.type) {
        case 'BRUTE_FORCE_ATTEMPT':
          await this.detectBruteForce(relevantEvents, rule)
          break
        case 'RATE_LIMIT_EXCEEDED':
          await this.detectRateLimitAbuse(relevantEvents, rule)
          break
        case 'MASS_DELETE':
          await this.detectMassDelete(relevantEvents, rule)
          break
        case 'DATA_EXFILTRATION':
          await this.detectDataExfiltration(relevantEvents, rule)
          break
        case 'UNAUTHORIZED_ACCESS':
          await this.detectUnauthorizedAccess(relevantEvents, rule)
          break
      }
    }
  }

  private async detectBruteForce(events: AuditEvent[], rule: DetectionRule): Promise<void> {
    // Agrupa tentativas de login falhadas por IP
    const failedLogins = events.filter(e => e.action === 'LOGIN' && !e.success)
    const byIp: Record<string, AuditEvent[]> = {}

    for (const event of failedLogins) {
      if (event.ip) {
        byIp[event.ip] = byIp[event.ip] || []
        byIp[event.ip].push(event)
      }
    }

    for (const [ip, ipEvents] of Object.entries(byIp)) {
      if (ipEvents.length >= rule.threshold) {
        // Evita alertas duplicados - busca no banco
        const windowStart = new Date(Date.now() - rule.windowMinutes * 60 * 1000)
        const existingAlert = await prisma.securityAlert.findFirst({
          where: {
            type: 'BRUTE_FORCE_ATTEMPT',
            sourceIp: ip,
            status: 'NEW',
            createdAt: { gte: windowStart }
          }
        })

        if (!existingAlert) {
          await this.createAlert(
            'BRUTE_FORCE_ATTEMPT',
            rule.severity,
            `Possível ataque de força bruta do IP ${ip}`,
            `${ipEvents.length} tentativas de login falhadas em ${rule.windowMinutes} minutos`,
            { ip, attempts: ipEvents.length, affectedUsers: Array.from(new Set(ipEvents.map(e => e.userName))) }
          )
        }
      }
    }
  }

  private async detectRateLimitAbuse(events: AuditEvent[], rule: DetectionRule): Promise<void> {
    const rateLimitEvents = events.filter(e => e.action === 'RATE_LIMIT_EXCEEDED')
    const byIp: Record<string, number> = {}

    for (const event of rateLimitEvents) {
      if (event.ip) {
        byIp[event.ip] = (byIp[event.ip] || 0) + 1
      }
    }

    for (const [ip, count] of Object.entries(byIp)) {
      if (count >= rule.threshold) {
        await this.createAlert(
          'RATE_LIMIT_EXCEEDED',
          rule.severity,
          `Rate limit excedido repetidamente pelo IP ${ip}`,
          `${count} violações em ${rule.windowMinutes} minutos`,
          { ip, violations: count }
        )
      }
    }
  }

  private async detectMassDelete(events: AuditEvent[], rule: DetectionRule): Promise<void> {
    const deleteEvents = events.filter(e => e.action === 'DELETE' || e.action === 'DELETAR')
    const byUser: Record<string, AuditEvent[]> = {}

    for (const event of deleteEvents) {
      const key = event.userId || event.ip || 'unknown'
      byUser[key] = byUser[key] || []
      byUser[key].push(event)
    }

    for (const [userId, userEvents] of Object.entries(byUser)) {
      if (userEvents.length >= rule.threshold) {
        const userName = userEvents[0]?.userName || 'Desconhecido'
        await this.createAlert(
          'MASS_DELETE',
          rule.severity,
          `Exclusão em massa detectada`,
          `Usuário ${userName} excluiu ${userEvents.length} registros em ${rule.windowMinutes} minutos`,
          {
            userId,
            userName,
            deletedCount: userEvents.length,
            entities: Array.from(new Set(userEvents.map(e => e.entity)))
          }
        )
      }
    }
  }

  private async detectDataExfiltration(events: AuditEvent[], rule: DetectionRule): Promise<void> {
    const readEvents = events.filter(e =>
      e.action === 'READ' ||
      e.action === 'EXPORT' ||
      e.action === 'DOWNLOAD' ||
      (e.metadata?.recordCount && e.metadata.recordCount > 50)
    )

    const byUser: Record<string, number> = {}
    for (const event of readEvents) {
      const key = event.userId || event.ip || 'unknown'
      const count = event.metadata?.recordCount || 1
      byUser[key] = (byUser[key] || 0) + count
    }

    for (const [userId, totalRecords] of Object.entries(byUser)) {
      if (totalRecords >= rule.threshold) {
        await this.createAlert(
          'DATA_EXFILTRATION',
          rule.severity,
          'Possível exfiltração de dados detectada',
          `${totalRecords} registros acessados/exportados em ${rule.windowMinutes} minutos`,
          { userId, totalRecords }
        )
      }
    }
  }

  private async detectUnauthorizedAccess(events: AuditEvent[], rule: DetectionRule): Promise<void> {
    const unauthorizedEvents = events.filter(e =>
      !e.success &&
      (e.action === 'ACCESS_DENIED' || e.metadata?.statusCode === 403)
    )

    const byUser: Record<string, AuditEvent[]> = {}
    for (const event of unauthorizedEvents) {
      const key = event.userId || event.ip || 'unknown'
      byUser[key] = byUser[key] || []
      byUser[key].push(event)
    }

    for (const [userId, userEvents] of Object.entries(byUser)) {
      if (userEvents.length >= rule.threshold) {
        await this.createAlert(
          'UNAUTHORIZED_ACCESS',
          rule.severity,
          'Múltiplas tentativas de acesso não autorizado',
          `${userEvents.length} tentativas de acesso a recursos protegidos`,
          {
            userId,
            attempts: userEvents.length,
            resources: Array.from(new Set(userEvents.map(e => e.entity)))
          }
        )
      }
    }
  }

  private detectSqlInjection(input: string): boolean {
    const patterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER)\b.*\b(FROM|INTO|WHERE|TABLE)\b)/i,
      /(--\s*$|\/\*|\*\/|;.*--)/,
      /(\bOR\b\s+\d+=\d+|\bAND\b\s+\d+=\d+)/i,
      /(\'|\");\s*(SELECT|INSERT|UPDATE|DELETE|DROP)/i
    ]

    return patterns.some(p => p.test(input))
  }

  private detectXss(input: string): boolean {
    const patterns = [
      /<script[^>]*>[\s\S]*?<\/script>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<\s*img[^>]+onerror/i,
      /<\s*svg[^>]+onload/i
    ]

    return patterns.some(p => p.test(input))
  }

  /**
   * Envia notificações do alerta
   */
  private async sendNotifications(alert: SecurityAlert): Promise<void> {
    // Callback customizado
    if (this.notificationCallback) {
      try {
        await this.notificationCallback(alert)
      } catch (error) {
        logError({ message: 'Erro ao enviar notificação de alerta', context: { error: String(error) } })
      }
    }

    // Webhooks
    for (const webhook of this.webhooks) {
      if (webhook.enabled && webhook.severities.includes(alert.severity)) {
        this.sendWebhook(webhook, alert)
      }
    }
  }

  private async sendWebhook(config: WebhookConfig, alert: SecurityAlert): Promise<void> {
    try {
      const payload = {
        alertId: alert.id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        metadata: alert.metadata,
        timestamp: alert.createdAt.toISOString()
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      if (config.secret) {
        const crypto = await import('crypto')
        const signature = crypto
          .createHmac('sha256', config.secret)
          .update(JSON.stringify(payload))
          .digest('hex')
        headers['X-Signature'] = signature
      }

      await fetch(config.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      logInfo({ message: 'Webhook de alerta enviado', context: { alertId: alert.id, url: config.url } })
    } catch (error) {
      logError({ message: 'Erro ao enviar webhook', context: { error: String(error), url: config.url } })
    }
  }

  /**
   * Lista alertas (do banco de dados)
   */
  async getAlerts(filters?: {
    status?: AlertStatus
    severity?: AlertSeverity
    type?: AlertType
    limit?: number
  }): Promise<SecurityAlert[]> {
    const where: any = {}

    if (filters?.status) where.status = filters.status
    if (filters?.severity) where.severity = filters.severity
    if (filters?.type) where.type = filters.type

    const alerts = await prisma.securityAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100
    })

    return alerts.map(a => this.mapToSecurityAlert(a))
  }

  /**
   * Atualiza status de um alerta
   */
  async updateAlertStatus(
    alertId: string,
    status: AlertStatus,
    userId: string,
    notes?: string
  ): Promise<SecurityAlert | null> {
    try {
      const data: any = {
        status,
        notes
      }

      if (status === 'ACKNOWLEDGED') {
        data.acknowledgedAt = new Date()
        data.acknowledgedBy = userId
      } else if (status === 'RESOLVED' || status === 'FALSE_POSITIVE') {
        data.resolvedAt = new Date()
        data.resolvedBy = userId
      }

      const alert = await prisma.securityAlert.update({
        where: { id: alertId },
        data
      })

      logInfo({
        message: 'Status de alerta atualizado',
        context: { alertId, status, updatedBy: userId }
      })

      return this.mapToSecurityAlert(alert)
    } catch (error) {
      logError({ message: 'Erro ao atualizar alerta', context: { error: String(error), alertId } })
      return null
    }
  }

  /**
   * Obtém estatísticas de alertas (do banco)
   */
  async getStats(): Promise<{
    total: number
    byStatus: Record<AlertStatus, number>
    bySeverity: Record<AlertSeverity, number>
    byType: Record<string, number>
    last24h: number
    unresolved: number
  }> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const [total, last24h, unresolved, byStatus, bySeverity, byType] = await Promise.all([
      prisma.securityAlert.count(),
      prisma.securityAlert.count({ where: { createdAt: { gte: oneDayAgo } } }),
      prisma.securityAlert.count({ where: { status: { in: ['NEW', 'ACKNOWLEDGED'] } } }),
      prisma.securityAlert.groupBy({ by: ['status'], _count: true }),
      prisma.securityAlert.groupBy({ by: ['severity'], _count: true }),
      prisma.securityAlert.groupBy({ by: ['type'], _count: true })
    ])

    const statusCounts: Record<AlertStatus, number> = { NEW: 0, ACKNOWLEDGED: 0, RESOLVED: 0, FALSE_POSITIVE: 0 }
    for (const s of byStatus) {
      statusCounts[s.status] = s._count
    }

    const severityCounts: Record<AlertSeverity, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
    for (const s of bySeverity) {
      severityCounts[s.severity] = s._count
    }

    const typeCounts: Record<string, number> = {}
    for (const t of byType) {
      typeCounts[t.type] = t._count
    }

    return {
      total,
      byStatus: statusCounts,
      bySeverity: severityCounts,
      byType: typeCounts,
      last24h,
      unresolved
    }
  }

  private cleanupEventBuffer(): void {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000) // Mantém 1 hora
    this.eventBuffer = this.eventBuffer.filter(e => e.timestamp >= cutoff)
  }
}

// Singleton
export const securityAlertService = new SecurityAlertService()

// Função helper para registrar eventos do audit log
export function recordSecurityEvent(event: AuditEvent): void {
  securityAlertService.recordEvent(event)
}

// Exporta tipos para uso externo
export type { AuditEvent, WebhookConfig, DetectionRule }
