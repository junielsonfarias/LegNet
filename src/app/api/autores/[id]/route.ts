import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandler,
  createSuccessResponse,
  NotFoundError,
  ValidationError,
  ConflictError, getErrorMessage } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { autorDbService } from '@/lib/services/autor-db-service'

export const dynamic = 'force-dynamic'

const UpdateAutorSchema = z.object({
  tipoAutorId: z.string().nullish().transform(v => v ?? undefined),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').nullish().transform(v => v ?? undefined),
  descricao: z.string().nullish().transform(v => v ?? undefined),
  parlamentarId: z.string().nullish().transform(v => v ?? undefined),
  comissaoId: z.string().nullish().transform(v => v ?? undefined),
  cargo: z.string().nullish().transform(v => v ?? undefined),
  email: z.string().email().nullish().or(z.literal('')).nullable(),
  telefone: z.string().nullish().transform(v => v ?? undefined),
  ativo: z.boolean().nullish().transform(v => v ?? undefined)
})

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const autor = await autorDbService.getById(id)
  if (!autor) throw new NotFoundError('Autor')
  return createSuccessResponse(autor, 'Autor encontrado')
})

export const PUT = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params
  const body = await request.json()
  const validatedData = UpdateAutorSchema.parse(body)

  const existing = await autorDbService.getById(id)
  if (!existing) throw new NotFoundError('Autor')

  if (validatedData.tipoAutorId) {
    const tipoAutor = await autorDbService.tipoAutorExists(validatedData.tipoAutorId)
    if (!tipoAutor) throw new ValidationError('Tipo de autor não encontrado')
  }

  if (validatedData.parlamentarId && validatedData.parlamentarId !== existing.parlamentarId) {
    const dup = await autorDbService.checkParlamentarVinculado(validatedData.parlamentarId, id)
    if (dup) throw new ConflictError('Este parlamentar já está vinculado a outro autor')
  }

  const autor = await autorDbService.update(id, validatedData)
  return createSuccessResponse(autor, 'Autor atualizado com sucesso')
}, { permissions: 'proposicao.manage' })

export const DELETE = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params
  const existing = await autorDbService.getById(id)
  if (!existing) throw new NotFoundError('Autor')

  try {
    await autorDbService.remove(id)
  } catch (e) {
    throw new ConflictError(getErrorMessage(e))
  }

  return createSuccessResponse(null, 'Autor excluído com sucesso')
}, { permissions: 'proposicao.manage' })
