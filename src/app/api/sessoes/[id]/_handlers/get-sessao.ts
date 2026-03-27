import { NextRequest } from 'next/server'
import { createSuccessResponse, NotFoundError } from '@/lib/error-handler'
import { resolverSessaoId } from '@/lib/services/sessao-controle'
import { sessaoDbService } from '@/lib/services/sessao-db-service'
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

  const sessao = await sessaoDbService.getById(id, sessaoIncludeFull)

  if (!sessao) {
    throw new NotFoundError('Sessão')
  }

  return createSuccessResponse(sessao, 'Sessão encontrada com sucesso')
}
