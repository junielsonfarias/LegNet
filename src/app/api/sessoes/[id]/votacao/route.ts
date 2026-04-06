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

  // Criar ou atualizar voto
  const voto = await upsertVotoIndividual({
    proposicaoId: validatedData.proposicaoId,
    parlamentarId: validatedData.parlamentarId,
    voto: validatedData.voto,
    turno: turnoAtual,
    sessaoId
  })

  // RN-078: Registrar auditoria para voto retroativo
  if (isRetroativo) {
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
})

