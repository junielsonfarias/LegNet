import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  withErrorHandler,
  createSuccessResponse,
  NotFoundError,
  ValidationError,
  ConflictError
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

// Schema de validação para atualização
const UpdateAutorSchema = z.object({
  tipoAutorId: z.string().optional(),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  descricao: z.string().optional().nullable(),
  parlamentarId: z.string().optional().nullable(),
  comissaoId: z.string().optional().nullable(),
  cargo: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  telefone: z.string().optional().nullable(),
  ativo: z.boolean().optional()
})

// GET - Obter autor por ID
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params

  const autor = await prisma.autor.findUnique({
    where: { id },
    include: {
      tipoAutor: true,
      parlamentar: {
        select: {
          id: true,
          nome: true,
          apelido: true,
          foto: true,
          partido: true,
          cargo: true,
          ativo: true
        }
      },
      comissao: {
        select: {
          id: true,
          nome: true,
          sigla: true,
          tipo: true,
          ativa: true
        }
      },
      proposicoes: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          numero: true,
          ano: true,
          tipo: true,
          titulo: true,
          status: true
        }
      },
      _count: {
        select: { proposicoes: true }
      }
    }
  })

  if (!autor) {
    throw new NotFoundError('Autor')
  }

  return createSuccessResponse(autor, 'Autor encontrado')
})

// PUT - Atualizar autor
// SEGURANÇA: Requer autenticação e permissão de gestão de proposições
export const PUT = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params
  const body = await request.json()
  const validatedData = UpdateAutorSchema.parse(body)

  // Verificar se existe
  const existing = await prisma.autor.findUnique({
    where: { id }
  })

  if (!existing) {
    throw new NotFoundError('Autor')
  }

  // Se mudando tipo de autor, verificar se existe
  if (validatedData.tipoAutorId) {
    const tipoAutor = await prisma.tipoAutor.findUnique({
      where: { id: validatedData.tipoAutorId }
    })
    if (!tipoAutor) {
      throw new ValidationError('Tipo de autor não encontrado')
    }
  }

  // Se mudando parlamentar, verificar duplicidade
  if (validatedData.parlamentarId && validatedData.parlamentarId !== existing.parlamentarId) {
    const existingParlamentar = await prisma.autor.findUnique({
      where: { parlamentarId: validatedData.parlamentarId }
    })
    if (existingParlamentar && existingParlamentar.id !== id) {
      throw new ConflictError('Este parlamentar já está vinculado a outro autor')
    }
  }

  const autor = await prisma.autor.update({
    where: { id },
    data: validatedData,
    include: {
      tipoAutor: true,
      parlamentar: {
        select: { id: true, nome: true, foto: true }
      },
      comissao: {
        select: { id: true, nome: true, sigla: true }
      }
    }
  })

  return createSuccessResponse(autor, 'Autor atualizado com sucesso')
}, { permissions: 'proposicao.manage' })

// DELETE - Excluir autor
// SEGURANÇA: Requer autenticação e permissão de gestão de proposições
export const DELETE = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params

  // Verificar se existe
  const existing = await prisma.autor.findUnique({
    where: { id },
    include: {
      _count: {
        select: { proposicoes: true }
      }
    }
  })

  if (!existing) {
    throw new NotFoundError('Autor')
  }

  // Verificar se há proposições vinculadas
  if (existing._count.proposicoes > 0) {
    throw new ConflictError(`Este autor possui ${existing._count.proposicoes} proposição(ões) vinculada(s). Remova ou transfira as proposições antes de excluir o autor.`)
  }

  await prisma.autor.delete({
    where: { id }
  })

  return createSuccessResponse(null, 'Autor excluído com sucesso')
}, { permissions: 'proposicao.manage' })
