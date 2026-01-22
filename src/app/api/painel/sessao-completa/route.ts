import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  withErrorHandler,
  createSuccessResponse,
  NotFoundError,
  validateId,
  ValidationError
} from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

// GET - Buscar sessão completa para o painel público (sem autenticação)
export const GET = withErrorHandler(async (
  request: NextRequest
) => {
  const { searchParams } = new URL(request.url)
  const sessaoId = searchParams.get('sessaoId')

  if (!sessaoId) {
    throw new ValidationError('sessaoId é obrigatório')
  }

  const id = validateId(sessaoId, 'Sessão')

  const sessao = await prisma.sessao.findUnique({
    where: { id },
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
              partido: true
            }
          }
        }
      }
    }
  })

  if (!sessao) {
    throw new NotFoundError('Sessão')
  }

  // Montar lista completa de presenças incluindo parlamentares da legislatura
  // que ainda não têm registro de presença
  const parlamentaresLegislatura = sessao.legislatura?.mandatos?.map(m => m.parlamentar) || []
  const presencasRegistradas = sessao.presencas || []

  // Criar mapa de presenças já registradas
  const presencasMap = new Map(
    presencasRegistradas.map(p => [p.parlamentar.id, p])
  )

  // Montar lista completa de presenças
  const presencasCompletas = parlamentaresLegislatura.map(parlamentar => {
    const presencaRegistrada = presencasMap.get(parlamentar.id)
    if (presencaRegistrada) {
      return presencaRegistrada
    }
    // Parlamentar sem registro de presença = ausente
    return {
      id: `virtual-${parlamentar.id}`,
      presente: false,
      justificativa: null,
      parlamentar: {
        id: parlamentar.id,
        nome: parlamentar.nome,
        apelido: parlamentar.apelido,
        partido: parlamentar.partido
      }
    }
  })

  // Retornar sessão com presenças completas
  const sessaoComPresencasCompletas = {
    ...sessao,
    presencas: presencasCompletas,
    // Adicionar estatísticas de quórum
    quorum: {
      total: parlamentaresLegislatura.length,
      presentes: presencasCompletas.filter(p => p.presente).length,
      ausentes: presencasCompletas.filter(p => !p.presente).length,
      percentual: parlamentaresLegislatura.length > 0
        ? Math.round((presencasCompletas.filter(p => p.presente).length / parlamentaresLegislatura.length) * 100)
        : 0
    }
  }

  return createSuccessResponse(sessaoComPresencasCompletas, 'Sessão encontrada com sucesso')
})
