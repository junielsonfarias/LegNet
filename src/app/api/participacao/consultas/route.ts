import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  criarConsulta,
  listarConsultas,
  listarConsultasAbertas
} from '@/lib/services/consulta-publica-service'

export const dynamic = 'force-dynamic'

const CriarConsultaSchema = z.object({
  titulo: z.string().min(5, 'Titulo e obrigatorio'),
  descricao: z.string().min(10, 'Descricao e obrigatoria'),
  proposicaoId: z.string().optional(),
  dataInicio: z.string().datetime(),
  dataFim: z.string().datetime(),
  permitirAnonimo: z.boolean().optional(),
  requerCadastro: z.boolean().optional(),
  moderacao: z.boolean().optional()
})

/**
 * GET - Listar consultas
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const publico = searchParams.get('publico')

  // Consultas públicas abertas - sem autenticação
  if (publico === 'true') {
    const consultas = await listarConsultasAbertas()
    return createSuccessResponse(consultas, 'Consultas abertas')
  }

  // Admin - requer autenticação
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new ValidationError('Não autorizado')
  }

  const status = searchParams.get('status') as any
  const proposicaoId = searchParams.get('proposicaoId') || undefined
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const resultado = await listarConsultas(
    { status, proposicaoId },
    page,
    limit
  )

  return createSuccessResponse(resultado, 'Consultas listadas')
})

/**
 * POST - Criar consulta
 * SEGURANÇA: Requer autenticação e permissão de participação
 */
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const validatedData = CriarConsultaSchema.parse(body)

  const consulta = await criarConsulta({
    ...validatedData,
    dataInicio: new Date(validatedData.dataInicio),
    dataFim: new Date(validatedData.dataFim)
  })

  return createSuccessResponse(consulta, 'Consulta criada com sucesso')
}, { permissions: 'participacao.manage' })
