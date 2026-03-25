import { prisma } from '@/lib/prisma'

export interface FavoritoFilters {
  userId: string
  tipoItem?: string
}

export interface FavoritoPayload {
  userId: string
  tipoItem: string
  itemId: string
  notificarMudancas?: boolean
  notificarVotacao?: boolean
  notificarParecer?: boolean
  anotacao?: string
}

export const favoritoDbService = {
  async list(filters: FavoritoFilters, options: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, options.page ?? 1)
    const limit = Math.min(100, Math.max(1, options.limit ?? 20))
    const skip = (page - 1) * limit

    const where: any = { userId: filters.userId }
    if (filters.tipoItem) where.tipoItem = filters.tipoItem

    const [total, favoritos] = await Promise.all([
      prisma.favorito.count({ where }),
      prisma.favorito.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    ])

    // Enriquecer com dados dos itens
    const favoritosComDados = await Promise.all(
      favoritos.map(async (fav) => {
        const item = await buscarDadosItem(fav.tipoItem, fav.itemId)
        return { ...fav, item }
      })
    )

    const totalPages = Math.max(1, Math.ceil(total / limit))

    return {
      data: favoritosComDados,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
    }
  },

  async exists(userId: string, tipoItem: string, itemId: string) {
    return prisma.favorito.findUnique({
      where: {
        userId_tipoItem_itemId: { userId, tipoItem: tipoItem as any, itemId }
      }
    })
  },

  async create(payload: FavoritoPayload) {
    const favorito = await prisma.favorito.create({
      data: {
        userId: payload.userId,
        tipoItem: payload.tipoItem as any,
        itemId: payload.itemId,
        notificarMudancas: payload.notificarMudancas ?? true,
        notificarVotacao: payload.notificarVotacao ?? true,
        notificarParecer: payload.notificarParecer ?? true,
        anotacao: payload.anotacao
      }
    })

    const item = await buscarDadosItem(favorito.tipoItem, favorito.itemId)
    return { ...favorito, item }
  },

  async remove(userId: string, tipoItem: string, itemId: string) {
    const favorito = await prisma.favorito.findUnique({
      where: {
        userId_tipoItem_itemId: { userId, tipoItem: tipoItem as any, itemId }
      }
    })

    if (!favorito) return null

    await prisma.favorito.delete({ where: { id: favorito.id } })
    return { success: true }
  },

  async verificarItemExiste(tipo: string, itemId: string): Promise<boolean> {
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
    } catch {
      return false
    }
  }
}

async function buscarDadosItem(tipo: string, itemId: string) {
  try {
    switch (tipo) {
      case 'PROPOSICAO':
        return await prisma.proposicao.findUnique({
          where: { id: itemId },
          select: { id: true, numero: true, ano: true, tipo: true, ementa: true, status: true, dataApresentacao: true, autor: { select: { id: true, nome: true } } }
        })
      case 'SESSAO':
        return await prisma.sessao.findUnique({
          where: { id: itemId },
          select: { id: true, numero: true, tipo: true, data: true, status: true, descricao: true }
        })
      case 'PARLAMENTAR':
        return await prisma.parlamentar.findUnique({
          where: { id: itemId },
          select: { id: true, nome: true, partido: true, cargo: true, foto: true, ativo: true }
        })
      case 'COMISSAO':
        return await prisma.comissao.findUnique({
          where: { id: itemId },
          select: { id: true, nome: true, sigla: true, tipo: true, ativa: true }
        })
      case 'PUBLICACAO':
        return await prisma.publicacao.findUnique({
          where: { id: itemId },
          select: { id: true, titulo: true, tipo: true, numero: true, ano: true, data: true }
        })
      default:
        return null
    }
  } catch {
    return null
  }
}
