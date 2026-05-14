/**
 * RN-173 — Lista publica de pareceres publicados.
 *
 * Retorna pareceres com `arquivoUrl IS NOT NULL`. Usado pela pagina
 * /transparencia/atos/pareceres-comissoes. Cache 60s + SWR 300s.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/error-handler'
import { withPublicCache } from '@/lib/http-cache'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const comissaoId = searchParams.get('comissaoId') || undefined
  const proposicaoId = searchParams.get('proposicaoId') || undefined
  const anoParam = searchParams.get('ano')
  const ano = anoParam ? Number(anoParam) : undefined
  const limit = Math.min(Number(searchParams.get('limit') || '500'), 1000)

  const where: Record<string, unknown> = {
    arquivoUrl: { not: null },
  }
  if (comissaoId) where.comissaoId = comissaoId
  if (proposicaoId) where.proposicaoId = proposicaoId
  if (ano && Number.isFinite(ano)) where.ano = ano

  const pareceres = await prisma.parecer.findMany({
    where,
    select: {
      id: true,
      numero: true,
      ano: true,
      tipo: true,
      status: true,
      ementa: true,
      arquivoUrl: true,
      arquivoNome: true,
      dataEmissao: true,
      dataElaboracao: true,
      comissao: {
        select: { id: true, nome: true, sigla: true },
      },
      relator: {
        select: { id: true, nome: true, apelido: true, partido: true },
      },
      proposicao: {
        select: { id: true, numero: true, ano: true, tipo: true, ementa: true },
      },
    },
    orderBy: [{ dataEmissao: 'desc' }, { createdAt: 'desc' }],
    take: limit,
  })

  return withPublicCache(
    NextResponse.json({ success: true, data: pareceres }),
    { maxAge: 60, swr: 300 },
  )
})
