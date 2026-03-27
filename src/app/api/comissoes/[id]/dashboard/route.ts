import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  withErrorHandler,
  createSuccessResponse,
  NotFoundError,
  UnauthorizedError,
  validateId
} from '@/lib/error-handler'
import { comissaoDbService } from '@/lib/services/comissao-db-service'

export const dynamic = 'force-dynamic'

// GET - Dados agregados para dashboard da comissao
export const GET = withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new UnauthorizedError()
  }

  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Comissao')

  const dashboard = await comissaoDbService.getDashboard(id)

  if (!dashboard) {
    throw new NotFoundError('Comissao')
  }

  return createSuccessResponse(dashboard, 'Dashboard carregado com sucesso')
})
