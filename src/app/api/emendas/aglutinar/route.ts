import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
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
 * SEGURANÇA: Requer autenticação e permissão de gestão de proposições
 */
export const POST = withAuth(async (request: NextRequest) => {
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
}, { permissions: 'proposicao.manage' })
