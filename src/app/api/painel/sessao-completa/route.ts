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
          anoFim: true
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

  return createSuccessResponse(sessao, 'Sessão encontrada com sucesso')
})
