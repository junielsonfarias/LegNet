import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  withErrorHandler,
  createSuccessResponse,
  NotFoundError,
  ConflictError
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'

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
// SEGURANÇA: Requer autenticação e permissão de gestão de proposições
export const PUT = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params
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
}, { permissions: 'proposicao.manage' })

// DELETE - Excluir tipo de autor
// SEGURANÇA: Requer autenticação e permissão de gestão de proposições
export const DELETE = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params

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
}, { permissions: 'proposicao.manage' })
