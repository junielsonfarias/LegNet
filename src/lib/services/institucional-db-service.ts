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
   * Busca membros da Mesa Diretora ativa (da tabela MesaDiretora)
   * Fallback: se não houver mesa cadastrada, usa Parlamentar.cargo legado
   */
  async getMesaDiretora() {
    // Buscar mesa diretora ativa da tabela correta
    const mesaAtiva = await prisma.mesaDiretora.findFirst({
      where: { ativa: true },
      include: {
        membros: {
          where: { ativo: true },
          include: {
            parlamentar: {
              select: { id: true, nome: true, apelido: true, partido: true, foto: true }
            },
            cargo: {
              select: { nome: true, ordem: true }
            }
          },
          orderBy: { cargo: { ordem: 'asc' } }
        }
      }
    })

    if (mesaAtiva && mesaAtiva.membros.length > 0) {
      // Mapear do novo modelo para o formato esperado pela API institucional
      return mesaAtiva.membros.map(m => {
        // Converter nome do cargo para o enum legado usado no frontend
        const cargoMap: Record<string, string> = {
          'Presidente': 'PRESIDENTE',
          'Vice-Presidente': 'VICE_PRESIDENTE',
          '1º Vice-Presidente': 'VICE_PRESIDENTE',
          '2º Vice-Presidente': '2_VICE_PRESIDENTE',
          '1º Secretário': 'PRIMEIRO_SECRETARIO',
          '1o Secretário': 'PRIMEIRO_SECRETARIO',
          '1° Secretário': 'PRIMEIRO_SECRETARIO',
          '2º Secretário': 'SEGUNDO_SECRETARIO',
          '2o Secretário': 'SEGUNDO_SECRETARIO',
          '2° Secretário': 'SEGUNDO_SECRETARIO',
        }
        return {
          id: m.parlamentar.id,
          nome: m.parlamentar.nome,
          apelido: m.parlamentar.apelido,
          cargo: cargoMap[m.cargo.nome] || m.cargo.nome.toUpperCase().replace(/\s+/g, '_'),
          partido: m.parlamentar.partido,
          foto: m.parlamentar.foto
        }
      })
    }

    // Fallback: usar campo legado Parlamentar.cargo
    return prisma.parlamentar.findMany({
      where: {
        ativo: true,
        cargo: { not: 'VEREADOR' }
      },
      select: {
        id: true,
        nome: true,
        apelido: true,
        cargo: true,
        partido: true,
        foto: true
      },
      orderBy: { cargo: 'asc' }
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
