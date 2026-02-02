/**
 * API: Alertas de Segurança
 * GET - Listar alertas de segurança (do banco de dados)
 * PUT - Atualizar status de um alerta
 * SEGURANÇA: Requer permissão audit.manage (apenas ADMIN/SECRETARIA)
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, ValidationError } from '@/lib/error-handler'
import { securityAlertService } from '@/lib/security/alert-service'
import type { AlertStatus, AlertSeverity, AlertType } from '@prisma/client'

export const dynamic = 'force-dynamic'

// Schema de validação para filtros
const FilterSchema = z.object({
  status: z.enum(['NEW', 'ACKNOWLEDGED', 'RESOLVED', 'FALSE_POSITIVE']).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  type: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50)
})

// Schema para atualização de status
const UpdateStatusSchema = z.object({
  alertId: z.string().min(1, 'alertId é obrigatório'),
  status: z.enum(['NEW', 'ACKNOWLEDGED', 'RESOLVED', 'FALSE_POSITIVE']),
  notes: z.string().optional()
})

/**
 * GET - Listar alertas de segurança
 * SEGURANÇA: Requer permissão audit.manage
 */
export const GET = withAuth(async (request: NextRequest, _ctx, session) => {
  const { searchParams } = new URL(request.url)

  // Validar parâmetros
  const params: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    params[key] = value
  })

  const validation = FilterSchema.safeParse(params)
  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message)
  }

  const { status, severity, type, limit } = validation.data

  // Tipo especial: estatísticas
  if (searchParams.get('tipo') === 'stats') {
    const stats = await securityAlertService.getStats()
    return createSuccessResponse(stats, 'Estatísticas de alertas')
  }

  const alerts = await securityAlertService.getAlerts({
    status: status as AlertStatus | undefined,
    severity: severity as AlertSeverity | undefined,
    type: type as AlertType | undefined,
    limit
  })

  return createSuccessResponse(alerts, 'Alertas listados', alerts.length)
}, { permissions: 'audit.manage' })

/**
 * PUT - Atualizar status de um alerta
 * SEGURANÇA: Requer permissão audit.manage
 */
export const PUT = withAuth(async (request: NextRequest, _ctx, session) => {
  const body = await request.json()

  const validation = UpdateStatusSchema.safeParse(body)
  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message)
  }

  const { alertId, status, notes } = validation.data

  const alert = await securityAlertService.updateAlertStatus(
    alertId,
    status as AlertStatus,
    session.user?.id || 'system',
    notes
  )

  if (!alert) {
    throw new ValidationError('Alerta não encontrado')
  }

  return createSuccessResponse(alert, 'Status do alerta atualizado')
}, { permissions: 'audit.manage' })
