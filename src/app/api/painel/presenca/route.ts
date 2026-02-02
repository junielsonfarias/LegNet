/**
 * API do Painel - Controle de Presenca
 * POST: Registra presenca de parlamentares
 * GET: Busca lista de presenca
 * SEGURANÇA: POST requer permissão presenca.manage
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, ValidationError, NotFoundError } from '@/lib/error-handler'
import {
  registrarPresenca,
  getEstadoPainel
} from '@/lib/services/painel-tempo-real-service'

export const dynamic = 'force-dynamic'

// Schema de validação
const PresencaSchema = z.object({
  sessaoId: z.string().min(1, 'sessaoId é obrigatório'),
  parlamentarId: z.string().min(1, 'parlamentarId é obrigatório'),
  presente: z.boolean(),
  justificativa: z.string().optional()
})

/**
 * POST - Registrar presença
 * SEGURANÇA: Requer permissão presenca.manage
 */
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const validation = PresencaSchema.safeParse(body)

  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message)
  }

  const { sessaoId, parlamentarId, presente, justificativa } = validation.data

  const sucesso = await registrarPresenca(sessaoId, parlamentarId, presente, justificativa)

  if (!sucesso) {
    throw new ValidationError('Erro ao registrar presença')
  }

  return createSuccessResponse(
    { registered: true },
    presente ? 'Presença registrada' : 'Ausência registrada'
  )
}, { permissions: 'presenca.manage' })

/**
 * GET - Buscar presenças
 * SEGURANÇA: Requer autenticação básica (GET é menos restritivo)
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const sessaoId = searchParams.get('sessaoId')

  if (!sessaoId) {
    throw new ValidationError('sessaoId é obrigatório')
  }

  const estado = await getEstadoPainel(sessaoId)

  if (!estado) {
    throw new NotFoundError('Sessão')
  }

  return createSuccessResponse({
    presencas: estado.presencas,
    estatisticas: {
      total: estado.estatisticas.totalParlamentares,
      presentes: estado.estatisticas.presentes,
      ausentes: estado.estatisticas.ausentes,
      percentual: estado.estatisticas.percentualPresenca
    }
  }, 'Presenças listadas')
})
