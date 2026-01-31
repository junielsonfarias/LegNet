import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import {
  withErrorHandler,
  createSuccessResponse,
  NotFoundError,
  ConflictError,
  UnauthorizedError
} from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

// Schema de validação para atualização
const UpdateTipoAutorSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  descricao: z.string().optional().nullable(),
  ativo: z.boolean().optional(),
  ordem: z.number().optional()
})

// GET - Obter tipo de autor por ID
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params

  const tipoAutor = await prisma.tipoAutor.findUnique({
    where: { id },
    include: {
      autores: {
        include: {
          parlamentar: {
            select: { id: true, nome: true, foto: true }
          },
          comissao: {
            select: { id: true, nome: true, sigla: true }
          }
        }
      },
      _count: {
        select: { autores: true }
      }
    }
  })

  if (!tipoAutor) {
    throw new NotFoundError('Tipo de autor')
  }

  return createSuccessResponse(tipoAutor, 'Tipo de autor encontrado')
})

// PUT - Atualizar tipo de autor
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new UnauthorizedError('Autenticação necessária')
  }

  const { id } = await params
  const body = await request.json()
  const validatedData = UpdateTipoAutorSchema.parse(body)

  // Verificar se existe
  const existing = await prisma.tipoAutor.findUnique({
    where: { id }
  })

  if (!existing) {
    throw new NotFoundError('Tipo de autor')
  }

  // Verificar duplicidade de nome
  if (validatedData.nome && validatedData.nome !== existing.nome) {
    const duplicate = await prisma.tipoAutor.findUnique({
      where: { nome: validatedData.nome }
    })
    if (duplicate) {
      throw new ConflictError('Já existe um tipo de autor com este nome')
    }
  }

  const tipoAutor = await prisma.tipoAutor.update({
    where: { id },
    data: validatedData
  })

  return createSuccessResponse(tipoAutor, 'Tipo de autor atualizado com sucesso')
})

// DELETE - Excluir tipo de autor
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new UnauthorizedError('Autenticação necessária')
  }

  const { id } = await params

  // Verificar se existe
  const existing = await prisma.tipoAutor.findUnique({
    where: { id },
    include: {
      _count: {
        select: { autores: true }
      }
    }
  })

  if (!existing) {
    throw new NotFoundError('Tipo de autor')
  }

  // Verificar se há autores vinculados
  if (existing._count.autores > 0) {
    throw new ConflictError(`Este tipo de autor possui ${existing._count.autores} autor(es) vinculado(s). Remova os autores antes de excluir o tipo.`)
  }

  await prisma.tipoAutor.delete({
    where: { id }
  })

  return createSuccessResponse(null, 'Tipo de autor excluído com sucesso')
})
