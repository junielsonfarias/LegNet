import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError
} from '@/lib/error-handler'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  criarSugestao,
  listarSugestoes,
  listarSugestoesPublicas,
  getEstatisticasSugestoes
} from '@/lib/services/sugestao-legislativa-service'

export const dynamic = 'force-dynamic'

const CriarSugestaoSchema = z.object({
  nome: z.string().min(3, 'Nome e obrigatorio'),
  email: z.string().email('Email invalido'),
  cpf: z.string().min(11, 'CPF e obrigatorio'),
  bairro: z.string().optional(),
  telefone: z.string().optional(),
  titulo: z.string().min(10, 'Titulo deve ter pelo menos 10 caracteres'),
  descricao: z.string().min(50, 'Descricao deve ter pelo menos 50 caracteres'),
  justificativa: z.string().min(30, 'Justificativa deve ter pelo menos 30 caracteres'),
  categoria: z.string().optional()
})

/**
 * GET - Listar sugestões
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const acao = searchParams.get('acao')

  // Estatísticas - admin
  if (acao === 'estatisticas') {
    const session = await getServerSession(authOptions)
    if (!session) {
      throw new ValidationError('Não autorizado')
    }
    const stats = await getEstatisticasSugestoes()
    return createSuccessResponse(stats, 'Estatísticas de sugestões')
  }

  // Sugestões públicas - sem autenticação
  const publico = searchParams.get('publico')
  if (publico === 'true') {
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const resultado = await listarSugestoesPublicas(page, limit)
    return createSuccessResponse(resultado, 'Sugestões públicas')
  }

  // Admin - requer autenticação
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new ValidationError('Não autorizado')
  }

  const status = searchParams.get('status') as any
  const categoria = searchParams.get('categoria') || undefined
  const parlamentarResponsavelId = searchParams.get('parlamentarResponsavelId') || undefined
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const resultado = await listarSugestoes(
    { status, categoria, parlamentarResponsavelId },
    page,
    limit
  )

  return createSuccessResponse(resultado, 'Sugestões listadas')
})

/**
 * POST - Criar sugestão (público)
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const validatedData = CriarSugestaoSchema.parse(body)

  const sugestao = await criarSugestao(validatedData)

  return createSuccessResponse(sugestao, 'Sugestão enviada com sucesso')
})
