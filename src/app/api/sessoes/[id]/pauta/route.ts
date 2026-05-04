import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, NotFoundError, ValidationError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { resolverSessaoId } from '@/lib/services/sessao-controle'
import { pautasDbService } from '@/lib/services/pautas-db-service'

const TIPO_ACAO_PAUTA = ['LEITURA', 'DISCUSSAO', 'VOTACAO', 'LEITURA_VOTACAO', 'DISCUSSAO_VOTACAO', 'COMUNICADO', 'HOMENAGEM', 'LEITURA_ATA', 'LEITURA_OFICIO'] as const

const PautaItemCreateSchema = z.object({
  secao: z.string().min(1, 'Secao e obrigatoria'),
  titulo: z.string().min(1, 'Titulo e obrigatorio'),
  descricao: z.string().nullish().transform(v => v ?? undefined),
  proposicaoId: z.string().nullish().transform(v => v ?? undefined),
  tempoEstimado: z.number().min(0).nullish().transform(v => v ?? undefined),
  autor: z.string().nullish().transform(v => v ?? undefined),
  observacoes: z.string().nullish().transform(v => v ?? undefined),
  tipoAcao: z.enum(TIPO_ACAO_PAUTA).nullish().transform(v => v ?? undefined),
  tipoVotacao: z.enum(['NOMINAL', 'SECRETA', 'SIMBOLICA', 'LEITURA'] as const).nullish().transform(v => v ?? undefined),
  sessaoAtaOrigemId: z.string().nullish().transform(v => v ?? undefined),
  oficioId: z.string().nullish().transform(v => v ?? undefined),
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

  // Detectar se sessão é CONCLUIDA (lançamento retroativo - pular validações)
  const sessaoDb = await prisma.sessao.findUnique({ where: { id: sessaoId }, select: { status: true } })
  const isRetroativo = sessaoDb?.status === 'CONCLUIDA'

  // RN-053 / Fase 3 A5: pauta APROVADA nao aceita novos itens.
  // Excecao: lancamento retroativo (sessao CONCLUIDA), pois operador esta
  // registrando dados pretericos.
  if (!isRetroativo) {
    await pautasDbService.assertPautaEditavel(sessaoId)
  }

  if (!isRetroativo) {
    // Valida elegibilidade da proposicao para pauta (apenas quando vinculada a uma proposicao)
    if (payload.data.proposicaoId) {
      const { verificarElegibilidadePauta } = await import('@/lib/services/fluxo-tramitacao-service')
      const elegibilidade = await verificarElegibilidadePauta(payload.data.proposicaoId)
      if (!elegibilidade.elegivel) {
        throw new ValidationError(`Proposição não elegível para pauta: ${elegibilidade.motivo}`)
      }
    }

    // Verificar se pauta esta trancada por veto pendente 30+ dias
    const vetosPendentes = await prisma.proposicao.findMany({
      where: { status: 'VETADA' },
      select: { id: true, updatedAt: true }
    })

    const agora = new Date()
    const vetoTrancante = vetosPendentes.find(v => {
      const dias = Math.floor((agora.getTime() - v.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
      return dias >= 30
    })

    if (vetoTrancante && payload.data.proposicaoId !== vetoTrancante.id) {
      throw new ValidationError('Pauta trancada: existe veto pendente há mais de 30 dias. Apenas o veto pode ser incluído na pauta até sua apreciação.')
    }
  }

  const pautaAtualizada = await pautasDbService.addItem(
    sessaoId,
    payload.data,
    {
      userId: session?.user?.id,
      requestIp: request.headers.get('x-forwarded-for') || undefined,
      skipValidation: isRetroativo
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
