import { prisma } from '@/lib/prisma'

export const fluxoTramitacaoDbService = {
  // ======================================================================
  // FluxoTramitacao
  // ======================================================================

  async findByTipo(tipoProposicao: string) {
    return prisma.fluxoTramitacao.findUnique({
      where: { tipoProposicao }
    })
  },

  async findById(id: string) {
    return prisma.fluxoTramitacao.findUnique({
      where: { id }
    })
  },

  async createFluxo(data: {
    tipoProposicao: string
    nome: string
    descricao?: string
    ativo?: boolean
  }) {
    return prisma.fluxoTramitacao.create({
      data: {
        tipoProposicao: data.tipoProposicao,
        nome: data.nome,
        descricao: data.descricao,
        ativo: data.ativo
      },
      include: {
        etapas: {
          orderBy: { ordem: 'asc' as const }
        }
      }
    })
  },

  async deactivateFluxo(id: string) {
    return prisma.fluxoTramitacao.update({
      where: { id },
      data: { ativo: false }
    })
  },

  // ======================================================================
  // FluxoTramitacaoEtapa
  // ======================================================================

  async getFluxoWithEtapas(fluxoId: string) {
    return prisma.fluxoTramitacao.findUnique({
      where: { id: fluxoId },
      include: {
        etapas: {
          orderBy: { ordem: 'asc' as const },
          include: {
            unidade: {
              select: { id: true, nome: true, sigla: true }
            }
          }
        }
      }
    })
  },

  async listEtapas(fluxoId: string) {
    return prisma.fluxoTramitacaoEtapa.findMany({
      where: { fluxoId },
      orderBy: { ordem: 'asc' },
      include: {
        unidade: {
          select: { id: true, nome: true, sigla: true }
        }
      }
    })
  },

  async findEtapaInFluxo(etapaId: string, fluxoId: string) {
    return prisma.fluxoTramitacaoEtapa.findFirst({
      where: { id: etapaId, fluxoId }
    })
  },

  async findFluxoById(id: string) {
    return prisma.fluxoTramitacao.findUnique({
      where: { id }
    })
  },

  async countTramitacoesUsingEtapa(etapaId: string) {
    return prisma.tramitacao.count({
      where: { fluxoEtapaId: etapaId }
    })
  }
}
