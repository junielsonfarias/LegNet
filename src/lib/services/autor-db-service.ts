import { prisma } from '@/lib/prisma'

export interface AutorFilters {
  ativo?: boolean
  tipoAutorId?: string
  search?: string
}

export interface AutorPayload {
  tipoAutorId: string
  nome: string
  descricao?: string | null
  parlamentarId?: string | null
  comissaoId?: string | null
  cargo?: string | null
  email?: string | null
  telefone?: string | null
  ativo?: boolean
}

const buildWhereClause = (filters: AutorFilters = {}) => {
  const where: any = {}

  if (filters.ativo !== undefined) where.ativo = filters.ativo
  if (filters.tipoAutorId) where.tipoAutorId = filters.tipoAutorId
  if (filters.search) {
    where.OR = [
      { nome: { contains: filters.search, mode: 'insensitive' } },
      { cargo: { contains: filters.search, mode: 'insensitive' } }
    ]
  }

  return where
}

const defaultInclude = {
  tipoAutor: true,
  parlamentar: {
    select: {
      id: true,
      nome: true,
      apelido: true,
      foto: true,
      partido: true,
      ativo: true
    }
  },
  comissao: {
    select: {
      id: true,
      nome: true,
      sigla: true,
      tipo: true,
      ativa: true
    }
  },
  _count: {
    select: { proposicoes: true }
  }
}

export const autorDbService = {
  async list(filters: AutorFilters = {}) {
    return prisma.autor.findMany({
      where: buildWhereClause(filters),
      orderBy: [{ nome: 'asc' }],
      include: defaultInclude
    })
  },

  async getById(id: string) {
    return prisma.autor.findUnique({
      where: { id },
      include: {
        ...defaultInclude,
        proposicoes: {
          take: 10,
          orderBy: { createdAt: 'desc' as const },
          select: {
            id: true,
            numero: true,
            ano: true,
            tipo: true,
            ementa: true,
            status: true
          }
        }
      }
    })
  },

  async checkParlamentarVinculado(parlamentarId: string, excludeId?: string) {
    const where: any = { parlamentarId }
    if (excludeId) where.id = { not: excludeId }
    return prisma.autor.findFirst({ where })
  },

  async create(payload: AutorPayload) {
    return prisma.autor.create({
      data: {
        tipoAutorId: payload.tipoAutorId,
        nome: payload.nome,
        descricao: payload.descricao || null,
        parlamentarId: payload.parlamentarId || null,
        comissaoId: payload.comissaoId || null,
        cargo: payload.cargo || null,
        email: payload.email || null,
        telefone: payload.telefone || null,
        ativo: payload.ativo ?? true
      },
      include: {
        tipoAutor: true,
        parlamentar: { select: { id: true, nome: true, foto: true } },
        comissao: { select: { id: true, nome: true, sigla: true } }
      }
    })
  },

  async update(id: string, payload: Partial<AutorPayload>) {
    const data: any = {}

    if (payload.tipoAutorId !== undefined) data.tipoAutorId = payload.tipoAutorId
    if (payload.nome !== undefined) data.nome = payload.nome
    if (payload.descricao !== undefined) data.descricao = payload.descricao || null
    if (payload.parlamentarId !== undefined) data.parlamentarId = payload.parlamentarId || null
    if (payload.comissaoId !== undefined) data.comissaoId = payload.comissaoId || null
    if (payload.cargo !== undefined) data.cargo = payload.cargo || null
    if (payload.email !== undefined) data.email = payload.email || null
    if (payload.telefone !== undefined) data.telefone = payload.telefone || null
    if (payload.ativo !== undefined) data.ativo = payload.ativo

    return prisma.autor.update({
      where: { id },
      data,
      include: defaultInclude
    })
  },

  async remove(id: string) {
    // Verificar se tem proposições vinculadas
    const count = await prisma.proposicao.count({ where: { autorId: id } })
    if (count > 0) {
      throw new Error(`Autor possui ${count} proposições vinculadas e não pode ser excluído`)
    }
    await prisma.autor.delete({ where: { id } })
    return { success: true }
  }
}
