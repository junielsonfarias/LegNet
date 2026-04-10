import { prisma } from '@/lib/prisma'

export interface OradorPayload {
  parlamentarId: string
  tipo: string
  tempoLimite?: number
  assunto?: string
  observacoes?: string
}

const defaultInclude = {
  parlamentar: {
    select: { id: true, nome: true, apelido: true, partido: true, foto: true }
  }
}

export const oradorSessaoDbService = {
  async listBySessao(sessaoId: string, filters: { tipo?: string; status?: string } = {}) {
    const where: Record<string, unknown> = { sessaoId }
    if (filters.tipo) where.tipo = filters.tipo
    if (filters.status) where.status = filters.status

    return prisma.oradorSessao.findMany({
      where,
      include: defaultInclude,
      orderBy: [{ tipo: 'asc' }, { ordem: 'asc' }]
    })
  },

  async checkInscricaoExistente(sessaoId: string, parlamentarId: string, tipo: string) {
    return prisma.oradorSessao.findFirst({
      where: {
        sessaoId,
        parlamentarId,
        tipo: tipo as any,
        status: { in: ['INSCRITO', 'FALANDO'] }
      }
    })
  },

  async getNextOrdem(sessaoId: string, tipo: string) {
    const ultimo = await prisma.oradorSessao.findFirst({
      where: { sessaoId, tipo: tipo as any },
      orderBy: { ordem: 'desc' }
    })
    return (ultimo?.ordem || 0) + 1
  },

  async create(sessaoId: string, payload: OradorPayload) {
    const ordem = await oradorSessaoDbService.getNextOrdem(sessaoId, payload.tipo)

    return prisma.oradorSessao.create({
      data: {
        sessaoId,
        parlamentarId: payload.parlamentarId,
        tipo: payload.tipo as any,
        ordem,
        tempoLimite: payload.tempoLimite,
        assunto: payload.assunto,
        observacoes: payload.observacoes,
        status: 'INSCRITO'
      },
      include: {
        parlamentar: {
          select: { id: true, nome: true, apelido: true, partido: true }
        }
      }
    })
  },

  async getById(id: string, include?: any) {
    return prisma.oradorSessao.findUnique({
      where: { id },
      include: include ?? {
        ...defaultInclude,
        sessao: {
          select: {
            id: true,
            numero: true,
            tipo: true,
            data: true
          }
        }
      }
    })
  },

  async update(id: string, data: any) {
    return prisma.oradorSessao.update({ where: { id }, data, include: defaultInclude })
  },

  async remove(id: string) {
    await prisma.oradorSessao.delete({ where: { id } })
    return { success: true }
  }
}
