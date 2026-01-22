import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError,
  NotFoundError,
  validateId
} from '@/lib/error-handler'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  buscarEmendaPorId,
  atualizarEmenda,
  votarEmenda,
  finalizarVotacaoEmenda,
  retirarEmenda,
  prejudicarEmenda,
  apurarVotacaoEmenda
} from '@/lib/services/emenda-service'

export const dynamic = 'force-dynamic'

const AtualizarEmendaSchema = z.object({
  status: z.enum([
    'APRESENTADA', 'EM_ANALISE', 'APROVADA', 'REJEITADA',
    'PREJUDICADA', 'RETIRADA', 'INCORPORADA'
  ]).optional(),
  parecerComissao: z.string().optional(),
  parecerTipo: z.enum(['FAVORAVEL', 'CONTRARIO', 'FAVORAVEL_COM_RESSALVAS']).optional(),
  parecerTexto: z.string().optional()
})

const VotarEmendaSchema = z.object({
  parlamentarId: z.string().min(1, 'Parlamentar é obrigatório'),
  voto: z.enum(['SIM', 'NAO', 'ABSTENCAO', 'AUSENTE'])
})

/**
 * GET - Buscar emenda por ID
 */
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new ValidationError('Não autorizado')
  }

  const id = validateId(params.id, 'Emenda')
  const emenda = await buscarEmendaPorId(id)

  if (!emenda) {
    throw new NotFoundError('Emenda')
  }

  return createSuccessResponse(emenda, 'Emenda encontrada')
})

/**
 * PUT - Atualizar emenda
 */
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new ValidationError('Não autorizado')
  }

  const id = validateId(params.id, 'Emenda')
  const body = await request.json()
  const validatedData = AtualizarEmendaSchema.parse(body)

  const emenda = await atualizarEmenda(id, validatedData)

  return createSuccessResponse(emenda, 'Emenda atualizada')
})

/**
 * POST - Ações específicas: votar, finalizar, retirar, prejudicar, apurar
 */
export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new ValidationError('Não autorizado')
  }

  const id = validateId(params.id, 'Emenda')
  const { searchParams } = new URL(request.url)
  const acao = searchParams.get('acao')
  const body = await request.json().catch(() => ({}))

  switch (acao) {
    case 'votar': {
      const data = VotarEmendaSchema.parse(body)
      const voto = await votarEmenda(id, data)
      return createSuccessResponse(voto, 'Voto registrado')
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

    case 'apurar': {
      const resultado = await apurarVotacaoEmenda(id)
      return createSuccessResponse(resultado, 'Apuração realizada')
    }

    default:
      throw new ValidationError('Ação inválida. Use: votar, finalizar, retirar, prejudicar ou apurar')
  }
})

/**
 * DELETE - Excluir emenda (apenas se APRESENTADA)
 */
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new ValidationError('Não autorizado')
  }

  const id = validateId(params.id, 'Emenda')

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
})
