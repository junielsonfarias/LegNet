import { prisma } from '@/lib/prisma'

export interface RegraEtapaData {
  id?: string
  ordem: number
  nome: string
  descricao?: string
  tipoTramitacaoId?: string
  unidadeId?: string
  notificacoes?: any
  alertas?: any
  prazoDias?: number | null
}

export interface RegraCreatePayload {
  nome: string
  descricao?: string
  condicoes: Record<string, any>
  acoes: Record<string, any>
  excecoes?: Record<string, any>
  ativo: boolean
  ordem: number
  etapas?: RegraEtapaData[]
}

export interface RegraUpdatePayload {
  nome?: string
  descricao?: string
  condicoes?: Record<string, any>
  acoes?: Record<string, any>
  excecoes?: Record<string, any>
  ativo?: boolean
  ordem?: number
  etapas?: RegraEtapaData[]
}

const defaultInclude = {
  etapas: {
    orderBy: { ordem: 'asc' as const }
  }
}

export const regraTramitacaoDbService = {
  async list(filters: { ativo?: boolean } = {}) {
    const where: any = {}
    if (filters.ativo !== undefined) where.ativo = filters.ativo

    return prisma.regraTramitacao.findMany({
      where,
      include: defaultInclude,
      orderBy: { ordem: 'asc' }
    })
  },

  async getById(id: string) {
    return prisma.regraTramitacao.findUnique({
      where: { id },
      include: defaultInclude
    })
  },

  async validateEtapas(etapas: RegraEtapaData[]) {
    for (const etapa of etapas) {
      if (etapa.tipoTramitacaoId) {
        const tipo = await prisma.tramitacaoTipo.findUnique({
          where: { id: etapa.tipoTramitacaoId }
        })
        if (!tipo) {
          return { valid: false, message: `Tipo de tramitação não encontrado para a etapa ${etapa.nome}` }
        }
      }

      if (etapa.unidadeId) {
        const unidade = await prisma.tramitacaoUnidade.findUnique({
          where: { id: etapa.unidadeId }
        })
        if (!unidade) {
          return { valid: false, message: `Unidade responsável não encontrada para a etapa ${etapa.nome}` }
        }
      }
    }
    return { valid: true, message: '' }
  },

  async create(payload: RegraCreatePayload) {
    const etapas = payload.etapas ?? []

    return prisma.regraTramitacao.create({
      data: {
        nome: payload.nome,
        descricao: payload.descricao,
        condicoes: payload.condicoes,
        acoes: payload.acoes,
        excecoes: payload.excecoes ?? {},
        ativo: payload.ativo,
        ordem: payload.ordem,
        etapas: {
          create: etapas.sort((a, b) => a.ordem - b.ordem).map((etapa, index) => ({
            ordem: etapa.ordem ?? index,
            nome: etapa.nome,
            descricao: etapa.descricao,
            tipoTramitacaoId: etapa.tipoTramitacaoId,
            unidadeId: etapa.unidadeId,
            notificacoes: etapa.notificacoes,
            alertas: etapa.alertas,
            prazoDias: etapa.prazoDias
          }))
        }
      },
      include: defaultInclude
    })
  },

  async update(id: string, payload: RegraUpdatePayload) {
    const { etapas, ...fields } = payload

    // Build update data from defined fields
    const updateData: any = {}
    if (fields.nome !== undefined) updateData.nome = fields.nome
    if (fields.descricao !== undefined) updateData.descricao = fields.descricao
    if (fields.condicoes !== undefined) updateData.condicoes = fields.condicoes
    if (fields.acoes !== undefined) updateData.acoes = fields.acoes
    if (fields.excecoes !== undefined) updateData.excecoes = fields.excecoes
    if (fields.ativo !== undefined) updateData.ativo = fields.ativo
    if (fields.ordem !== undefined) updateData.ordem = fields.ordem

    return prisma.$transaction(async (tx) => {
      // Update the rule
      await tx.regraTramitacao.update({
        where: { id },
        data: updateData
      })

      // If etapas provided, replace all
      if (etapas) {
        await tx.regraTramitacaoEtapa.deleteMany({
          where: { regraId: id }
        })

        await tx.regraTramitacaoEtapa.createMany({
          data: etapas.sort((a, b) => a.ordem - b.ordem).map((etapa, index) => ({
            regraId: id,
            ordem: etapa.ordem ?? index,
            nome: etapa.nome,
            descricao: etapa.descricao,
            tipoTramitacaoId: etapa.tipoTramitacaoId,
            unidadeId: etapa.unidadeId,
            notificacoes: etapa.notificacoes,
            alertas: etapa.alertas,
            prazoDias: etapa.prazoDias
          }))
        })
      }

      // Return full record with etapas
      return tx.regraTramitacao.findUnique({
        where: { id },
        include: defaultInclude
      })
    })
  },

  async remove(id: string) {
    await prisma.regraTramitacao.delete({ where: { id } })
    return { success: true }
  }
}
