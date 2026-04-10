import { prisma } from '@/lib/prisma'

export interface TipoProposicaoFilters {
  ativo?: boolean
}

export interface TipoProposicaoPayload {
  codigo: string
  nome: string
  sigla: string
  descricao?: string | null
  prazoLimite?: number | null
  requerVotacao?: boolean
  requerSancao?: boolean
  numeracaoAnual?: boolean
  prefixoNumeracao?: string | null
  ativo?: boolean
  ordem?: number
  corBadge?: string | null
  icone?: string | null
  quorumAplicacao?: string | null
  quorumAplicacao2Turno?: string | null
  totalTurnos?: number
  intersticioDias?: number
}

export const tiposProposicaoDbService = {
  async list(filters: TipoProposicaoFilters = {}) {
    const where: Record<string, unknown> = {}
    if (filters.ativo !== undefined) where.ativo = filters.ativo

    return prisma.tipoProposicaoConfig.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { ordem: 'asc' }
    })
  },

  async getById(id: string) {
    return prisma.tipoProposicaoConfig.findUnique({ where: { id } })
  },

  async getByCodigo(codigo: string) {
    return prisma.tipoProposicaoConfig.findUnique({ where: { codigo } })
  },

  async create(payload: TipoProposicaoPayload) {
    return prisma.tipoProposicaoConfig.create({ data: payload as any })
  },

  async update(id: string, payload: Partial<TipoProposicaoPayload>) {
    const data: any = {}
    if (payload.codigo !== undefined) data.codigo = payload.codigo
    if (payload.nome !== undefined) data.nome = payload.nome
    if (payload.sigla !== undefined) data.sigla = payload.sigla
    if (payload.descricao !== undefined) data.descricao = payload.descricao
    if (payload.prazoLimite !== undefined) data.prazoLimite = payload.prazoLimite
    if (payload.requerVotacao !== undefined) data.requerVotacao = payload.requerVotacao
    if (payload.requerSancao !== undefined) data.requerSancao = payload.requerSancao
    if (payload.numeracaoAnual !== undefined) data.numeracaoAnual = payload.numeracaoAnual
    if (payload.prefixoNumeracao !== undefined) data.prefixoNumeracao = payload.prefixoNumeracao
    if (payload.ativo !== undefined) data.ativo = payload.ativo
    if (payload.ordem !== undefined) data.ordem = payload.ordem
    if (payload.corBadge !== undefined) data.corBadge = payload.corBadge
    if (payload.icone !== undefined) data.icone = payload.icone
    if (payload.quorumAplicacao !== undefined) data.quorumAplicacao = payload.quorumAplicacao
    if (payload.quorumAplicacao2Turno !== undefined) data.quorumAplicacao2Turno = payload.quorumAplicacao2Turno
    if (payload.totalTurnos !== undefined) data.totalTurnos = payload.totalTurnos
    if (payload.intersticioDias !== undefined) data.intersticioDias = payload.intersticioDias
    return prisma.tipoProposicaoConfig.update({ where: { id }, data })
  },

  async remove(id: string) {
    await prisma.tipoProposicaoConfig.delete({ where: { id } })
    return { success: true }
  },

  async countProposicoesByCodigo(codigo: string) {
    return prisma.proposicao.count({ where: { tipo: codigo } })
  }
}
