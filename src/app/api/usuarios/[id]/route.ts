import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  createSuccessResponse,
  ValidationError,
  NotFoundError,
  validateId
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

const UpdateUsuarioSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  // SEGURANÇA: Senha mínima de 8 caracteres
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres').optional(),
  role: z.enum(['ADMIN', 'EDITOR', 'USER', 'PARLAMENTAR', 'OPERADOR', 'SECRETARIA', 'AUXILIAR_LEGISLATIVO']).optional(),
  parlamentarId: z.string().optional().nullable(),
  ativo: z.boolean().optional()
})

// GET - Buscar usuário por ID
// SEGURANÇA: Requer autenticação e permissão de gerenciamento de usuários
export const GET = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Usuário')

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
}, { permissions: 'user.manage' })

// PUT - Atualizar usuário
// SEGURANÇA: Requer autenticação e permissão de gerenciamento de usuários
export const PUT = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Usuário')
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
}, { permissions: 'user.manage' })

// DELETE - Excluir usuário
// SEGURANÇA: Requer autenticação e permissão de gerenciamento de usuários
export const DELETE = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Usuário')

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
}, { permissions: 'user.manage' })

