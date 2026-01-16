import { NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { createSuccessResponse, ValidationError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import {
  iniciarSessaoControle,
  finalizarSessaoControle
} from '@/lib/services/sessao-controle'

export const dynamic = 'force-dynamic'

const ControleSchema = z.object({
  acao: z.enum(['iniciar', 'finalizar', 'cancelar'])
})

export const POST = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const body = await request.json()
  const { acao } = ControleSchema.parse(body)
  const sessaoId = params.id

  if (!sessaoId) {
    throw new ValidationError('Sessão inválida')
  }

  let sessao

  switch (acao) {
    case 'iniciar':
      sessao = await iniciarSessaoControle(sessaoId)
      break
    case 'finalizar':
      sessao = await finalizarSessaoControle(sessaoId)
      break
    case 'cancelar':
      sessao = await prisma.sessao.update({
        where: { id: sessaoId },
        data: {
          status: 'CANCELADA',
          finalizada: false
        }
      })
      break
  }

  return createSuccessResponse(sessao, 'Sessão atualizada com sucesso')
}), { permissions: 'sessao.manage' })

