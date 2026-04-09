import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, NotFoundError, ValidationError, validateId } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { validarInclusaoOrdemDoDia } from '@/lib/services/proposicao-validacao-service'
import { pautasDbService } from '@/lib/services/pautas-db-service'
import { proposicaoDbService } from '@/lib/services/proposicao-db-service'
import { parlamentarDbService } from '@/lib/services/parlamentar-db-service'
import { pareceresDbService } from '@/lib/services/pareceres-db-service'

const PAUTA_STATUS = ['PENDENTE', 'EM_DISCUSSAO', 'EM_VOTACAO', 'APROVADO', 'REJEITADO', 'RETIRADO', 'ADIADO', 'CONCLUIDO', 'VISTA'] as const
const TIPO_ACAO_PAUTA = ['LEITURA', 'DISCUSSAO', 'VOTACAO', 'LEITURA_VOTACAO', 'DISCUSSAO_VOTACAO', 'COMUNICADO', 'HOMENAGEM', 'LEITURA_ATA', 'LEITURA_OFICIO'] as const

const PautaItemUpdateSchema = z.object({
  secao: z.string().min(1).nullish().transform(v => v ?? undefined),
  titulo: z.string().min(1).nullish().transform(v => v ?? undefined),
  descricao: z.string().nullish().transform(v => v ?? undefined),
  proposicaoId: z.string().nullable().optional(),
  tempoEstimado: z.number().min(0).nullable().optional(),
  tempoReal: z.number().min(0).nullable().optional(),
  status: z.enum(PAUTA_STATUS).nullish().transform(v => v ?? undefined),
  autor: z.string().nullish().transform(v => v ?? undefined),
  observacoes: z.string().nullish().transform(v => v ?? undefined),
  ordem: z.number().int().min(1).optional(),
  tipoAcao: z.enum(TIPO_ACAO_PAUTA).nullish().transform(v => v ?? undefined),
  tipoVotacao: z.enum(['NOMINAL', 'SECRETA', 'SIMBOLICA', 'LEITURA'] as const).nullish().transform(v => v ?? undefined),
  sessaoAtaOrigemId: z.string().nullable().optional(),
  oficioId: z.string().nullable().optional(),
  // === NOVOS CAMPOS DE ETAPA E LEITURA ===
  etapa: z.number().int().min(1).max(2).nullable().optional(), // 1 = 1ª Ordem do Dia, 2 = 2ª Ordem do Dia
  parecerId: z.string().nullable().optional(),
  leituraNumero: z.number().int().min(1).max(3).nullable().optional(), // 1ª, 2ª ou 3ª leitura
  relatorId: z.string().nullable().optional()
})

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
  session
) => {
  const { itemId } = await params
  const validatedItemId = validateId(itemId, 'Item da pauta')
  const existingItem = await pautasDbService.getItem(validatedItemId)
  if (!existingItem) {
    throw new NotFoundError('Item da pauta')
  }

  const body = await request.json()
  const payload = PautaItemUpdateSchema.safeParse({
    ...body,
    tempoEstimado: body.tempoEstimado !== undefined ? Number(body.tempoEstimado) : undefined,
    tempoReal: body.tempoReal !== undefined ? Number(body.tempoReal) : undefined
  })

  if (!payload.success) {
    throw new ValidationError(payload.error.issues[0]?.message ?? 'Dados inválidos')
  }

  const data = payload.data
  const updateData: Record<string, unknown> = {}

  // Determinar seção e tipoAcao finais para validações
  const secaoFinal = data.secao || existingItem.secao
  const tipoAcaoFinal = data.tipoAcao || existingItem.tipoAcao

  // RN-060: Campo etapa só é válido para seção ORDEM_DO_DIA
  if (data.etapa !== undefined && data.etapa !== null) {
    if (secaoFinal !== 'ORDEM_DO_DIA') {
      throw new ValidationError('RN-060: Campo etapa só é válido para seção ORDEM_DO_DIA')
    }
    // RN-061/RN-062: Consistência entre etapa e tipoAcao
    if (data.etapa === 1 && tipoAcaoFinal === 'VOTACAO') {
      throw new ValidationError('RN-061: Etapa 1 (1ª Ordem do Dia) não permite tipoAcao VOTACAO')
    }
    if (data.etapa === 2 && tipoAcaoFinal === 'LEITURA') {
      throw new ValidationError('RN-062: Etapa 2 (2ª Ordem do Dia) não permite tipoAcao LEITURA')
    }
  }

  // Validar parecerId existe
  if (data.parecerId) {
    const parecer = await pareceresDbService.getById(data.parecerId)
    if (!parecer) {
      throw new ValidationError('Parecer não encontrado')
    }
  }

  // RN-065: Validar relatorId com mandato ativo
  if (data.relatorId) {
    const relator = await parlamentarDbService.getById(data.relatorId)
    if (!relator) {
      throw new ValidationError('Relator não encontrado')
    }
    if (!relator.mandatos || relator.mandatos.length === 0 || !relator.mandatos.some((m: any) => m.ativo)) {
      throw new ValidationError('RN-065: Relator deve ter mandato ativo')
    }
  }

  // RN-030: Validar parecer CLJ antes de mover para ORDEM_DO_DIA
  if (data.secao === 'ORDEM_DO_DIA' && existingItem.secao !== 'ORDEM_DO_DIA') {
    const tipoAcao = data.tipoAcao || existingItem.tipoAcao
    // Validar apenas para ações que envolvem votação ou discussão
    if (existingItem.proposicaoId && (tipoAcao === 'VOTACAO' || tipoAcao === 'DISCUSSAO')) {
      const validacao = await validarInclusaoOrdemDoDia(existingItem.proposicaoId)
      if (!validacao.valid) {
        throw new ValidationError('RN-030: ' + validacao.errors.join('; '))
      }
    }
  }

  if (data.titulo !== undefined) updateData.titulo = data.titulo
  if (data.descricao !== undefined) updateData.descricao = data.descricao ?? null
  if (data.proposicaoId !== undefined) updateData.proposicaoId = data.proposicaoId ?? null
  if (data.tempoEstimado !== undefined) updateData.tempoEstimado = data.tempoEstimado ?? null
  if (data.tempoReal !== undefined) updateData.tempoReal = data.tempoReal ?? null
  if (data.status !== undefined) updateData.status = data.status
  if (data.autor !== undefined) updateData.autor = data.autor ?? null
  if (data.observacoes !== undefined) updateData.observacoes = data.observacoes ?? null
  if (data.tipoAcao !== undefined) updateData.tipoAcao = data.tipoAcao
  if (data.tipoVotacao !== undefined) updateData.tipoVotacao = data.tipoVotacao
  if (data.sessaoAtaOrigemId !== undefined) updateData.sessaoAtaOrigemId = data.sessaoAtaOrigemId
  if (data.oficioId !== undefined) updateData.oficioId = data.oficioId
  if (data.etapa !== undefined) updateData.etapa = data.etapa
  if (data.parecerId !== undefined) updateData.parecerId = data.parecerId
  if (data.leituraNumero !== undefined) updateData.leituraNumero = data.leituraNumero
  if (data.relatorId !== undefined) updateData.relatorId = data.relatorId

  let novaSecao = existingItem.secao

  if (data.secao && data.secao !== existingItem.secao) {
    novaSecao = data.secao
    updateData.secao = data.secao
  }

  if (data.ordem !== undefined) {
    updateData.ordem = data.ordem
  }

  const itemAtualizado = await pautasDbService.updateItem(validatedItemId, updateData)

  if (data.secao && data.secao !== existingItem.secao) {
    await pautasDbService.reorderItensInSection(existingItem.pautaId, existingItem.secao)
  }

  if (data.ordem !== undefined || data.secao) {
    await pautasDbService.reorderItensInSection(itemAtualizado.pautaId, novaSecao)
  }

  await pautasDbService.recalcTempoTotal(itemAtualizado.pautaId)

  const itemCompleto = await pautasDbService.getItem(validatedItemId)

  await logAudit({
    request,
    session,
    action: 'PAUTA_ITEM_UPDATE',
    entity: 'PautaItem',
    entityId: validatedItemId,
    metadata: {
      pautaId: itemAtualizado.pautaId,
      antigaSecao: existingItem.secao,
      novaSecao,
      titulo: itemAtualizado.titulo
    }
  })

  return createSuccessResponse(itemCompleto, 'Item da pauta atualizado com sucesso')
}, { permissions: 'pauta.manage' })

export const DELETE = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
  session
) => {
  const { itemId } = await params
  const validatedItemId = validateId(itemId, 'Item da pauta')
  const existingItem = await pautasDbService.getItem(validatedItemId)
  if (!existingItem) {
    throw new NotFoundError('Item da pauta')
  }

  // Reverter status da proposição vinculada (EM_PAUTA → AGUARDANDO_PAUTA)
  if (existingItem.proposicaoId) {
    await proposicaoDbService.revertStatusPauta([existingItem.proposicaoId])
  }

  await pautasDbService.deleteItem(validatedItemId)

  await pautasDbService.reorderItensInSection(existingItem.pautaId, existingItem.secao)
  await pautasDbService.recalcTempoTotal(existingItem.pautaId)

  await logAudit({
    request,
    session,
    action: 'PAUTA_ITEM_DELETE',
    entity: 'PautaItem',
    entityId: validatedItemId,
    metadata: {
      pautaId: existingItem.pautaId,
      secao: existingItem.secao,
      titulo: existingItem.titulo
    }
  })

  const pautaAtualizada = await pautasDbService.loadPautaById(existingItem.pautaId)

  return createSuccessResponse(
    pautaAtualizada,
    'Item da pauta removido com sucesso'
  )
}, { permissions: 'pauta.manage' })
