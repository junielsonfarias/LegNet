import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

/**
 * GET - Listar servidores para quadro de pessoal (publico)
 * Nao expoe salario
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const busca = searchParams.get('busca') || undefined
  const vinculo = searchParams.get('vinculo') || undefined
  const situacao = searchParams.get('situacao') || 'ATIVO'

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

  const servidores = await prisma.servidor.findMany({
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
  })

  return createSuccessResponse(servidores, undefined, servidores.length)
})
