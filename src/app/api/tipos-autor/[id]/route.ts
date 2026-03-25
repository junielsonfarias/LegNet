import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandler,
  createSuccessResponse,
  NotFoundError,
  ConflictError
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { tiposAutorDbService } from '@/lib/services/tipos-autor-db-service'

export const dynamic = 'force-dynamic'

const UpdateTipoAutorSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  descricao: z.string().optional().nullable(),
  ativo: z.boolean().optional(),
  ordem: z.number().optional()
})

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const tipoAutor = await tiposAutorDbService.getById(id)
  if (!tipoAutor) throw new NotFoundError('Tipo de autor')
  return createSuccessResponse(tipoAutor, 'Tipo de autor encontrado')
})

export const PUT = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params
  const body = await request.json()
  const validatedData = UpdateTipoAutorSchema.parse(body)

  const existing = await tiposAutorDbService.getById(id)
  if (!existing) throw new NotFoundError('Tipo de autor')

  if (validatedData.nome && validatedData.nome !== existing.nome) {
    const duplicate = await tiposAutorDbService.checkDuplicateName(validatedData.nome, id)
    if (duplicate) throw new ConflictError('Já existe um tipo de autor com este nome')
  }

  const tipoAutor = await tiposAutorDbService.update(id, validatedData)
  return createSuccessResponse(tipoAutor, 'Tipo de autor atualizado com sucesso')
}, { permissions: 'proposicao.manage' })

export const DELETE = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params
  const existing = await tiposAutorDbService.getById(id)
  if (!existing) throw new NotFoundError('Tipo de autor')

  try {
    await tiposAutorDbService.remove(id)
  } catch (e: any) {
    throw new ConflictError(e.message)
  }

  return createSuccessResponse(null, 'Tipo de autor excluído com sucesso')
}, { permissions: 'proposicao.manage' })
