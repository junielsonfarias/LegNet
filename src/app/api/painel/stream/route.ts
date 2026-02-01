/**
 * API de Streaming (SSE) para Painel em Tempo Real
 *
 * Fornece atualizacoes em tempo real via Server-Sent Events
 * para o painel de transmissao e painel do operador.
 *
 * Uso:
 * GET /api/painel/stream?sessaoId=xxx
 *
 * Eventos enviados:
 * - estado: Estado completo do painel
 * - voto: Novo voto registrado
 * - presenca: Mudanca de presenca
 * - votacao-iniciada: Votacao iniciada
 * - votacao-finalizada: Votacao finalizada com resultado
 * - item-alterado: Item da pauta alterado
 * - sessao-alterada: Status da sessao alterado
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Intervalo de polling para atualizar estado (em ms)
const POLLING_INTERVAL = 2000

// Tipo para o estado do painel
interface EstadoPainelSSE {
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

/**
 * Busca estado atual do painel para uma sessao
 */
async function getEstadoAtual(sessaoId: string): Promise<EstadoPainelSSE | null> {
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
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessaoId = searchParams.get('sessaoId')

  if (!sessaoId) {
    return new Response('sessaoId e obrigatorio', { status: 400 })
  }

  // Verificar se sessao existe
  const sessaoExiste = await prisma.sessao.findUnique({
    where: { id: sessaoId },
    select: { id: true }
  })

  if (!sessaoExiste) {
    return new Response('Sessao nao encontrada', { status: 404 })
  }

  // Criar stream de resposta SSE
  const encoder = new TextEncoder()
  let isConnected = true

  const stream = new ReadableStream({
    async start(controller) {
      // Funcao para enviar evento
      const sendEvent = (event: string, data: unknown) => {
        if (!isConnected) return

        try {
          const eventString = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(eventString))
        } catch (error) {
          // Conexão provavelmente foi fechada pelo cliente
          console.debug('Erro ao enviar evento SSE (conexão fechada?):', error)
        }
      }

      // Funcao para enviar heartbeat
      const sendHeartbeat = () => {
        if (!isConnected) return

        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch (error) {
          // Conexão provavelmente foi fechada pelo cliente
          console.debug('Erro ao enviar heartbeat SSE (conexão fechada?):', error)
        }
      }

      // Ultimo estado para comparacao
      let ultimoEstado: EstadoPainelSSE | null = null

      // Loop de polling
      const poll = async () => {
        if (!isConnected) return

        try {
          const estado = await getEstadoAtual(sessaoId)

          if (estado) {
            // Verificar se houve mudanca
            const estadoJson = JSON.stringify(estado)
            const ultimoJson = ultimoEstado ? JSON.stringify(ultimoEstado) : ''

            if (estadoJson !== ultimoJson) {
              // Enviar evento de estado atualizado
              sendEvent('estado', estado)

              // Detectar eventos especificos
              if (ultimoEstado) {
                // Votacao iniciada
                if (
                  ultimoEstado.itemAtual?.status !== 'EM_VOTACAO' &&
                  estado.itemAtual?.status === 'EM_VOTACAO'
                ) {
                  sendEvent('votacao-iniciada', {
                    itemId: estado.itemAtual.id,
                    proposicao: estado.itemAtual.proposicao
                  })
                }

                // Votacao finalizada
                if (
                  ultimoEstado.itemAtual?.status === 'EM_VOTACAO' &&
                  (estado.itemAtual?.status === 'APROVADO' || estado.itemAtual?.status === 'REJEITADO')
                ) {
                  sendEvent('votacao-finalizada', {
                    itemId: estado.itemAtual.id,
                    resultado: estado.resultado,
                    votos: estado.votacao
                  })
                }

                // Novo voto registrado
                const votosAnteriores = ultimoEstado.votacao.sim + ultimoEstado.votacao.nao + ultimoEstado.votacao.abstencao
                const votosAtuais = estado.votacao.sim + estado.votacao.nao + estado.votacao.abstencao
                if (votosAtuais > votosAnteriores) {
                  // Encontrar quem votou
                  const novoVoto = estado.vereadores.find(v => {
                    const anterior = ultimoEstado?.vereadores.find(a => a.id === v.id)
                    return v.voto !== null && anterior?.voto === null
                  })
                  if (novoVoto) {
                    sendEvent('voto', {
                      parlamentarId: novoVoto.id,
                      parlamentarNome: novoVoto.apelido || novoVoto.nome,
                      voto: novoVoto.voto,
                      timestamp: new Date().toISOString()
                    })
                  }
                }

                // Mudanca de presenca
                if (ultimoEstado.presentes !== estado.presentes) {
                  sendEvent('presenca', {
                    presentes: estado.presentes,
                    totalVereadores: estado.totalVereadores
                  })
                }
              }

              ultimoEstado = estado
            } else {
              // Enviar heartbeat se nao houver mudanca
              sendHeartbeat()
            }
          }
        } catch (error) {
          console.error('Erro no polling SSE:', error)
        }

        // Agendar proximo poll
        if (isConnected) {
          setTimeout(poll, POLLING_INTERVAL)
        }
      }

      // Iniciar polling
      poll()

      // Cleanup quando conexao fechada
      request.signal.addEventListener('abort', () => {
        isConnected = false
        controller.close()
      })
    },

    cancel() {
      isConnected = false
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  })
}
