import { NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { createSuccessResponse, NotFoundError, ValidationError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'

const PAUTA_SECOES = ['EXPEDIENTE', 'ORDEM_DO_DIA', 'COMUNICACOES', 'HONRAS', 'OUTROS'] as const

const sortPautaItens = <T extends { secao: string; ordem: number }>(itens: T[]): T[] => {
  return [...itens].sort((a, b) => {
    const secaoDiff = PAUTA_SECOES.indexOf(a.secao as typeof PAUTA_SECOES[number]) -
      PAUTA_SECOES.indexOf(b.secao as typeof PAUTA_SECOES[number])
    if (secaoDiff !== 0) {
      return secaoDiff
    }
    return a.ordem - b.ordem
  })
}

const TemplateApplySchema = z.object({
  templateId: z.string().min(1, 'Template é obrigatório'),
  mode: z.enum(['REPLACE', 'APPEND']).default('REPLACE')
})

const ensureSessaoExists = async (sessaoId: string) => {
  const sessao = await prisma.sessao.findUnique({ where: { id: sessaoId } })
  if (!sessao) {
    throw new NotFoundError('Sessão')
  }
  return sessao
}

const ensureTemplateExists = async (templateId: string) => {
  const template = await prisma.sessaoTemplate.findUnique({
    where: { id: templateId },
    include: {
      itens: {
        orderBy: { ordem: 'asc' }
      }
    }
  })

  if (!template || template.itens.length === 0) {
    throw new NotFoundError('Template de sessão')
  }

  return template
}

const ensurePautaSessao = async (sessaoId: string) => {
  const pautaExistente = await prisma.pautaSessao.findUnique({
    where: { sessaoId }
  })

  if (pautaExistente) {
    return pautaExistente
  }

  return prisma.pautaSessao.create({
    data: {
      sessaoId,
      status: 'RASCUNHO',
      geradaAutomaticamente: false,
      tempoTotalEstimado: 0
    }
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

export const POST = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const sessaoId = params.id
  const { templateId, mode } = TemplateApplySchema.parse(await request.json())

  await ensureSessaoExists(sessaoId)
  const template = await ensureTemplateExists(templateId)
  const pauta = await ensurePautaSessao(sessaoId)

  if (mode === 'REPLACE') {
    await prisma.pautaItem.deleteMany({ where: { pautaId: pauta.id } })
  }

  const existentes = mode === 'APPEND'
    ? await prisma.pautaItem.findMany({
        where: { pautaId: pauta.id }
      })
    : []

  const ordemPorSecao = new Map<string, number>()
  existentes.forEach(item => {
    const valorAtual = ordemPorSecao.get(item.secao) ?? 0
    ordemPorSecao.set(item.secao, Math.max(valorAtual, item.ordem))
  })

  for (const item of sortPautaItens(template.itens)) {
    const atual = ordemPorSecao.get(item.secao) ?? 0
    const novaOrdem = mode === 'APPEND'
      ? atual + 1
      : (item.ordem ?? atual + 1)
    ordemPorSecao.set(item.secao, novaOrdem)

    await prisma.pautaItem.create({
      data: {
        pautaId: pauta.id,
        secao: item.secao,
        ordem: novaOrdem,
        titulo: item.titulo,
        descricao: item.descricao ?? null,
        tempoEstimado: item.tempoEstimado ?? null,
        status: 'PENDENTE',
        autor: null,
        proposicaoId: null,
        observacoes: null
      }
    })
  }

  await recalcTempoTotal(pauta.id)

  const pautaAtualizada = await prisma.pautaSessao.findUnique({
    where: { id: pauta.id },
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

  if (!pautaAtualizada) {
    throw new ValidationError('Não foi possível carregar a pauta após aplicar o template')
  }

  await logAudit({
    request,
    session,
    action: 'PAUTA_APPLY_TEMPLATE',
    entity: 'Sessao',
    entityId: sessaoId,
    metadata: {
      templateId,
      modo: mode,
      itensAdicionados: template.itens.length
    }
  })

  return createSuccessResponse({
    ...pautaAtualizada,
    itens: sortPautaItens(pautaAtualizada.itens)
  }, 'Template aplicado à pauta com sucesso')
}, { permissions: 'pauta.manage' })

