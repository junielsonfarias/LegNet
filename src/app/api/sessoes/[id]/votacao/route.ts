import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError,
  NotFoundError,
  validateId
} from '@/lib/error-handler'
import {
  assertSessaoPermiteVotacao,
  ensureParlamentarPresente,
  obterSessaoParaControle
} from '@/lib/services/sessao-controle'

export const dynamic = 'force-dynamic'

const VotoSchema = z.object({
  proposicaoId: z.string(),
  parlamentarId: z.string(),
  voto: z.enum(['SIM', 'NAO', 'ABSTENCAO'])
})

// GET - Listar votos da sessão
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const sessaoId = validateId(params.id, 'Sessão')

  const sessao = await prisma.sessao.findUnique({
    where: { id: sessaoId },
    include: {
      // Buscar proposições via pauta da sessão (principal fonte de votações)
      pautaSessao: {
        include: {
          itens: {
            include: {
              proposicao: {
                include: {
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
      // Também buscar proposições diretamente vinculadas à sessão
      proposicoes: {
        include: {
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
  })

  if (!sessao) {
    throw new NotFoundError('Sessão')
  }

  // Consolidar proposições de ambas as fontes (pauta + diretas)
  const proposicoesMap = new Map<string, any>()

  // Adicionar proposições da pauta
  if (sessao.pautaSessao?.itens) {
    for (const item of sessao.pautaSessao.itens) {
      if (item.proposicao) {
        proposicoesMap.set(item.proposicao.id, item.proposicao)
      }
    }
  }

  // Adicionar proposições diretas (caso não estejam na pauta)
  for (const prop of sessao.proposicoes) {
    if (!proposicoesMap.has(prop.id)) {
      proposicoesMap.set(prop.id, prop)
    }
  }

  const proposicoesConsolidadas = Array.from(proposicoesMap.values())

  return createSuccessResponse(proposicoesConsolidadas, 'Votações listadas com sucesso')
})

// POST - Registrar voto
export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const sessaoId = validateId(params.id, 'Sessão')
  const body = await request.json()

  const validatedData = VotoSchema.parse(body)

  // Verificar se sessão existe e está em andamento
  const sessao = await obterSessaoParaControle(sessaoId)
  assertSessaoPermiteVotacao(sessao)

  // Verificar se parlamentar está presente na sessão
  await ensureParlamentarPresente(sessaoId, validatedData.parlamentarId)

  // Verificar se proposição existe
  const proposicao = await prisma.proposicao.findUnique({
    where: { id: validatedData.proposicaoId }
  })

  if (!proposicao) {
    throw new NotFoundError('Proposição')
  }

  // Verificar se a proposição está em um item da pauta desta sessão
  // E se esse item está com status EM_VOTACAO
  const pautaItem = await prisma.pautaItem.findFirst({
    where: {
      proposicaoId: validatedData.proposicaoId,
      pauta: {
        sessaoId: sessaoId
      }
    },
    include: {
      pauta: true
    }
  })

  if (!pautaItem) {
    throw new ValidationError('Esta proposição não está na pauta desta sessão')
  }

  if (pautaItem.status !== 'EM_VOTACAO') {
    throw new ValidationError(
      pautaItem.status === 'EM_DISCUSSAO'
        ? 'A votação ainda não foi iniciada para esta proposição. Aguarde o operador iniciar a votação.'
        : pautaItem.status === 'PENDENTE'
          ? 'Esta proposição ainda não foi colocada em discussão.'
          : `Esta proposição já foi ${pautaItem.status.toLowerCase().replace('_', ' ')}.`
    )
  }

  // Criar ou atualizar voto
  const voto = await prisma.votacao.upsert({
    where: {
      proposicaoId_parlamentarId: {
        proposicaoId: validatedData.proposicaoId,
        parlamentarId: validatedData.parlamentarId
      }
    },
    update: {
      voto: validatedData.voto
    },
    create: {
      proposicaoId: validatedData.proposicaoId,
      parlamentarId: validatedData.parlamentarId,
      voto: validatedData.voto
    },
    include: {
      parlamentar: {
        select: {
          id: true,
          nome: true,
          apelido: true
        }
      },
      proposicao: {
        select: {
          id: true,
          numero: true,
          ano: true,
          titulo: true
        }
      }
    }
  })

  return createSuccessResponse(voto, 'Voto registrado com sucesso')
})

