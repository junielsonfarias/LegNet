import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const ano = searchParams.get('ano') ? parseInt(searchParams.get('ano')!) : new Date().getFullYear()
  const mes = searchParams.get('mes') ? parseInt(searchParams.get('mes')!) : undefined

  const where: Record<string, unknown> = { ano }
  if (mes) where.mes = mes

  const diarias = await prisma.diaria.findMany({
    where,
    orderBy: [{ mes: 'desc' }, { dataInicio: 'desc' }],
  })

  const total = diarias.reduce((acc, d) => acc + Number(d.valorTotal), 0)

  return createSuccessResponse(diarias, undefined, total)
})
