import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/favoritos/check - Verifica se um item está nos favoritos
 *
 * Query params:
 * - tipoItem: tipo do item (PROPOSICAO, SESSAO, etc)
 * - itemId: ID do item
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ favorito: false })
    }

    const { searchParams } = new URL(request.url)
    const tipoItem = searchParams.get('tipoItem')
    const itemId = searchParams.get('itemId')

    if (!tipoItem || !itemId) {
      return NextResponse.json(
        { error: 'Parâmetros tipoItem e itemId são obrigatórios' },
        { status: 400 }
      )
    }

    const favorito = await prisma.favorito.findUnique({
      where: {
        userId_tipoItem_itemId: {
          userId: session.user.id,
          tipoItem: tipoItem as any,
          itemId,
        },
      },
    })

    return NextResponse.json({
      favorito: !!favorito,
      dados: favorito || null,
    })
  } catch (error) {
    console.error('Erro ao verificar favorito:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * POST /api/favoritos/check - Verifica múltiplos itens
 *
 * Body:
 * - itens: Array de { tipoItem, itemId }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ favoritos: {} })
    }

    const body = await request.json()
    const { itens } = body

    if (!Array.isArray(itens)) {
      return NextResponse.json(
        { error: 'Parâmetro itens deve ser um array' },
        { status: 400 }
      )
    }

    const favoritos = await prisma.favorito.findMany({
      where: {
        userId: session.user.id,
        OR: itens.map((item: { tipoItem: string; itemId: string }) => ({
          tipoItem: item.tipoItem as any,
          itemId: item.itemId,
        })),
      },
    })

    // Criar mapa de favoritos para resposta rápida
    const mapaFavoritos: Record<string, boolean> = {}
    favoritos.forEach((fav) => {
      mapaFavoritos[`${fav.tipoItem}:${fav.itemId}`] = true
    })

    return NextResponse.json({ favoritos: mapaFavoritos })
  } catch (error) {
    console.error('Erro ao verificar favoritos:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
