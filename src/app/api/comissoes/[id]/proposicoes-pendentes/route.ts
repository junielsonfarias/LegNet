import { NextRequest } from 'next/server'
import {
  withErrorHandler,
  createSuccessResponse,
  NotFoundError,
  validateId
} from '@/lib/error-handler'
import { comissaoDbService } from '@/lib/services/comissao-db-service'

export const dynamic = 'force-dynamic'

// GET - Listar proposições em tramitação para uma comissão que ainda não têm parecer
export const GET = withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Comissão')

  const result = await comissaoDbService.getPendingPropositions(id)

  if (!result) {
    throw new NotFoundError('Comissão')
  }

  return createSuccessResponse(result, 'Proposições pendentes listadas com sucesso')
})
