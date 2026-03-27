import { NextRequest } from 'next/server'
import { z } from 'zod'
import { TipoSessao } from '@prisma/client'
import { ConflictError, createSuccessResponse, NotFoundError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { templatesSessaoDbService } from '@/lib/services/templates-sessao-db-service'

const PAUTA_SECOES = ['EXPEDIENTE', 'ORDEM_DO_DIA', 'COMUNICACOES', 'HONRAS', 'OUTROS'] as const

const TemplateItemSchema = z.object({
  id: z.string().optional(),
  secao: z.enum(PAUTA_SECOES),
  ordem: z.number().int().min(1).optional(),
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  tempoEstimado: z.number().int().min(0).optional(),
  tipoProposicao: z.string().optional(),
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
    return secaoDiff !== 0 ? secaoDiff : a.ordem - b.ordem
  })
}

export const GET = withAuth(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const template = await templatesSessaoDbService.getById(id)
  if (!template) throw new NotFoundError('Template de sessão')

  return createSuccessResponse(
    { ...template, itens: sortTemplateItens(template.itens) },
    'Template encontrado com sucesso'
  )
}, { permissions: 'pauta.manage' })

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  session
) => {
  const { id: templateId } = await params
  const payload = TemplateUpdateSchema.parse(await request.json())

  const templateAtual = await templatesSessaoDbService.getById(templateId)
  if (!templateAtual) throw new NotFoundError('Template de sessão')

  const nomeFinal = payload.nome ?? templateAtual.nome
  const tipoFinal = payload.tipo ?? templateAtual.tipo

  const duplicado = await templatesSessaoDbService.checkDuplicate(nomeFinal, tipoFinal, templateId)
  if (duplicado) throw new ConflictError('Já existe um template com este nome para o tipo selecionado')

  const updatePayload: any = {}
  if (payload.nome !== undefined) updatePayload.nome = payload.nome
  if (payload.descricao !== undefined) updatePayload.descricao = payload.descricao
  if (payload.tipo !== undefined) updatePayload.tipo = payload.tipo
  if (payload.ativo !== undefined) updatePayload.ativo = payload.ativo
  if (payload.duracaoEstimativa !== undefined) updatePayload.duracaoEstimativa = payload.duracaoEstimativa

  if (payload.itens) {
    updatePayload.itens = sortTemplateItens(
      payload.itens.map((item, index) => ({ ...item, ordem: item.ordem ?? index + 1 }))
    )
  }

  const templateAtualizado = await templatesSessaoDbService.update(templateId, updatePayload)

  await logAudit({
    request, session,
    action: 'TEMPLATE_SESSAO_UPDATE',
    entity: 'SessaoTemplate',
    entityId: templateId,
    metadata: { nome: templateAtualizado.nome, tipo: templateAtualizado.tipo, itens: templateAtualizado.itens.length }
  })

  return createSuccessResponse(
    { ...templateAtualizado, itens: sortTemplateItens(templateAtualizado.itens) },
    'Template atualizado com sucesso'
  )
}, { permissions: 'pauta.manage' })

export const DELETE = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  session
) => {
  const { id } = await params
  const template = await templatesSessaoDbService.getById(id)
  if (!template) throw new NotFoundError('Template de sessão')

  await templatesSessaoDbService.remove(id)

  await logAudit({
    request, session,
    action: 'TEMPLATE_SESSAO_DELETE',
    entity: 'SessaoTemplate',
    entityId: id,
    metadata: { nome: template.nome, tipo: template.tipo }
  })

  return createSuccessResponse(null, 'Template excluído com sucesso')
}, { permissions: 'pauta.manage' })
