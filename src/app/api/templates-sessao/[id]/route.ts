import { NextRequest } from 'next/server'
import { z } from 'zod'
import { TipoSessao } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { ConflictError, createSuccessResponse, NotFoundError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'

const PAUTA_SECOES = ['EXPEDIENTE', 'ORDEM_DO_DIA', 'COMUNICACOES', 'HONRAS', 'OUTROS'] as const

const TemplateItemSchema = z.object({
  id: z.string().optional(),
  secao: z.enum(PAUTA_SECOES),
  ordem: z.number().int().min(1).optional(),
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  tempoEstimado: z.number().int().min(0).optional(),
  tipoProposicao: z.string().optional(), // Codigo do tipo de proposicao (flexivel)
  obrigatorio: z.boolean().optional()
})

const TemplateUpdateSchema = z.object({
  nome: z.string().min(1).optional(),
  descricao: z.string().nullable().optional(),
  tipo: z.nativeEnum(TipoSessao).optional(),
  ativo: z.boolean().optional(),
  duracaoEstimativa: z.number().int().min(0).nullable().optional(),
  itens: z.array(TemplateItemSchema).min(1).optional()
})

const sortTemplateItens = <T extends { secao: string; ordem: number }>(itens: T[]): T[] => {
  return [...itens].sort((a, b) => {
    const secaoDiff = PAUTA_SECOES.indexOf(a.secao as typeof PAUTA_SECOES[number]) -
      PAUTA_SECOES.indexOf(b.secao as typeof PAUTA_SECOES[number])
    if (secaoDiff !== 0) {
      return secaoDiff
    }
    return a.ordem - b.ordem
  })
}

const getTemplateOrThrow = async (id: string) => {
  const template = await prisma.sessaoTemplate.findUnique({
    where: { id },
    include: {
      itens: {
        orderBy: { ordem: 'asc' }
      }
    }
  })

  if (!template) {
    throw new NotFoundError('Template de sessão')
  }

  return {
    ...template,
    itens: sortTemplateItens(template.itens)
  }
}

export const GET = withAuth(async (
  _request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const template = await getTemplateOrThrow(params.id)
  return createSuccessResponse(template, 'Template encontrado com sucesso')
}, { permissions: 'pauta.manage' })

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const templateId = params.id
  const payload = TemplateUpdateSchema.parse(await request.json())

  const templateAtual = await getTemplateOrThrow(templateId)

  const nomeFinal = payload.nome ?? templateAtual.nome
  const tipoFinal = payload.tipo ?? templateAtual.tipo

  const duplicado = await prisma.sessaoTemplate.findFirst({
    where: {
      id: { not: templateId },
      nome: nomeFinal,
      tipo: tipoFinal
    }
  })

  if (duplicado) {
    throw new ConflictError('Já existe um template com este nome para o tipo selecionado')
  }

  const dataToUpdate: Record<string, any> = {}
  if (payload.nome !== undefined) dataToUpdate.nome = payload.nome
  if (payload.descricao !== undefined) dataToUpdate.descricao = payload.descricao
  if (payload.tipo !== undefined) dataToUpdate.tipo = payload.tipo
  if (payload.ativo !== undefined) dataToUpdate.ativo = payload.ativo
  if (payload.duracaoEstimativa !== undefined) dataToUpdate.duracaoEstimativa = payload.duracaoEstimativa

  if (Object.keys(dataToUpdate).length > 0) {
    await prisma.sessaoTemplate.update({
      where: { id: templateId },
      data: dataToUpdate
    })
  }

  const recrearItens = async (client: any, itens: NonNullable<typeof payload.itens>) => {
    await client.templateItem.deleteMany({ where: { templateId } })

    const ordemPorSecao = new Map<string, number>()

    for (const item of itens) {
      const atual = ordemPorSecao.get(item.secao) ?? 0
      const ordemNormalizada = atual + 1
      ordemPorSecao.set(item.secao, ordemNormalizada)

      await client.templateItem.create({
        data: {
          templateId,
          secao: item.secao,
          ordem: ordemNormalizada,
          titulo: item.titulo,
          descricao: item.descricao ?? null,
          tempoEstimado: item.tempoEstimado ?? null,
          tipoProposicao: item.tipoProposicao ?? null,
          obrigatorio: item.obrigatorio ?? false
        }
      })
    }
  }

  if (payload.itens) {
    const itensOrdenados = sortTemplateItens(
      payload.itens.map((item, index) => ({
        ...item,
        ordem: item.ordem ?? index + 1
      }))
    )

    await prisma.$transaction(async (tx) => {
      await recrearItens(tx, itensOrdenados)
    })
  }

  const templateAtualizado = await getTemplateOrThrow(templateId)

  await logAudit({
    request,
    session,
    action: 'TEMPLATE_SESSAO_UPDATE',
    entity: 'SessaoTemplate',
    entityId: templateId,
    metadata: {
      nome: templateAtualizado.nome,
      tipo: templateAtualizado.tipo,
      itens: templateAtualizado.itens.length
    }
  })

  return createSuccessResponse(templateAtualizado, 'Template atualizado com sucesso')
}, { permissions: 'pauta.manage' })

export const DELETE = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const template = await getTemplateOrThrow(params.id)

  await prisma.sessaoTemplate.delete({ where: { id: params.id } })

  await logAudit({
    request,
    session,
    action: 'TEMPLATE_SESSAO_DELETE',
    entity: 'SessaoTemplate',
    entityId: params.id,
    metadata: {
      nome: template.nome,
      tipo: template.tipo
    }
  })

  return createSuccessResponse(null, 'Template excluído com sucesso')
}, { permissions: 'pauta.manage' })

