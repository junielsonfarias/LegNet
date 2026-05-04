import { NextRequest } from 'next/server'
import { parlamentarDbService } from '@/lib/services/parlamentar-db-service'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, ForbiddenError } from '@/lib/error-handler'

// Forcar rota dinamica (nao pode ser pre-renderizada)
export const dynamic = 'force-dynamic'

/**
 * API para verificar status de acesso do parlamentar
 *
 * Retorna:
 * - sessaoEmAndamento: boolean - se ha sessao EM_ANDAMENTO
 * - presencaConfirmada: boolean - se o parlamentar tem presenca confirmada na sessao
 * - sessaoId: string | null - ID da sessao em andamento
 * - podeAcessarVotacao: boolean - se pode acessar modulo de votacao
 * - podeAcessarDashboard: boolean - se pode acessar o dashboard
 */
export const GET = withAuth(async (request: NextRequest, _ctx: unknown, session: any) => {
  const parlamentarId = session?.user?.parlamentarId

  if (!parlamentarId) {
    throw new ForbiddenError('Usuário não vinculado a um parlamentar')
  }

  const data = await parlamentarDbService.getStatus(parlamentarId)

  return createSuccessResponse(data)
  // M12: GET idempotente (consulta de status) — skipCsrf seguro.
}, { skipCsrf: true })
