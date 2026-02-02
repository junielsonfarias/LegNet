import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createSuccessResponse,
  ValidationError,
  NotFoundError,
  validateId
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import {
  buscarEmendaPorId,
  atualizarEmenda,
  votarEmenda,
  finalizarVotacaoEmenda,
  retirarEmenda,
  prejudicarEmenda,
  apurarVotacaoEmenda,
  iniciarVotacaoEmenda,
  incorporarEmenda,
  emitirParecerEmenda,
  listarVotosEmenda
} from '@/lib/services/emenda-service'

export const dynamic = 'force-dynamic'

const AtualizarEmendaSchema = z.object({
  status: z.enum([
    'APRESENTADA', 'EM_ANALISE', 'PARECER_EMITIDO', 'EM_VOTACAO',
    'APROVADA', 'REJEITADA', 'PREJUDICADA', 'RETIRADA', 'INCORPORADA'
  ]).optional(),
  parecerComissao: z.string().optional(),
  parecerTipo: z.enum([
    'FAVORAVEL', 'FAVORAVEL_COM_RESSALVAS', 'CONTRARIO',
    'PELA_REJEICAO', 'PELA_APROVACAO_PARCIAL'
  ]).optional(),
  parecerTexto: z.string().optional(),
  parecerData: z.string().datetime().transform(val => new Date(val)).optional(),
  parecerRelatorId: z.string().optional(),
  observacoes: z.string().optional()
})

const VotarEmendaSchema = z.object({
  parlamentarId: z.string().min(1, 'Parlamentar é obrigatório'),
  voto: z.enum(['SIM', 'NAO', 'ABSTENCAO', 'AUSENTE']),
  sessaoId: z.string().optional()
})

/**
 * GET - Buscar emenda por ID
 * SEGURANÇA: Requer autenticação
 */
export const GET = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Emenda')
  const emenda = await buscarEmendaPorId(id)

  if (!emenda) {
    throw new NotFoundError('Emenda')
  }

  return createSuccessResponse(emenda, 'Emenda encontrada')
}, { permissions: 'proposicao.view' })

/**
 * PUT - Atualizar emenda
 * SEGURANÇA: Requer autenticação e permissão de gestão
 */
export const PUT = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Emenda')
  const body = await request.json()
  const validatedData = AtualizarEmendaSchema.parse(body)

  const emenda = await atualizarEmenda(id, validatedData)

  return createSuccessResponse(emenda, 'Emenda atualizada')
}, { permissions: 'proposicao.manage' })

/**
 * POST - Ações específicas: votar, finalizar, retirar, prejudicar, apurar
 * SEGURANÇA: Requer autenticação e permissão de gestão
 */
export const POST = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Emenda')
  const { searchParams } = new URL(request.url)
  const acao = searchParams.get('acao')
  const body = await request.json().catch(() => ({}))

  switch (acao) {
    case 'votar': {
      const data = VotarEmendaSchema.parse(body)
      const voto = await votarEmenda(id, data)
      return createSuccessResponse(voto, 'Voto registrado')
    }

    case 'iniciar': {
      if (!body.sessaoId) {
        throw new ValidationError('sessaoId é obrigatório para iniciar votação')
      }
      const emenda = await iniciarVotacaoEmenda(id, body.sessaoId)
      return createSuccessResponse(emenda, 'Votação iniciada')
    }

    case 'finalizar': {
      const resultado = await finalizarVotacaoEmenda(id)
      return createSuccessResponse(resultado, 'Votação finalizada')
    }

    case 'retirar': {
      const emenda = await retirarEmenda(id, body.motivo)
      return createSuccessResponse(emenda, 'Emenda retirada')
    }

    case 'prejudicar': {
      const emenda = await prejudicarEmenda(id, body.motivo)
      return createSuccessResponse(emenda, 'Emenda prejudicada')
    }

    case 'incorporar': {
      const emenda = await incorporarEmenda(id)
      return createSuccessResponse(emenda, 'Emenda incorporada ao texto')
    }

    case 'parecer': {
      const { parecerTipo, parecerTexto, comissaoId, relatorId } = body
      if (!parecerTipo || !parecerTexto || !comissaoId || !relatorId) {
        throw new ValidationError('parecerTipo, parecerTexto, comissaoId e relatorId são obrigatórios')
      }
      const emenda = await emitirParecerEmenda(id, parecerTipo, parecerTexto, comissaoId, relatorId)
      return createSuccessResponse(emenda, 'Parecer emitido')
    }

    case 'apurar': {
      const resultado = await apurarVotacaoEmenda(id)
      return createSuccessResponse(resultado, 'Apuração realizada')
    }

    case 'votos': {
      const votos = await listarVotosEmenda(id)
      return createSuccessResponse(votos, 'Votos da emenda')
    }

    default:
      throw new ValidationError('Ação inválida. Use: votar, iniciar, finalizar, retirar, prejudicar, incorporar, parecer, apurar ou votos')
  }
}, { permissions: 'proposicao.manage' })

/**
 * DELETE - Excluir emenda (apenas se APRESENTADA)
 * SEGURANÇA: Requer autenticação e permissão de gestão
 */
export const DELETE = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Emenda')

  const emenda = await buscarEmendaPorId(id)
  if (!emenda) {
    throw new NotFoundError('Emenda')
  }

  if (emenda.status !== 'APRESENTADA') {
    throw new ValidationError('Apenas emendas com status APRESENTADA podem ser excluídas')
  }

  await prisma.emenda.delete({
    where: { id }
  })

  return createSuccessResponse({ id }, 'Emenda excluída')
}, { permissions: 'proposicao.manage' })
