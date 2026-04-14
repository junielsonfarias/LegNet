import { NextRequest } from 'next/server'
import { withErrorHandler,
  createSuccessResponse,
  ValidationError, getErrorMessage } from '@/lib/error-handler'
import { pareceresDbService } from '@/lib/services/pareceres-db-service'

export const dynamic = 'force-dynamic'

// GET - Obter próximo número de parecer para uma comissão
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const comissaoId = searchParams.get('comissaoId')

  if (!comissaoId) {
    throw new ValidationError('comissaoId é obrigatório')
  }

  try {
    const resultado = await pareceresDbService.getNextNumeroFormatado(comissaoId)
    return createSuccessResponse(resultado, 'Próximo número obtido com sucesso')
  } catch (error) {
    throw new ValidationError(getErrorMessage(error))
  }
})
