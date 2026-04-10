import { NextRequest } from 'next/server'

import { withAuth, ensurePermission } from '@/lib/auth/permissions'
import { backupService } from '@/lib/services/backup-service'
import { createSuccessResponse } from '@/lib/error-handler'
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

export const POST = withAuth(async (request, _ctx, session) => {
  const startedAt = Date.now()
  await ensurePermission(session, 'config.manage')
  const body = await parseJsonBody<{ note?: string }>(request, {})

  const snapshot = await backupService.exportSnapshot({
    note: body.note,
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
