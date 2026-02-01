import { NextRequest } from 'next/server'
import { z } from 'zod'
import { TipoSessao } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { createSuccessResponse, ConflictError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'

const PAUTA_SECOES = ['EXPEDIENTE', 'ORDEM_DO_DIA', 'COMUNICACOES', 'HONRAS', 'OUTROS'] as const

const TemplateItemSchema = z.object({
  secao: z.enum(PAUTA_SECOES),
  ordem: z.number().int().min(1).optional(),
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  tempoEstimado: z.number().int().min(0).optional(),
  tipoProposicao: z.string().optional(), // Codigo do tipo de proposicao (flexivel)
  obrigatorio: z.boolean().optional()
})

const TemplateCreateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  tipo: z.nativeEnum(TipoSessao),
  ativo: z.boolean().optional(),
  duracaoEstimativa: z.number().int().min(0).optional(),
  itens: z.array(TemplateItemSchema).min(1, 'Informe ao menos um item no template')
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

const mapTemplateWithItens = (template: any) => ({
  ...template,
  itens: template.itens ? sortTemplateItens(template.itens) : []
})

export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get('tipo') as TipoSessao | null
  const ativoParam = searchParams.get('ativo')
  const includeItems = searchParams.get('includeItems') === 'true'

  const where: Record<string, any> = {}
  if (tipo) {
    where.tipo = tipo
  }
  if (ativoParam !== null) {
    where.ativo = ativoParam === 'true'
  }

  const templates = await prisma.sessaoTemplate.findMany({
    where,
    orderBy: { nome: 'asc' },
    include: includeItems
      ? {
          itens: {
            orderBy: { ordem: 'asc' }
          }
        }
      : undefined
  })

  const data = includeItems
    ? templates.map(mapTemplateWithItens)
    : templates

  return createSuccessResponse(data, 'Templates listados com sucesso')
}, { permissions: 'pauta.manage' })

export const POST = withAuth(async (request: NextRequest, _ctx, session) => {
  const body = await request.json()
  const payload = TemplateCreateSchema.parse(body)

  const existing = await prisma.sessaoTemplate.findFirst({
    where: {
      nome: payload.nome,
      tipo: payload.tipo
    }
  })

  if (existing) {
    throw new ConflictError('Já existe um template com este nome para o tipo selecionado')
  }

  const template = await prisma.sessaoTemplate.create({
    data: {
      nome: payload.nome,
      descricao: payload.descricao || null,
      tipo: payload.tipo,
      ativo: payload.ativo ?? true,
      duracaoEstimativa: payload.duracaoEstimativa ?? null,
      itens: {
        create: payload.itens.map((item, index) => ({
          secao: item.secao,
          ordem: item.ordem ?? index + 1,
          titulo: item.titulo,
          descricao: item.descricao || null,
          tempoEstimado: item.tempoEstimado ?? null,
          tipoProposicao: item.tipoProposicao || null,
          obrigatorio: item.obrigatorio ?? false
        }))
      }
    },
    include: {
      itens: {
        orderBy: { ordem: 'asc' }
      }
    }
  })

  await logAudit({
    request,
    session,
    action: 'TEMPLATE_SESSAO_CREATE',
    entity: 'SessaoTemplate',
    entityId: template.id,
    metadata: {
      nome: template.nome,
      tipo: template.tipo,
      itens: template.itens.length
    }
  })

  return createSuccessResponse(mapTemplateWithItens(template), 'Template criado com sucesso', undefined, 201)
}, { permissions: 'pauta.manage' })

