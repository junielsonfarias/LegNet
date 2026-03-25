import { prisma } from '@/lib/prisma'

export interface ExpedientePayload {
  tipoExpedienteId: string
  conteudo: string
  ordem?: number
}

export const expedienteSessaoDbService = {
  async listBySessao(sessaoId: string) {
    return prisma.expedienteSessao.findMany({
      where: { sessaoId },
      include: { tipoExpediente: true },
      orderBy: [{ tipoExpediente: { ordem: 'asc' } }, { ordem: 'asc' }]
    })
  },

  async upsert(sessaoId: string, payload: ExpedientePayload) {
    const existente = await prisma.expedienteSessao.findUnique({
      where: {
        sessaoId_tipoExpedienteId: {
          sessaoId,
          tipoExpedienteId: payload.tipoExpedienteId
        }
      }
    })

    if (existente) {
      return {
        data: await prisma.expedienteSessao.update({
          where: { id: existente.id },
          data: { conteudo: payload.conteudo, ordem: payload.ordem ?? existente.ordem },
          include: { tipoExpediente: true }
        }),
        created: false
      }
    }

    return {
      data: await prisma.expedienteSessao.create({
        data: {
          sessaoId,
          tipoExpedienteId: payload.tipoExpedienteId,
          conteudo: payload.conteudo,
          ordem: payload.ordem ?? 0
        },
        include: { tipoExpediente: true }
      }),
      created: true
    }
  },

  async remove(id: string) {
    await prisma.expedienteSessao.delete({ where: { id } })
    return { success: true }
  }
}
