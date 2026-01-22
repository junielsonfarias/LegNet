import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError
} from '@/lib/error-handler'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { aglutinarEmendas } from '@/lib/services/emenda-service'

export const dynamic = 'force-dynamic'

const AglutinarSchema = z.object({
  proposicaoId: z.string().min(1, 'Proposição é obrigatória'),
  emendasIds: z.array(z.string()).min(2, 'Selecione pelo menos 2 emendas'),
  autorId: z.string().min(1, 'Autor é obrigatório'),
  textoNovo: z.string().min(1, 'Texto novo é obrigatório'),
  justificativa: z.string().min(1, 'Justificativa é obrigatória')
})

/**
 * POST - Aglutinar emendas
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new ValidationError('Não autorizado')
  }

  const body = await request.json()
  const validatedData = AglutinarSchema.parse(body)

  const emendaAglutinada = await aglutinarEmendas(
    validatedData.proposicaoId,
    validatedData.emendasIds,
    validatedData.autorId,
    validatedData.textoNovo,
    validatedData.justificativa
  )

  return createSuccessResponse(emendaAglutinada, 'Emendas aglutinadas com sucesso')
})
