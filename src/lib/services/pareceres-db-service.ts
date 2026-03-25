import { prisma } from '@/lib/prisma'
import type { TipoVoto } from '@prisma/client'

export interface ParecerFilters {
  comissaoId?: string
  proposicaoId?: string
  relatorId?: string
  status?: string
  tipo?: string
  ano?: number
}

const defaultInclude = {
  proposicao: {
    select: { id: true, numero: true, ano: true, tipo: true, titulo: true, ementa: true, status: true }
  },
  comissao: {
    select: { id: true, nome: true, sigla: true, tipo: true }
  },
  relator: {
    select: { id: true, nome: true, apelido: true, partido: true, foto: true }
  },
  _count: { select: { votosComissao: true } }
}

const buildWhereClause = (filters: ParecerFilters = {}) => {
  const where: any = {}
  if (filters.comissaoId) where.comissaoId = filters.comissaoId
  if (filters.proposicaoId) where.proposicaoId = filters.proposicaoId
  if (filters.relatorId) where.relatorId = filters.relatorId
  if (filters.status) where.status = filters.status
  if (filters.tipo) where.tipo = filters.tipo
  if (filters.ano) where.ano = filters.ano
  return where
}

export const pareceresDbService = {
  async list(filters: ParecerFilters = {}) {
    return prisma.parecer.findMany({
      where: buildWhereClause(filters),
      include: defaultInclude,
      orderBy: [{ dataDistribuicao: 'desc' }]
    })
  },

  async getById(id: string) {
    return prisma.parecer.findUnique({
      where: { id },
      include: {
        ...defaultInclude,
        votosComissao: {
          include: {
            parlamentar: { select: { id: true, nome: true, apelido: true, partido: true } }
          }
        }
      }
    })
  },

  async checkDuplicate(proposicaoId: string, comissaoId: string) {
    return prisma.parecer.findUnique({
      where: { proposicaoId_comissaoId: { proposicaoId, comissaoId } }
    })
  },

  async getNextNumero(comissaoId: string, ano: number) {
    const ultimo = await prisma.parecer.findFirst({
      where: { ano, comissaoId },
      orderBy: { createdAt: 'desc' }
    })

    let proximo = 1
    if (ultimo?.numero) {
      const match = ultimo.numero.match(/^(\d+)/)
      if (match) proximo = parseInt(match[1]) + 1
    }

    return proximo
  },

  async create(data: any) {
    return prisma.parecer.create({
      data,
      include: {
        proposicao: { select: { id: true, numero: true, ano: true, tipo: true, titulo: true } },
        comissao: { select: { id: true, nome: true, sigla: true } },
        relator: { select: { id: true, nome: true, apelido: true } }
      }
    })
  },

  async update(id: string, data: any) {
    return prisma.parecer.update({
      where: { id },
      data,
      include: defaultInclude
    })
  },

  async remove(id: string) {
    await prisma.parecer.delete({ where: { id } })
    return { success: true }
  },

  async registrarVoto(parecerId: string, parlamentarId: string, voto: string, justificativa?: string) {
    return prisma.votoParecerComissao.upsert({
      where: {
        parecerId_parlamentarId: { parecerId, parlamentarId }
      },
      update: { voto: voto as TipoVoto },
      create: {
        parecerId,
        parlamentarId,
        voto: voto as TipoVoto
      },
      include: {
        parlamentar: { select: { id: true, nome: true, apelido: true } }
      }
    })
  }
}
