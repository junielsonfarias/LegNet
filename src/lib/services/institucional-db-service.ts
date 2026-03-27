/**
 * Servico de acesso ao banco para dados institucionais
 * Centraliza queries Prisma do modulo institucional
 */

import { prisma } from '@/lib/prisma'

export const institucionalDbService = {
  /**
   * Busca a configuracao institucional mais recente
   */
  async getConfiguracao() {
    return prisma.configuracaoInstitucional.findFirst({
      orderBy: { createdAt: 'desc' }
    })
  },

  /**
   * Busca parlamentares da Mesa Diretora (cargo diferente de VEREADOR)
   */
  async getMesaDiretora() {
    return prisma.parlamentar.findMany({
      where: {
        ativo: true,
        cargo: {
          not: 'VEREADOR'
        }
      },
      select: {
        id: true,
        nome: true,
        apelido: true,
        cargo: true,
        partido: true,
        foto: true
      },
      orderBy: {
        cargo: 'asc'
      }
    })
  },

  /**
   * Conta parlamentares ativos
   */
  async countParlamentaresAtivos() {
    return prisma.parlamentar.count({
      where: { ativo: true }
    })
  },

  /**
   * Busca a legislatura ativa
   */
  async getLegislaturaAtiva() {
    return prisma.legislatura.findFirst({
      where: { ativa: true },
      select: {
        numero: true,
        anoInicio: true,
        anoFim: true
      }
    })
  },

  /**
   * Conta comissoes ativas
   */
  async countComissoesAtivas() {
    return prisma.comissao.count({
      where: { ativa: true }
    })
  },

  /**
   * Atualiza uma configuracao institucional existente
   */
  async updateConfiguracao(id: string, data: any) {
    return prisma.configuracaoInstitucional.update({
      where: { id },
      data
    })
  },

  /**
   * Cria uma nova configuracao institucional
   */
  async createConfiguracao(data: any) {
    return prisma.configuracaoInstitucional.create({
      data
    })
  }
}
