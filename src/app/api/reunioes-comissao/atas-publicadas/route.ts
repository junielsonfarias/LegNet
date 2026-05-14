/**
 * RN-172 — Lista publica de atas de reunioes de comissao publicadas.
 *
 * Retorna reunioes cujo `arquivoAta` esta preenchido. Usado pela pagina
 * /transparencia/atos/atas-comissoes. Cache 60s + SWR 300s.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/error-handler'
import { withPublicCache } from '@/lib/http-cache'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const comissaoId = searchParams.get('comissaoId') || undefined
  const anoParam = searchParams.get('ano')
  const ano = anoParam ? Number(anoParam) : undefined
  const limit = Math.min(Number(searchParams.get('limit') || '500'), 1000)

  const where: Record<string, unknown> = {
    arquivoAta: { not: null },
  }
  if (comissaoId) where.comissaoId = comissaoId
  if (ano && Number.isFinite(ano)) where.ano = ano

  const reunioes = await prisma.reuniaoComissao.findMany({
    where,
    select: {
      id: true,
      numero: true,
      ano: true,
      tipo: true,
      data: true,
      arquivoAta: true,
      dataPublicacaoAta: true,
      ataAprovada: true,
      comissao: {
        select: { id: true, nome: true, sigla: true },
      },
    },
    orderBy: [{ data: 'desc' }, { numero: 'desc' }],
    take: limit,
  })

  return withPublicCache(
    NextResponse.json({ success: true, data: reunioes }),
    { maxAge: 60, swr: 300 },
  )
})
