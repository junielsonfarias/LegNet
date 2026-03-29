import { NextRequest } from 'next/server'
import { createSuccessResponse, NotFoundError } from '@/lib/error-handler'
import { resolverSessaoId } from '@/lib/services/sessao-controle'
import { sessaoDbService } from '@/lib/services/sessao-db-service'
import { sessaoIncludeFull, sessaoIncludeOperator } from '../_validators/sessao-validators'

/**
 * Handler para buscar sessão por ID
 * GET /api/sessoes/[id]?light=true (operador) ou GET /api/sessoes/[id] (completo)
 */
export async function getSessaoHandler(
  request: NextRequest,
  params: { id: string }
) {
  const id = await resolverSessaoId(params.id)

  // ?light=true usa include leve (sem votacoes individuais) para o painel do operador
  const { searchParams } = new URL(request.url)
  const isLight = searchParams.get('light') === 'true'
  const include = isLight ? sessaoIncludeOperator : sessaoIncludeFull

  const sessao = await sessaoDbService.getById(id, include)

  if (!sessao) {
    throw new NotFoundError('Sessão')
  }

  return createSuccessResponse(sessao, 'Sessão encontrada com sucesso')
}
