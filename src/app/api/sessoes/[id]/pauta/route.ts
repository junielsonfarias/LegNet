import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, NotFoundError, ValidationError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { gerarPautaAutomatica } from '@/lib/utils/sessoes-utils'
import {
  validarInclusaoOrdemDoDia,
  determinarTipoAcaoPauta,
  MAPEAMENTO_TIPO_SECAO
} from '@/lib/services/proposicao-validacao-service'
import { resolverSessaoId } from '@/lib/services/sessao-controle'
import { tramitarParaPlenario } from '@/lib/services/tramitacao-service'

const PAUTA_SECAO_ORDER = ['EXPEDIENTE', 'ORDEM_DO_DIA', 'COMUNICACOES', 'HONRAS', 'OUTROS'] as const
const TIPO_ACAO_PAUTA = ['LEITURA', 'DISCUSSAO', 'VOTACAO', 'COMUNICADO', 'HOMENAGEM'] as const

const PautaItemCreateSchema = z.object({
  secao: z.enum(PAUTA_SECAO_ORDER),
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  proposicaoId: z.string().optional(),
  tempoEstimado: z.number().min(0).optional(),
  autor: z.string().optional(),
  observacoes: z.string().optional(),
  tipoAcao: z.enum(TIPO_ACAO_PAUTA).optional(), // Se não informado, será determinado automaticamente
  // === NOVOS CAMPOS DE ETAPA E LEITURA ===
  etapa: z.number().int().min(1).max(2).nullable().optional(), // 1 = 1ª Ordem do Dia, 2 = 2ª Ordem do Dia
  parecerId: z.string().nullable().optional(),
  leituraNumero: z.number().int().min(1).max(3).nullable().optional(),
  relatorId: z.string().nullable().optional()
})

const sortItens = <T extends { secao: string; ordem: number }>(itens: T[]) => {
  return [...itens].sort((a, b) => {
    const secaoDiff = PAUTA_SECAO_ORDER.indexOf(a.secao as typeof PAUTA_SECAO_ORDER[number]) -
      PAUTA_SECAO_ORDER.indexOf(b.secao as typeof PAUTA_SECAO_ORDER[number])
    if (secaoDiff !== 0) {
      return secaoDiff
    }
    return a.ordem - b.ordem
  })
}

const loadPautaCompleta = async (sessaoId: string) => {
  const pauta = await prisma.pautaSessao.findUnique({
    where: { sessaoId },
    include: {
      itens: {
        include: {
          proposicao: {
            select: {
              id: true,
              numero: true,
              ano: true,
              titulo: true,
              tipo: true,
              status: true
            }
          },
          parecer: {
            select: {
              id: true,
              numero: true,
              ano: true,
              tipo: true,
              status: true,
              comissao: {
                select: { id: true, nome: true, sigla: true }
              }
            }
          },
          relator: {
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

  if (!pauta) {
    return null
  }

  return {
    ...pauta,
    itens: sortItens(pauta.itens)
  }
}

const ensurePautaSessao = async (sessaoId: string) => {
  const existente = await loadPautaCompleta(sessaoId)
  if (existente) {
    return existente
  }

  const sessao = await prisma.sessao.findUnique({ where: { id: sessaoId } })
  if (!sessao) {
    throw new NotFoundError('Sessão')
  }

  const pautaPadrao = await gerarPautaAutomatica(sessao.numero, new Date(sessao.data), sessao.horario ?? undefined)
  const tempoTotal = pautaPadrao.itens.reduce((total, item) => total + (item.tempoEstimado || 0), 0)

  await prisma.pautaSessao.create({
    data: {
      sessaoId,
      status: 'RASCUNHO',
      geradaAutomaticamente: true,
      observacoes: pautaPadrao.observacoes,
      tempoTotalEstimado: tempoTotal,
      itens: {
        create: pautaPadrao.itens.map(item => ({
          secao: item.secao,
          ordem: item.ordem,
          titulo: item.titulo,
          descricao: item.descricao ?? null,
          tempoEstimado: item.tempoEstimado ?? null,
          status: 'PENDENTE'
        }))
      }
    }
  })

  return await loadPautaCompleta(sessaoId)
}

const recalcTempoTotal = async (pautaId: string) => {
  const itens = await prisma.pautaItem.findMany({
    where: { pautaId }
  })
  const tempoTotal = itens.reduce((total, item) => total + (item.tempoEstimado || 0), 0)
  await prisma.pautaSessao.update({
    where: { id: pautaId },
    data: {
      tempoTotalEstimado: tempoTotal,
      geradaAutomaticamente: false
    }
  })
}

export const GET = withAuth(async (
  _request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const sessaoId = await resolverSessaoId(params.id)

  const pauta = await ensurePautaSessao(sessaoId)
  if (!pauta) {
    throw new NotFoundError('Pauta da sessão')
  }

  return createSuccessResponse(pauta, 'Pauta carregada com sucesso')
}, { permissions: 'sessao.view' })

export const POST = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const sessaoId = await resolverSessaoId(params.id)
  const body = await request.json()

  const payload = PautaItemCreateSchema.safeParse({
    ...body,
    tempoEstimado: body.tempoEstimado !== undefined ? Number(body.tempoEstimado) : undefined
  })

  if (!payload.success) {
    throw new ValidationError(payload.error.issues[0]?.message ?? 'Dados inválidos')
  }

  const sessao = await prisma.sessao.findUnique({ where: { id: sessaoId } })
  if (!sessao) {
    throw new NotFoundError('Sessão')
  }

  const pautaSessao = await ensurePautaSessao(sessaoId)
  if (!pautaSessao) {
    throw new NotFoundError('Pauta da sessão')
  }

  // Determinar tipoAcao automaticamente se não informado
  let tipoAcao = payload.data.tipoAcao
  let proposicaoTipo: string | null = null

  // Se tem proposição vinculada, buscar informações
  if (payload.data.proposicaoId) {
    const proposicao = await prisma.proposicao.findUnique({
      where: { id: payload.data.proposicaoId },
      select: { tipo: true, status: true }
    })

    if (proposicao) {
      proposicaoTipo = proposicao.tipo

      // Determinar tipoAcao baseado no tipo da proposição e seção
      if (!tipoAcao) {
        const mapeamento = MAPEAMENTO_TIPO_SECAO[proposicao.tipo]
        if (mapeamento) {
          // Se está indo para ORDEM_DO_DIA e tem tipoAcaoVotacao, usar esse
          if (payload.data.secao === 'ORDEM_DO_DIA' && mapeamento.tipoAcaoVotacao) {
            tipoAcao = mapeamento.tipoAcaoVotacao as typeof TIPO_ACAO_PAUTA[number]
          } else {
            tipoAcao = mapeamento.tipoAcaoPrimeira as typeof TIPO_ACAO_PAUTA[number]
          }
        } else {
          tipoAcao = determinarTipoAcaoPauta(proposicao.tipo, payload.data.secao) as typeof TIPO_ACAO_PAUTA[number]
        }
      }

      // RN-030 e RN-057: SEMPRE validar parecer ao adicionar à ORDEM_DO_DIA para VOTAÇÃO
      // GAP CRÍTICO #4: Removido bypass - validação é sempre obrigatória
      if (
        payload.data.secao === 'ORDEM_DO_DIA' &&
        (tipoAcao === 'VOTACAO' || tipoAcao === 'DISCUSSAO')
      ) {
        const validacao = await validarInclusaoOrdemDoDia(payload.data.proposicaoId)

        if (!validacao.valid) {
          throw new ValidationError(
            'RN-030/RN-057: ' + validacao.errors.join('; ') +
            ' Não é possível incluir esta proposição na Ordem do Dia.'
          )
        }

        // Se passou na validação, tramitar proposição para o Plenário
        if (proposicao.status !== 'EM_PAUTA') {
          // Usa serviço de tramitação para criar registro e atualizar status
          await tramitarParaPlenario(
            payload.data.proposicaoId,
            sessaoId,
            `Incluída na pauta - Seção: ${payload.data.secao}`,
            session?.user?.id,
            request.headers.get('x-forwarded-for') || undefined
          )
        }
      }
    }
  }

  // Se ainda não tem tipoAcao, usar padrão baseado na seção
  if (!tipoAcao) {
    switch (payload.data.secao) {
      case 'ORDEM_DO_DIA':
        tipoAcao = 'VOTACAO'
        break
      case 'EXPEDIENTE':
        tipoAcao = 'LEITURA'
        break
      case 'HONRAS':
        tipoAcao = 'HOMENAGEM'
        break
      case 'COMUNICACOES':
        tipoAcao = 'COMUNICADO'
        break
      default:
        tipoAcao = 'LEITURA'
    }
  }

  // === AUTO-DETERMINAÇÃO DE ETAPA (RN-060 a RN-063) ===
  let etapa = payload.data.etapa ?? null

  // RN-060: Campo etapa só é válido para ORDEM_DO_DIA
  if (payload.data.secao !== 'ORDEM_DO_DIA') {
    etapa = null
  } else if (etapa === null) {
    // RN-063: Default - etapa 1 para LEITURA, etapa 2 para VOTACAO/DISCUSSAO
    etapa = (tipoAcao === 'LEITURA') ? 1 : 2
  }

  // Validar consistência etapa vs tipoAcao
  if (etapa !== null && payload.data.secao === 'ORDEM_DO_DIA') {
    if (etapa === 1 && tipoAcao === 'VOTACAO') {
      throw new ValidationError('RN-061: Etapa 1 (1ª Ordem do Dia) não permite tipoAcao VOTACAO')
    }
    if (etapa === 2 && tipoAcao === 'LEITURA') {
      throw new ValidationError('RN-062: Etapa 2 (2ª Ordem do Dia) não permite tipoAcao LEITURA')
    }
  }

  // Validar parecerId existe
  if (payload.data.parecerId) {
    const parecer = await prisma.parecer.findUnique({ where: { id: payload.data.parecerId } })
    if (!parecer) {
      throw new ValidationError('Parecer não encontrado')
    }
  }

  // Validar se proposição já está na pauta (evitar duplicação)
  if (payload.data.proposicaoId) {
    const itemExistente = await prisma.pautaItem.findFirst({
      where: {
        pautaId: pautaSessao.id,
        proposicaoId: payload.data.proposicaoId
      }
    })
    if (itemExistente) {
      throw new ValidationError(
        'Esta proposição já está na pauta desta sessão. ' +
        'Não é permitido adicionar a mesma proposição duas vezes.'
      )
    }
  }

  // RN-065: Validar relatorId com mandato ativo
  if (payload.data.relatorId) {
    const relator = await prisma.parlamentar.findUnique({
      where: { id: payload.data.relatorId },
      include: { mandatos: { where: { ativo: true } } }
    })
    if (!relator) {
      throw new ValidationError('Relator não encontrado')
    }
    if (relator.mandatos.length === 0) {
      throw new ValidationError('RN-065: Relator deve ter mandato ativo')
    }
  }

  const maiorOrdem = await prisma.pautaItem.findFirst({
    where: {
      pautaId: pautaSessao.id,
      secao: payload.data.secao
    },
    orderBy: {
      ordem: 'desc'
    }
  })

  await prisma.pautaItem.create({
    data: {
      pautaId: pautaSessao.id,
      secao: payload.data.secao,
      ordem: maiorOrdem ? maiorOrdem.ordem + 1 : 1,
      titulo: payload.data.titulo,
      descricao: payload.data.descricao ?? null,
      proposicaoId: payload.data.proposicaoId ?? null,
      tempoEstimado: payload.data.tempoEstimado ?? null,
      status: 'PENDENTE',
      tipoAcao: tipoAcao,
      autor: payload.data.autor ?? null,
      observacoes: payload.data.observacoes ?? null,
      // Novos campos de etapa e leitura
      etapa: etapa,
      parecerId: payload.data.parecerId ?? null,
      leituraNumero: payload.data.leituraNumero ?? null,
      relatorId: payload.data.relatorId ?? null
    }
  })

  await recalcTempoTotal(pautaSessao.id)

  const pautaAtualizada = await loadPautaCompleta(sessaoId)
  if (!pautaAtualizada) {
    throw new NotFoundError('Pauta da sessão')
  }

  await logAudit({
    request,
    session,
    action: 'PAUTA_ITEM_CREATE',
    entity: 'PautaSessao',
    entityId: pautaSessao.id,
    metadata: {
      sessaoId,
      secao: payload.data.secao,
      titulo: payload.data.titulo,
      tipoAcao,
      proposicaoTipo
    }
  })

  return createSuccessResponse(
    pautaAtualizada,
    'Item adicionado à pauta com sucesso'
  )
}, { permissions: 'pauta.manage' })