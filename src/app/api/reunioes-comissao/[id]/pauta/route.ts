/**
 * API: Pauta de Reunião de Comissão
 * POST - Adiciona item na pauta
 * PUT - Atualiza item ou reordena pauta
 * DELETE - Remove item da pauta
 * SEGURANÇA: Todas as operações requerem permissão comissao.manage
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, ValidationError } from '@/lib/error-handler'
import { ReuniaoComissaoService } from '@/lib/services/reuniao-comissao-service'

export const dynamic = 'force-dynamic'

// Tipos de item de pauta (conforme reuniao-comissao-service.ts)
const TIPOS_ITEM_PAUTA = ['ANALISE_PROPOSICAO', 'VOTACAO_PARECER', 'DESIGNACAO_RELATOR', 'COMUNICACAO', 'OUTROS'] as const
const STATUS_ITEM_PAUTA = ['PENDENTE', 'EM_DISCUSSAO', 'EM_VOTACAO', 'APROVADO', 'REJEITADO', 'ADIADO', 'RETIRADO'] as const

// Schema de validação para adicionar item
const AdicionarItemSchema = z.object({
  titulo: z.string().min(1, 'Título do item é obrigatório'),
  descricao: z.string().optional(),
  tipo: z.enum(TIPOS_ITEM_PAUTA).optional(),
  proposicaoId: z.string().optional(),
  parecerId: z.string().optional(),
  tempoEstimado: z.number().int().min(1).optional()
})

// Schema para reordenação
const ReordenarItemSchema = z.object({
  id: z.string(),
  ordem: z.number().int().min(0)
})

// Schema para atualização ou reordenação
const AtualizarPautaSchema = z.object({
  itemId: z.string().optional(),
  itensOrdenados: z.array(ReordenarItemSchema).optional(),
  titulo: z.string().optional(),
  descricao: z.string().optional(),
  tipo: z.enum(TIPOS_ITEM_PAUTA).optional(),
  status: z.enum(STATUS_ITEM_PAUTA).optional(),
  resultado: z.string().optional(),
  observacoes: z.string().optional(),
  tempoReal: z.number().int().min(0).optional()
})

/**
 * POST - Adicionar item na pauta
 * SEGURANÇA: Requer permissão comissao.manage
 */
export const POST = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: reuniaoId } = await context.params
  const body = await request.json()

  const validation = AdicionarItemSchema.safeParse(body)
  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message)
  }

  const dados = validation.data

  const item = await ReuniaoComissaoService.adicionarItemPauta(reuniaoId, {
    titulo: dados.titulo,
    descricao: dados.descricao,
    tipo: dados.tipo,
    proposicaoId: dados.proposicaoId,
    parecerId: dados.parecerId,
    tempoEstimado: dados.tempoEstimado
  })

  return createSuccessResponse(item, 'Item adicionado à pauta', undefined, 201)
}, { permissions: 'comissao.manage' })

/**
 * PUT - Atualizar item da pauta ou reordenar
 * SEGURANÇA: Requer permissão comissao.manage
 */
export const PUT = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: reuniaoId } = await context.params
  const body = await request.json()

  const validation = AtualizarPautaSchema.safeParse(body)
  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message)
  }

  const dados = validation.data

  // Se for reordenação (array de itens)
  if (dados.itensOrdenados && Array.isArray(dados.itensOrdenados)) {
    await ReuniaoComissaoService.reordenarPauta(reuniaoId, dados.itensOrdenados)
    return createSuccessResponse({ reordered: true }, 'Pauta reordenada com sucesso')
  }

  // Se for atualização de um item específico
  if (!dados.itemId) {
    throw new ValidationError('ID do item é obrigatório para atualização')
  }

  const item = await ReuniaoComissaoService.atualizarItemPauta(dados.itemId, {
    titulo: dados.titulo,
    descricao: dados.descricao,
    tipo: dados.tipo,
    status: dados.status,
    resultado: dados.resultado,
    observacoes: dados.observacoes,
    tempoReal: dados.tempoReal
  })

  return createSuccessResponse(item, 'Item atualizado com sucesso')
}, { permissions: 'comissao.manage' })

/**
 * DELETE - Remover item da pauta
 * SEGURANÇA: Requer permissão comissao.manage
 */
export const DELETE = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { searchParams } = new URL(request.url)
  const itemId = searchParams.get('itemId')

  if (!itemId) {
    throw new ValidationError('ID do item é obrigatório')
  }

  await ReuniaoComissaoService.removerItemPauta(itemId)

  return createSuccessResponse({ deleted: true }, 'Item removido da pauta')
}, { permissions: 'comissao.manage' })
