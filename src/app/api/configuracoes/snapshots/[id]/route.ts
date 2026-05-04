import { NextRequest } from 'next/server'
import { createSuccessResponse, NotFoundError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

/**
 * Fase 5 / M5: retorna o snapshot completo (institucional + sistema) para
 * que o admin possa visualizar diff antes de aplicar rollback.
 */
export const GET = withAuth(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const snap = await prisma.configuracaoSnapshot.findUnique({ where: { id } })
  if (!snap) throw new NotFoundError('Snapshot')
  return createSuccessResponse(snap, 'Snapshot encontrado')
}, { permissions: 'config.view' })

/**
 * DELETE /api/configuracoes/snapshots/[id]
 * Remove snapshot — usado para limpeza periodica de historico antigo.
 * Snapshots automaticos antes de restore sao auditados (logAudit).
 */
export const DELETE = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  session
) => {
  const { id } = await params
  const snap = await prisma.configuracaoSnapshot.findUnique({
    where: { id },
    select: { id: true, createdAt: true }
  })
  if (!snap) throw new NotFoundError('Snapshot')

  await prisma.configuracaoSnapshot.delete({ where: { id } })

  await logAudit({
    request,
    session,
    action: 'CONFIGURACAO_SNAPSHOT_DELETE',
    entity: 'ConfiguracaoSnapshot',
    entityId: id,
    metadata: { createdAt: snap.createdAt.toISOString() }
  })

  return createSuccessResponse({ removed: true }, 'Snapshot removido')
}, { permissions: 'config.manage' })
