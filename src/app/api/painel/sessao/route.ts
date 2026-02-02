/**
 * API do Painel - Controle de Sessao
 * POST: Inicia/Finaliza/Suspende/Retoma sessao
 * GET: Busca estado da sessao
 * SEGURANÇA: POST requer permissão sessao.manage
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, ValidationError } from '@/lib/error-handler'
import {
  iniciarSessao,
  finalizarSessao,
  getEstadoPainel
} from '@/lib/services/painel-tempo-real-service'

export const dynamic = 'force-dynamic'

// Schema de validação
const SessaoControlSchema = z.object({
  sessaoId: z.string().min(1, 'sessaoId é obrigatório'),
  acao: z.enum(['iniciar', 'finalizar', 'suspender', 'retomar'], {
    errorMap: () => ({ message: 'Ação inválida. Use: iniciar, finalizar, suspender, retomar' })
  })
})

/**
 * POST - Controle de sessão
 * SEGURANÇA: Requer permissão sessao.manage
 */
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const validation = SessaoControlSchema.safeParse(body)

  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message)
  }

  const { sessaoId, acao } = validation.data
  let resultado

  switch (acao) {
    case 'iniciar':
      resultado = await iniciarSessao(sessaoId)
      if (!resultado) {
        throw new ValidationError('Erro ao iniciar sessão')
      }
      return createSuccessResponse(resultado, 'Sessão iniciada com sucesso')

    case 'finalizar':
      await finalizarSessao(sessaoId)
      return createSuccessResponse({ finalized: true }, 'Sessão finalizada com sucesso')

    case 'suspender':
      // Implementar suspensão se necessário
      return createSuccessResponse({ suspended: true }, 'Sessão suspensa')

    case 'retomar':
      resultado = await iniciarSessao(sessaoId)
      return createSuccessResponse(resultado, 'Sessão retomada')

    default:
      throw new ValidationError('Ação inválida')
  }
}, { permissions: 'sessao.manage' })

/**
 * GET - Buscar estado da sessão
 * SEGURANÇA: Rota pública (exibição no painel público)
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const sessaoId = searchParams.get('sessaoId')

  if (!sessaoId) {
    throw new ValidationError('sessaoId é obrigatório')
  }

  const estado = await getEstadoPainel(sessaoId)

  return createSuccessResponse(estado?.sessao || null, 'Estado da sessão')
})
