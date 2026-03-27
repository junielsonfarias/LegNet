import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, NotFoundError, ValidationError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { pautasDbService } from '@/lib/services/pautas-db-service'
import { proposicaoDbService } from '@/lib/services/proposicao-db-service'

export const dynamic = 'force-dynamic'

const PautaUpdateSchema = z.object({
  observacoes: z.string().optional(),
  status: z.enum(['RASCUNHO', 'APROVADA']).optional()
})

export const GET = withAuth(withErrorHandler(async (request: NextRequest, context) => {
  const { id: pautaId } = context.params as { id: string }

  const pauta = await pautasDbService.getById(pautaId)
  if (!pauta) throw new NotFoundError('Pauta')

  const stats = {
    totalItens: pauta.itens.length,
    itensPendentes: pauta.itens.filter((i: any) => i.status === 'PENDENTE').length,
    itensAprovados: pauta.itens.filter((i: any) => i.status === 'APROVADO').length,
    itensRejeitados: pauta.itens.filter((i: any) => i.status === 'REJEITADO').length,
    itensEmAndamento: pauta.itens.filter((i: any) => ['EM_DISCUSSAO', 'EM_VOTACAO'].includes(i.status)).length
  }

  return createSuccessResponse({ ...pauta, stats })
}), { permissions: 'pauta.view' })

export const PATCH = withAuth(withErrorHandler(async (request: NextRequest, context, session) => {
  const { id: pautaId } = context.params as { id: string }
  const body = await request.json()
  const payload = PautaUpdateSchema.parse(body)

  const pauta = await pautasDbService.getById(pautaId)
  if (!pauta) throw new NotFoundError('Pauta')

  if (payload.status) {
    if (['EM_ANDAMENTO', 'CONCLUIDA'].includes(pauta.status)) {
      throw new ValidationError(`Pauta com status "${pauta.status}" não pode ser alterada manualmente.`)
    }

    if (pauta.status === 'APROVADA' && payload.status === 'RASCUNHO') {
      const dataSessao = new Date(pauta.sessao.data)
      const horasAteASessao = (dataSessao.getTime() - Date.now()) / (60 * 60 * 1000)
      if (horasAteASessao < 48) {
        throw new ValidationError('RN-125: Não é possível despublicar a pauta com menos de 48h da sessão.')
      }
    }
  }

  const pautaAtualizada = await pautasDbService.update(pautaId, {
    ...(payload.observacoes !== undefined && { observacoes: payload.observacoes }),
    ...(payload.status && { status: payload.status })
  })

  await logAudit({
    request, session,
    action: 'PAUTA_UPDATE',
    entity: 'PautaSessao',
    entityId: pautaId,
    metadata: {
      sessaoId: pauta.sessaoId,
      statusAnterior: pauta.status,
      statusNovo: payload.status || pauta.status,
      alteracoes: payload
    }
  })

  return createSuccessResponse(pautaAtualizada, 'Pauta atualizada com sucesso')
}), { permissions: 'pauta.manage' })

export const DELETE = withAuth(withErrorHandler(async (request: NextRequest, context, session) => {
  const { id: pautaId } = context.params as { id: string }

  const pauta = await pautasDbService.getById(pautaId)
  if (!pauta) throw new NotFoundError('Pauta')

  if (pauta.status !== 'RASCUNHO') {
    throw new ValidationError(`Pauta com status "${pauta.status}" não pode ser excluída. Apenas pautas em RASCUNHO podem ser removidas.`)
  }

  // Reverter status das proposições
  const proposicoesIds = pauta.itens
    .map((i: any) => i.proposicaoId)
    .filter((id: any): id is string => id !== null && id !== undefined)

  if (proposicoesIds.length > 0) {
    await proposicaoDbService.revertStatusPauta(proposicoesIds)
  }

  await pautasDbService.remove(pautaId)

  await logAudit({
    request, session,
    action: 'PAUTA_DELETE',
    entity: 'PautaSessao',
    entityId: pautaId,
    metadata: {
      sessaoId: pauta.sessaoId,
      totalItensRemovidos: pauta.itens.length,
      proposicoesRevertidas: proposicoesIds
    }
  })

  return createSuccessResponse(null, 'Pauta excluída com sucesso')
}), { permissions: 'pauta.manage' })
