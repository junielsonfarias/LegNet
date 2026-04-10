import { NextRequest } from 'next/server'
import { esicService } from '@/lib/services/esic-service'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, ValidationError, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

/**
 * GET - Buscar solicitação e-SIC por ID (admin)
 */
export const GET = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const solicitacao = await esicService.getById(id)

  if (!solicitacao) {
    throw new NotFoundError('Solicitação')
  }

  return createSuccessResponse(solicitacao)
})

/**
 * PATCH - Atualizar/responder solicitação e-SIC (admin)
 * Ações: responder, prorrogar, negar
 */
export const PATCH = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  session: any
) => {
  const { id } = await params
  const body = await request.json()

  const solicitacao = await esicService.getById(id)
  if (!solicitacao) {
    throw new NotFoundError('Solicitação')
  }

  let resultado

  switch (body.acao) {
    case 'responder':
      if (!body.resposta) {
        throw new ValidationError('Campo resposta é obrigatório')
      }
      resultado = await esicService.responder(id, body.resposta, body.respondidoPor || session?.user?.name || 'Sistema')
      break

    case 'prorrogar':
      if (!body.motivo) {
        throw new ValidationError('Campo motivo é obrigatório para prorrogação')
      }
      resultado = await esicService.prorrogar(id, body.motivo)
      break

    case 'negar':
      if (!body.motivo) {
        throw new ValidationError('Campo motivo é obrigatório para negativa')
      }
      resultado = await esicService.negar(id, body.motivo, body.respondidoPor || session?.user?.name || 'Sistema')
      break

    default:
      throw new ValidationError('Ação inválida. Use: responder, prorrogar ou negar')
  }

  return createSuccessResponse(
    resultado,
    `Solicitação ${body.acao === 'responder' ? 'respondida' : body.acao === 'prorrogar' ? 'prorrogada' : 'negada'} com sucesso`
  )
})
