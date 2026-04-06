import { NextRequest } from 'next/server'
import { createSuccessResponse, NotFoundError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const UpdateProfileSchema = z.object({
  name: z.string().min(1, 'Nome e obrigatorio').max(100),
})

// GET - Dados do usuario logado
export const GET = withAuth(async (_request: NextRequest, _ctx, session) => {
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      ativo: true,
      createdAt: true,
      parlamentarId: true,
    },
  })

  if (!user) throw new NotFoundError('Usuario')

  return createSuccessResponse(user, 'Perfil carregado')
})

// PUT - Atualizar nome do usuario logado
export const PUT = withAuth(async (request: NextRequest, _ctx, session) => {
  const body = await request.json()
  const data = UpdateProfileSchema.parse(body)

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { name: data.name },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  })

  return createSuccessResponse(user, 'Perfil atualizado com sucesso')
})
