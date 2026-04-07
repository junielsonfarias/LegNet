import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { favoritoDbService } from '@/lib/services/favorito-db-service'

export const dynamic = 'force-dynamic'

// Schema de validação
const favoritoSchema = z.object({
  tipoItem: z.enum(['PROPOSICAO', 'SESSAO', 'PARLAMENTAR', 'COMISSAO', 'PUBLICACAO']),
  itemId: z.string().min(1),
  notificarMudancas: z.boolean().nullish().transform(v => v ?? true),
  notificarVotacao: z.boolean().nullish().transform(v => v ?? true),
  notificarParecer: z.boolean().nullish().transform(v => v ?? true),
  anotacao: z.string().nullish().transform(v => v ?? undefined),
})

/**
 * GET /api/favoritos - Lista favoritos do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') || undefined
    const pagina = parseInt(searchParams.get('pagina') || '1')
    const limite = parseInt(searchParams.get('limite') || '20')

    const result = await favoritoDbService.list(
      { userId: session.user.id, tipoItem: tipo },
      { page: pagina, limit: limite }
    )

    return NextResponse.json({
      favoritos: result.data,
      total: result.pagination.total,
      pagina: result.pagination.page,
      limite: result.pagination.limit,
      totalPaginas: result.pagination.totalPages,
    })
  } catch (error) {
    console.error('Erro ao listar favoritos:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * POST /api/favoritos - Adiciona item aos favoritos
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validacao = favoritoSchema.safeParse(body)

    if (!validacao.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', detalhes: validacao.error.errors },
        { status: 400 }
      )
    }

    const dados = validacao.data

    // Verificar se já existe
    const existente = await favoritoDbService.exists(session.user.id, dados.tipoItem, dados.itemId)
    if (existente) {
      return NextResponse.json(
        { error: 'Item já está nos favoritos' },
        { status: 409 }
      )
    }

    // Verificar se o item existe
    const itemExiste = await favoritoDbService.verificarItemExiste(dados.tipoItem, dados.itemId)
    if (!itemExiste) {
      return NextResponse.json(
        { error: 'Item não encontrado' },
        { status: 404 }
      )
    }

    // Criar favorito
    const favorito = await favoritoDbService.create({
      userId: session.user.id,
      tipoItem: dados.tipoItem,
      itemId: dados.itemId,
      notificarMudancas: dados.notificarMudancas,
      notificarVotacao: dados.notificarVotacao,
      notificarParecer: dados.notificarParecer,
      anotacao: dados.anotacao,
    })

    return NextResponse.json({ favorito }, { status: 201 })
  } catch (error) {
    console.error('Erro ao adicionar favorito:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * DELETE /api/favoritos - Remove item dos favoritos
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
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

    const result = await favoritoDbService.remove(session.user.id, tipoItem, itemId)

    if (!result) {
      return NextResponse.json(
        { error: 'Favorito não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao remover favorito:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
