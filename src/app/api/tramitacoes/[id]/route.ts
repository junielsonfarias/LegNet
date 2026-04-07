import { NextRequest } from 'next/server'
import { z } from 'zod'

import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse } from '@/lib/error-handler'
import {
  getById,
  update,
  reopen,
  finalize,
  remove,
  avancarEtapaFluxo
} from '@/lib/services/tramitacao-service'

export const dynamic = 'force-dynamic'

const StatusEnum = z.enum(['EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'])
const ResultadoEnum = z.enum(['APROVADO', 'REJEITADO', 'APROVADO_COM_EMENDAS', 'ARQUIVADO'])

const UpdateTramitacaoSchema = z.object({
  tipoTramitacaoId: z.string().nullish().transform(v => v ?? undefined),
  unidadeId: z.string().nullish().transform(v => v ?? undefined),
  dataEntrada: z.string().datetime({ message: 'dataEntrada deve estar no formato ISO 8601' }).optional(),
  dataSaida: z
    .union([
      z.string().datetime({ message: 'dataSaida deve estar no formato ISO 8601' }),
      z.null()
    ])
    .optional(),
  status: StatusEnum.optional(),
  observacoes: z.union([z.string(), z.null()]).optional(),
  parecer: z.union([z.string(), z.null()]).optional(),
  resultado: z.union([ResultadoEnum, z.null()]).optional(),
  responsavelId: z.union([z.string(), z.null()]).optional(),
  prazoVencimento: z
    .union([
      z.string().datetime({ message: 'prazoVencimento deve estar no formato ISO 8601' }),
      z.null()
    ])
    .optional(),
  diasVencidos: z.union([z.number().int().min(0), z.null()]).optional(),
  automatica: z.boolean().nullish().transform(v => v ?? undefined)
})

const ActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('advance'),
    comentario: z.union([z.string(), z.null()]).optional(),
    parecer: z.string().nullish().transform(v => v ?? undefined),
    resultado: ResultadoEnum.optional()
  }),
  z.object({
    action: z.literal('reopen'),
    observacoes: z.union([z.string(), z.null()]).optional()
  }),
  z.object({
    action: z.literal('finalize'),
    observacoes: z.union([z.string(), z.null()]).optional(),
    resultado: z.union([ResultadoEnum, z.null()]).optional()
  })
])

// GET - Obter tramitação por ID
export const GET = withAuth(async (_request: NextRequest, { params }) => {
  const { id } = await params

  const tramitacao = await getById(id)

  return createSuccessResponse(tramitacao, 'Tramitação encontrada')
}, { permissions: 'tramitacao.view' })

// PUT - Atualizar tramitação ou executar ação
export const PUT = withAuth(async (request: NextRequest, { params, user }) => {
  const { id } = await params
  const body = await request.json()

  // Verificar se é uma ação especial
  const actionResult = ActionSchema.safeParse(body)
  if (actionResult.success) {
    const actionPayload = actionResult.data

    // Ação: Avançar para próxima etapa
    if (actionPayload.action === 'advance') {
      const tramitacao = await getById(id)

      const resultado = await avancarEtapaFluxo(
        tramitacao.proposicaoId,
        actionPayload.comentario || undefined,
        actionPayload.parecer as any,
        actionPayload.resultado as any,
        user?.id,
        request.headers.get('x-forwarded-for') || undefined
      )

      return createSuccessResponse(
        resultado,
        resultado.etapaFinal ? 'Tramitação finalizada' : 'Tramitação avançada para a próxima etapa'
      )
    }

    // Ação: Reabrir tramitação
    if (actionPayload.action === 'reopen') {
      const tramitacao = await reopen(id, actionPayload.observacoes, user?.id)
      return createSuccessResponse(tramitacao, 'Tramitação reaberta com sucesso')
    }

    // Ação: Finalizar tramitação
    if (actionPayload.action === 'finalize') {
      const tramitacao = await finalize(id, actionPayload.observacoes, actionPayload.resultado, user?.id)
      return createSuccessResponse(tramitacao, 'Tramitação finalizada com sucesso')
    }
  }

  // Atualização normal
  const payload = UpdateTramitacaoSchema.parse(body)
  const tramitacao = await update(id, payload, user?.id)

  return createSuccessResponse(tramitacao, 'Tramitação atualizada com sucesso')
}, { permissions: 'tramitacao.manage' })

// DELETE - Excluir tramitação
export const DELETE = withAuth(async (_request: NextRequest, { params }) => {
  const { id } = await params

  const result = await remove(id)

  return createSuccessResponse(result, 'Tramitação removida com sucesso')
}, { permissions: 'tramitacao.manage' })
