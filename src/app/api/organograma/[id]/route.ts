import { NextRequest } from 'next/server'
import { organogramaService } from '@/lib/services/organograma-service'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, NotFoundError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

/**
 * GET - Buscar unidade por ID (admin)
 */
export const GET = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const unidade = await organogramaService.getById(id)

  if (!unidade) {
    throw new NotFoundError('Unidade')
  }

  return createSuccessResponse(unidade)
})

/**
 * PATCH - Atualizar unidade (admin)
 */
export const PATCH = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()

  const unidadeExistente = await organogramaService.getById(id)
  if (!unidadeExistente) {
    throw new NotFoundError('Unidade')
  }

  const unidade = await organogramaService.update(id, {
    nome: body.nome,
    sigla: body.sigla,
    descricao: body.descricao,
    responsavel: body.responsavel,
    cargo: body.cargo,
    email: body.email,
    telefone: body.telefone,
    parentId: body.parentId,
    ordem: body.ordem
  })

  return createSuccessResponse(unidade, 'Unidade atualizada com sucesso')
})

/**
 * DELETE - Soft delete de unidade (admin)
 */
export const DELETE = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params

  const unidadeExistente = await organogramaService.getById(id)
  if (!unidadeExistente) {
    throw new NotFoundError('Unidade')
  }

  await organogramaService.delete(id)

  return createSuccessResponse({ removed: true }, 'Unidade removida com sucesso')
})
