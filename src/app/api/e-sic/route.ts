import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { esicService } from '@/lib/services/esic-service'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, ValidationError } from '@/lib/error-handler'
import type { StatusESIC } from '@prisma/client'

const CriarSolicitacaoSchema = z.object({
  nome: z.string().min(2).max(200).trim(),
  email: z.string().email(),
  cpf: z.string().regex(/^\d{11}$/).optional(),
  telefone: z.string().max(20).optional(),
  tipoSolicitante: z.string().max(50).optional(),
  assunto: z.string().min(5).max(300).trim(),
  descricao: z.string().min(10).max(5000).trim(),
  orgao: z.string().max(200).optional(),
  formaResposta: z.string().max(50).optional()
})

export const dynamic = 'force-dynamic'

/**
 * GET - Listar solicitações e-SIC (admin)
 * Requer autenticação
 */
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || undefined
  const ano = searchParams.get('ano') ? parseInt(searchParams.get('ano')!) : undefined
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const busca = searchParams.get('busca') || undefined

  const result = await esicService.paginate(
    { status: status as StatusESIC | undefined, ano, search: busca },
    { page, limit }
  )

  return NextResponse.json({
    success: true,
    data: result.data,
    pagination: result.pagination
  })
})

/**
 * POST - Criar nova solicitação e-SIC (público)
 * Não requer autenticação
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()

  const parsed = CriarSolicitacaoSchema.safeParse(body)
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors.map(e => e.message).join(', '))
  }

  const solicitacao = await esicService.create(parsed.data)

  return createSuccessResponse(
    {
      id: solicitacao.id,
      protocolo: solicitacao.protocolo,
      prazoResposta: solicitacao.prazoResposta
    },
    'Solicitação registrada com sucesso',
    undefined,
    201
  )
})
