/**
 * API: Presença em Reunião de Comissão
 * GET - Lista presenças
 * POST - Registra presença
 * PUT - Registra saída
 * SEGURANÇA: POST/PUT requerem permissão comissao.manage
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, ValidationError } from '@/lib/error-handler'
import { ReuniaoComissaoService } from '@/lib/services/reuniao-comissao-service'

export const dynamic = 'force-dynamic'

// Schema de validação
const PresencaSchema = z.object({
  membroComissaoId: z.string().min(1, 'ID do membro é obrigatório'),
  presente: z.boolean().optional().default(true),
  justificativa: z.string().optional()
})

const SaidaSchema = z.object({
  membroComissaoId: z.string().min(1, 'ID do membro é obrigatório')
})

/**
 * GET - Listar presenças da reunião
 * Requer autenticação básica
 */
export const GET = withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new ValidationError('Não autorizado')
  }

  const { id: reuniaoId } = await context.params
  const presencas = await ReuniaoComissaoService.obterPresencas(reuniaoId)
  const quorum = await ReuniaoComissaoService.verificarQuorum(reuniaoId)

  return createSuccessResponse({ presencas, quorum }, 'Presenças listadas')
})

/**
 * POST - Registrar presença
 * SEGURANÇA: Requer permissão comissao.manage
 */
export const POST = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: reuniaoId } = await context.params
  const body = await request.json()

  const validation = PresencaSchema.safeParse(body)
  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message)
  }

  const { membroComissaoId, presente, justificativa } = validation.data

  const presenca = await ReuniaoComissaoService.registrarPresenca(
    reuniaoId,
    membroComissaoId,
    presente,
    justificativa
  )

  const quorum = await ReuniaoComissaoService.verificarQuorum(reuniaoId)

  return createSuccessResponse({ presenca, quorum }, 'Presença registrada')
}, { permissions: 'comissao.manage' })

/**
 * PUT - Registrar saída
 * SEGURANÇA: Requer permissão comissao.manage
 */
export const PUT = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: reuniaoId } = await context.params
  const body = await request.json()

  const validation = SaidaSchema.safeParse(body)
  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message)
  }

  const { membroComissaoId } = validation.data

  const presenca = await ReuniaoComissaoService.registrarSaida(
    reuniaoId,
    membroComissaoId
  )

  return createSuccessResponse(presenca, 'Saída registrada')
}, { permissions: 'comissao.manage' })
