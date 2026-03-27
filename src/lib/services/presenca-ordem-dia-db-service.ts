import { prisma } from '@/lib/prisma'

export interface PresencaOrdemDiaPayload {
  parlamentarId: string
  presente: boolean
  observacoes?: string
}

const defaultInclude = {
  parlamentar: {
    select: { id: true, nome: true, apelido: true, partido: true }
  }
}

export const presencaOrdemDiaDbService = {
  async listBySessao(sessaoId: string) {
    return prisma.presencaOrdemDia.findMany({
      where: { sessaoId },
      include: defaultInclude,
      orderBy: { parlamentar: { nome: 'asc' } }
    })
  },

  async registrar(sessaoId: string, payload: PresencaOrdemDiaPayload) {
    return prisma.presencaOrdemDia.upsert({
      where: {
        sessaoId_parlamentarId: {
          sessaoId,
          parlamentarId: payload.parlamentarId
        }
      },
      update: {
        presente: payload.presente,
        observacoes: payload.observacoes,
        registradoEm: new Date()
      },
      create: {
        sessaoId,
        parlamentarId: payload.parlamentarId,
        presente: payload.presente,
        observacoes: payload.observacoes
      },
      include: defaultInclude
    })
  },

  async registrarLote(sessaoId: string, presencas: PresencaOrdemDiaPayload[]) {
    return Promise.all(
      presencas.map(p => presencaOrdemDiaDbService.registrar(sessaoId, p))
    )
  },

  async limpar(sessaoId: string) {
    const count = await prisma.presencaOrdemDia.count({ where: { sessaoId } })
    if (count > 0) {
      await prisma.presencaOrdemDia.deleteMany({ where: { sessaoId } })
    }
    return { removidos: count }
  },

  async copiarDaSessao(sessaoId: string, parlamentarIds: string[]) {
    if (parlamentarIds.length === 0) return []

    return Promise.all(
      parlamentarIds.map(parlamentarId =>
        prisma.presencaOrdemDia.upsert({
          where: {
            sessaoId_parlamentarId: {
              sessaoId,
              parlamentarId
            }
          },
          update: {
            presente: true,
            registradoEm: new Date(),
            observacoes: 'Copiado da presença da sessão'
          },
          create: {
            sessaoId,
            parlamentarId,
            presente: true,
            observacoes: 'Copiado da presença da sessão'
          }
        })
      )
    )
  },

  async getStats(sessaoId: string) {
    const presencas = await prisma.presencaOrdemDia.findMany({
      where: { sessaoId },
      select: { presente: true }
    })
    return {
      total: presencas.length,
      presentes: presencas.filter(p => p.presente).length,
      ausentes: presencas.filter(p => !p.presente).length
    }
  }
}
