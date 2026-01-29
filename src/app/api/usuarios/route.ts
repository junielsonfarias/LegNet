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
import { withAuth } from '@/lib/auth/permissions'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

const CreateUsuarioSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z.enum(['ADMIN', 'EDITOR', 'USER', 'PARLAMENTAR', 'OPERADOR', 'SECRETARIA']),
  parlamentarId: z.string().optional(),
  ativo: z.boolean().default(true)
})

const UpdateUsuarioSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
  role: z.enum(['ADMIN', 'EDITOR', 'USER', 'PARLAMENTAR', 'OPERADOR', 'SECRETARIA']).optional(),
  parlamentarId: z.string().optional().nullable(),
  ativo: z.boolean().optional()
})

// Schema para query params de listagem
const ListUsuariosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(['ADMIN', 'EDITOR', 'USER', 'PARLAMENTAR', 'OPERADOR', 'SECRETARIA']).optional(),
  ativo: z.coerce.boolean().optional(),
  search: z.string().optional()
})

// GET - Listar todos os usuários (REQUER ADMIN ou SECRETARIA)
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  // Validar query params
  const params: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    params[key] = value
  })

  const validation = ListUsuariosQuerySchema.safeParse(params)
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: 'Parâmetros inválidos', details: validation.error.errors },
      { status: 400 }
    )
  }

  const { page, limit, role, ativo, search } = validation.data
  const skip = (page - 1) * limit

  // Construir filtros
  const where: Record<string, unknown> = {}
  if (role) where.role = role
  if (ativo !== undefined) where.ativo = ativo
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ]
  }

  const [usuarios, total] = await Promise.all([
    prisma.user.findMany({
      where,
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
      },
      skip,
      take: limit
    }),
    prisma.user.count({ where })
  ])

  // Remover senhas da resposta
  const usuariosSemSenha = usuarios.map(({ password, ...user }) => user)

  return NextResponse.json({
    success: true,
    data: usuariosSemSenha,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  })
}, { permissions: 'user.view' })

// POST - Criar novo usuário (REQUER ADMIN - operação sensível)
export const POST = withAuth(async (request: NextRequest) => {
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
}, { permissions: 'user.manage' })

