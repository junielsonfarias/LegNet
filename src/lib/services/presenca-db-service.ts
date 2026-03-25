import { prisma } from '@/lib/prisma'

export interface PresencaFilters {
  sessaoId?: string
  parlamentarId?: string
  presente?: boolean
}

export interface PresencaPayload {
  sessaoId: string
  parlamentarId: string
  presente: boolean
  justificativa?: string | null
}

export const presencaDbService = {
  async listBySessao(sessaoId: string) {
    return prisma.presencaSessao.findMany({
      where: { sessaoId },
      include: {
        parlamentar: {
          select: {
            id: true,
            nome: true,
            apelido: true,
            partido: true,
            cargo: true,
            foto: true
          }
        }
      },
      orderBy: { parlamentar: { nome: 'asc' } }
    })
  },

  async listByParlamentar(parlamentarId: string, options: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, options.page ?? 1)
    const limit = Math.min(100, Math.max(1, options.limit ?? 20))
    const skip = (page - 1) * limit

    const where = { parlamentarId }

    const [total, presencas] = await Promise.all([
      prisma.presencaSessao.count({ where }),
      prisma.presencaSessao.findMany({
        where,
        include: {
          sessao: {
            select: {
              id: true,
              numero: true,
              tipo: true,
              data: true,
              status: true
            }
          }
        },
        orderBy: { sessao: { data: 'desc' } },
        skip,
        take: limit
      })
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))

    return {
      data: presencas,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
    }
  },

  async registrar(payload: PresencaPayload) {
    return prisma.presencaSessao.upsert({
      where: {
        sessaoId_parlamentarId: {
          sessaoId: payload.sessaoId,
          parlamentarId: payload.parlamentarId
        }
      },
      update: {
        presente: payload.presente,
        justificativa: payload.justificativa || null
      },
      create: {
        sessaoId: payload.sessaoId,
        parlamentarId: payload.parlamentarId,
        presente: payload.presente,
        justificativa: payload.justificativa || null
      },
      include: {
        parlamentar: {
          select: { id: true, nome: true, apelido: true, partido: true }
        }
      }
    })
  },

  async registrarLote(sessaoId: string, presencas: Omit<PresencaPayload, 'sessaoId'>[]) {
    const results = await Promise.all(
      presencas.map(p =>
        presencaDbService.registrar({ ...p, sessaoId })
      )
    )
    return results
  },

  async getStats(sessaoId: string) {
    const [total, presentes, ausentes] = await Promise.all([
      prisma.presencaSessao.count({ where: { sessaoId } }),
      prisma.presencaSessao.count({ where: { sessaoId, presente: true } }),
      prisma.presencaSessao.count({ where: { sessaoId, presente: false } })
    ])

    return { total, presentes, ausentes, quorum: total > 0 ? presentes / total : 0 }
  },

  async getStatsParlamentar(parlamentarId: string) {
    const [total, presentes] = await Promise.all([
      prisma.presencaSessao.count({ where: { parlamentarId } }),
      prisma.presencaSessao.count({ where: { parlamentarId, presente: true } })
    ])

    return {
      total,
      presentes,
      ausentes: total - presentes,
      percentual: total > 0 ? (presentes / total) * 100 : 0
    }
  }
}
