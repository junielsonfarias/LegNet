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
import { withPublicCache } from '@/lib/http-cache'


/**
 * F3.3 — paginacao + stats via groupBy. Antes retornava tabela inteira
 * com colunas JSON pesadas (`participantes`, `documentos`, `atas`,
 * `transcricoes`, `cronograma`) — payload >1MB em camaras ativas.
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || undefined
  const tipo = searchParams.get('tipo') || undefined
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (status && status !== 'all') where.status = status
  if (tipo && tipo !== 'all') where.tipo = tipo

  const [total, audiencias, porStatus] = await Promise.all([
    prisma.audienciaPublica.count({ where }),
    prisma.audienciaPublica.findMany({
      where,
      orderBy: { dataHora: 'desc' },
      skip,
      take: limit,
    }),
    prisma.audienciaPublica.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
    }),
  ])

  const stats = {
    total,
    agendadas: porStatus.find((g) => g.status === 'AGENDADA')?._count._all ?? 0,
    realizadas: porStatus.find((g) => g.status === 'CONCLUIDA')?._count._all ?? 0,
    canceladas: porStatus.find((g) => g.status === 'CANCELADA')?._count._all ?? 0,
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))
  return withPublicCache(
    createSuccessResponse(
      { audiencias, total, stats },
      undefined,
      total,
      200,
      { page, limit, total, totalPages },
    ),
    { maxAge: 60, swr: 300 },
  )
})
