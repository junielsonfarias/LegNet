import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError,
  ConflictError
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'

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
// SEGURANÇA: Requer autenticação e permissão de gestão de proposições
export const POST = withAuth(async (request: NextRequest) => {
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
}, { permissions: 'proposicao.manage' })
