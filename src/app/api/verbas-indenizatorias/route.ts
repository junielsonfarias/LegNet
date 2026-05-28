import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const ano = searchParams.get('ano') ? parseInt(searchParams.get('ano')!) : new Date().getFullYear()
  const mes = searchParams.get('mes') ? parseInt(searchParams.get('mes')!) : undefined
  const parlamentarId = searchParams.get('parlamentarId') || undefined

  const where: Record<string, unknown> = { ano }
  if (mes) where.mes = mes
  if (parlamentarId) where.parlamentarId = parlamentarId

  // QW-7: limite defensivo anti payload >2MB; total calculado via aggregate (todos os registros)
  const [verbas, totalAgg] = await Promise.all([
    prisma.verbaIndenizatoria.findMany({
      where,
      orderBy: [{ mes: 'desc' }, { tipo: 'asc' }],
      take: 500,
    }),
    prisma.verbaIndenizatoria.aggregate({ where, _sum: { valor: true } }),
  ])

  const total = Number(totalAgg._sum.valor ?? 0)

  return createSuccessResponse(verbas, undefined, total)
})
