import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'
import { withPublicCache } from '@/lib/http-cache'


/**
 * GET - Listar servidores para quadro de pessoal (publico)
 * Nao expoe salario.
 *
 * F3.3 — paginacao obrigatoria. Antes retornava tabela inteira (200-2000 linhas
 * em camaras medias), o que estourava o payload e o cache CDN.
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const busca = searchParams.get('busca') || undefined
  const vinculo = searchParams.get('vinculo') || undefined
  const situacao = searchParams.get('situacao') || 'ATIVO'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50))
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}

  if (busca) {
    where.OR = [
      { nome: { contains: busca, mode: 'insensitive' } },
      { cargo: { contains: busca, mode: 'insensitive' } },
      { lotacao: { contains: busca, mode: 'insensitive' } },
    ]
  }

  if (vinculo) where.vinculo = vinculo
  if (situacao) where.situacao = situacao

  const [total, servidores] = await Promise.all([
    prisma.servidor.count({ where }),
    prisma.servidor.findMany({
      where,
      select: {
        id: true,
        nome: true,
        cargo: true,
        funcao: true,
        unidade: true,
        lotacao: true,
        vinculo: true,
        situacao: true,
        cargaHoraria: true,
        dataAdmissao: true,
      },
      orderBy: { nome: 'asc' },
      skip,
      take: limit,
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / limit))
  return withPublicCache(
    createSuccessResponse(servidores, undefined, total, 200, { page, limit, total, totalPages }),
    { maxAge: 60, swr: 300 },
  )
})
