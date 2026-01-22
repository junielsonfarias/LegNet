import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

// Tipos
export type TipoReuniaoComissao = 'ORDINARIA' | 'EXTRAORDINARIA' | 'ESPECIAL'
export type StatusReuniaoComissao = 'AGENDADA' | 'CONVOCADA' | 'EM_ANDAMENTO' | 'SUSPENSA' | 'CONCLUIDA' | 'CANCELADA'
export type TipoItemPautaReuniao = 'ANALISE_PROPOSICAO' | 'VOTACAO_PARECER' | 'DESIGNACAO_RELATOR' | 'COMUNICACAO' | 'OUTROS'
export type StatusItemPautaReuniao = 'PENDENTE' | 'EM_DISCUSSAO' | 'EM_VOTACAO' | 'APROVADO' | 'REJEITADO' | 'ADIADO' | 'RETIRADO'

// ==========================================
// SERVICO DE REUNIOES DE COMISSAO
// ==========================================

export class ReuniaoComissaoService {

  // ------------------------------------------
  // CRUD DE REUNIOES
  // ------------------------------------------

  /**
   * Criar nova reuniao de comissao
   */
  static async criarReuniao(dados: {
    comissaoId: string
    tipo?: TipoReuniaoComissao
    data: Date
    horaInicio?: Date
    local?: string
    motivoConvocacao?: string
    quorumMinimo?: number
    observacoes?: string
    criadoPorId?: string
  }) {
    // Gerar numero sequencial da reuniao
    const ano = new Date().getFullYear()
    const ultimaReuniao = await prisma.reuniaoComissao.findFirst({
      where: { comissaoId: dados.comissaoId, ano },
      orderBy: { numero: 'desc' }
    })
    const numero = (ultimaReuniao?.numero || 0) + 1

    return prisma.reuniaoComissao.create({
      data: {
        comissaoId: dados.comissaoId,
        numero,
        ano,
        tipo: dados.tipo || 'ORDINARIA',
        status: 'AGENDADA',
        data: dados.data,
        horaInicio: dados.horaInicio,
        local: dados.local,
        motivoConvocacao: dados.motivoConvocacao,
        quorumMinimo: dados.quorumMinimo || 2,
        observacoes: dados.observacoes,
        criadoPorId: dados.criadoPorId
      },
      include: {
        comissao: true
      }
    })
  }

  /**
   * Listar reunioes com filtros
   */
  static async listarReunioes(filtros?: {
    comissaoId?: string
    status?: StatusReuniaoComissao
    ano?: number
    dataInicio?: Date
    dataFim?: Date
    skip?: number
    take?: number
  }) {
    const where: Prisma.ReuniaoComissaoWhereInput = {}

    if (filtros?.comissaoId) where.comissaoId = filtros.comissaoId
    if (filtros?.status) where.status = filtros.status
    if (filtros?.ano) where.ano = filtros.ano
    if (filtros?.dataInicio || filtros?.dataFim) {
      where.data = {}
      if (filtros.dataInicio) where.data.gte = filtros.dataInicio
      if (filtros.dataFim) where.data.lte = filtros.dataFim
    }

    const [reunioes, total] = await Promise.all([
      prisma.reuniaoComissao.findMany({
        where,
        include: {
          comissao: true,
          itens: {
            include: {
              proposicao: true
            }
          },
          presencas: {
            include: {
              membro: {
                include: {
                  parlamentar: true
                }
              }
            }
          },
          _count: {
            select: {
              itens: true,
              presencas: true,
              pareceres: true
            }
          }
        },
        orderBy: { data: 'desc' },
        skip: filtros?.skip,
        take: filtros?.take
      }),
      prisma.reuniaoComissao.count({ where })
    ])

    return { reunioes, total }
  }

  /**
   * Buscar reuniao por ID
   */
  static async buscarReuniaoPorId(id: string) {
    return prisma.reuniaoComissao.findUnique({
      where: { id },
      include: {
        comissao: {
          include: {
            membros: {
              where: { ativo: true },
              include: {
                parlamentar: true
              }
            }
          }
        },
        itens: {
          include: {
            proposicao: {
              include: {
                autor: true
              }
            }
          },
          orderBy: { ordem: 'asc' }
        },
        presencas: {
          include: {
            membro: {
              include: {
                parlamentar: true
              }
            }
          }
        },
        pareceres: {
          include: {
            proposicao: true,
            relator: true
          }
        }
      }
    })
  }

  /**
   * Atualizar reuniao
   */
  static async atualizarReuniao(id: string, dados: {
    tipo?: TipoReuniaoComissao
    data?: Date
    horaInicio?: Date
    horaFim?: Date
    local?: string
    motivoConvocacao?: string
    pautaTexto?: string
    ataTexto?: string
    quorumMinimo?: number
    observacoes?: string
  }) {
    return prisma.reuniaoComissao.update({
      where: { id },
      data: dados,
      include: {
        comissao: true
      }
    })
  }

  /**
   * Excluir reuniao (apenas se AGENDADA)
   */
  static async excluirReuniao(id: string) {
    const reuniao = await prisma.reuniaoComissao.findUnique({
      where: { id }
    })

    if (!reuniao) {
      throw new Error('Reuniao nao encontrada')
    }

    if (reuniao.status !== 'AGENDADA' && reuniao.status !== 'CANCELADA') {
      throw new Error('Apenas reunioes agendadas ou canceladas podem ser excluidas')
    }

    return prisma.reuniaoComissao.delete({
      where: { id }
    })
  }

  // ------------------------------------------
  // CONTROLE DE STATUS DA REUNIAO
  // ------------------------------------------

  /**
   * Convocar reuniao (envia convocacao)
   */
  static async convocarReuniao(id: string) {
    const reuniao = await prisma.reuniaoComissao.findUnique({
      where: { id }
    })

    if (!reuniao) throw new Error('Reuniao nao encontrada')
    if (reuniao.status !== 'AGENDADA') {
      throw new Error('Apenas reunioes agendadas podem ser convocadas')
    }

    return prisma.reuniaoComissao.update({
      where: { id },
      data: {
        status: 'CONVOCADA',
        dataConvocacao: new Date()
      }
    })
  }

  /**
   * Iniciar reuniao
   */
  static async iniciarReuniao(id: string) {
    const reuniao = await this.buscarReuniaoPorId(id)

    if (!reuniao) throw new Error('Reuniao nao encontrada')
    if (reuniao.status !== 'AGENDADA' && reuniao.status !== 'CONVOCADA') {
      throw new Error('Reuniao nao pode ser iniciada')
    }

    // Verificar quorum
    const presentes = reuniao.presencas.filter(p => p.presente).length
    if (presentes < reuniao.quorumMinimo) {
      throw new Error(`Quorum insuficiente. Minimo: ${reuniao.quorumMinimo}, Presentes: ${presentes}`)
    }

    return prisma.reuniaoComissao.update({
      where: { id },
      data: {
        status: 'EM_ANDAMENTO',
        horaInicio: new Date()
      }
    })
  }

  /**
   * Suspender reuniao
   */
  static async suspenderReuniao(id: string, motivo?: string) {
    const reuniao = await prisma.reuniaoComissao.findUnique({
      where: { id }
    })

    if (!reuniao) throw new Error('Reuniao nao encontrada')
    if (reuniao.status !== 'EM_ANDAMENTO') {
      throw new Error('Apenas reunioes em andamento podem ser suspensas')
    }

    return prisma.reuniaoComissao.update({
      where: { id },
      data: {
        status: 'SUSPENSA',
        observacoes: motivo ? `${reuniao.observacoes || ''}\n[SUSPENSA]: ${motivo}` : reuniao.observacoes
      }
    })
  }

  /**
   * Retomar reuniao suspensa
   */
  static async retomarReuniao(id: string) {
    const reuniao = await prisma.reuniaoComissao.findUnique({
      where: { id }
    })

    if (!reuniao) throw new Error('Reuniao nao encontrada')
    if (reuniao.status !== 'SUSPENSA') {
      throw new Error('Apenas reunioes suspensas podem ser retomadas')
    }

    return prisma.reuniaoComissao.update({
      where: { id },
      data: {
        status: 'EM_ANDAMENTO'
      }
    })
  }

  /**
   * Encerrar reuniao
   */
  static async encerrarReuniao(id: string) {
    const reuniao = await prisma.reuniaoComissao.findUnique({
      where: { id }
    })

    if (!reuniao) throw new Error('Reuniao nao encontrada')
    if (reuniao.status !== 'EM_ANDAMENTO') {
      throw new Error('Apenas reunioes em andamento podem ser encerradas')
    }

    return prisma.reuniaoComissao.update({
      where: { id },
      data: {
        status: 'CONCLUIDA',
        horaFim: new Date()
      }
    })
  }

  /**
   * Cancelar reuniao
   */
  static async cancelarReuniao(id: string, motivo: string) {
    const reuniao = await prisma.reuniaoComissao.findUnique({
      where: { id }
    })

    if (!reuniao) throw new Error('Reuniao nao encontrada')
    if (reuniao.status === 'CONCLUIDA') {
      throw new Error('Reunioes concluidas nao podem ser canceladas')
    }

    return prisma.reuniaoComissao.update({
      where: { id },
      data: {
        status: 'CANCELADA',
        observacoes: `${reuniao.observacoes || ''}\n[CANCELADA]: ${motivo}`
      }
    })
  }

  // ------------------------------------------
  // PAUTA DA REUNIAO
  // ------------------------------------------

  /**
   * Adicionar item na pauta da reuniao
   */
  static async adicionarItemPauta(reuniaoId: string, dados: {
    titulo: string
    descricao?: string
    tipo?: TipoItemPautaReuniao
    proposicaoId?: string
    parecerId?: string
    tempoEstimado?: number
  }) {
    // Verificar se reuniao existe e esta em status valido
    const reuniao = await prisma.reuniaoComissao.findUnique({
      where: { id: reuniaoId }
    })

    if (!reuniao) throw new Error('Reuniao nao encontrada')
    if (reuniao.status === 'CONCLUIDA' || reuniao.status === 'CANCELADA') {
      throw new Error('Nao e possivel adicionar itens a reunioes concluidas ou canceladas')
    }

    // Obter proxima ordem
    const ultimoItem = await prisma.pautaReuniaoComissao.findFirst({
      where: { reuniaoId },
      orderBy: { ordem: 'desc' }
    })
    const ordem = (ultimoItem?.ordem || 0) + 1

    return prisma.pautaReuniaoComissao.create({
      data: {
        reuniaoId,
        ordem,
        titulo: dados.titulo,
        descricao: dados.descricao,
        tipo: dados.tipo || 'ANALISE_PROPOSICAO',
        proposicaoId: dados.proposicaoId,
        parecerId: dados.parecerId,
        tempoEstimado: dados.tempoEstimado,
        status: 'PENDENTE'
      },
      include: {
        proposicao: true
      }
    })
  }

  /**
   * Atualizar item da pauta
   */
  static async atualizarItemPauta(itemId: string, dados: {
    titulo?: string
    descricao?: string
    tipo?: TipoItemPautaReuniao
    status?: StatusItemPautaReuniao
    resultado?: string
    observacoes?: string
    tempoReal?: number
  }) {
    return prisma.pautaReuniaoComissao.update({
      where: { id: itemId },
      data: dados,
      include: {
        proposicao: true
      }
    })
  }

  /**
   * Remover item da pauta
   */
  static async removerItemPauta(itemId: string) {
    const item = await prisma.pautaReuniaoComissao.findUnique({
      where: { id: itemId },
      include: { reuniao: true }
    })

    if (!item) throw new Error('Item nao encontrado')
    if (item.reuniao.status === 'CONCLUIDA' || item.reuniao.status === 'CANCELADA') {
      throw new Error('Nao e possivel remover itens de reunioes concluidas ou canceladas')
    }

    return prisma.pautaReuniaoComissao.delete({
      where: { id: itemId }
    })
  }

  /**
   * Reordenar itens da pauta
   */
  static async reordenarPauta(reuniaoId: string, itensOrdenados: { id: string, ordem: number }[]) {
    const operations = itensOrdenados.map(item =>
      prisma.pautaReuniaoComissao.update({
        where: { id: item.id },
        data: { ordem: item.ordem }
      })
    )

    return prisma.$transaction(operations)
  }

  // ------------------------------------------
  // PRESENCA NA REUNIAO
  // ------------------------------------------

  /**
   * Registrar presenca de membro
   */
  static async registrarPresenca(reuniaoId: string, membroComissaoId: string, presente: boolean, justificativa?: string) {
    return prisma.presencaReuniaoComissao.upsert({
      where: {
        reuniaoId_membroComissaoId: { reuniaoId, membroComissaoId }
      },
      create: {
        reuniaoId,
        membroComissaoId,
        presente,
        justificativa,
        horaChegada: presente ? new Date() : null
      },
      update: {
        presente,
        justificativa,
        horaChegada: presente ? new Date() : null
      },
      include: {
        membro: {
          include: {
            parlamentar: true
          }
        }
      }
    })
  }

  /**
   * Registrar saida de membro
   */
  static async registrarSaida(reuniaoId: string, membroComissaoId: string) {
    return prisma.presencaReuniaoComissao.update({
      where: {
        reuniaoId_membroComissaoId: { reuniaoId, membroComissaoId }
      },
      data: {
        horaSaida: new Date()
      }
    })
  }

  /**
   * Obter lista de presenca da reuniao
   */
  static async obterPresencas(reuniaoId: string) {
    return prisma.presencaReuniaoComissao.findMany({
      where: { reuniaoId },
      include: {
        membro: {
          include: {
            parlamentar: true
          }
        }
      },
      orderBy: {
        membro: {
          cargo: 'asc'
        }
      }
    })
  }

  /**
   * Verificar quorum da reuniao
   */
  static async verificarQuorum(reuniaoId: string): Promise<{ atingido: boolean, presentes: number, minimo: number }> {
    const reuniao = await prisma.reuniaoComissao.findUnique({
      where: { id: reuniaoId }
    })

    if (!reuniao) throw new Error('Reuniao nao encontrada')

    const presentes = await prisma.presencaReuniaoComissao.count({
      where: { reuniaoId, presente: true }
    })

    return {
      atingido: presentes >= reuniao.quorumMinimo,
      presentes,
      minimo: reuniao.quorumMinimo
    }
  }

  // ------------------------------------------
  // VOTACAO DE PARECER NA REUNIAO
  // ------------------------------------------

  /**
   * Votar parecer na reuniao de comissao
   */
  static async votarParecer(reuniaoId: string, parecerId: string, dados: {
    votosAFavor: number
    votosContra: number
    votosAbstencao: number
  }) {
    const reuniao = await prisma.reuniaoComissao.findUnique({
      where: { id: reuniaoId }
    })

    if (!reuniao) throw new Error('Reuniao nao encontrada')
    if (reuniao.status !== 'EM_ANDAMENTO') {
      throw new Error('Votacao so pode ocorrer com reuniao em andamento')
    }

    // Atualizar parecer com resultado da votacao
    const parecerAtualizado = await prisma.parecer.update({
      where: { id: parecerId },
      data: {
        reuniaoId,
        dataVotacao: new Date(),
        votosAFavor: dados.votosAFavor,
        votosContra: dados.votosContra,
        votosAbstencao: dados.votosAbstencao,
        status: dados.votosAFavor > dados.votosContra ? 'APROVADO_COMISSAO' : 'REJEITADO_COMISSAO'
      },
      include: {
        proposicao: true
      }
    })

    // Se parecer aprovado e da CLJ, atualizar proposicao para AGUARDANDO_PAUTA
    if (parecerAtualizado.status === 'APROVADO_COMISSAO') {
      const comissao = await prisma.comissao.findUnique({
        where: { id: parecerAtualizado.comissaoId }
      })

      // Se for CLJ (Comissao de Legislacao e Justica), a proposicao fica pronta para pauta
      if (comissao?.sigla === 'CLJ' || comissao?.nome.toLowerCase().includes('legisla')) {
        await prisma.proposicao.update({
          where: { id: parecerAtualizado.proposicaoId },
          data: { status: 'AGUARDANDO_PAUTA' }
        })
      }
    }

    return parecerAtualizado
  }

  /**
   * Emitir parecer apos aprovacao na comissao
   */
  static async emitirParecer(parecerId: string) {
    const parecer = await prisma.parecer.findUnique({
      where: { id: parecerId }
    })

    if (!parecer) throw new Error('Parecer nao encontrado')
    if (parecer.status !== 'APROVADO_COMISSAO') {
      throw new Error('Apenas pareceres aprovados pela comissao podem ser emitidos')
    }

    return prisma.parecer.update({
      where: { id: parecerId },
      data: {
        status: 'EMITIDO',
        dataEmissao: new Date()
      }
    })
  }

  // ------------------------------------------
  // ATA DA REUNIAO
  // ------------------------------------------

  /**
   * Salvar ata da reuniao
   */
  static async salvarAta(reuniaoId: string, ataTexto: string) {
    return prisma.reuniaoComissao.update({
      where: { id: reuniaoId },
      data: { ataTexto }
    })
  }

  /**
   * Aprovar ata da reuniao
   */
  static async aprovarAta(reuniaoId: string) {
    const reuniao = await prisma.reuniaoComissao.findUnique({
      where: { id: reuniaoId }
    })

    if (!reuniao) throw new Error('Reuniao nao encontrada')
    if (!reuniao.ataTexto) throw new Error('Ata nao foi redigida')
    if (reuniao.status !== 'CONCLUIDA') {
      throw new Error('Ata so pode ser aprovada apos conclusao da reuniao')
    }

    return prisma.reuniaoComissao.update({
      where: { id: reuniaoId },
      data: {
        ataAprovada: true,
        dataAprovacaoAta: new Date()
      }
    })
  }

  // ------------------------------------------
  // RELATORIOS E CONSULTAS
  // ------------------------------------------

  /**
   * Proximas reunioes agendadas
   */
  static async proximasReunioes(comissaoId?: string, limite = 5) {
    const where: Prisma.ReuniaoComissaoWhereInput = {
      status: { in: ['AGENDADA', 'CONVOCADA'] },
      data: { gte: new Date() }
    }

    if (comissaoId) where.comissaoId = comissaoId

    return prisma.reuniaoComissao.findMany({
      where,
      include: {
        comissao: true,
        _count: {
          select: { itens: true }
        }
      },
      orderBy: { data: 'asc' },
      take: limite
    })
  }

  /**
   * Proposicoes pendentes de analise em uma comissao
   */
  static async proposicoesPendentes(comissaoId: string) {
    // Buscar proposicoes que foram tramitadas para esta comissao
    // e ainda nao tem parecer emitido
    const tramitacoes = await prisma.tramitacao.findMany({
      where: {
        unidade: {
          nome: {
            contains: 'Comissao'
          }
        },
        status: 'EM_ANDAMENTO'
      },
      include: {
        proposicao: {
          include: {
            autor: true,
            pareceres: {
              where: { comissaoId }
            }
          }
        }
      }
    })

    // Filtrar proposicoes sem parecer nesta comissao
    return tramitacoes
      .filter(t => t.proposicao.pareceres.length === 0)
      .map(t => t.proposicao)
  }

  /**
   * Estatisticas de reunioes por periodo
   */
  static async estatisticas(comissaoId: string, ano: number) {
    const reunioes = await prisma.reuniaoComissao.findMany({
      where: { comissaoId, ano },
      include: {
        pareceres: true,
        itens: true
      }
    })

    return {
      totalReunioes: reunioes.length,
      reunioesRealizadas: reunioes.filter(r => r.status === 'CONCLUIDA').length,
      reunioesCanceladas: reunioes.filter(r => r.status === 'CANCELADA').length,
      totalPareceresVotados: reunioes.reduce((acc, r) => acc + r.pareceres.length, 0),
      totalItensAnalisados: reunioes.reduce((acc, r) => acc + r.itens.length, 0)
    }
  }
}

export default ReuniaoComissaoService
