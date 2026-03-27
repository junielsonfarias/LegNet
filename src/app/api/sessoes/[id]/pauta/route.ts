import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, NotFoundError, ValidationError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { resolverSessaoId } from '@/lib/services/sessao-controle'
import { pautasDbService } from '@/lib/services/pautas-db-service'

const PAUTA_SECAO_ORDER = ['EXPEDIENTE', 'ORDEM_DO_DIA', 'COMUNICACOES', 'HONRAS', 'OUTROS'] as const
const TIPO_ACAO_PAUTA = ['LEITURA', 'DISCUSSAO', 'VOTACAO', 'COMUNICADO', 'HOMENAGEM'] as const

const PautaItemCreateSchema = z.object({
  secao: z.enum(PAUTA_SECAO_ORDER),
  titulo: z.string().min(1, 'Titulo e obrigatorio'),
  descricao: z.string().optional(),
  proposicaoId: z.string().optional(),
  tempoEstimado: z.number().min(0).optional(),
  autor: z.string().optional(),
  observacoes: z.string().optional(),
  tipoAcao: z.enum(TIPO_ACAO_PAUTA).optional(),
  etapa: z.number().int().min(1).max(2).nullable().optional(),
  parecerId: z.string().nullable().optional(),
  leituraNumero: z.number().int().min(1).max(3).nullable().optional(),
  relatorId: z.string().nullable().optional()
})

export const GET = withAuth(async (
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params
  const sessaoId = await resolverSessaoId(id)

  const pauta = await pautasDbService.getPautaSessao(sessaoId)
  if (!pauta) {
    throw new NotFoundError('Pauta da sessao')
  }

  return createSuccessResponse(pauta, 'Pauta carregada com sucesso')
}, { permissions: 'sessao.view' })

export const POST = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  session
) => {
  const { id } = await context.params
  const sessaoId = await resolverSessaoId(id)
  const body = await request.json()

  const payload = PautaItemCreateSchema.safeParse({
    ...body,
    tempoEstimado: body.tempoEstimado !== undefined ? Number(body.tempoEstimado) : undefined
  })

  if (!payload.success) {
    throw new ValidationError(payload.error.issues[0]?.message ?? 'Dados invalidos')
  }

  const pautaAtualizada = await pautasDbService.addItem(
    sessaoId,
    payload.data,
    {
      userId: session?.user?.id,
      requestIp: request.headers.get('x-forwarded-for') || undefined
    }
  )

  if (!pautaAtualizada) {
    throw new NotFoundError('Pauta da sessao')
  }

  await logAudit({
    request,
    session,
    action: 'PAUTA_ITEM_CREATE',
    entity: 'PautaSessao',
    entityId: pautaAtualizada.id,
    metadata: {
      sessaoId,
      secao: payload.data.secao,
      titulo: payload.data.titulo,
      tipoAcao: payload.data.tipoAcao
    }
  })

  return createSuccessResponse(
    pautaAtualizada,
    'Item adicionado a pauta com sucesso'
  )
}, { permissions: 'pauta.manage' })
