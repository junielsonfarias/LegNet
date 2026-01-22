import { NextRequest } from 'next/server'
import { z } from 'zod'
import { PautaSecao } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, NotFoundError, ValidationError, validateId } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'

const PAUTA_SECAO_ORDER = ['EXPEDIENTE', 'ORDEM_DO_DIA', 'COMUNICACOES', 'HONRAS', 'OUTROS'] as const
const PAUTA_STATUS = ['PENDENTE', 'EM_DISCUSSAO', 'APROVADO', 'REJEITADO', 'RETIRADO', 'ADIADO'] as const
const TIPO_ACAO_PAUTA = ['LEITURA', 'DISCUSSAO', 'VOTACAO', 'COMUNICADO', 'HOMENAGEM'] as const

const PautaItemUpdateSchema = z.object({
  secao: z.enum(PAUTA_SECAO_ORDER).optional(),
  titulo: z.string().min(1).optional(),
  descricao: z.string().optional(),
  proposicaoId: z.string().nullable().optional(),
  tempoEstimado: z.number().min(0).nullable().optional(),
  tempoReal: z.number().min(0).nullable().optional(),
  status: z.enum(PAUTA_STATUS).optional(),
  autor: z.string().optional(),
  observacoes: z.string().optional(),
  ordem: z.number().int().min(1).optional(),
  tipoAcao: z.enum(TIPO_ACAO_PAUTA).optional() // Tipo de ação: LEITURA, VOTACAO, etc.
})

const sortItens = <T extends { secao: string; ordem: number }>(itens: T[]) => {
  return [...itens].sort((a, b) => {
    const secaoDiff = PAUTA_SECAO_ORDER.indexOf(a.secao as typeof PAUTA_SECAO_ORDER[number]) -
      PAUTA_SECAO_ORDER.indexOf(b.secao as typeof PAUTA_SECAO_ORDER[number])
    if (secaoDiff !== 0) {
      return secaoDiff
    }
    return a.ordem - b.ordem
  })
}

const recalcTempoTotal = async (pautaId: string) => {
  const itens = await prisma.pautaItem.findMany({ where: { pautaId } })
  const tempoTotal = itens.reduce((total, item) => total + (item.tempoEstimado || 0), 0)
  await prisma.pautaSessao.update({
    where: { id: pautaId },
    data: {
      tempoTotalEstimado: tempoTotal,
      geradaAutomaticamente: false
    }
  })
}

const reorderItensInSection = async (pautaId: string, secao: PautaSecao) => {
  const itens = await prisma.pautaItem.findMany({
    where: {
      pautaId,
      secao
    },
    orderBy: {
      ordem: 'asc'
    }
  })

  await Promise.all(
    itens.map((item, index) => {
      const novaOrdem = index + 1
      if (item.ordem === novaOrdem) {
        return null
      }
      return prisma.pautaItem.update({
        where: { id: item.id },
        data: { ordem: novaOrdem }
      })
    }).filter(Boolean)
  )
}

const loadPautaSessao = async (pautaId: string) => {
  const pauta = await prisma.pautaSessao.findUnique({
    where: { id: pautaId },
    include: {
      itens: {
        include: {
          proposicao: {
            select: {
              id: true,
              numero: true,
              ano: true,
              titulo: true,
              tipo: true,
              status: true
            }
          }
        }
      }
    }
  })

  if (!pauta) {
    return null
  }

  return {
    ...pauta,
    itens: sortItens(pauta.itens)
  }
}

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: { itemId: string } },
  session
) => {
  const itemId = validateId(params.itemId, 'Item da pauta')
  const existingItem = await prisma.pautaItem.findUnique({ where: { id: itemId } })
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

  if (data.titulo !== undefined) updateData.titulo = data.titulo
  if (data.descricao !== undefined) updateData.descricao = data.descricao ?? null
  if (data.proposicaoId !== undefined) updateData.proposicaoId = data.proposicaoId ?? null
  if (data.tempoEstimado !== undefined) updateData.tempoEstimado = data.tempoEstimado ?? null
  if (data.tempoReal !== undefined) updateData.tempoReal = data.tempoReal ?? null
  if (data.status !== undefined) updateData.status = data.status
  if (data.autor !== undefined) updateData.autor = data.autor ?? null
  if (data.observacoes !== undefined) updateData.observacoes = data.observacoes ?? null
  if (data.tipoAcao !== undefined) updateData.tipoAcao = data.tipoAcao

  let novaSecao = existingItem.secao

  if (data.secao && data.secao !== existingItem.secao) {
    novaSecao = data.secao
    updateData.secao = data.secao
  }

  if (data.ordem !== undefined) {
    updateData.ordem = data.ordem
  }

  const itemAtualizado = await prisma.pautaItem.update({
    where: { id: itemId },
    data: updateData
  })

  if (data.secao && data.secao !== existingItem.secao) {
    await reorderItensInSection(existingItem.pautaId, existingItem.secao)
  }

  if (data.ordem !== undefined || data.secao) {
    await reorderItensInSection(itemAtualizado.pautaId, novaSecao)
  }

  await recalcTempoTotal(itemAtualizado.pautaId)

  const itemCompleto = await prisma.pautaItem.findUnique({
    where: { id: itemId },
    include: {
      proposicao: {
        select: {
          id: true,
          numero: true,
          ano: true,
          titulo: true,
          tipo: true,
          status: true
        }
      }
    }
  })

  await logAudit({
    request,
    session,
    action: 'PAUTA_ITEM_UPDATE',
    entity: 'PautaItem',
    entityId: itemId,
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
  { params }: { params: { itemId: string } },
  session
) => {
  const itemId = validateId(params.itemId, 'Item da pauta')
  const existingItem = await prisma.pautaItem.findUnique({ where: { id: itemId } })
  if (!existingItem) {
    throw new NotFoundError('Item da pauta')
  }

  await prisma.pautaItem.delete({ where: { id: itemId } })

  await reorderItensInSection(existingItem.pautaId, existingItem.secao)
  await recalcTempoTotal(existingItem.pautaId)

  await logAudit({
    request,
    session,
    action: 'PAUTA_ITEM_DELETE',
    entity: 'PautaItem',
    entityId: itemId,
    metadata: {
      pautaId: existingItem.pautaId,
      secao: existingItem.secao,
      titulo: existingItem.titulo
    }
  })

  const pautaAtualizada = await loadPautaSessao(existingItem.pautaId)

  return createSuccessResponse(
    pautaAtualizada,
    'Item da pauta removido com sucesso'
  )
}, { permissions: 'pauta.manage' })