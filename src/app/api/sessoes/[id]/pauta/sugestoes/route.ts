import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { resolverSessaoId } from '@/lib/services/sessao-controle'
import { pautasDbService } from '@/lib/services/pautas-db-service'

export const GET = withAuth(async (
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params
  const { searchParams } = new URL(_request.url)
  const retroativo = searchParams.get('retroativo') === 'true'

  const sessaoId = await resolverSessaoId(id)

  const result = await pautasDbService.getSugestoes(sessaoId, retroativo)

  return createSuccessResponse(result, 'Sugestoes geradas com sucesso')
}, { permissions: 'pauta.manage' })
