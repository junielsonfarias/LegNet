import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/permissions'
import { favoritoDbService } from '@/lib/services/favorito-db-service'
import { ValidationError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

/**
 * GET /api/favoritos/check - Verifica se um item está nos favoritos
 *
 * Query params:
 * - tipoItem: tipo do item (PROPOSICAO, SESSAO, etc)
 * - itemId: ID do item
 */
export const GET = withAuth(async (request: NextRequest, _ctx: unknown, session: any) => {
  if (!session?.user?.id) {
    return NextResponse.json({ favorito: false })
  }

  const { searchParams } = new URL(request.url)
  const tipoItem = searchParams.get('tipoItem')
  const itemId = searchParams.get('itemId')

  if (!tipoItem || !itemId) {
    throw new ValidationError('Parâmetros tipoItem e itemId são obrigatórios')
  }

  const favorito = await favoritoDbService.exists(session.user.id, tipoItem, itemId)

  return NextResponse.json({
    favorito: !!favorito,
    dados: favorito || null,
  })
}, { skipCsrf: true })

/**
 * POST /api/favoritos/check - Verifica múltiplos itens
 *
 * Body:
 * - itens: Array de { tipoItem, itemId }
 */
export const POST = withAuth(async (request: NextRequest, _ctx: unknown, session: any) => {
  if (!session?.user?.id) {
    return NextResponse.json({ favoritos: {} })
  }

  const body = await request.json()
  const { itens } = body

  if (!Array.isArray(itens)) {
    throw new ValidationError('Parâmetro itens deve ser um array')
  }

  const favoritos = await favoritoDbService.checkMultiple(session.user.id, itens)

  // Criar mapa de favoritos para resposta rápida
  const mapaFavoritos: Record<string, boolean> = {}
  favoritos.forEach((fav) => {
    mapaFavoritos[`${fav.tipoItem}:${fav.itemId}`] = true
  })

  return NextResponse.json({ favoritos: mapaFavoritos })
})
