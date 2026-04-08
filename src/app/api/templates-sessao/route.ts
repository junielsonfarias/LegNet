import { NextRequest } from 'next/server'
import { z } from 'zod'
import { TipoSessao } from '@prisma/client'

import { createSuccessResponse, ConflictError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { templatesSessaoDbService } from '@/lib/services/templates-sessao-db-service'

const TemplateItemSchema = z.object({
  secao: z.string().min(1, 'Seção é obrigatória'),
  ordem: z.number().int().min(1).optional(),
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().nullish().transform(v => v ?? undefined),
  tempoEstimado: z.number().int().min(0).optional(),
  tipoProposicao: z.string().nullish().transform(v => v ?? undefined), // Codigo do tipo de proposicao (flexivel)
  obrigatorio: z.boolean().nullish().transform(v => v ?? undefined)
})

const TemplateCreateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().nullish().transform(v => v ?? undefined),
  tipo: z.nativeEnum(TipoSessao),
  ativo: z.boolean().nullish().transform(v => v ?? undefined),
  duracaoEstimativa: z.number().int().min(0).optional(),
  itens: z.array(TemplateItemSchema).min(1, 'Informe ao menos um item no template')
})

const sortTemplateItens = <T extends { secao: string; ordem: number }>(itens: T[]): T[] => {
  return [...itens].sort((a, b) => {
    if (a.secao !== b.secao) {
      return a.secao.localeCompare(b.secao)
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

  const templates = await templatesSessaoDbService.list({
    tipo: tipo || undefined,
    ativo: ativoParam !== null ? ativoParam === 'true' : undefined,
    includeItems
  })

  const data = includeItems
    ? templates.map(mapTemplateWithItens)
    : templates

  return createSuccessResponse(data, 'Templates listados com sucesso')
}, { permissions: 'pauta.manage' })

export const POST = withAuth(async (request: NextRequest, _ctx, session) => {
  const body = await request.json()
  const payload = TemplateCreateSchema.parse(body)

  const existing = await templatesSessaoDbService.checkDuplicate(payload.nome, payload.tipo)

  if (existing) {
    throw new ConflictError('Já existe um template com este nome para o tipo selecionado')
  }

  const template = await templatesSessaoDbService.create({
    nome: payload.nome,
    descricao: payload.descricao || null,
    tipo: payload.tipo,
    ativo: payload.ativo ?? true,
    duracaoEstimativa: payload.duracaoEstimativa ?? null,
    itens: payload.itens.map((item, index) => ({
      secao: item.secao,
      ordem: item.ordem ?? index + 1,
      titulo: item.titulo,
      descricao: item.descricao || null,
      tempoEstimado: item.tempoEstimado ?? null,
      tipoProposicao: item.tipoProposicao || null,
      obrigatorio: item.obrigatorio ?? false
    }))
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
