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

    const where: Record<string, unknown> = { userId: filters.userId }
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

    // Enriquecer com dados dos itens em BATCH (antes era N+1 — 1 query por favorito).
    // Agrupa por tipoItem e faz 1 query por tipo, depois monta um Map para lookup O(1).
    const itensMap = await buscarDadosItensBatch(
      favoritos.map((f) => ({ tipo: f.tipoItem, itemId: f.itemId })),
    )
    const favoritosComDados = favoritos.map((fav) => ({
      ...fav,
      item: itensMap.get(`${fav.tipoItem}:${fav.itemId}`) ?? null,
    }))

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

  async getById(id: string) {
    return prisma.favorito.findUnique({ where: { id } })
  },

  async updateById(id: string, data: { notificarMudancas?: boolean; notificarVotacao?: boolean; notificarParecer?: boolean; anotacao?: string | null }) {
    return prisma.favorito.update({ where: { id }, data })
  },

  async deleteById(id: string) {
    await prisma.favorito.delete({ where: { id } })
    return { success: true }
  },

  async checkMultiple(userId: string, itens: Array<{ tipoItem: string; itemId: string }>) {
    return prisma.favorito.findMany({
      where: {
        userId,
        OR: itens.map((item) => ({
          tipoItem: item.tipoItem as any,
          itemId: item.itemId,
        })),
      },
    })
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

/**
 * Batch-lookup de dados de itens favoritados. Agrupa por tipo e faz 1 query
 * por tipo (em vez de 1 por item), retornando um Map com chave `tipo:itemId`.
 *
 * Elimina o N+1 original (ver favorito-db-service.ts:39-43 pre-fix).
 */
async function buscarDadosItensBatch(
  items: Array<{ tipo: string; itemId: string }>,
): Promise<Map<string, unknown>> {
  const map = new Map<string, unknown>()
  if (items.length === 0) return map

  // Agrupa ids por tipo
  const idsPorTipo: Record<string, string[]> = {}
  for (const { tipo, itemId } of items) {
    if (!idsPorTipo[tipo]) idsPorTipo[tipo] = []
    idsPorTipo[tipo].push(itemId)
  }

  // Dispara as queries em paralelo, uma por tipo
  const tasks: Array<Promise<void>> = []

  if (idsPorTipo.PROPOSICAO?.length) {
    tasks.push(
      prisma.proposicao
        .findMany({
          where: { id: { in: idsPorTipo.PROPOSICAO } },
          select: {
            id: true,
            numero: true,
            ano: true,
            tipo: true,
            ementa: true,
            status: true,
            dataApresentacao: true,
            autor: { select: { id: true, nome: true } },
          },
        })
        .then((rows) => {
          for (const r of rows) map.set(`PROPOSICAO:${r.id}`, r)
        }),
    )
  }

  if (idsPorTipo.SESSAO?.length) {
    tasks.push(
      prisma.sessao
        .findMany({
          where: { id: { in: idsPorTipo.SESSAO } },
          select: { id: true, numero: true, tipo: true, data: true, status: true, descricao: true },
        })
        .then((rows) => {
          for (const r of rows) map.set(`SESSAO:${r.id}`, r)
        }),
    )
  }

  if (idsPorTipo.PARLAMENTAR?.length) {
    tasks.push(
      prisma.parlamentar
        .findMany({
          where: { id: { in: idsPorTipo.PARLAMENTAR } },
          select: { id: true, nome: true, partido: true, cargo: true, foto: true, ativo: true },
        })
        .then((rows) => {
          for (const r of rows) map.set(`PARLAMENTAR:${r.id}`, r)
        }),
    )
  }

  if (idsPorTipo.COMISSAO?.length) {
    tasks.push(
      prisma.comissao
        .findMany({
          where: { id: { in: idsPorTipo.COMISSAO } },
          select: { id: true, nome: true, sigla: true, tipo: true, ativa: true },
        })
        .then((rows) => {
          for (const r of rows) map.set(`COMISSAO:${r.id}`, r)
        }),
    )
  }

  if (idsPorTipo.PUBLICACAO?.length) {
    tasks.push(
      prisma.publicacao
        .findMany({
          where: { id: { in: idsPorTipo.PUBLICACAO } },
          select: { id: true, titulo: true, tipo: true, numero: true, ano: true, data: true },
        })
        .then((rows) => {
          for (const r of rows) map.set(`PUBLICACAO:${r.id}`, r)
        }),
    )
  }

  await Promise.all(tasks)
  return map
}
