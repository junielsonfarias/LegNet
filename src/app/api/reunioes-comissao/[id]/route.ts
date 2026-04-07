/**
 * API: Reunião de Comissão por ID
 * GET - Busca reunião
 * PUT - Atualiza reunião
 * DELETE - Exclui reunião
 * SEGURANÇA: PUT/DELETE requerem permissão comissao.manage
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, ValidationError, NotFoundError, validateId } from '@/lib/error-handler'
import { ReuniaoComissaoService } from '@/lib/services/reuniao-comissao-service'

export const dynamic = 'force-dynamic'

// Schema de validação para atualização
const AtualizarReuniaoSchema = z.object({
  tipo: z.enum(['ORDINARIA', 'EXTRAORDINARIA', 'ESPECIAL']).nullish().transform(v => v ?? undefined),
  data: z.string().datetime().nullish().transform(v => v ?? undefined),
  horaInicio: z.string().datetime().nullish().transform(v => v ?? undefined),
  horaFim: z.string().datetime().nullish().transform(v => v ?? undefined),
  local: z.string().nullish().transform(v => v ?? undefined),
  motivoConvocacao: z.string().nullish().transform(v => v ?? undefined),
  pautaTexto: z.string().nullish().transform(v => v ?? undefined),
  ataTexto: z.string().nullish().transform(v => v ?? undefined),
  quorumMinimo: z.number().int().min(1).optional(),
  observacoes: z.string().nullish().transform(v => v ?? undefined)
})

/**
 * GET - Buscar reunião por ID
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

  const { id } = await context.params
  const reuniao = await ReuniaoComissaoService.buscarReuniaoPorId(id)

  if (!reuniao) {
    throw new NotFoundError('Reunião')
  }

  return createSuccessResponse(reuniao, 'Reunião encontrada')
})

/**
 * PUT - Atualizar reunião
 * SEGURANÇA: Requer permissão comissao.manage
 */
export const PUT = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params
  validateId(id, 'Reunião')

  const body = await request.json()
  const validation = AtualizarReuniaoSchema.safeParse(body)

  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message)
  }

  const dados = validation.data

  const reuniao = await ReuniaoComissaoService.atualizarReuniao(id, {
    tipo: dados.tipo,
    data: dados.data ? new Date(dados.data) : undefined,
    horaInicio: dados.horaInicio ? new Date(dados.horaInicio) : undefined,
    horaFim: dados.horaFim ? new Date(dados.horaFim) : undefined,
    local: dados.local ?? undefined,
    motivoConvocacao: dados.motivoConvocacao ?? undefined,
    pautaTexto: dados.pautaTexto ?? undefined,
    ataTexto: dados.ataTexto ?? undefined,
    quorumMinimo: dados.quorumMinimo,
    observacoes: dados.observacoes ?? undefined
  })

  return createSuccessResponse(reuniao, 'Reunião atualizada com sucesso')
}, { permissions: 'comissao.manage' })

/**
 * DELETE - Excluir reunião
 * SEGURANÇA: Requer permissão comissao.manage
 */
export const DELETE = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params
  validateId(id, 'Reunião')

  await ReuniaoComissaoService.excluirReuniao(id)

  return createSuccessResponse({ deleted: true }, 'Reunião excluída com sucesso')
}, { permissions: 'comissao.manage' })
