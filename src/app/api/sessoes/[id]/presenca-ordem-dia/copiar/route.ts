/**
 * API para copiar presença da sessão para ordem do dia
 * POST: Copia todas as presenças da sessão
 */

import { NextRequest } from 'next/server'
import { createSuccessResponse, NotFoundError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { presencaDbService } from '@/lib/services/presenca-db-service'
import { presencaOrdemDiaDbService } from '@/lib/services/presenca-ordem-dia-db-service'
import { sessaoDbService } from '@/lib/services/sessao-db-service'

export const dynamic = 'force-dynamic'

// POST - Copia presenças da sessão para ordem do dia
export const POST = withAuth(withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  session
) => {
  const { id: sessaoId } = await context.params

  // Verificar se sessão existe
  const sessao = await sessaoDbService.getById(sessaoId)
  if (!sessao) {
    throw new NotFoundError('Sessão')
  }

  // Buscar presenças da sessão (presentes)
  const presencas = await presencaDbService.listBySessao(sessaoId)
  const presentes = presencas.filter(p => p.presente)

  if (presentes.length === 0) {
    return createSuccessResponse({
      copiados: 0,
      mensagem: 'Nenhuma presença registrada na sessão para copiar'
    })
  }

  // Copiar presenças para ordem do dia via serviço
  const parlamentarIds = presentes.map(p => p.parlamentarId)
  const resultados = await presencaOrdemDiaDbService.copiarDaSessao(sessaoId, parlamentarIds)

  await logAudit({
    request,
    session,
    action: 'PRESENCA_ORDEM_DIA_COPIADA',
    entity: 'PresencaOrdemDia',
    entityId: sessaoId,
    metadata: {
      totalCopiados: resultados.length
    }
  })

  return createSuccessResponse({
    copiados: resultados.length,
    mensagem: `${resultados.length} presenças copiadas da sessão para ordem do dia`
  })
}), { permissions: 'sessao.manage' })
