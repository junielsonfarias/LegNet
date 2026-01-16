import { prisma } from './prisma'

export type AutorPublicacaoTipo = 'PARLAMENTAR' | 'COMISSAO' | 'ORGAO' | 'OUTRO'

export interface CategoriaPublicacao {
  id: string
  nome: string
  descricao?: string | null
  cor?: string | null
  ativa: boolean
  ordem: number
  createdAt: string
  updatedAt: string
}

export interface CategoriaPublicacaoPayload {
  nome: string
  descricao?: string | null
  cor?: string | null
  ativa?: boolean
  ordem?: number
}

const mapCategoria = (categoria: any): CategoriaPublicacao => ({
  id: categoria.id,
  nome: categoria.nome,
  descricao: categoria.descricao ?? null,
  cor: categoria.cor ?? null,
  ativa: Boolean(categoria.ativa),
  ordem: typeof categoria.ordem === 'number' ? categoria.ordem : 0,
  createdAt: new Date(categoria.createdAt).toISOString(),
  updatedAt: new Date(categoria.updatedAt).toISOString()
})

export const categoriasPublicacaoService = {
  async list(options: { includeInativas?: boolean } = {}) {
    const categorias = await prisma.categoriaPublicacao.findMany({
      where: options.includeInativas ? undefined : { ativa: true },
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }]
    })
    return categorias.map(mapCategoria)
  },

  async search(query: string) {
    const categorias = await prisma.categoriaPublicacao.findMany({
      where: {
        OR: [
          { nome: { contains: query, mode: 'insensitive' } },
          { descricao: { contains: query, mode: 'insensitive' } }
        ]
      },
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }]
    })
    return categorias.map(mapCategoria)
  },

  async getById(id: string) {
    const categoria = await prisma.categoriaPublicacao.findUnique({
      where: { id }
    })
    return categoria ? mapCategoria(categoria) : null
  },

  async create(payload: CategoriaPublicacaoPayload) {
    const categoria = await prisma.categoriaPublicacao.create({
      data: {
        nome: payload.nome.trim(),
        descricao: payload.descricao?.trim() || null,
        cor: payload.cor?.trim() || '#0f172a',
        ativa: payload.ativa ?? true,
        ordem: payload.ordem ?? 0
      }
    })
    return mapCategoria(categoria)
  },

  async update(id: string, payload: Partial<CategoriaPublicacaoPayload>) {
    const categoria = await prisma.categoriaPublicacao.update({
      where: { id },
      data: {
        ...(payload.nome !== undefined ? { nome: payload.nome.trim() } : {}),
        ...(payload.descricao !== undefined ? { descricao: payload.descricao?.trim() || null } : {}),
        ...(payload.cor !== undefined ? { cor: payload.cor?.trim() || '#0f172a' } : {}),
        ...(payload.ativa !== undefined ? { ativa: payload.ativa } : {}),
        ...(payload.ordem !== undefined ? { ordem: payload.ordem } : {})
      }
    })
    return mapCategoria(categoria)
  },

  async toggleStatus(id: string, ativa: boolean) {
    const categoria = await prisma.categoriaPublicacao.update({
      where: { id },
      data: { ativa }
    })
    return mapCategoria(categoria)
  },

  async remove(id: string) {
    await prisma.categoriaPublicacao.delete({
      where: { id }
    })
    return { success: true }
  }
}


