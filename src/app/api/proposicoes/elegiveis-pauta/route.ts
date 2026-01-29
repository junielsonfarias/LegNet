import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { listarProposicoesElegiveisPauta } from '@/lib/services/fluxo-tramitacao-service'

/**
 * GET /api/proposicoes/elegiveis-pauta
 * Lista proposicoes que estao elegiveis para inclusao na pauta
 * (tramitacao na etapa que habilita pauta)
 */
export const GET = withAuth(async (
  _request: NextRequest
) => {
  const proposicoes = await listarProposicoesElegiveisPauta()

  return createSuccessResponse(proposicoes, `${proposicoes.length} proposicoes elegiveis para pauta`)
}, { permissions: 'proposicao.view' })
