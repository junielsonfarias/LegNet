import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError,
  ConflictError,
  UnauthorizedError
} from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

// Schema de validação
const TipoAutorSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: z.string().optional(),
  ativo: z.boolean().optional().default(true),
  ordem: z.number().optional().default(0)
})

// GET - Listar tipos de autor
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const ativo = searchParams.get('ativo')

  const where: any = {}
  if (ativo === 'true') {
    where.ativo = true
  } else if (ativo === 'false') {
    where.ativo = false
  }

  const tiposAutor = await prisma.tipoAutor.findMany({
    where,
    orderBy: [
      { ordem: 'asc' },
      { nome: 'asc' }
    ],
    include: {
      _count: {
        select: { autores: true }
      }
    }
  })

  return createSuccessResponse(tiposAutor, 'Tipos de autor listados com sucesso')
})

// POST - Criar tipo de autor
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new UnauthorizedError('Autenticação necessária')
  }

  const body = await request.json()
  const validatedData = TipoAutorSchema.parse(body)

  // Verificar duplicidade
  const existing = await prisma.tipoAutor.findUnique({
    where: { nome: validatedData.nome }
  })

  if (existing) {
    throw new ConflictError('Já existe um tipo de autor com este nome')
  }

  const tipoAutor = await prisma.tipoAutor.create({
    data: validatedData
  })

  return createSuccessResponse(tipoAutor, 'Tipo de autor criado com sucesso', undefined, 201)
})
