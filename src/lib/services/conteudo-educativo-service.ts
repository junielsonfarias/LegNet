import { prisma } from '@/lib/prisma'

export interface ConteudoEducativoFilters {
  categoria?: string
  publicado?: boolean
}

function gerarSlug(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const buildWhereClause = (filters: ConteudoEducativoFilters = {}) => {
  const where: Record<string, unknown> = {}

  if (filters.categoria) where.categoria = filters.categoria
  if (filters.publicado !== undefined) where.publicado = filters.publicado

  return where
}

export const conteudoEducativoService = {
  async list(filters: ConteudoEducativoFilters = {}) {
    return prisma.conteudoEducativo.findMany({
      where: buildWhereClause(filters),
      orderBy: [{ ordem: 'asc' }, { createdAt: 'desc' }],
    })
  },

  async getBySlug(slug: string) {
    return prisma.conteudoEducativo.findFirst({
      where: { slug, publicado: true },
    })
  },

  async getById(id: string) {
    return prisma.conteudoEducativo.findUnique({ where: { id } })
  },

  async create(data: {
    titulo: string
    slug?: string
    conteudo: string
    resumo?: string
    imagem?: string
    categoria: string
    ordem?: number
    publicado?: boolean
  }) {
    const slug = data.slug || gerarSlug(data.titulo)

    return prisma.conteudoEducativo.create({
      data: {
        titulo: data.titulo,
        slug,
        conteudo: data.conteudo,
        resumo: data.resumo ?? null,
        imagem: data.imagem ?? null,
        categoria: data.categoria,
        ordem: data.ordem ?? 0,
        publicado: data.publicado ?? false,
      },
    })
  },

  async update(id: string, data: Partial<{
    titulo: string
    slug: string
    conteudo: string
    resumo: string | null
    imagem: string | null
    categoria: string
    ordem: number
    publicado: boolean
  }>) {
    return prisma.conteudoEducativo.update({ where: { id }, data })
  },

  async delete(id: string) {
    await prisma.conteudoEducativo.delete({ where: { id } })
    return { success: true }
  },

  async getCategorias() {
    const result = await prisma.conteudoEducativo.findMany({
      select: { categoria: true },
      distinct: ['categoria'],
      orderBy: { categoria: 'asc' },
    })
    return result.map((r) => r.categoria)
  },

  async getPublicados(categoria?: string) {
    const where: Record<string, unknown> = { publicado: true }
    if (categoria) where.categoria = categoria

    return prisma.conteudoEducativo.findMany({
      where,
      orderBy: [{ ordem: 'asc' }, { createdAt: 'desc' }],
    })
  },
}
