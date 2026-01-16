import { NextRequest } from 'next/server'

import { withAuth, ensurePermission } from '@/lib/auth/permissions'
import { backupService } from '@/lib/services/backup-service'
import { createSuccessResponse, ValidationError } from '@/lib/error-handler'
import { logAudit } from '@/lib/audit'
import { registerApiMetric } from '@/lib/monitoring/metrics'
import { logInfo } from '@/lib/logging/structured-logger'

export const dynamic = 'force-dynamic'

const parseJsonBody = async <T>(request: NextRequest, fallback: T): Promise<T> => {
  try {
    const body = await request.json()
    return body ?? fallback
  } catch {
    return fallback
  }
}

export const GET = withAuth(async (request, _ctx, session) => {
  const startedAt = Date.now()
  const { searchParams } = new URL(request.url)

  if (searchParams.has('id')) {
    await ensurePermission(session, 'config.manage')
    const id = searchParams.get('id')
    if (!id) {
      throw new ValidationError('Parâmetro id é obrigatório')
    }
    const snapshot = backupService.resolveSnapshot(id)
    if (!snapshot) {
      throw new ValidationError('Backup não encontrado')
    }
    const response = createSuccessResponse(snapshot, 'Backup recuperado com sucesso')
    registerApiMetric('backup_get_snapshot', Date.now() - startedAt, response.status, { snapshotId: id })
    return response
  }

  const history = backupService.listHistory()
  const response = createSuccessResponse({ history }, 'Histórico de backups carregado')
  registerApiMetric('backup_history', Date.now() - startedAt, response.status, { historySize: history.length })
  return response
}, { permissions: 'config.view' })

export const POST = withAuth(async (request, _ctx, session) => {
  const startedAt = Date.now()
  await ensurePermission(session, 'config.manage')
  const body = await parseJsonBody<{ note?: string }>(request, {})

  const snapshot = await backupService.exportSnapshot({
    note: body.note,
    persistHistory: true
  })

  await logAudit({
    request,
    session,
    action: 'BACKUP_EXPORT',
    entity: 'BackupSnapshot',
    entityId: snapshot.meta.id,
    metadata: snapshot.meta
  })

  logInfo({
    message: 'Backup gerado',
    context: {
      snapshotId: snapshot.meta.id,
      source: snapshot.meta.source
    }
  })

  const response = createSuccessResponse(snapshot, 'Backup gerado com sucesso', undefined, 201)
  registerApiMetric('backup_create', Date.now() - startedAt, response.status, {
    source: snapshot.meta.source
  })

  return response
}, { permissions: 'config.manage' })

type RestoreBody = {
  snapshotId?: string
  snapshot?: {
    meta: unknown
    payload: Record<string, any>
  }
  note?: string
}

const validateRestoreBody = (body: RestoreBody) => {
  if (!body.snapshotId && !body.snapshot) {
    throw new ValidationError('Informe snapshotId ou snapshot completo para restaurar.')
  }
}

export const PUT = withAuth(async (request, _ctx, session) => {
  const startedAt = Date.now()
  await ensurePermission(session, 'config.manage')
  const body = await parseJsonBody<RestoreBody>(request, {})
  validateRestoreBody(body)

  const result = await backupService.restoreSnapshot({
    snapshotId: body.snapshotId,
    snapshot: body.snapshot as any,
    note: body.note
  })

  await logAudit({
    request,
    session,
    action: 'BACKUP_RESTORE',
    entity: 'BackupSnapshot',
    entityId: result.current.id,
    metadata: {
      current: result.current,
      restoredFrom: result.restoredFrom
    }
  })

  logInfo({
    message: 'Backup restaurado',
    context: {
      restoredFrom: result.restoredFrom.id,
      currentSnapshot: result.current.id
    }
  })

  const response = createSuccessResponse(result, 'Backup restaurado com sucesso')
  registerApiMetric('backup_restore', Date.now() - startedAt, response.status, {
    restoredFrom: result.restoredFrom.id
  })

  return response
}, { permissions: 'config.manage' })

