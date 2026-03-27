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
import { getMeetingDefaults, getProposicoesPendentes } from '@/lib/services/meeting-defaults-service'
import { comissaoDbService } from '@/lib/services/comissao-db-service'

export const dynamic = 'force-dynamic'

// GET - Obter defaults inteligentes para nova reuniao
export const GET = withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new UnauthorizedError()
  }

  const { id: rawId } = await context.params
  const comissaoId = validateId(rawId, 'Comissao')

  // Verificar se comissao existe
  const comissao = await comissaoDbService.exists(comissaoId)

  if (!comissao) {
    throw new NotFoundError('Comissao')
  }

  // Obter defaults e proposicoes pendentes
  const [defaults, proposicoesPendentes] = await Promise.all([
    getMeetingDefaults(comissaoId),
    getProposicoesPendentes(comissaoId)
  ])

  return createSuccessResponse({
    ...defaults,
    proposicoesPendentes
  }, 'Defaults carregados com sucesso')
})
