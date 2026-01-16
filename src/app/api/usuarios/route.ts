import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  withErrorHandler,
  createSuccessResponse,
  createErrorResponse,
  ValidationError,
  NotFoundError,
  validateId
} from '@/lib/error-handler'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

const CreateUsuarioSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z.enum(['ADMIN', 'EDITOR', 'USER', 'PARLAMENTAR', 'OPERADOR']),
  parlamentarId: z.string().optional(),
  ativo: z.boolean().default(true)
})

const UpdateUsuarioSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
  role: z.enum(['ADMIN', 'EDITOR', 'USER', 'PARLAMENTAR', 'OPERADOR']).optional(),
  parlamentarId: z.string().optional().nullable(),
  ativo: z.boolean().optional()
})

// GET - Listar todos os usuários
export const GET = withErrorHandler(async (request: NextRequest) => {
  const usuarios = await prisma.user.findMany({
    include: {
      parlamentar: {
        select: {
          id: true,
          nome: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return createSuccessResponse(usuarios, 'Usuários listados com sucesso')
})

// POST - Criar novo usuário
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  
  const validatedData = CreateUsuarioSchema.parse(body)

  // Verificar se email já existe
  const usuarioExistente = await prisma.user.findUnique({
    where: { email: validatedData.email }
  })

  if (usuarioExistente) {
    throw new ValidationError('Email já está em uso')
  }

  // Verificar se parlamentar já tem usuário vinculado (se for parlamentar)
  if (validatedData.role === 'PARLAMENTAR' && validatedData.parlamentarId) {
    const parlamentarComUsuario = await prisma.user.findFirst({
      where: {
        parlamentarId: validatedData.parlamentarId
      }
    })

    if (parlamentarComUsuario) {
      throw new ValidationError('Este parlamentar já possui um usuário vinculado')
    }
  }

  // Hash da senha
  const hashedPassword = await bcrypt.hash(validatedData.password, 12)

  const novoUsuario = await prisma.user.create({
    data: {
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      role: validatedData.role,
      parlamentarId: validatedData.parlamentarId || null,
      ativo: validatedData.ativo
    },
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
  const { password, ...usuarioSemSenha } = novoUsuario

  return createSuccessResponse(usuarioSemSenha, 'Usuário criado com sucesso')
})

