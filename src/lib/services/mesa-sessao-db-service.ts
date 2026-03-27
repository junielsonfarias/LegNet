import { prisma } from '@/lib/prisma'

export interface MembroMesaSessaoInput {
  parlamentarId: string
  cargo: 'PRESIDENTE' | 'VICE_PRESIDENTE' | 'PRIMEIRO_SECRETARIO' | 'SEGUNDO_SECRETARIO'
  titular?: boolean
  observacoes?: string
}

const parlamentarSelect = {
  id: true,
  nome: true,
  apelido: true,
  partido: true,
  foto: true
}

const mesaSessaoInclude = {
  membros: {
    include: {
      parlamentar: { select: parlamentarSelect }
    },
    orderBy: { cargo: 'asc' as const }
  }
}

export const mesaSessaoDbService = {
  /**
   * Obtem a mesa da sessao. Se a sessao tem mesa especifica, retorna ela.
   * Caso contrario, faz fallback para a mesa diretora ativa do periodo.
   */
  async getMesaSessao(sessaoId: string) {
    const sessao = await prisma.sessao.findUnique({
      where: { id: sessaoId },
      include: {
        mesaSessao: {
          include: mesaSessaoInclude
        },
        periodo: {
          include: {
            mesasDiretora: {
              where: { ativa: true },
              include: {
                membros: {
                  where: { ativo: true },
                  include: {
                    parlamentar: { select: parlamentarSelect },
                    cargo: {
                      select: { id: true, nome: true, ordem: true }
                    }
                  },
                  orderBy: { cargo: { ordem: 'asc' } }
                }
              }
            }
          }
        }
      }
    })

    if (!sessao) return null

    // Se a sessao tem mesa especifica, retornar ela
    if (sessao.mesaSessao) {
      return {
        mesaSessao: sessao.mesaSessao,
        mesaDiretora: sessao.periodo?.mesasDiretora?.[0] || null,
        usandoMesaDiretora: false
      }
    }

    // Se nao tem mesa especifica, retornar a mesa diretora do periodo
    const mesaDiretora = sessao.periodo?.mesasDiretora?.[0] || null

    return {
      mesaSessao: null,
      mesaDiretora,
      usandoMesaDiretora: true
    }
  },

  /**
   * Cria ou atualiza a mesa de uma sessao. Valida que:
   * - A sessao existe
   * - Todos os parlamentares existem e estao ativos
   * Usa transacao para garantir atomicidade na atualizacao.
   */
  async createOrUpdate(
    sessaoId: string,
    membros: MembroMesaSessaoInput[],
    observacoes: string | undefined,
    userId: string
  ) {
    // Verificar se a sessao existe
    const sessao = await prisma.sessao.findUnique({
      where: { id: sessaoId },
      include: { mesaSessao: true }
    })

    if (!sessao) throw new Error('Sessão não encontrada')

    // Validar que os parlamentares existem e estao ativos
    const parlamentarIds = membros.map(m => m.parlamentarId)
    const parlamentares = await prisma.parlamentar.findMany({
      where: {
        id: { in: parlamentarIds },
        ativo: true
      }
    })

    if (parlamentares.length !== parlamentarIds.length) {
      const encontradosIds = parlamentares.map(p => p.id)
      const naoEncontrados = parlamentarIds.filter(id => !encontradosIds.includes(id))
      throw new Error(
        `Um ou mais parlamentares não foram encontrados ou estão inativos: ${naoEncontrados.join(', ')}`
      )
    }

    const membrosData = membros.map(m => ({
      parlamentarId: m.parlamentarId,
      cargo: m.cargo,
      titular: m.titular ?? true,
      observacoes: m.observacoes
    }))

    // Se ja existe mesa, atualizar com transacao
    if (sessao.mesaSessao) {
      const mesaSessaoId = sessao.mesaSessao.id
      return prisma.$transaction(async (tx) => {
        // Deletar membros antigos
        await tx.membroMesaSessao.deleteMany({
          where: { mesaSessaoId }
        })

        // Atualizar mesa e criar novos membros
        return tx.mesaSessao.update({
          where: { id: mesaSessaoId },
          data: {
            observacoes,
            criadoPor: userId,
            membros: {
              create: membrosData
            }
          },
          include: mesaSessaoInclude
        })
      })
    }

    // Criar nova mesa da sessao
    return prisma.mesaSessao.create({
      data: {
        sessaoId,
        observacoes,
        criadoPor: userId,
        membros: {
          create: membrosData
        }
      },
      include: mesaSessaoInclude
    })
  },

  /**
   * Remove a mesa especifica de uma sessao, fazendo a sessao
   * voltar a usar a mesa diretora do periodo.
   */
  async remove(sessaoId: string) {
    const sessao = await prisma.sessao.findUnique({
      where: { id: sessaoId },
      include: { mesaSessao: true }
    })

    if (!sessao) throw new Error('Sessão não encontrada')
    if (!sessao.mesaSessao) throw new Error('Esta sessão não possui mesa específica')

    await prisma.mesaSessao.delete({
      where: { id: sessao.mesaSessao.id }
    })

    return { success: true }
  }
}
