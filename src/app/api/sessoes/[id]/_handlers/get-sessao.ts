import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, NotFoundError } from '@/lib/error-handler'
import { resolverSessaoId } from '@/lib/services/sessao-controle'
import { sessaoIncludeFull } from '../_validators/sessao-validators'

/**
 * Handler para buscar sessão por ID
 * GET /api/sessoes/[id]
 */
export async function getSessaoHandler(
  request: NextRequest,
  params: { id: string }
) {
  // Resolver ID (aceita CUID ou slug no formato sessao-{numero}-{ano})
  const id = await resolverSessaoId(params.id)

  const sessao = await prisma.sessao.findUnique({
    where: { id },
    include: sessaoIncludeFull as any
  })

  if (!sessao) {
    throw new NotFoundError('Sessão')
  }

  return createSuccessResponse(sessao, 'Sessão encontrada com sucesso')
}
