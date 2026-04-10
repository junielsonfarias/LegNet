import { NextRequest } from 'next/server'
import { esicService } from '@/lib/services/esic-service'
import { withErrorHandler, createSuccessResponse, ValidationError, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

/**
 * POST - Registrar recurso em solicitação e-SIC (público)
 * Não requer autenticação
 */
export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()

  if (!body.motivo) {
    throw new ValidationError('Campo motivo é obrigatório')
  }

  const solicitacao = await esicService.getById(id)
  if (!solicitacao) {
    throw new NotFoundError('Solicitação')
  }

  const recurso = await esicService.criarRecurso(id, body.motivo, body.instancia || 1)

  return createSuccessResponse(recurso, 'Recurso registrado com sucesso', undefined, 201)
})
