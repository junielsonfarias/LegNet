import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, NotFoundError, ValidationError, validateId } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { gerarPautaAutomatica } from '@/lib/utils/sessoes-utils'
import {
  validarInclusaoOrdemDoDia,
  determinarTipoAcaoPauta,
  MAPEAMENTO_TIPO_SECAO
} from '@/lib/services/proposicao-validacao-service'

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
  tipoAcao: z.enum(TIPO_ACAO_PAUTA).optional(), // NOVO - se não informado, será determinado automaticamente
  validarParecer: z.boolean().optional().default(true) // NOVO - permite ignorar validação em casos especiais
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
  const sessaoId = validateId(params.id, 'Sessão')

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
  const sessaoId = validateId(params.id, 'Sessão')
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

      // RN-030: Validar parecer se está adicionando à ORDEM_DO_DIA para VOTAÇÃO
      if (
        payload.data.secao === 'ORDEM_DO_DIA' &&
        (tipoAcao === 'VOTACAO' || tipoAcao === 'DISCUSSAO') &&
        payload.data.validarParecer !== false
      ) {
        const validacao = await validarInclusaoOrdemDoDia(payload.data.proposicaoId)

        if (!validacao.valid) {
          throw new ValidationError(validacao.errors.join('; '))
        }

        // Se passou na validação, atualizar status da proposição para EM_PAUTA
        if (proposicao.status !== 'EM_PAUTA') {
          await prisma.proposicao.update({
            where: { id: payload.data.proposicaoId },
            data: { status: 'EM_PAUTA' }
          })
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
      observacoes: payload.data.observacoes ?? null
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