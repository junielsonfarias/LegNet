import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError,
  NotFoundError,
  UnauthorizedError
} from '@/lib/error-handler'
import {
  getVotosSessaoConsolidados,
  findProposicaoParaVotacao,
  findPautaItemParaVotacao,
  upsertVotoIndividual
} from '@/lib/services/votacao-service'
import { hasPermission } from '@/lib/auth/permissions'
import type { UserRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'
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

// Fase 5 / M3: tipos para consolidacao de votacao (substitui any)
type VotoTipo = 'SIM' | 'NAO' | 'ABSTENCAO' | 'AUSENTE'
type TipoVotacao = 'NOMINAL' | 'SECRETA' | 'SIMBOLICA' | 'LEITURA'

interface VotoIndividual {
  id: string
  voto: VotoTipo
  parlamentarId?: string
  parlamentar?: { id: string; nome: string; apelido?: string | null }
}

interface ProposicaoComVotacoes {
  id: string
  numero: string
  ano: number
  tipo: string
  titulo: string
  status: string
  votacoes?: VotoIndividual[]
  // permite campos extras que vem do include do Prisma
  [key: string]: unknown
}

const contarVotos = (votacoes: VotoIndividual[] | undefined): {
  sim: number; nao: number; abstencao: number
} => ({
  sim: votacoes?.filter((v) => v.voto === 'SIM').length ?? 0,
  nao: votacoes?.filter((v) => v.voto === 'NAO').length ?? 0,
  abstencao: votacoes?.filter((v) => v.voto === 'ABSTENCAO').length ?? 0
})

// GET - Listar votos da sessão
export const GET = withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params
  const sessaoId = await resolverSessaoId(id)

  const sessao = await getVotosSessaoConsolidados(sessaoId)

  if (!sessao) {
    throw new NotFoundError('Sessão')
  }

  // Consolidar proposições de ambas as fontes (pauta + diretas)
  const proposicoesMap = new Map<string, ProposicaoComVotacoes>()

  // Mapa de tipoVotacao por proposicaoId
  const tipoVotacaoMap = new Map<string, TipoVotacao>()

  // Adicionar proposições da pauta
  if (sessao.pautaSessao?.itens) {
    for (const item of sessao.pautaSessao.itens) {
      if (item.proposicao) {
        proposicoesMap.set(item.proposicao.id, item.proposicao as ProposicaoComVotacoes)
        tipoVotacaoMap.set(item.proposicao.id, (item.tipoVotacao as TipoVotacao | null) ?? 'NOMINAL')
      }
    }
  }

  // Adicionar proposições diretas (caso não estejam na pauta)
  for (const prop of sessao.proposicoes) {
    if (!proposicoesMap.has(prop.id)) {
      proposicoesMap.set(prop.id, prop as ProposicaoComVotacoes)
    }
  }

  // Processar proposições para respeitar tipo de votação
  // RN-061 (votacao secreta): NUNCA retornar votos individuais quando tipoVotacao=SECRETA
  // SIMBOLICA tambem nao retorna individuais (sao votos por aclamacao)
  const proposicoesConsolidadas = Array.from(proposicoesMap.values()).map((prop) => {
    const tipoVotacao = tipoVotacaoMap.get(prop.id) ?? 'NOMINAL'

    // Votação LEITURA - apenas leitura, sem votação
    if (tipoVotacao === 'LEITURA') {
      return {
        ...prop,
        tipoVotacao: 'LEITURA' as const,
        votacoes: [],
        votacaoInfo: {
          tipo: 'LEITURA' as const,
          descricao: 'Apenas leitura, sem votação'
        }
      }
    }

    // Votação SECRETA - não retornar detalhes individuais dos votos (RN-061)
    if (tipoVotacao === 'SECRETA') {
      const { sim, nao, abstencao } = contarVotos(prop.votacoes)
      return {
        ...prop,
        tipoVotacao: 'SECRETA' as const,
        votacoes: [], // RN-061: votos individuais NUNCA expostos em sessao secreta
        votacaoSecreta: {
          total: sim + nao + abstencao,
          sim, nao, abstencao
        }
      }
    }

    // Votação SIMBOLICA - mão levantada, apenas contagem
    if (tipoVotacao === 'SIMBOLICA') {
      const { sim, nao, abstencao } = contarVotos(prop.votacoes)
      return {
        ...prop,
        tipoVotacao: 'SIMBOLICA' as const,
        votacoes: [], // simbolica e por aclamacao - nao expoe individual
        votacaoSimbolica: {
          total: sim + nao + abstencao,
          sim, nao, abstencao,
          descricao: 'Votação por mão levantada'
        }
      }
    }

    // Votação NOMINAL - retorna votos individuais
    return {
      ...prop,
      tipoVotacao: 'NOMINAL' as const
    }
  })

  return createSuccessResponse(proposicoesConsolidadas, 'Votações listadas com sucesso')
})

// POST - Registrar voto
// SEGURANÇA: Requer autenticação. Parlamentares podem votar por si mesmos,
// outros roles precisam da permissão votacao.manage
export const POST = withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  // Validação CSRF
  const { validateCsrf } = await import('@/lib/middleware/csrf')
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError

  // Verificar autenticação
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new UnauthorizedError('Sessão expirada ou usuário não autenticado')
  }

  const { id: rawId } = await context.params
  const sessaoId = await resolverSessaoId(rawId)
  const body = await request.json()

  const validatedData = VotoSchema.parse(body)

  // Verificar permissão:
  // 1. Se tem permissão votacao.manage (OPERADOR, ADMIN, etc.) - pode votar por qualquer um
  // 2. Se é PARLAMENTAR e está votando por si mesmo - permitido
  const userRole = (session.user.role as UserRole) || 'USER'
  const userParlamentarId = (session.user as any).parlamentarId

  const hasVotacaoManage = hasPermission(userRole, 'votacao.manage')
  const isSelfVote = userRole === 'PARLAMENTAR' && userParlamentarId === validatedData.parlamentarId

  if (!hasVotacaoManage && !isSelfVote) {
    throw new UnauthorizedError(
      userRole === 'PARLAMENTAR'
        ? 'Você só pode registrar seu próprio voto'
        : 'Você não possui permissão para registrar votos'
    )
  }

  // Verificar se sessão existe e está em andamento
  const sessao = await obterSessaoParaControle(sessaoId)
  assertSessaoPermiteVotacao(sessao)

  // Executar validações em paralelo para reduzir latência
  const [, mandatoAtivo, proposicao, pautaItem] = await Promise.all([
    ensureParlamentarPresente(sessaoId, validatedData.parlamentarId),
    sessao.legislaturaId
      ? prisma.mandato.findFirst({
          where: {
            parlamentarId: validatedData.parlamentarId,
            legislaturaId: sessao.legislaturaId,
            ativo: true
          }
        })
      : Promise.resolve(true),
    findProposicaoParaVotacao(validatedData.proposicaoId),
    findPautaItemParaVotacao(validatedData.proposicaoId, sessaoId)
  ])

  if (sessao.legislaturaId && !mandatoAtivo) {
    throw new ValidationError('Parlamentar nao possui mandato ativo na legislatura desta sessao')
  }

  if (!proposicao) {
    throw new NotFoundError('Proposição')
  }

  if (!pautaItem) {
    throw new ValidationError('Esta proposição não está na pauta desta sessão')
  }

  // Bloquear votos em itens de LEITURA (não tem votação)
  if (pautaItem.tipoAcao === 'LEITURA' || (pautaItem as any).tipoVotacao === 'LEITURA') {
    throw new ValidationError('Este item é apenas de leitura e não aceita votação.')
  }

  // Bloquear votos em itens com status final (APROVADO, REJEITADO, RETIRADO)
  const statusFinaisItem = ['APROVADO', 'REJEITADO', 'RETIRADO', 'CONCLUIDO']
  if (statusFinaisItem.includes(pautaItem.status)) {
    throw new ValidationError(
      `Este item já foi ${pautaItem.status.toLowerCase().replace('_', ' ')} e não aceita mais votos.`
    )
  }

  // Para sessões EM_ANDAMENTO, exigir que o item esteja em votação
  if (sessao.status === 'EM_ANDAMENTO' && pautaItem.status !== 'EM_VOTACAO') {
    throw new ValidationError(
      pautaItem.status === 'EM_DISCUSSAO'
        ? 'A votação ainda não foi iniciada para esta proposição. Aguarde o operador iniciar a votação.'
        : pautaItem.status === 'PENDENTE'
          ? 'Esta proposição ainda não foi colocada em discussão.'
          : `Esta proposição está com status ${pautaItem.status.toLowerCase().replace('_', ' ')}.`
    )
  }

  // Verificar impedimento de voto (autor não pode votar na própria proposição - RN-063)
  if (proposicao?.autorId === validatedData.parlamentarId) {
    throw new ValidationError('Parlamentar impedido de votar: autor da proposição (RN-063)')
  }

  // Usar turno atual do item da pauta (default 1)
  const turnoAtual = pautaItem.turnoAtual || 1

  // Detectar se é lançamento retroativo (sessão já concluída)
  const isRetroativo = sessao.status === 'CONCLUIDA'

  // Criar ou atualizar voto com re-check atômico do status do item
  const voto = await prisma.$transaction(async (tx: any) => {
    // Re-verificar status dentro da transação para evitar race condition
    const itemAtual = await tx.pautaItem.findUnique({
      where: { id: pautaItem.id },
      select: { status: true }
    })
    if (itemAtual && statusFinaisItem.includes(itemAtual.status)) {
      throw new ValidationError('Este item já foi encerrado e não aceita mais votos.')
    }
    return tx.votacao.upsert({
      where: {
        proposicaoId_parlamentarId_turno: {
          proposicaoId: validatedData.proposicaoId,
          parlamentarId: validatedData.parlamentarId,
          turno: turnoAtual
        }
      },
      update: {
        voto: validatedData.voto,
        sessaoId
      },
      create: {
        proposicaoId: validatedData.proposicaoId,
        parlamentarId: validatedData.parlamentarId,
        voto: validatedData.voto,
        turno: turnoAtual,
        sessaoId
      },
      include: {
        parlamentar: { select: { id: true, nome: true, apelido: true } },
        proposicao: { select: { id: true, titulo: true, numero: true, ano: true, tipo: true } }
      }
    })
  })

  // P0-2 / RN-003: audit log de todo voto persistido (IP + user-agent + session)
  // RN-078: distingue VOTO_RETROATIVO de VOTO_REGISTRADO via action
  if (session?.user) {
    await logAudit({
      request,
      session,
      action: isRetroativo ? 'VOTO_RETROATIVO' : 'VOTO_REGISTRADO',
      entity: 'Votacao',
      entityId: voto.id,
      metadata: {
        sessaoId,
        proposicaoId: validatedData.proposicaoId,
        parlamentarId: validatedData.parlamentarId,
        voto: validatedData.voto,
        turno: turnoAtual,
        proposicao: `${proposicao.numero}/${proposicao.ano}`,
        timestamp: new Date().toISOString()
      }
    })
  }

  return createSuccessResponse(voto, 'Voto registrado com sucesso')
})

