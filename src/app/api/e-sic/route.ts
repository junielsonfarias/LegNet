import { NextRequest, NextResponse } from 'next/server'
import { esicService } from '@/lib/services/esic-service'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, ValidationError } from '@/lib/error-handler'
import type { StatusESIC } from '@prisma/client'

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

  // Validar campos obrigatórios
  if (!body.nome || !body.email || !body.assunto || !body.descricao) {
    throw new ValidationError('Campos obrigatórios não fornecidos (nome, email, assunto, descricao)')
  }

  const solicitacao = await esicService.create({
    nome: body.nome,
    email: body.email,
    cpf: body.cpf,
    telefone: body.telefone,
    tipoSolicitante: body.tipoSolicitante,
    assunto: body.assunto,
    descricao: body.descricao,
    orgao: body.orgao,
    formaResposta: body.formaResposta
  })

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
