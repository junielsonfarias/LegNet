import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, ConflictError, NotFoundError, ValidationError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { favoritoDbService } from '@/lib/services/favorito-db-service'

export const dynamic = 'force-dynamic'

const favoritoSchema = z.object({
  tipoItem: z.enum(['PROPOSICAO', 'SESSAO', 'PARLAMENTAR', 'COMISSAO', 'PUBLICACAO']),
  itemId: z.string().min(1),
  notificarMudancas: z.boolean().nullish().transform(v => v ?? true),
  notificarVotacao: z.boolean().nullish().transform(v => v ?? true),
  notificarParecer: z.boolean().nullish().transform(v => v ?? true),
  anotacao: z.string().nullish().transform(v => v ?? undefined),
})

// GET - Lista favoritos do usuário
export const GET = withAuth(withErrorHandler(async (request: NextRequest, _ctx, session) => {
  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get('tipo') || undefined
  const pagina = parseInt(searchParams.get('pagina') || '1')
  const limite = parseInt(searchParams.get('limite') || '20')

  const result = await favoritoDbService.list(
    { userId: session!.user!.id, tipoItem: tipo },
    { page: pagina, limit: limite }
  )

  return createSuccessResponse(result.data, 'Favoritos carregados', result.pagination.total)
}))

// POST - Adiciona item aos favoritos
export const POST = withAuth(withErrorHandler(async (request: NextRequest, _ctx, session) => {
  const body = await request.json()
  const dados = favoritoSchema.parse(body)

  const existente = await favoritoDbService.exists(session!.user!.id, dados.tipoItem, dados.itemId)
  if (existente) throw new ConflictError('Item já está nos favoritos')

  const itemExiste = await favoritoDbService.verificarItemExiste(dados.tipoItem, dados.itemId)
  if (!itemExiste) throw new NotFoundError('Item')

  const favorito = await favoritoDbService.create({
    userId: session!.user!.id,
    tipoItem: dados.tipoItem,
    itemId: dados.itemId,
    notificarMudancas: dados.notificarMudancas,
    notificarVotacao: dados.notificarVotacao,
    notificarParecer: dados.notificarParecer,
    anotacao: dados.anotacao,
  })

  return createSuccessResponse(favorito, 'Favorito adicionado', undefined, 201)
}))

// DELETE - Remove item dos favoritos
export const DELETE = withAuth(withErrorHandler(async (request: NextRequest, _ctx, session) => {
  const { searchParams } = new URL(request.url)
  const tipoItem = searchParams.get('tipoItem')
  const itemId = searchParams.get('itemId')

  if (!tipoItem || !itemId) throw new ValidationError('Parâmetros tipoItem e itemId são obrigatórios')

  const result = await favoritoDbService.remove(session!.user!.id, tipoItem, itemId)
  if (!result) throw new NotFoundError('Favorito')

  return createSuccessResponse(null, 'Favorito removido')
}))
