import { NextRequest } from 'next/server'
import { ouvidoriaService } from '@/lib/services/ouvidoria-service'
import { withErrorHandler, createSuccessResponse, ValidationError, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

/**
 * GET - Acompanhar manifestação por protocolo (público)
 * Não requer autenticação
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const protocolo = searchParams.get('protocolo')

  if (!protocolo) {
    throw new ValidationError('Parâmetro protocolo é obrigatório')
  }

  const manifestacao = await ouvidoriaService.getByProtocolo(protocolo)

  if (!manifestacao) {
    throw new NotFoundError('Manifestação não encontrada para o protocolo informado')
  }

  return createSuccessResponse(manifestacao)
})
