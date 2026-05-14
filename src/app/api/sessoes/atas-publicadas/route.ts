/**
 * RN-170 — Lista publica de atas de sessoes publicadas.
 *
 * Retorna sessoes cujo `arquivoAtaAssinada` esta preenchido. Usado pela
 * pagina /transparencia/atos/atas. Cache publico curto (60s + SWR 300s).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/error-handler'
import { withPublicCache } from '@/lib/http-cache'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const anoParam = searchParams.get('ano')
  const ano = anoParam ? Number(anoParam) : undefined
  const limit = Math.min(Number(searchParams.get('limit') || '500'), 1000)

  const where: Record<string, unknown> = {
    arquivoAtaAssinada: { not: null },
  }

  if (ano && Number.isFinite(ano)) {
    where.data = {
      gte: new Date(Date.UTC(ano, 0, 1)),
      lt: new Date(Date.UTC(ano + 1, 0, 1)),
    }
  }

  const sessoes = await prisma.sessao.findMany({
    where,
    select: {
      id: true,
      numero: true,
      tipo: true,
      data: true,
      arquivoAtaAssinada: true,
      arquivoAta: true,
      dataPublicacaoAta: true,
      statusAta: true,
    },
    orderBy: [{ data: 'desc' }, { numero: 'desc' }],
    take: limit,
  })

  return withPublicCache(
    NextResponse.json({ success: true, data: sessoes }),
    { maxAge: 60, swr: 300 },
  )
})
