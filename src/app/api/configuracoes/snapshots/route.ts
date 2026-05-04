import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Fase 5 / M5: lista snapshots de configuracao para auditoria/rollback.
 * Retorna metadata (sem o JSON completo) para nao inflar resposta.
 */
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)

  const snapshots = await prisma.configuracaoSnapshot.findMany({
    select: {
      id: true,
      motivo: true,
      userId: true,
      userEmail: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  })

  return createSuccessResponse(snapshots, 'Snapshots de configuracao')
}, { permissions: 'config.view' })
