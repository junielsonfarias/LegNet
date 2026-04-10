/**
 * API do Painel em Tempo Real - Estado
 * GET: Retorna estado atual do painel para uma sessao
 */

import { NextRequest } from 'next/server'
import { getEstadoPainel } from '@/lib/services/painel-tempo-real-service'
import { withErrorHandler, createSuccessResponse, ValidationError, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const sessaoId = searchParams.get('sessaoId')

  if (!sessaoId) {
    throw new ValidationError('sessaoId e obrigatorio')
  }

  const estado = await getEstadoPainel(sessaoId)

  if (!estado) {
    throw new NotFoundError('Sessao')
  }

  return createSuccessResponse(estado)
})
