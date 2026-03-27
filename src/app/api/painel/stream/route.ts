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
import { painelDbService, type EstadoPainelSSE } from '@/lib/services/painel-db-service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Intervalo de polling para atualizar estado (em ms)
const POLLING_INTERVAL = 2000

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessaoId = searchParams.get('sessaoId')

  if (!sessaoId) {
    return new Response('sessaoId e obrigatorio', { status: 400 })
  }

  // Verificar se sessao existe
  const sessaoExiste = await painelDbService.sessaoExists(sessaoId)

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
          // Conexão SSE fechada pelo cliente - esperado
        }
      }

      // Funcao para enviar heartbeat
      const sendHeartbeat = () => {
        if (!isConnected) return

        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch (error) {
          // Conexão provavelmente foi fechada pelo cliente
          // Heartbeat SSE falhou - conexão fechada pelo cliente
        }
      }

      // Ultimo estado para comparacao
      let ultimoEstado: EstadoPainelSSE | null = null

      // Loop de polling
      const poll = async () => {
        if (!isConnected) return

        try {
          const estado = await painelDbService.getEstadoPainel(sessaoId)

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
