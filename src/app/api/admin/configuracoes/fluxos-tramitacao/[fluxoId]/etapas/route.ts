import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, ValidationError, NotFoundError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import {
  adicionarEtapa,
  atualizarEtapa,
  removerEtapa,
  reordenarEtapas
} from '@/lib/services/fluxo-tramitacao-service'
import { prisma } from '@/lib/prisma'

const EtapaCreateSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio'),
  descricao: z.string().optional(),
  unidadeId: z.string().optional(),
  prazoDiasNormal: z.number().min(0).optional().default(15),
  prazoDiasUrgencia: z.number().min(0).optional(),
  requerParecer: z.boolean().optional().default(false),
  habilitaPauta: z.boolean().optional().default(false),
  ehEtapaFinal: z.boolean().optional().default(false)
})

const EtapaUpdateSchema = z.object({
  id: z.string(),
  nome: z.string().min(1).optional(),
  descricao: z.string().optional().nullable(),
  unidadeId: z.string().optional().nullable(),
  prazoDiasNormal: z.number().min(0).optional(),
  prazoDiasUrgencia: z.number().min(0).optional().nullable(),
  requerParecer: z.boolean().optional(),
  habilitaPauta: z.boolean().optional(),
  ehEtapaFinal: z.boolean().optional()
})

const ReordenarSchema = z.object({
  novaOrdem: z.array(z.string()).min(1, 'Array de IDs e obrigatorio')
})

/**
 * GET /api/admin/configuracoes/fluxos-tramitacao/[fluxoId]/etapas
 * Lista todas as etapas de um fluxo
 */
export const GET = withAuth(async (
  _request: NextRequest,
  { params }: { params: { fluxoId: string } }
) => {
  const { fluxoId } = params

  const fluxo = await prisma.fluxoTramitacao.findUnique({
    where: { id: fluxoId },
    include: {
      etapas: {
        orderBy: { ordem: 'asc' },
        include: {
          unidade: {
            select: { id: true, nome: true, sigla: true }
          }
        }
      }
    }
  })

  if (!fluxo) {
    throw new NotFoundError('Fluxo nao encontrado')
  }

  return createSuccessResponse(fluxo.etapas, 'Etapas carregadas com sucesso')
}, { permissions: 'configuracoes.view' })

/**
 * POST /api/admin/configuracoes/fluxos-tramitacao/[fluxoId]/etapas
 * Adiciona uma nova etapa ao fluxo
 */
export const POST = withAuth(async (
  request: NextRequest,
  { params }: { params: { fluxoId: string } },
  session
) => {
  const { fluxoId } = params
  const body = await request.json()

  // Verifica se e uma solicitacao de reordenacao
  if (body.reordenar === true) {
    const reordenarPayload = ReordenarSchema.safeParse(body)
    if (!reordenarPayload.success) {
      throw new ValidationError(reordenarPayload.error.issues[0]?.message ?? 'Dados invalidos')
    }

    await reordenarEtapas(fluxoId, reordenarPayload.data.novaOrdem)

    await logAudit({
      request,
      session,
      action: 'FLUXO_ETAPAS_REORDENAR',
      entity: 'FluxoTramitacaoEtapa',
      metadata: { fluxoId, novaOrdem: reordenarPayload.data.novaOrdem }
    })

    const etapas = await prisma.fluxoTramitacaoEtapa.findMany({
      where: { fluxoId },
      orderBy: { ordem: 'asc' },
      include: {
        unidade: {
          select: { id: true, nome: true, sigla: true }
        }
      }
    })

    return createSuccessResponse(etapas, 'Etapas reordenadas com sucesso')
  }

  const payload = EtapaCreateSchema.safeParse(body)
  if (!payload.success) {
    throw new ValidationError(payload.error.issues[0]?.message ?? 'Dados invalidos')
  }

  // Verifica se o fluxo existe
  const fluxo = await prisma.fluxoTramitacao.findUnique({
    where: { id: fluxoId }
  })

  if (!fluxo) {
    throw new NotFoundError('Fluxo nao encontrado')
  }

  const etapa = await adicionarEtapa(fluxoId, payload.data)

  await logAudit({
    request,
    session,
    action: 'FLUXO_ETAPA_CREATE',
    entity: 'FluxoTramitacaoEtapa',
    entityId: etapa.id,
    metadata: {
      fluxoId,
      nome: payload.data.nome,
      habilitaPauta: payload.data.habilitaPauta
    }
  })

  return createSuccessResponse(etapa, 'Etapa adicionada com sucesso')
}, { permissions: 'configuracoes.manage' })

/**
 * PUT /api/admin/configuracoes/fluxos-tramitacao/[fluxoId]/etapas
 * Atualiza uma etapa existente
 */
export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: { fluxoId: string } },
  session
) => {
  const { fluxoId } = params
  const body = await request.json()

  const payload = EtapaUpdateSchema.safeParse(body)
  if (!payload.success) {
    throw new ValidationError(payload.error.issues[0]?.message ?? 'Dados invalidos')
  }

  const { id, ...dados } = payload.data

  // Verifica se a etapa existe e pertence ao fluxo
  const etapaExistente = await prisma.fluxoTramitacaoEtapa.findFirst({
    where: { id, fluxoId }
  })

  if (!etapaExistente) {
    throw new NotFoundError('Etapa nao encontrada neste fluxo')
  }

  const etapa = await atualizarEtapa(id, dados)

  await logAudit({
    request,
    session,
    action: 'FLUXO_ETAPA_UPDATE',
    entity: 'FluxoTramitacaoEtapa',
    entityId: id,
    metadata: { fluxoId, ...dados }
  })

  return createSuccessResponse(etapa, 'Etapa atualizada com sucesso')
}, { permissions: 'configuracoes.manage' })

/**
 * DELETE /api/admin/configuracoes/fluxos-tramitacao/[fluxoId]/etapas
 * Remove uma etapa do fluxo
 */
export const DELETE = withAuth(async (
  request: NextRequest,
  { params }: { params: { fluxoId: string } },
  session
) => {
  const { fluxoId } = params
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    throw new ValidationError('ID da etapa e obrigatorio')
  }

  // Verifica se a etapa existe e pertence ao fluxo
  const etapaExistente = await prisma.fluxoTramitacaoEtapa.findFirst({
    where: { id, fluxoId }
  })

  if (!etapaExistente) {
    throw new NotFoundError('Etapa nao encontrada neste fluxo')
  }

  // Verifica se ha tramitacoes usando esta etapa
  const tramitacoesUsando = await prisma.tramitacao.count({
    where: { fluxoEtapaId: id }
  })

  if (tramitacoesUsando > 0) {
    throw new ValidationError(
      `Esta etapa nao pode ser removida pois existem ${tramitacoesUsando} tramitacoes vinculadas a ela`
    )
  }

  await removerEtapa(id)

  await logAudit({
    request,
    session,
    action: 'FLUXO_ETAPA_DELETE',
    entity: 'FluxoTramitacaoEtapa',
    entityId: id,
    metadata: { fluxoId, nomeEtapa: etapaExistente.nome }
  })

  return createSuccessResponse({ id }, 'Etapa removida com sucesso')
}, { permissions: 'configuracoes.manage' })
