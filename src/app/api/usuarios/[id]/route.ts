import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError,
  NotFoundError,
  validateId
} from '@/lib/error-handler'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

const UpdateUsuarioSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
  role: z.enum(['ADMIN', 'EDITOR', 'USER', 'PARLAMENTAR', 'OPERADOR']).optional(),
  parlamentarId: z.string().optional().nullable(),
  ativo: z.boolean().optional()
})

// GET - Buscar usuário por ID
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = validateId(params.id, 'Usuário')

  const usuario = await prisma.user.findUnique({
    where: { id },
    include: {
      parlamentar: {
        select: {
          id: true,
          nome: true
        }
      }
    }
  })

  if (!usuario) {
    throw new NotFoundError('Usuário')
  }

  // Remover senha da resposta
  const { password, ...usuarioSemSenha } = usuario

  return createSuccessResponse(usuarioSemSenha, 'Usuário encontrado com sucesso')
})

// PUT - Atualizar usuário
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = validateId(params.id, 'Usuário')
  const body = await request.json()

  const validatedData = UpdateUsuarioSchema.parse(body)

  // Verificar se usuário existe
  const usuarioExistente = await prisma.user.findUnique({
    where: { id }
  })

  if (!usuarioExistente) {
    throw new NotFoundError('Usuário')
  }

  // Verificar se email já está em uso por outro usuário
  if (validatedData.email && validatedData.email !== usuarioExistente.email) {
    const emailEmUso = await prisma.user.findFirst({
      where: {
        email: validatedData.email,
        id: { not: id }
      }
    })

    if (emailEmUso) {
      throw new ValidationError('Email já está em uso por outro usuário')
    }
  }

  // Verificar se parlamentar já tem usuário vinculado (se for parlamentar)
  if (validatedData.role === 'PARLAMENTAR' && validatedData.parlamentarId) {
    const parlamentarComUsuario = await prisma.user.findFirst({
      where: {
        parlamentarId: validatedData.parlamentarId,
        id: { not: id }
      }
    })

    if (parlamentarComUsuario) {
      throw new ValidationError('Este parlamentar já possui um usuário vinculado')
    }
  }

  // Preparar dados para atualização
  const updateData: any = {
    ...(validatedData.name !== undefined && { name: validatedData.name }),
    ...(validatedData.email !== undefined && { email: validatedData.email }),
    ...(validatedData.role !== undefined && { role: validatedData.role }),
    ...(validatedData.parlamentarId !== undefined && { parlamentarId: validatedData.parlamentarId || null }),
    ...(validatedData.ativo !== undefined && { ativo: validatedData.ativo })
  }

  // Hash da senha se fornecida
  if (validatedData.password) {
    updateData.password = await bcrypt.hash(validatedData.password, 12)
  }

  const usuarioAtualizado = await prisma.user.update({
    where: { id },
    data: updateData,
    include: {
      parlamentar: {
        select: {
          id: true,
          nome: true
        }
      }
    }
  })

  // Remover senha da resposta
  const { password, ...usuarioSemSenha } = usuarioAtualizado

  return createSuccessResponse(usuarioSemSenha, 'Usuário atualizado com sucesso')
})

// DELETE - Excluir usuário
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = validateId(params.id, 'Usuário')

  const usuario = await prisma.user.findUnique({
    where: { id }
  })

  if (!usuario) {
    throw new NotFoundError('Usuário')
  }

  await prisma.user.delete({
    where: { id }
  })

  return createSuccessResponse(null, 'Usuário excluído com sucesso')
})

