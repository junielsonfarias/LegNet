/**
 * Servico de banco de dados para o Painel em Tempo Real
 *
 * Centraliza as queries Prisma usadas pelas rotas do painel:
 * - /api/painel/stream (SSE)
 * - /api/painel/sessao-completa
 */

import { prisma } from '@/lib/prisma'

// Tipo para o estado do painel (usado pelo SSE stream)
export interface EstadoPainelSSE {
  sessao: {
    id: string
    numero: number
    tipo: string
    status: string
    data: string
    horarioInicio?: string | null
    tempoInicio?: string | null
  } | null
  itemAtual: {
    id: string
    titulo: string
    status: string
    proposicao?: {
      id: string
      numero: string
      ano: number
      tipo: string
      ementa?: string | null
    } | null
  } | null
  votacao: {
    sim: number
    nao: number
    abstencao: number
    pendentes: number
  }
  vereadores: Array<{
    id: string
    nome: string
    apelido?: string | null
    foto?: string | null
    partido?: string | null
    voto: 'SIM' | 'NAO' | 'ABSTENCAO' | null
  }>
  presentes: number
  totalVereadores: number
  resultado?: 'APROVADA' | 'REJEITADA' | 'EMPATE' | null
  timestamp: string
}

export const painelDbService = {
  /**
   * Verifica se uma sessao existe
   */
  async sessaoExists(sessaoId: string): Promise<boolean> {
    const sessao = await prisma.sessao.findUnique({
      where: { id: sessaoId },
      select: { id: true }
    })
    return !!sessao
  },

  /**
   * Busca estado atual do painel para uma sessao (usado pelo SSE stream)
   */
  async getEstadoPainel(sessaoId: string): Promise<EstadoPainelSSE | null> {
    try {
      const sessao = await prisma.sessao.findUnique({
        where: { id: sessaoId },
        include: {
          presencas: {
            include: {
              parlamentar: {
                select: {
                  id: true,
                  nome: true,
                  apelido: true,
                  foto: true,
                  partido: true
                }
              }
            }
          },
          pautaSessao: {
            include: {
              itemAtual: {
                include: {
                  proposicao: {
                    select: {
                      id: true,
                      numero: true,
                      ano: true,
                      tipo: true,
                      ementa: true,
                      votacoes: {
                        include: {
                          parlamentar: {
                            select: {
                              id: true,
                              nome: true,
                              apelido: true,
                              foto: true,
                              partido: true
                            }
                          }
                        }
                      }
                    }
                  }
                }
              },
              itens: {
                where: {
                  status: {
                    in: ['EM_DISCUSSAO', 'EM_VOTACAO']
                  }
                },
                include: {
                  proposicao: {
                    select: {
                      id: true,
                      numero: true,
                      ano: true,
                      tipo: true,
                      ementa: true,
                      votacoes: {
                        include: {
                          parlamentar: {
                            select: {
                              id: true,
                              nome: true,
                              apelido: true,
                              foto: true,
                              partido: true
                            }
                          }
                        }
                      }
                    }
                  }
                },
                take: 1
              }
            }
          },
          legislatura: {
            include: {
              mandatos: {
                where: { ativo: true },
                include: {
                  parlamentar: {
                    select: {
                      id: true,
                      nome: true,
                      apelido: true,
                      foto: true,
                      partido: true
                    }
                  }
                }
              }
            }
          }
        }
      })

      if (!sessao) return null

      // Encontrar item atual
      const itemAtual = sessao.pautaSessao?.itemAtual ||
        sessao.pautaSessao?.itens?.[0] || null

      // Obter presencas
      const presencasAtivas = sessao.presencas.filter(p => p.presente)
      const parlamentaresPresentes = presencasAtivas.map(p => p.parlamentar)

      // Total de parlamentares da legislatura
      const totalVereadores = sessao.legislatura?.mandatos?.length || parlamentaresPresentes.length

      // Obter votos da proposicao atual
      let votos: Array<{
        parlamentarId: string
        voto: 'SIM' | 'NAO' | 'ABSTENCAO'
        parlamentar: typeof parlamentaresPresentes[0]
      }> = []

      if (itemAtual?.proposicao?.votacoes) {
        votos = itemAtual.proposicao.votacoes.map(v => ({
          parlamentarId: v.parlamentarId,
          voto: v.voto as 'SIM' | 'NAO' | 'ABSTENCAO',
          parlamentar: v.parlamentar
        }))
      }

      // Montar lista de vereadores com seus votos
      const vereadores = parlamentaresPresentes.map(parlamentar => {
        const voto = votos.find(v => v.parlamentarId === parlamentar.id)
        return {
          id: parlamentar.id,
          nome: parlamentar.nome,
          apelido: parlamentar.apelido,
          foto: parlamentar.foto,
          partido: parlamentar.partido,
          voto: voto?.voto || null
        }
      })

      // Contagem de votos
      const votosContagem = {
        sim: votos.filter(v => v.voto === 'SIM').length,
        nao: votos.filter(v => v.voto === 'NAO').length,
        abstencao: votos.filter(v => v.voto === 'ABSTENCAO').length,
        pendentes: parlamentaresPresentes.length - votos.length
      }

      // Determinar resultado
      let resultado: 'APROVADA' | 'REJEITADA' | 'EMPATE' | null = null
      if (itemAtual?.status === 'APROVADO') resultado = 'APROVADA'
      else if (itemAtual?.status === 'REJEITADO') resultado = 'REJEITADA'

      const estado: EstadoPainelSSE = {
        sessao: {
          id: sessao.id,
          numero: sessao.numero,
          tipo: sessao.tipo,
          status: sessao.status,
          data: sessao.data.toISOString(),
          horarioInicio: sessao.horario,
          tempoInicio: sessao.tempoInicio?.toISOString() || null
        },
        itemAtual: itemAtual ? {
          id: itemAtual.id,
          titulo: itemAtual.titulo,
          status: itemAtual.status,
          proposicao: itemAtual.proposicao ? {
            id: itemAtual.proposicao.id,
            numero: itemAtual.proposicao.numero,
            ano: itemAtual.proposicao.ano,
            tipo: itemAtual.proposicao.tipo,
            ementa: itemAtual.proposicao.ementa
          } : null
        } : null,
        votacao: votosContagem,
        vereadores,
        presentes: parlamentaresPresentes.length,
        totalVereadores,
        resultado,
        timestamp: new Date().toISOString()
      }

      return estado
    } catch (error) {
      console.error('Erro ao buscar estado do painel:', error)
      return null
    }
  },

  /**
   * Busca sessao completa para o painel publico
   */
  async getSessaoCompleta(sessaoId: string) {
    const sessao = await prisma.sessao.findUnique({
      where: { id: sessaoId },
      include: {
        legislatura: {
          select: {
            id: true,
            numero: true,
            anoInicio: true,
            anoFim: true,
            mandatos: {
              where: { ativo: true },
              include: {
                parlamentar: {
                  select: {
                    id: true,
                    nome: true,
                    apelido: true,
                    partido: true,
                    foto: true
                  }
                }
              }
            }
          }
        },
        periodo: {
          select: {
            id: true,
            numero: true,
            dataInicio: true,
            dataFim: true
          }
        },
        pautaSessao: {
          include: {
            itemAtual: {
              select: {
                id: true,
                titulo: true,
                secao: true,
                ordem: true,
                tempoEstimado: true,
                tempoReal: true,
                tempoAcumulado: true,
                iniciadoEm: true,
                finalizadoEm: true,
                status: true
              }
            },
            itens: {
              orderBy: { ordem: 'asc' },
              include: {
                proposicao: {
                  select: {
                    id: true,
                    numero: true,
                    ano: true,
                    titulo: true,
                    tipo: true,
                    status: true,
                    autor: {
                      select: {
                        id: true,
                        nome: true,
                        apelido: true
                      }
                    },
                    votacoes: {
                      include: {
                        parlamentar: {
                          select: {
                            id: true,
                            nome: true,
                            apelido: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        presencas: {
          include: {
            parlamentar: {
              select: {
                id: true,
                nome: true,
                apelido: true,
                partido: true,
                foto: true
              }
            }
          }
        }
      }
    })

    return sessao
  }
}
