import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  // Modo "anos disponíveis": lista os anos com registros (desc) p/ filtro dinâmico.
  if (searchParams.get('anos') === 'true') {
    const distintos = await prisma.diaria.findMany({
      distinct: ['ano'],
      select: { ano: true },
      orderBy: { ano: 'desc' },
    })
    return createSuccessResponse(distintos.map((d) => d.ano))
  }

  const ano = searchParams.get('ano') ? parseInt(searchParams.get('ano')!) : new Date().getFullYear()
  const mes = searchParams.get('mes') ? parseInt(searchParams.get('mes')!) : undefined

  const where: Record<string, unknown> = { ano }
  if (mes) where.mes = mes

  // QW-7: limite defensivo anti payload >2MB; total calculado via aggregate (todos os registros)
  const [diarias, totalAgg] = await Promise.all([
    prisma.diaria.findMany({
      where,
      orderBy: [{ mes: 'desc' }, { dataInicio: 'desc' }],
      take: 500,
    }),
    prisma.diaria.aggregate({ where, _sum: { valorTotal: true } }),
  ])

  const total = Number(totalAgg._sum.valorTotal ?? 0)

  return createSuccessResponse(diarias, undefined, total)
})
