import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError,
  NotFoundError
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import {
  assertSessaoPermiteVotacao,
  ensureParlamentarPresente,
  obterSessaoParaControle,
  resolverSessaoId
} from '@/lib/services/sessao-controle'
import { logAudit } from '@/lib/audit'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
  const sessaoId = await resolverSessaoId(params.id)

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

  if (!sessao) {
    throw new NotFoundError('Sessão')
  }

  // Consolidar proposições de ambas as fontes (pauta + diretas)
  const proposicoesMap = new Map<string, any>()

  // Mapa de tipoVotacao por proposicaoId
  const tipoVotacaoMap = new Map<string, string>()

  // Adicionar proposições da pauta
  if (sessao.pautaSessao?.itens) {
    for (const item of sessao.pautaSessao.itens) {
      if (item.proposicao) {
        proposicoesMap.set(item.proposicao.id, item.proposicao)
        tipoVotacaoMap.set(item.proposicao.id, item.tipoVotacao || 'NOMINAL')
      }
    }
  }

  // Adicionar proposições diretas (caso não estejam na pauta)
  for (const prop of sessao.proposicoes) {
    if (!proposicoesMap.has(prop.id)) {
      proposicoesMap.set(prop.id, prop)
    }
  }

  // Processar proposições para respeitar tipo de votação
  const proposicoesConsolidadas = Array.from(proposicoesMap.values()).map(prop => {
    const tipoVotacao = tipoVotacaoMap.get(prop.id) || 'NOMINAL'

    // Votação LEITURA - apenas leitura, sem votação
    if (tipoVotacao === 'LEITURA') {
      return {
        ...prop,
        tipoVotacao: 'LEITURA',
        votacoes: [],
        votacaoInfo: {
          tipo: 'LEITURA',
          descricao: 'Apenas leitura, sem votação'
        }
      }
    }

    // Votação SECRETA - não retornar detalhes individuais dos votos
    if (tipoVotacao === 'SECRETA') {
      const votosSim = prop.votacoes?.filter((v: any) => v.voto === 'SIM').length || 0
      const votosNao = prop.votacoes?.filter((v: any) => v.voto === 'NAO').length || 0
      const votosAbstencao = prop.votacoes?.filter((v: any) => v.voto === 'ABSTENCAO').length || 0

      return {
        ...prop,
        tipoVotacao: 'SECRETA',
        votacoes: [], // Não retorna votos individuais
        votacaoSecreta: {
          total: votosSim + votosNao + votosAbstencao,
          sim: votosSim,
          nao: votosNao,
          abstencao: votosAbstencao
        }
      }
    }

    // Votação SIMBOLICA - mão levantada, apenas contagem
    if (tipoVotacao === 'SIMBOLICA') {
      const votosSim = prop.votacoes?.filter((v: any) => v.voto === 'SIM').length || 0
      const votosNao = prop.votacoes?.filter((v: any) => v.voto === 'NAO').length || 0
      const votosAbstencao = prop.votacoes?.filter((v: any) => v.voto === 'ABSTENCAO').length || 0

      return {
        ...prop,
        tipoVotacao: 'SIMBOLICA',
        votacoes: [], // Não retorna votos individuais
        votacaoSimbolica: {
          total: votosSim + votosNao + votosAbstencao,
          sim: votosSim,
          nao: votosNao,
          abstencao: votosAbstencao,
          descricao: 'Votação por mão levantada'
        }
      }
    }

    // Votação NOMINAL - retorna votos individuais
    return {
      ...prop,
      tipoVotacao: 'NOMINAL'
    }
  })

  return createSuccessResponse(proposicoesConsolidadas, 'Votações listadas com sucesso')
})

// POST - Registrar voto
// SEGURANÇA: Requer autenticação e permissão de votação
export const POST = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const sessaoId = await resolverSessaoId(rawId)
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

  // Para sessões CONCLUIDAS, permitir edição de votos independente do status do item (dados pretéritos)
  // Para sessões EM_ANDAMENTO, exigir que o item esteja em votação
  if (sessao.status === 'EM_ANDAMENTO' && pautaItem.status !== 'EM_VOTACAO') {
    throw new ValidationError(
      pautaItem.status === 'EM_DISCUSSAO'
        ? 'A votação ainda não foi iniciada para esta proposição. Aguarde o operador iniciar a votação.'
        : pautaItem.status === 'PENDENTE'
          ? 'Esta proposição ainda não foi colocada em discussão.'
          : `Esta proposição já foi ${pautaItem.status.toLowerCase().replace('_', ' ')}.`
    )
  }

  // Usar turno atual do item da pauta (default 1)
  const turnoAtual = pautaItem.turnoAtual || 1

  // Detectar se é lançamento retroativo (sessão já concluída)
  const isRetroativo = sessao.status === 'CONCLUIDA'

  // Criar ou atualizar voto
  const voto = await prisma.votacao.upsert({
    where: {
      proposicaoId_parlamentarId_turno: {
        proposicaoId: validatedData.proposicaoId,
        parlamentarId: validatedData.parlamentarId,
        turno: turnoAtual
      }
    },
    update: {
      voto: validatedData.voto,
      sessaoId: sessaoId  // Garante que sessaoId é atualizado mesmo em updates
    },
    create: {
      proposicaoId: validatedData.proposicaoId,
      parlamentarId: validatedData.parlamentarId,
      voto: validatedData.voto,
      turno: turnoAtual,
      sessaoId: sessaoId  // GAP #1: Registrar sessaoId nos votos individuais
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

  // RN-078: Registrar auditoria para voto retroativo
  if (isRetroativo) {
    const session = await getServerSession(authOptions)
    if (session?.user) {
      await logAudit({
        request,
        session,
        action: 'VOTO_RETROATIVO',
        entity: 'Votacao',
        entityId: voto.id,
        metadata: {
          sessaoId,
          proposicaoId: validatedData.proposicaoId,
          parlamentarId: validatedData.parlamentarId,
          voto: validatedData.voto,
          proposicao: `${proposicao.numero}/${proposicao.ano}`,
          timestamp: new Date().toISOString()
        }
      })
    }
  }

  return createSuccessResponse(voto, 'Voto registrado com sucesso')
}, { permissions: 'votacao.manage' })

