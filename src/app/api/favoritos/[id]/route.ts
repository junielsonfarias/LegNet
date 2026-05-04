import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/permissions'
import { favoritoDbService } from '@/lib/services/favorito-db-service'
import { createSuccessResponse, NotFoundError, ForbiddenError, ValidationError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

// Schema de atualização
const updateSchema = z.object({
  notificarMudancas: z.boolean().nullish().transform(v => v ?? undefined),
  notificarVotacao: z.boolean().nullish().transform(v => v ?? undefined),
  notificarParecer: z.boolean().nullish().transform(v => v ?? undefined),
  anotacao: z.string().nullable().optional(),
})

/**
 * GET /api/favoritos/[id] - Busca um favorito específico
 */
export const GET = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  session: any
) => {
  const { id } = await params

  const favorito = await favoritoDbService.getById(id)

  if (!favorito) {
    throw new NotFoundError('Favorito')
  }

  if (favorito.userId !== session?.user?.id) {
    throw new ForbiddenError('Acesso negado')
  }

  return NextResponse.json({ favorito })
  // M12: GET idempotente (consulta) — skipCsrf seguro. PATCH/DELETE abaixo NAO tem.
}, { skipCsrf: true })

/**
 * PATCH /api/favoritos/[id] - Atualiza configurações do favorito
 */
export const PATCH = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  session: any
) => {
  const { id } = await params
  const body = await request.json()
  const validacao = updateSchema.safeParse(body)

  if (!validacao.success) {
    throw new ValidationError('Dados inválidos', validacao.error.errors)
  }

  const favorito = await favoritoDbService.getById(id)

  if (!favorito) {
    throw new NotFoundError('Favorito')
  }

  if (favorito.userId !== session?.user?.id) {
    throw new ForbiddenError('Acesso negado')
  }

  const atualizado = await favoritoDbService.updateById(id, validacao.data)

  return NextResponse.json({ favorito: atualizado })
})

/**
 * DELETE /api/favoritos/[id] - Remove um favorito
 */
export const DELETE = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  session: any
) => {
  const { id } = await params

  const favorito = await favoritoDbService.getById(id)

  if (!favorito) {
    throw new NotFoundError('Favorito')
  }

  if (favorito.userId !== session?.user?.id) {
    throw new ForbiddenError('Acesso negado')
  }

  await favoritoDbService.deleteById(id)

  return createSuccessResponse({ removed: true })
})
