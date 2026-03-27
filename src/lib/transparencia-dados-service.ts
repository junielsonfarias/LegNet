import { prisma } from '@/lib/prisma'

export const transparenciaService = {
  async getByCategoria(categoria: string) {
    return prisma.transparenciaConteudo.findMany({
      where: { categoriaSlug: categoria, status: 'publicado' },
      orderBy: { dataPublicacao: 'desc' },
    })
  },

  async getBySubcategoria(categoria: string, subcategoria: string) {
    return prisma.transparenciaConteudo.findMany({
      where: { categoriaSlug: categoria, subcategoria, status: 'publicado' },
      orderBy: { dataPublicacao: 'desc' },
    })
  },

  async getByAno(ano: number) {
    return prisma.transparenciaConteudo.findMany({
      where: { ano, status: 'publicado' },
      orderBy: { dataPublicacao: 'desc' },
    })
  },

  async getByTipo(tipo: string) {
    return prisma.transparenciaConteudo.findMany({
      where: { tipo },
      orderBy: { dataPublicacao: 'desc' },
    })
  },

  async search(query: string) {
    return prisma.transparenciaConteudo.findMany({
      where: {
        OR: [
          { titulo: { contains: query, mode: 'insensitive' } },
          { descricao: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { dataPublicacao: 'desc' },
    })
  },

  async getCategorias() {
    const result = await prisma.transparenciaConteudo.findMany({
      select: { categoriaSlug: true },
      distinct: ['categoriaSlug'],
      orderBy: { categoriaSlug: 'asc' },
    })
    return result.map((r) => r.categoriaSlug)
  },

  async getSubcategorias(categoria: string) {
    const result = await prisma.transparenciaConteudo.findMany({
      where: { categoriaSlug: categoria },
      select: { subcategoria: true },
      distinct: ['subcategoria'],
      orderBy: { subcategoria: 'asc' },
    })
    return result.map((r) => r.subcategoria)
  },

  async getAnos() {
    const result = await prisma.transparenciaConteudo.findMany({
      select: { ano: true },
      distinct: ['ano'],
      orderBy: { ano: 'desc' },
    })
    return result.map((r) => r.ano)
  },

  async getTipos() {
    const result = await prisma.transparenciaConteudo.findMany({
      select: { tipo: true },
      distinct: ['tipo'],
      orderBy: { tipo: 'asc' },
    })
    return result.map((r) => r.tipo)
  },

  async getById(id: string) {
    return prisma.transparenciaConteudo.findUnique({ where: { id } })
  },

  async getEstatisticas() {
    const [total, porCategoria, porTipo, porAno] = await Promise.all([
      prisma.transparenciaConteudo.count(),
      prisma.transparenciaConteudo.groupBy({
        by: ['categoriaSlug'],
        _count: { _all: true },
      }),
      prisma.transparenciaConteudo.groupBy({
        by: ['tipo'],
        _count: { _all: true },
      }),
      prisma.transparenciaConteudo.groupBy({
        by: ['ano'],
        _count: { _all: true },
      }),
    ])

    return {
      total,
      porCategoria: porCategoria.reduce(
        (acc, item) => {
          acc[item.categoriaSlug] = item._count._all
          return acc
        },
        {} as Record<string, number>
      ),
      porTipo: porTipo.reduce(
        (acc, item) => {
          acc[item.tipo] = item._count._all
          return acc
        },
        {} as Record<string, number>
      ),
      porAno: porAno.reduce(
        (acc, item) => {
          acc[item.ano] = item._count._all
          return acc
        },
        {} as Record<number, number>
      ),
    }
  },

  async getAll() {
    const [data, categorias, tipos, anos, publicados, rascunhos, arquivados] = await Promise.all([
      prisma.transparenciaConteudo.findMany({ orderBy: { dataPublicacao: 'desc' } }),
      prisma.transparenciaConteudo
        .findMany({ select: { categoriaSlug: true }, distinct: ['categoriaSlug'] })
        .then((r) => r.map((i) => i.categoriaSlug)),
      prisma.transparenciaConteudo
        .findMany({ select: { tipo: true }, distinct: ['tipo'] })
        .then((r) => r.map((i) => i.tipo)),
      prisma.transparenciaConteudo
        .findMany({ select: { ano: true }, distinct: ['ano'], orderBy: { ano: 'desc' } })
        .then((r) => r.map((i) => i.ano)),
      prisma.transparenciaConteudo.count({ where: { status: 'publicado' } }),
      prisma.transparenciaConteudo.count({ where: { status: 'rascunho' } }),
      prisma.transparenciaConteudo.count({ where: { status: 'arquivado' } }),
    ])

    return {
      data,
      categorias,
      tipos,
      anos,
      stats: {
        total: data.length,
        publicados,
        rascunhos,
        arquivados,
      },
    }
  },

  async getRecentes(limite: number = 10) {
    const data = await prisma.transparenciaConteudo.findMany({
      where: { status: 'publicado' },
      orderBy: { dataPublicacao: 'desc' },
      take: limite,
    })
    return { data }
  },

  async getMaisAcessados(limite: number = 10) {
    const data = await prisma.transparenciaConteudo.findMany({
      where: { status: 'publicado' },
      orderBy: { dataPublicacao: 'desc' },
      take: limite,
    })
    return { data }
  },

  async getPorSubcategoria(categoria: string) {
    const items = await prisma.transparenciaConteudo.findMany({
      where: { categoriaSlug: categoria },
      orderBy: { dataPublicacao: 'desc' },
    })

    const subcategoriaSet = Array.from(new Set(items.map((i) => i.subcategoria)))

    return {
      data: items,
      subcategorias: subcategoriaSet.map((subcategoria) => ({
        nome: subcategoria,
        total: items.filter((i) => i.subcategoria === subcategoria).length,
        publicados: items.filter((i) => i.subcategoria === subcategoria && i.status === 'publicado').length,
      })),
    }
  },

  async getEstatisticasPorCategoria() {
    const items = await prisma.transparenciaConteudo.findMany({
      select: {
        categoriaSlug: true,
        status: true,
        dataPublicacao: true,
      },
    })

    const categoriaSet = Array.from(new Set(items.map((i) => i.categoriaSlug)))

    return categoriaSet
      .map((categoria) => {
        const catItems = items.filter((i) => i.categoriaSlug === categoria)
        return {
          categoria,
          total: catItems.length,
          publicados: catItems.filter((i) => i.status === 'publicado').length,
          rascunhos: catItems.filter((i) => i.status === 'rascunho').length,
          arquivados: catItems.filter((i) => i.status === 'arquivado').length,
          ultimaAtualizacao:
            catItems.length > 0
              ? Math.max(...catItems.map((i) => new Date(i.dataPublicacao).getTime()))
              : 0,
        }
      })
      .sort((a, b) => b.total - a.total)
  },
}
