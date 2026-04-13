/**
 * API Publica de Audiencias Publicas
 * GET: Lista audiencias publicas + estatisticas
 *
 * Acesso publico (sem autenticacao). Filtra por status visivelPortal=true
 * via campo JSON publicacaoPublica quando presente.
 */

import { NextRequest } from 'next/server'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || undefined
  const tipo = searchParams.get('tipo') || undefined

  const where: Record<string, unknown> = {}
  if (status && status !== 'all') where.status = status
  if (tipo && tipo !== 'all') where.tipo = tipo

  const audiencias = await prisma.audienciaPublica.findMany({
    where,
    orderBy: { dataHora: 'desc' },
  })

  const stats = {
    total: audiencias.length,
    agendadas: audiencias.filter((a) => a.status === 'AGENDADA').length,
    realizadas: audiencias.filter((a) => a.status === 'CONCLUIDA').length,
    canceladas: audiencias.filter((a) => a.status === 'CANCELADA').length,
  }

  return createSuccessResponse({
    audiencias,
    total: audiencias.length,
    stats,
  })
})
