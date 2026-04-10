import { NextRequest } from 'next/server'
import { esicService } from '@/lib/services/esic-service'
import { withErrorHandler, createSuccessResponse, ValidationError, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

/**
 * GET - Acompanhar solicitação e-SIC por protocolo (público)
 * Não requer autenticação
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const protocolo = searchParams.get('protocolo')

  if (!protocolo) {
    throw new ValidationError('Parâmetro protocolo é obrigatório')
  }

  const solicitacao = await esicService.getByProtocolo(protocolo)

  if (!solicitacao) {
    throw new NotFoundError('Solicitação não encontrada para o protocolo informado')
  }

  return createSuccessResponse(solicitacao)
})
