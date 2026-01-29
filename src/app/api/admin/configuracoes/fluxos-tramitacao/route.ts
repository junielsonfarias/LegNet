import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, ValidationError, NotFoundError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import {
  listarFluxos,
  getFluxoByTipoProposicao,
  atualizarFluxo,
  criarFluxosPadrao
} from '@/lib/services/fluxo-tramitacao-service'
import { prisma } from '@/lib/prisma'

const TipoProposicaoEnum = z.enum([
  'PROJETO_LEI',
  'PROJETO_RESOLUCAO',
  'PROJETO_DECRETO',
  'INDICACAO',
  'REQUERIMENTO',
  'MOCAO',
  'VOTO_PESAR',
  'VOTO_APLAUSO'
])

const FluxoCreateSchema = z.object({
  tipoProposicao: TipoProposicaoEnum,
  nome: z.string().min(1, 'Nome e obrigatorio'),
  descricao: z.string().optional(),
  ativo: z.boolean().optional().default(true)
})

const FluxoUpdateSchema = z.object({
  id: z.string(),
  nome: z.string().min(1).optional(),
  descricao: z.string().optional(),
  ativo: z.boolean().optional()
})

/**
 * GET /api/admin/configuracoes/fluxos-tramitacao
 * Lista todos os fluxos de tramitacao ou busca por tipo de proposicao
 */
export const GET = withAuth(async (
  request: NextRequest
) => {
  const { searchParams } = new URL(request.url)
  const tipoProposicao = searchParams.get('tipoProposicao')

  if (tipoProposicao) {
    const parseResult = TipoProposicaoEnum.safeParse(tipoProposicao)
    if (!parseResult.success) {
      throw new ValidationError('Tipo de proposicao invalido')
    }

    const fluxo = await getFluxoByTipoProposicao(parseResult.data)
    if (!fluxo) {
      throw new NotFoundError('Fluxo nao encontrado para este tipo de proposicao')
    }

    return createSuccessResponse(fluxo, 'Fluxo carregado com sucesso')
  }

  const fluxos = await listarFluxos()
  return createSuccessResponse(fluxos, 'Fluxos carregados com sucesso')
}, { permissions: 'config.view' })

/**
 * POST /api/admin/configuracoes/fluxos-tramitacao
 * Cria um novo fluxo de tramitacao
 */
export const POST = withAuth(async (
  request: NextRequest,
  _context,
  session
) => {
  const body = await request.json()

  // Verifica se e uma solicitacao para criar fluxos padrao
  if (body.criarPadrao === true) {
    await criarFluxosPadrao()

    await logAudit({
      request,
      session,
      action: 'FLUXOS_PADRAO_CRIADOS',
      entity: 'FluxoTramitacao',
      metadata: { acao: 'criar_fluxos_padrao' }
    })

    const fluxos = await listarFluxos()
    return createSuccessResponse(fluxos, 'Fluxos padrao criados com sucesso')
  }

  const payload = FluxoCreateSchema.safeParse(body)
  if (!payload.success) {
    throw new ValidationError(payload.error.issues[0]?.message ?? 'Dados invalidos')
  }

  // Verifica se ja existe fluxo para este tipo
  const existente = await prisma.fluxoTramitacao.findUnique({
    where: { tipoProposicao: payload.data.tipoProposicao }
  })

  if (existente) {
    throw new ValidationError(`Ja existe um fluxo para o tipo ${payload.data.tipoProposicao}`)
  }

  const fluxo = await prisma.fluxoTramitacao.create({
    data: {
      tipoProposicao: payload.data.tipoProposicao,
      nome: payload.data.nome,
      descricao: payload.data.descricao,
      ativo: payload.data.ativo
    },
    include: {
      etapas: {
        orderBy: { ordem: 'asc' }
      }
    }
  })

  await logAudit({
    request,
    session,
    action: 'FLUXO_TRAMITACAO_CREATE',
    entity: 'FluxoTramitacao',
    entityId: fluxo.id,
    metadata: {
      tipoProposicao: payload.data.tipoProposicao,
      nome: payload.data.nome
    }
  })

  return createSuccessResponse(fluxo, 'Fluxo criado com sucesso')
}, { permissions: 'config.manage' })

/**
 * PUT /api/admin/configuracoes/fluxos-tramitacao
 * Atualiza um fluxo de tramitacao existente
 */
export const PUT = withAuth(async (
  request: NextRequest,
  _context,
  session
) => {
  const body = await request.json()
  const payload = FluxoUpdateSchema.safeParse(body)

  if (!payload.success) {
    throw new ValidationError(payload.error.issues[0]?.message ?? 'Dados invalidos')
  }

  const { id, ...dados } = payload.data

  const fluxoExistente = await prisma.fluxoTramitacao.findUnique({
    where: { id }
  })

  if (!fluxoExistente) {
    throw new NotFoundError('Fluxo nao encontrado')
  }

  const fluxo = await atualizarFluxo(id, dados)

  await logAudit({
    request,
    session,
    action: 'FLUXO_TRAMITACAO_UPDATE',
    entity: 'FluxoTramitacao',
    entityId: id,
    metadata: dados
  })

  return createSuccessResponse(fluxo, 'Fluxo atualizado com sucesso')
}, { permissions: 'config.manage' })

/**
 * DELETE /api/admin/configuracoes/fluxos-tramitacao
 * Deleta um fluxo de tramitacao (soft delete - apenas desativa)
 */
export const DELETE = withAuth(async (
  request: NextRequest,
  _context,
  session
) => {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    throw new ValidationError('ID do fluxo e obrigatorio')
  }

  const fluxoExistente = await prisma.fluxoTramitacao.findUnique({
    where: { id }
  })

  if (!fluxoExistente) {
    throw new NotFoundError('Fluxo nao encontrado')
  }

  // Soft delete - apenas desativa
  await prisma.fluxoTramitacao.update({
    where: { id },
    data: { ativo: false }
  })

  await logAudit({
    request,
    session,
    action: 'FLUXO_TRAMITACAO_DELETE',
    entity: 'FluxoTramitacao',
    entityId: id,
    metadata: { tipoProposicao: fluxoExistente.tipoProposicao }
  })

  return createSuccessResponse({ id }, 'Fluxo desativado com sucesso')
}, { permissions: 'config.manage' })
