import { prisma } from '@/lib/prisma'

export interface NoticiaFilters {
  categoria?: string
  publicada?: boolean
  search?: string
}

export interface NoticiaPayload {
  titulo: string
  resumo?: string | null
  conteudo: string
  imagem?: string | null
  categoria?: string | null
  tags?: string[]
  publicada?: boolean
  dataPublicacao?: string | null
}

const buildWhereClause = (filters: NoticiaFilters = {}) => {
  const where: Record<string, unknown> = {}

  if (filters.categoria) where.categoria = { contains: filters.categoria, mode: 'insensitive' }
  if (filters.publicada !== undefined) where.publicada = filters.publicada
  if (filters.search) {
    where.OR = [
      { titulo: { contains: filters.search, mode: 'insensitive' } },
      { resumo: { contains: filters.search, mode: 'insensitive' } }
    ]
  }

  return where
}

export const noticiasDbService = {
  async list(filters: NoticiaFilters = {}) {
    return prisma.noticia.findMany({
      where: buildWhereClause(filters),
      orderBy: [{ dataPublicacao: 'desc' }, { createdAt: 'desc' }]
    })
  },

  async paginate(filters: NoticiaFilters = {}, options: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, options.page ?? 1)
    const limit = Math.min(100, Math.max(1, options.limit ?? 10))
    const skip = (page - 1) * limit
    const where = buildWhereClause(filters)

    const [total, noticias] = await Promise.all([
      prisma.noticia.count({ where }),
      prisma.noticia.findMany({
        where,
        orderBy: [{ dataPublicacao: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit
      })
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))

    return {
      data: noticias,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
    }
  },

  async getById(id: string) {
    return prisma.noticia.findUnique({ where: { id } })
  },

  async create(payload: NoticiaPayload) {
    return prisma.noticia.create({
      data: {
        titulo: payload.titulo,
        conteudo: payload.conteudo,
        resumo: payload.resumo || null,
        categoria: payload.categoria || null,
        tags: payload.tags || [],
        imagem: payload.imagem || null,
        publicada: payload.publicada || false,
        dataPublicacao: payload.dataPublicacao
          ? new Date(payload.dataPublicacao)
          : payload.publicada
            ? new Date()
            : null
      }
    })
  },

  async update(id: string, payload: Partial<NoticiaPayload>) {
    const data: any = {}

    if (payload.titulo !== undefined) data.titulo = payload.titulo
    if (payload.conteudo !== undefined) data.conteudo = payload.conteudo
    if (payload.resumo !== undefined) data.resumo = payload.resumo || null
    if (payload.categoria !== undefined) data.categoria = payload.categoria || null
    if (payload.tags !== undefined) data.tags = payload.tags
    if (payload.imagem !== undefined) data.imagem = payload.imagem || null
    if (payload.publicada !== undefined) {
      data.publicada = payload.publicada
      if (payload.publicada && !payload.dataPublicacao) {
        data.dataPublicacao = new Date()
      }
    }
    if (payload.dataPublicacao !== undefined) {
      data.dataPublicacao = payload.dataPublicacao ? new Date(payload.dataPublicacao) : null
    }

    return prisma.noticia.update({ where: { id }, data })
  },

  async remove(id: string) {
    await prisma.noticia.delete({ where: { id } })
    return { success: true }
  },

  async getStats() {
    const [total, publicadas, porCategoria] = await Promise.all([
      prisma.noticia.count(),
      prisma.noticia.count({ where: { publicada: true } }),
      prisma.noticia.groupBy({ by: ['categoria'], _count: { _all: true }, where: { publicada: true } })
    ])

    return {
      total,
      publicadas,
      porCategoria: porCategoria.reduce((acc, item) => {
        if (item.categoria) acc[item.categoria] = item._count._all
        return acc
      }, {} as Record<string, number>)
    }
  }
}
