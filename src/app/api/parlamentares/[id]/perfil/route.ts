import { NextRequest } from 'next/server'
import {
  withErrorHandler,
  createSuccessResponse,
  NotFoundError,
  validateId
} from '@/lib/error-handler'
import { parlamentarDbService } from '@/lib/services/parlamentar-db-service'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// GET - Buscar perfil completo do parlamentar
export const GET = withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Parlamentar')

  const perfilCompleto = await parlamentarDbService.getPerfil(id)

  if (!perfilCompleto) {
    throw new NotFoundError('Parlamentar')
  }

  return createSuccessResponse(perfilCompleto, 'Perfil do parlamentar carregado com sucesso')
})
