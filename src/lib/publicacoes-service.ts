import { prisma } from './prisma'

import type { CategoriaPublicacao, AutorPublicacaoTipo } from './categorias-publicacao-service'

export interface Publicacao {
  id: string
  titulo: string
  descricao: string | null
  tipo: string
  numero: string | null
  ano: number
  data: string
  conteudo: string
  arquivo: string | null
  tamanho: string | null
  publicada: boolean
  visualizacoes: number
  categoriaId: string | null
  categoria?: CategoriaPublicacao | null
  autorTipo: AutorPublicacaoTipo
  autorNome: string
  autorId: string | null
  autorParlamentar?: {
    id: string
    nome: string
    apelido?: string | null
    partido?: string | null
  } | null
  createdAt: string
  updatedAt: string
}

export interface PublicacaoPayload {
  titulo: string
  descricao?: string | null
  tipo: string
  numero?: string | null
  ano?: number
  data?: string | Date
  conteudo: string
  arquivo?: string | null
  tamanho?: string | null
  publicada?: boolean
  categoriaId?: string | null
  autorTipo?: AutorPublicacaoTipo
  autorNome?: string
  autorId?: string | null
}

export interface PublicacaoFilters {
  categoriaId?: string
  autorTipo?: AutorPublicacaoTipo
  publicada?: boolean
  search?: string
  tipo?: string
  ano?: number
}

const mapCategoria = (categoria?: any): CategoriaPublicacao | null => {
  if (!categoria) return null
  return {
    id: categoria.id,
    nome: categoria.nome,
    descricao: categoria.descricao ?? null,
    cor: categoria.cor ?? null,
    ativa: Boolean(categoria.ativa),
    ordem: typeof categoria.ordem === 'number' ? categoria.ordem : 0,
    createdAt: new Date(categoria.createdAt).toISOString(),
    updatedAt: new Date(categoria.updatedAt).toISOString()
  }
}

const mapPublicacao = (publicacao: any): Publicacao => ({
  id: publicacao.id,
  titulo: publicacao.titulo,
  descricao: publicacao.descricao ?? null,
  tipo: publicacao.tipo,
  numero: publicacao.numero ?? null,
  ano: publicacao.ano,
  data: new Date(publicacao.data).toISOString(),
  conteudo: publicacao.conteudo,
  arquivo: publicacao.arquivo ?? null,
  tamanho: publicacao.tamanho ?? null,
  publicada: Boolean(publicacao.publicada),
  visualizacoes: publicacao.visualizacoes ?? 0,
  categoriaId: publicacao.categoriaId ?? null,
  categoria: mapCategoria(publicacao.categoria),
  autorTipo: publicacao.autorTipo,
  autorNome: publicacao.autorNome,
  autorId: publicacao.autorId ?? null,
  autorParlamentar: publicacao.autorParlamentar
    ? {
        id: publicacao.autorParlamentar.id,
        nome: publicacao.autorParlamentar.nome,
        apelido: publicacao.autorParlamentar.apelido ?? null,
        partido: publicacao.autorParlamentar.partido ?? null
      }
    : null,
  createdAt: new Date(publicacao.createdAt).toISOString(),
  updatedAt: new Date(publicacao.updatedAt).toISOString()
})

const buildWhereClause = (filters: PublicacaoFilters = {}) => {
  const where: any = {}

  if (filters.categoriaId) {
    where.categoriaId = filters.categoriaId
  }

  if (filters.autorTipo) {
    where.autorTipo = filters.autorTipo
  }

  if (filters.publicada !== undefined) {
    where.publicada = filters.publicada
  }

  if (filters.tipo) {
    where.tipo = filters.tipo
  }

  if (filters.ano) {
    where.ano = filters.ano
  }

  if (filters.search) {
    const term = filters.search.trim()
    where.OR = [
      { titulo: { contains: term, mode: 'insensitive' } },
      { descricao: { contains: term, mode: 'insensitive' } },
      { autorNome: { contains: term, mode: 'insensitive' } }
    ]
  }

  return where
}

export const publicacoesService = {
  async list(filters: PublicacaoFilters = {}) {
    const publicacoes = await prisma.publicacao.findMany({
      where: buildWhereClause(filters),
      orderBy: [{ data: 'desc' }, { createdAt: 'desc' }],
      include: {
        categoria: true,
        autorParlamentar: true
      }
    })

    return publicacoes.map(mapPublicacao)
  },

  async paginate(filters: PublicacaoFilters = {}, options: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, options.page ?? 1)
    const limit = Math.min(100, Math.max(1, options.limit ?? 10))
    const skip = (page - 1) * limit

    const where = buildWhereClause(filters)

    const [total, registros] = await Promise.all([
      prisma.publicacao.count({ where }),
      prisma.publicacao.findMany({
        where,
        orderBy: [{ data: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        include: {
          categoria: true,
          autorParlamentar: true
        }
      })
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))

    return {
      data: registros.map(mapPublicacao),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  },

  async getById(id: string) {
    const publicacao = await prisma.publicacao.findUnique({
      where: { id },
      include: {
        categoria: true,
        autorParlamentar: true
      }
    })
    return publicacao ? mapPublicacao(publicacao) : null
  },

  async create(payload: PublicacaoPayload) {
    const ano = payload.ano ?? (payload.data ? new Date(payload.data).getFullYear() : new Date().getFullYear())
    const data = payload.data ? new Date(payload.data) : new Date()

    const publicacao = await prisma.publicacao.create({
      data: {
        titulo: payload.titulo.trim(),
        descricao: payload.descricao?.trim() || null,
        tipo: payload.tipo as any,
        numero: payload.numero?.trim() || null,
        ano,
        data,
        conteudo: payload.conteudo,
        arquivo: payload.arquivo?.trim() || null,
        tamanho: payload.tamanho?.trim() || null,
        publicada: payload.publicada ?? false,
        categoriaId: payload.categoriaId || null,
        autorTipo: payload.autorTipo ?? 'OUTRO',
        autorNome: payload.autorNome?.trim() || 'Autor não informado',
        autorId: payload.autorId || null
      },
      include: {
        categoria: true,
        autorParlamentar: true
      }
    })

    return mapPublicacao(publicacao)
  },

  async update(id: string, payload: Partial<PublicacaoPayload>) {
    const data: any = {}

    if (payload.titulo !== undefined) data.titulo = payload.titulo.trim()
    if (payload.descricao !== undefined) data.descricao = payload.descricao?.trim() || null
    if (payload.tipo !== undefined) data.tipo = payload.tipo
    if (payload.numero !== undefined) data.numero = payload.numero?.trim() || null
    if (payload.ano !== undefined) data.ano = payload.ano
    if (payload.data !== undefined) data.data = new Date(payload.data)
    if (payload.conteudo !== undefined) data.conteudo = payload.conteudo
    if (payload.arquivo !== undefined) data.arquivo = payload.arquivo?.trim() || null
    if (payload.tamanho !== undefined) data.tamanho = payload.tamanho?.trim() || null
    if (payload.publicada !== undefined) data.publicada = payload.publicada
    if (payload.categoriaId !== undefined) data.categoriaId = payload.categoriaId || null
    if (payload.autorTipo !== undefined) data.autorTipo = payload.autorTipo
    if (payload.autorNome !== undefined) data.autorNome = payload.autorNome?.trim() || 'Autor não informado'
    if (payload.autorId !== undefined) data.autorId = payload.autorId || null

    if (payload.ano === undefined && payload.data) {
      data.ano = new Date(payload.data).getFullYear()
    }

    const publicacao = await prisma.publicacao.update({
      where: { id },
      data,
      include: {
        categoria: true,
        autorParlamentar: true
      }
    })

    return mapPublicacao(publicacao)
  },

  async remove(id: string) {
    await prisma.publicacao.delete({
      where: { id }
    })
    return { success: true }
  },

  async incrementarVisualizacoes(id: string) {
    const publicacao = await prisma.publicacao.update({
      where: { id },
      data: {
        visualizacoes: {
          increment: 1
        }
      },
      include: {
        categoria: true,
        autorParlamentar: true
      }
    })
    return mapPublicacao(publicacao)
  },

  async getStats() {
    const [total, publicadas, categorias, visualizacoes] = await Promise.all([
      prisma.publicacao.count(),
      prisma.publicacao.count({ where: { publicada: true } }),
      prisma.categoriaPublicacao.count(),
      prisma.publicacao.aggregate({
        _sum: { visualizacoes: true }
      })
    ])

    return {
      total,
      publicadas,
      rascunhos: total - publicadas,
      totalVisualizacoes: visualizacoes._sum.visualizacoes ?? 0,
      categorias
    }
  },

  async getStatsByCategoria() {
    const [agrupados, categorias] = await Promise.all([
      prisma.publicacao.groupBy({
        by: ['categoriaId'],
        _count: { _all: true },
        _sum: { visualizacoes: true }
      }),
      prisma.categoriaPublicacao.findMany({
        select: { id: true, nome: true }
      })
    ])

    const categoriaMap = new Map(categorias.map(cat => [cat.id, cat.nome]))

    return agrupados.map(entry => ({
      categoriaId: entry.categoriaId,
      categoria: entry.categoriaId ? categoriaMap.get(entry.categoriaId) ?? 'Sem categoria' : 'Sem categoria',
      quantidade: entry._count._all,
      visualizacoes: entry._sum.visualizacoes ?? 0
    }))
  },

  async getRecentes(quantidade = 5) {
    const publicacoes = await prisma.publicacao.findMany({
      where: { publicada: true },
      orderBy: [{ data: 'desc' }, { createdAt: 'desc' }],
      take: quantidade,
      include: {
        categoria: true,
        autorParlamentar: true
      }
    })

    return publicacoes.map(mapPublicacao)
  },

  async getAnosDisponiveis() {
    const anos = await prisma.publicacao.groupBy({
      by: ['ano'],
      _count: { _all: true },
      orderBy: { ano: 'desc' }
    })
    return anos.map(entry => entry.ano)
  }
}


