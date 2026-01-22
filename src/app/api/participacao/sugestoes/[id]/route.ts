import { NextRequest } from 'next/server'
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
import {
  buscarSugestao,
  moderarSugestao,
  apoiarSugestao,
  removerApoio,
  converterEmProposicao
} from '@/lib/services/sugestao-legislativa-service'

export const dynamic = 'force-dynamic'

const ModerarSchema = z.object({
  status: z.enum(['PENDENTE', 'EM_ANALISE', 'ACEITA', 'RECUSADA', 'CONVERTIDA_PROPOSICAO']),
  motivoRecusa: z.string().optional(),
  parlamentarResponsavelId: z.string().optional()
})

const ApoiarSchema = z.object({
  nome: z.string().min(3, 'Nome e obrigatorio'),
  email: z.string().email('Email invalido'),
  cpf: z.string().min(11, 'CPF e obrigatorio')
})

const ConverterSchema = z.object({
  tipoProposicao: z.string().min(1, 'Tipo de proposicao e obrigatorio'),
  autorId: z.string().min(1, 'Autor e obrigatorio')
})

/**
 * GET - Buscar sugestão por ID
 */
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = params.id

  const sugestao = await buscarSugestao(id)
  if (!sugestao) {
    throw new NotFoundError('Sugestão')
  }

  return createSuccessResponse(sugestao, 'Sugestão encontrada')
})

/**
 * PUT - Moderar sugestão
 */
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new ValidationError('Não autorizado')
  }

  const id = validateId(params.id, 'Sugestão')
  const body = await request.json()
  const validatedData = ModerarSchema.parse(body)

  const sugestao = await moderarSugestao(id, validatedData)

  return createSuccessResponse(sugestao, 'Sugestão moderada')
})

/**
 * POST - Ações: apoiar, converter
 */
export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = params.id
  const { searchParams } = new URL(request.url)
  const acao = searchParams.get('acao')
  const body = await request.json()

  switch (acao) {
    case 'apoiar': {
      const data = ApoiarSchema.parse(body)
      const apoio = await apoiarSugestao(id, data.nome, data.email, data.cpf)
      return createSuccessResponse(apoio, 'Apoio registrado')
    }

    case 'remover-apoio': {
      const { cpf } = body
      if (!cpf) {
        throw new ValidationError('CPF é obrigatório')
      }
      await removerApoio(id, cpf)
      return createSuccessResponse({ sugestaoId: id }, 'Apoio removido')
    }

    case 'converter': {
      const session = await getServerSession(authOptions)
      if (!session) {
        throw new ValidationError('Não autorizado')
      }
      const data = ConverterSchema.parse(body)
      const proposicao = await converterEmProposicao(id, data.tipoProposicao, data.autorId)
      return createSuccessResponse(proposicao, 'Sugestão convertida em proposição')
    }

    default:
      throw new ValidationError('Ação inválida. Use: apoiar, remover-apoio ou converter')
  }
})
