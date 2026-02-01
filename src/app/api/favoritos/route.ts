import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Schema de validação
const favoritoSchema = z.object({
  tipoItem: z.enum(['PROPOSICAO', 'SESSAO', 'PARLAMENTAR', 'COMISSAO', 'PUBLICACAO']),
  itemId: z.string().min(1),
  notificarMudancas: z.boolean().optional().default(true),
  notificarVotacao: z.boolean().optional().default(true),
  notificarParecer: z.boolean().optional().default(true),
  anotacao: z.string().optional(),
})

/**
 * GET /api/favoritos - Lista favoritos do usuário
 *
 * Query params:
 * - tipo: filtrar por tipo (PROPOSICAO, SESSAO, etc)
 * - pagina: número da página (default: 1)
 * - limite: itens por página (default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    const pagina = parseInt(searchParams.get('pagina') || '1')
    const limite = parseInt(searchParams.get('limite') || '20')

    const where: any = {
      userId: session.user.id,
    }

    if (tipo) {
      where.tipoItem = tipo
    }

    const [favoritos, total] = await Promise.all([
      prisma.favorito.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      prisma.favorito.count({ where }),
    ])

    // Buscar dados dos itens favoritados
    const favoritosComDados = await Promise.all(
      favoritos.map(async (fav) => {
        const itemData = await buscarDadosItem(fav.tipoItem, fav.itemId)
        return {
          ...fav,
          item: itemData,
        }
      })
    )

    return NextResponse.json({
      favoritos: favoritosComDados,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
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
    const existente = await prisma.favorito.findUnique({
      where: {
        userId_tipoItem_itemId: {
          userId: session.user.id,
          tipoItem: dados.tipoItem,
          itemId: dados.itemId,
        },
      },
    })

    if (existente) {
      return NextResponse.json(
        { error: 'Item já está nos favoritos' },
        { status: 409 }
      )
    }

    // Verificar se o item existe
    const itemExiste = await verificarItemExiste(dados.tipoItem, dados.itemId)
    if (!itemExiste) {
      return NextResponse.json(
        { error: 'Item não encontrado' },
        { status: 404 }
      )
    }

    // Criar favorito
    const favorito = await prisma.favorito.create({
      data: {
        userId: session.user.id,
        tipoItem: dados.tipoItem,
        itemId: dados.itemId,
        notificarMudancas: dados.notificarMudancas,
        notificarVotacao: dados.notificarVotacao,
        notificarParecer: dados.notificarParecer,
        anotacao: dados.anotacao,
      },
    })

    const itemData = await buscarDadosItem(favorito.tipoItem, favorito.itemId)

    return NextResponse.json({
      favorito: {
        ...favorito,
        item: itemData,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao adicionar favorito:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * DELETE /api/favoritos - Remove item dos favoritos
 *
 * Query params:
 * - tipoItem: tipo do item
 * - itemId: ID do item
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

    const favorito = await prisma.favorito.findUnique({
      where: {
        userId_tipoItem_itemId: {
          userId: session.user.id,
          tipoItem: tipoItem as any,
          itemId,
        },
      },
    })

    if (!favorito) {
      return NextResponse.json(
        { error: 'Favorito não encontrado' },
        { status: 404 }
      )
    }

    await prisma.favorito.delete({
      where: { id: favorito.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao remover favorito:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * Busca dados do item favoritado
 */
async function buscarDadosItem(tipo: string, itemId: string) {
  try {
    switch (tipo) {
      case 'PROPOSICAO':
        return await prisma.proposicao.findUnique({
          where: { id: itemId },
          select: {
            id: true,
            numero: true,
            ano: true,
            tipo: true,
            ementa: true,
            status: true,
            dataApresentacao: true,
            autor: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        })

      case 'SESSAO':
        return await prisma.sessao.findUnique({
          where: { id: itemId },
          select: {
            id: true,
            numero: true,
            tipo: true,
            data: true,
            status: true,
            descricao: true,
          },
        })

      case 'PARLAMENTAR':
        return await prisma.parlamentar.findUnique({
          where: { id: itemId },
          select: {
            id: true,
            nome: true,
            partido: true,
            cargo: true,
            foto: true,
            ativo: true,
          },
        })

      case 'COMISSAO':
        return await prisma.comissao.findUnique({
          where: { id: itemId },
          select: {
            id: true,
            nome: true,
            sigla: true,
            tipo: true,
            ativa: true,
          },
        })

      case 'PUBLICACAO':
        return await prisma.publicacao.findUnique({
          where: { id: itemId },
          select: {
            id: true,
            titulo: true,
            tipo: true,
            numero: true,
            ano: true,
            data: true,
          },
        })

      default:
        return null
    }
  } catch (error) {
    console.error(`Erro ao buscar dados do item ${tipo}:`, error)
    return null
  }
}

/**
 * Verifica se o item existe
 */
async function verificarItemExiste(tipo: string, itemId: string): Promise<boolean> {
  try {
    switch (tipo) {
      case 'PROPOSICAO':
        return !!(await prisma.proposicao.findUnique({ where: { id: itemId } }))
      case 'SESSAO':
        return !!(await prisma.sessao.findUnique({ where: { id: itemId } }))
      case 'PARLAMENTAR':
        return !!(await prisma.parlamentar.findUnique({ where: { id: itemId } }))
      case 'COMISSAO':
        return !!(await prisma.comissao.findUnique({ where: { id: itemId } }))
      case 'PUBLICACAO':
        return !!(await prisma.publicacao.findUnique({ where: { id: itemId } }))
      default:
        return false
    }
  } catch (error) {
    console.error(`Erro ao verificar existência do item ${tipo}/${itemId}:`, error)
    return false
  }
}
