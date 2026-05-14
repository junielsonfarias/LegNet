/**
 * RN-174 — Lista publica de emendas publicadas.
 *
 * Retorna emendas com `arquivoUrl IS NOT NULL`. Usado pela pagina
 * /transparencia/atos/emendas. Cache 60s + SWR 300s.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/error-handler'
import { withPublicCache } from '@/lib/http-cache'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const proposicaoId = searchParams.get('proposicaoId') || undefined
  const autorId = searchParams.get('autorId') || undefined
  const anoParam = searchParams.get('ano')
  const ano = anoParam ? Number(anoParam) : undefined
  const limit = Math.min(Number(searchParams.get('limit') || '500'), 1000)

  const where: Record<string, unknown> = {
    arquivoUrl: { not: null },
  }
  if (proposicaoId) where.proposicaoId = proposicaoId
  if (autorId) where.autorId = autorId
  if (ano && Number.isFinite(ano)) {
    where.dataPublicacao = {
      gte: new Date(Date.UTC(ano, 0, 1)),
      lt: new Date(Date.UTC(ano + 1, 0, 1)),
    }
  }

  const emendas = await prisma.emenda.findMany({
    where,
    select: {
      id: true,
      numero: true,
      tipo: true,
      status: true,
      arquivoUrl: true,
      arquivoNome: true,
      dataPublicacao: true,
      autor: {
        select: { id: true, nome: true, apelido: true, partido: true },
      },
      proposicao: {
        select: { id: true, numero: true, ano: true, tipo: true, ementa: true },
      },
    },
    orderBy: [{ dataPublicacao: 'desc' }, { createdAt: 'desc' }],
    take: limit,
  })

  return withPublicCache(
    NextResponse.json({ success: true, data: emendas }),
    { maxAge: 60, swr: 300 },
  )
})
