import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, NotFoundError, ValidationError, validateId } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { gerarPautaAutomatica } from '@/lib/utils/sessoes-utils'

const PAUTA_SECAO_ORDER = ['EXPEDIENTE', 'ORDEM_DO_DIA', 'COMUNICACOES', 'HONRAS', 'OUTROS'] as const

const PautaItemCreateSchema = z.object({
  secao: z.enum(PAUTA_SECAO_ORDER),
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  proposicaoId: z.string().optional(),
  tempoEstimado: z.number().min(0).optional(),
  autor: z.string().optional(),
  observacoes: z.string().optional()
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

const loadPautaCompleta = async (sessaoId: string) => {
  const pauta = await prisma.pautaSessao.findUnique({
    where: { sessaoId },
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

const ensurePautaSessao = async (sessaoId: string) => {
  const existente = await loadPautaCompleta(sessaoId)
  if (existente) {
    return existente
  }

  const sessao = await prisma.sessao.findUnique({ where: { id: sessaoId } })
  if (!sessao) {
    throw new NotFoundError('Sessão')
  }

  const pautaPadrao = await gerarPautaAutomatica(sessao.numero, new Date(sessao.data), sessao.horario ?? undefined)
  const tempoTotal = pautaPadrao.itens.reduce((total, item) => total + (item.tempoEstimado || 0), 0)

  await prisma.pautaSessao.create({
    data: {
      sessaoId,
      status: 'RASCUNHO',
      geradaAutomaticamente: true,
      observacoes: pautaPadrao.observacoes,
      tempoTotalEstimado: tempoTotal,
      itens: {
        create: pautaPadrao.itens.map(item => ({
          secao: item.secao,
          ordem: item.ordem,
          titulo: item.titulo,
          descricao: item.descricao ?? null,
          tempoEstimado: item.tempoEstimado ?? null,
          status: 'PENDENTE'
        }))
      }
    }
  })

  return await loadPautaCompleta(sessaoId)
}

const recalcTempoTotal = async (pautaId: string) => {
  const itens = await prisma.pautaItem.findMany({
    where: { pautaId }
  })
  const tempoTotal = itens.reduce((total, item) => total + (item.tempoEstimado || 0), 0)
  await prisma.pautaSessao.update({
    where: { id: pautaId },
    data: {
      tempoTotalEstimado: tempoTotal,
      geradaAutomaticamente: false
    }
  })
}

export const GET = withAuth(async (
  _request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const sessaoId = validateId(params.id, 'Sessão')

  const pauta = await ensurePautaSessao(sessaoId)
  if (!pauta) {
    throw new NotFoundError('Pauta da sessão')
  }

  return createSuccessResponse(pauta, 'Pauta carregada com sucesso')
}, { permissions: 'sessao.view' })

export const POST = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const sessaoId = validateId(params.id, 'Sessão')
  const body = await request.json()

  const payload = PautaItemCreateSchema.safeParse({
    ...body,
    tempoEstimado: body.tempoEstimado !== undefined ? Number(body.tempoEstimado) : undefined
  })

  if (!payload.success) {
    throw new ValidationError(payload.error.issues[0]?.message ?? 'Dados inválidos')
  }

  const sessao = await prisma.sessao.findUnique({ where: { id: sessaoId } })
  if (!sessao) {
    throw new NotFoundError('Sessão')
  }

  const pautaSessao = await ensurePautaSessao(sessaoId)
  if (!pautaSessao) {
    throw new NotFoundError('Pauta da sessão')
  }

  const maiorOrdem = await prisma.pautaItem.findFirst({
    where: {
      pautaId: pautaSessao.id,
      secao: payload.data.secao
    },
    orderBy: {
      ordem: 'desc'
    }
  })

  await prisma.pautaItem.create({
    data: {
      pautaId: pautaSessao.id,
      secao: payload.data.secao,
      ordem: maiorOrdem ? maiorOrdem.ordem + 1 : 1,
      titulo: payload.data.titulo,
      descricao: payload.data.descricao ?? null,
      proposicaoId: payload.data.proposicaoId ?? null,
      tempoEstimado: payload.data.tempoEstimado ?? null,
      status: 'PENDENTE',
      autor: payload.data.autor ?? null,
      observacoes: payload.data.observacoes ?? null
    }
  })

  await recalcTempoTotal(pautaSessao.id)

  const pautaAtualizada = await loadPautaCompleta(sessaoId)
  if (!pautaAtualizada) {
    throw new NotFoundError('Pauta da sessão')
  }

  await logAudit({
    request,
    session,
    action: 'PAUTA_ITEM_CREATE',
    entity: 'PautaSessao',
    entityId: pautaSessao.id,
    metadata: {
      sessaoId,
      secao: payload.data.secao,
      titulo: payload.data.titulo
    }
  })

  return createSuccessResponse(
    pautaAtualizada,
    'Item adicionado à pauta com sucesso'
  )
}, { permissions: 'pauta.manage' })