import { NextRequest } from 'next/server'
import { createSuccessResponse, ValidationError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

const ChangePasswordSchema = z.object({
  senhaAtual: z.string().min(1, 'Senha atual e obrigatoria'),
  novaSenha: z
    .string()
    .min(8, 'Nova senha deve ter no minimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiuscula')
    .regex(/[a-z]/, 'Deve conter pelo menos uma letra minuscula')
    .regex(/[0-9]/, 'Deve conter pelo menos um numero'),
})

// PUT - Alterar senha do usuario logado
export const PUT = withAuth(async (request: NextRequest, _ctx, session) => {
  const body = await request.json()
  const data = ChangePasswordSchema.parse(body)

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, password: true },
  })

  if (!user?.password) {
    throw new ValidationError('Usuario sem senha configurada')
  }

  const senhaCorreta = await bcrypt.compare(data.senhaAtual, user.password)
  if (!senhaCorreta) {
    throw new ValidationError('Senha atual incorreta')
  }

  const hashedPassword = await bcrypt.hash(data.novaSenha, 12)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword },
  })

  return createSuccessResponse(null, 'Senha alterada com sucesso')
})
