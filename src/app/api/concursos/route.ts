import { NextRequest } from 'next/server'
import { createSuccessResponse, withErrorHandler } from '@/lib/error-handler'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || undefined
  const where: Record<string, unknown> = {}
  if (status) where.status = status

  const concursos = await prisma.concurso.findMany({ where, orderBy: { dataPublicacao: 'desc' } })
  return createSuccessResponse(concursos)
})
