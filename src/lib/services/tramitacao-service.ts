/**
 * Serviço de Tramitação de Proposições
 * Implementa regras de negócio RN-030 a RN-037
 * Inclui CRUD, dashboard e regras de negócio
 */

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import { addBusinessDays, differenceInDays } from '@/lib/utils/date'
import { ValidationError, NotFoundError } from '@/lib/error-handler'
import type { Prisma } from '@prisma/client'

// Re-exportar tipos e constantes do módulo de tipos
export type {
  TramitacaoListFilters,
  PaginationParams,
  TramitacaoCreateData,
  TramitacaoUpdateData,
  TramitacaoActionReopen,
  TramitacaoActionFinalize,
  TipoParecer,
  RegimeTramitacao,
  ValidationResult,
  TramitacaoData,
  TramitacaoResultado,
  AvancarEtapaResult,
} from './tramitacao-types'

export { PRAZOS_PARECER_DIAS, REGRAS_TRAMITACAO } from './tramitacao-types'

import type {
  TramitacaoListFilters,
  PaginationParams,
  TramitacaoCreateData,
  TramitacaoUpdateData,
  RegimeTramitacao,
  ValidationResult,
  TramitacaoData,
  TipoParecer,
  TramitacaoResultado,
  AvancarEtapaResult,
} from './tramitacao-types'

import { PRAZOS_PARECER_DIAS } from './tramitacao-types'

const logger = createLogger('tramitacao')

// ======================================================================
// CRUD Methods
// ======================================================================

/**
 * Lista tramitações com filtros e paginação
 */
export async function list(
  filters: TramitacaoListFilters,
  pagination: PaginationParams
) {
  const { page, limit } = pagination
  const where: Record<string, unknown> = {}

  if (filters.proposicaoId) {
    where.proposicaoId = filters.proposicaoId
  }

  if (filters.tipoTramitacaoId) {
    where.tipoTramitacaoId = filters.tipoTramitacaoId
  }

  if (filters.unidadeId) {
    where.unidadeId = filters.unidadeId
  }

  const validStatuses = ['RECEBIDA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA']
  if (filters.status && validStatuses.includes(filters.status)) {
    where.status = filters.status
  }

  const validResultados = ['APROVADO', 'REJEITADO', 'APROVADO_COM_EMENDAS', 'ARQUIVADO']
  if (filters.resultado && validResultados.includes(filters.resultado)) {
    where.resultado = filters.resultado
  }

  if (filters.automatica !== null && filters.automatica !== undefined) {
    where.automatica = filters.automatica
  }

  if (filters.from || filters.to) {
    const dateFilter: Record<string, unknown> = {}
    if (filters.from) {
      const fromDate = new Date(filters.from)
      if (!Number.isNaN(fromDate.getTime())) {
        dateFilter.gte = fromDate
      }
    }
    if (filters.to) {
      const toDate = new Date(filters.to)
      if (!Number.isNaN(toDate.getTime())) {
        dateFilter.lte = toDate
      }
    }
    where.dataEntrada = dateFilter
  }

  if (filters.search) {
    where.OR = [
      { observacoes: { contains: filters.search, mode: 'insensitive' } },
      { parecer: { contains: filters.search, mode: 'insensitive' } }
    ]
  }

  const [tramitacoes, total] = await Promise.all([
    prisma.tramitacao.findMany({
      where,
      include: {
        tipoTramitacao: true,
        unidade: true,
        proposicao: {
          select: {
            id: true,
            numero: true,
            ano: true,
            tipo: true,
            titulo: true
          }
        },
        responsavel: {
          select: {
            id: true,
            nome: true
          }
        }
      },
      orderBy: { dataEntrada: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.tramitacao.count({ where })
  ])

  return {
    tramitacoes,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

/**
 * Busca tramitação por ID com todos os relacionamentos
 */
export async function getById(id: string) {
  const tramitacao = await prisma.tramitacao.findUnique({
    where: { id },
    include: {
      tipoTramitacao: true,
      unidade: true,
      proposicao: {
        select: {
          id: true,
          numero: true,
          ano: true,
          tipo: true,
          titulo: true
        }
      },
      responsavel: {
        select: {
          id: true,
          nome: true
        }
      },
      historicos: {
        orderBy: { data: 'desc' }
      },
      notificacoes: {
        orderBy: { enviadoEm: 'desc' }
      },
      fluxoEtapa: {
        include: {
          fluxo: true
        }
      }
    }
  })

  if (!tramitacao) {
    throw new NotFoundError('Tramitação não encontrada')
  }

  return tramitacao
}

/**
 * Cria uma nova tramitação
 * Inclui validação de proposição, tipo, unidade, cálculo de prazo e histórico
 */
export async function create(data: TramitacaoCreateData, userId?: string) {
  // Verificar se proposição existe
  const proposicao = await prisma.proposicao.findUnique({
    where: { id: data.proposicaoId }
  })

  if (!proposicao) {
    throw new ValidationError('Proposição não encontrada')
  }

  // Verificar se já existe tramitação ativa para esta proposição
  const tramitacaoAtiva = await prisma.tramitacao.findFirst({
    where: {
      proposicaoId: data.proposicaoId,
      status: { in: ['RECEBIDA', 'EM_ANDAMENTO'] }
    },
    select: { id: true, status: true }
  })

  if (tramitacaoAtiva) {
    throw new ValidationError(
      `Já existe uma tramitação ${tramitacaoAtiva.status === 'RECEBIDA' ? 'pendente' : 'em andamento'} para esta proposição. Finalize ou cancele a tramitação atual antes de criar uma nova.`
    )
  }

  // Buscar tipo de tramitação
  const tipo = await prisma.tramitacaoTipo.findUnique({
    where: { id: data.tipoTramitacaoId },
    include: { unidadeResponsavel: true }
  })

  if (!tipo) {
    throw new ValidationError('Tipo de tramitação não encontrado')
  }

  // Resolver unidade
  const resolvedUnidadeId = data.unidadeId ?? tipo.unidadeResponsavelId
  if (!resolvedUnidadeId) {
    throw new ValidationError('Unidade responsável não informada e não configurada no tipo de tramitação selecionado.')
  }

  const unidade = await prisma.tramitacaoUnidade.findUnique({
    where: { id: resolvedUnidadeId }
  })

  if (!unidade) {
    throw new ValidationError('Unidade responsável não encontrada')
  }

  const status = (data.status ?? 'RECEBIDA') as 'RECEBIDA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'
  const dataEntrada = data.dataEntrada ? new Date(data.dataEntrada) : new Date()
  let dataSaida = data.dataSaida ? new Date(data.dataSaida) : undefined

  if (status === 'CONCLUIDA' && !dataSaida) {
    dataSaida = new Date()
  }

  // Calcular prazo de vencimento (para status ativos: RECEBIDA ou EM_ANDAMENTO)
  let prazoVencimento: Date | undefined = data.prazoVencimento ? new Date(data.prazoVencimento) : undefined
  if (!prazoVencimento && (status === 'RECEBIDA' || status === 'EM_ANDAMENTO') && tipo.prazoRegimental > 0) {
    prazoVencimento = addBusinessDays(dataEntrada, tipo.prazoRegimental) ?? undefined
  }

  // Calcular dias vencidos
  let diasVencidos = data.diasVencidos
  if (diasVencidos === undefined && prazoVencimento) {
    const diff = Date.now() - prazoVencimento.getTime()
    diasVencidos = diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0
  }

  const tramitacao = await prisma.tramitacao.create({
    data: {
      proposicaoId: data.proposicaoId,
      tipoTramitacaoId: tipo.id,
      unidadeId: resolvedUnidadeId,
      dataEntrada,
      dataSaida,
      status,
      observacoes: data.observacoes,
      parecer: data.parecer,
      resultado: data.resultado as any,
      responsavelId: data.responsavelId,
      prazoVencimento,
      diasVencidos,
      automatica: data.automatica ?? false
    },
    include: {
      tipoTramitacao: true,
      unidade: true,
      proposicao: {
        select: {
          id: true,
          numero: true,
          ano: true,
          tipo: true,
          titulo: true
        }
      }
    }
  })

  // Criar registro no histórico
  await prisma.tramitacaoHistorico.create({
    data: {
      tramitacaoId: tramitacao.id,
      acao: 'CRIACAO',
      descricao: data.observacoes || 'Tramitação criada',
      usuarioId: userId,
      dadosNovos: tramitacao as any
    }
  })

  // Atualizar status da proposição baseado no tipo de tramitação/unidade
  const tipoNomeLower = tipo.nome.toLowerCase()
  const unidadeNomeLower = unidade.nome.toLowerCase()
  const observacoesLower = (data.observacoes || '').toLowerCase()

  // Detecta se é tramitação para "Aguardando Pauta"
  const isAguardandoPauta =
    tipoNomeLower.includes('aguardando pauta') ||
    tipoNomeLower.includes('pauta') ||
    observacoesLower.includes('aguardando pauta') ||
    (unidade.tipo === 'SECRETARIA' && (
      observacoesLower.includes('pauta') ||
      observacoesLower.includes('aguardando')
    ))

  // Detecta se é tramitação para "Plenário" (em pauta)
  const isEmPauta =
    unidade.tipo === 'PLENARIO' ||
    unidadeNomeLower.includes('plenário') ||
    unidadeNomeLower.includes('plenario') ||
    tipoNomeLower.includes('plenário') ||
    tipoNomeLower.includes('plenario')

  // Determinar novo status da proposição
  let novoStatusProposicao: string | null = null

  if (isEmPauta) {
    novoStatusProposicao = 'EM_PAUTA'
  } else if (isAguardandoPauta) {
    novoStatusProposicao = 'AGUARDANDO_PAUTA'
  } else if (proposicao.status === 'APRESENTADA') {
    novoStatusProposicao = 'EM_TRAMITACAO'
  }

  if (novoStatusProposicao && novoStatusProposicao !== proposicao.status) {
    // Validar transição de status antes de atualizar
    const { validarTransicaoStatus } = await import('./status-transitions')
    const validacao = validarTransicaoStatus(proposicao.status, novoStatusProposicao)
    if (validacao.valid) {
      await prisma.proposicao.update({
        where: { id: data.proposicaoId },
        data: { status: novoStatusProposicao as any }
      })
    } else {
      logger.warn('Transição de status inválida na criação de tramitação', {
        statusAtual: proposicao.status,
        novoStatus: novoStatusProposicao,
        motivo: validacao.error
      })
    }
  }

  logger.info('Tramitação criada via CRUD', {
    action: 'create',
    tramitacaoId: tramitacao.id,
    proposicaoId: data.proposicaoId,
    userId
  })

  return tramitacao
}

/**
 * Atualiza uma tramitação existente (atualização normal)
 */
export async function update(id: string, data: TramitacaoUpdateData, userId?: string) {
  const atual = await prisma.tramitacao.findUnique({
    where: { id }
  })

  if (!atual) {
    throw new NotFoundError('Tramitação não encontrada')
  }

  // Verificar tipo de tramitação
  const tipoId = data.tipoTramitacaoId ?? atual.tipoTramitacaoId
  const tipo = await prisma.tramitacaoTipo.findUnique({
    where: { id: tipoId }
  })

  if (!tipo) {
    throw new ValidationError('Tipo de tramitação não encontrado')
  }

  // Resolver unidade (unidadeId é obrigatório, usar atual como fallback)
  const resolvedUnidadeId = data.unidadeId ??
    (data.tipoTramitacaoId && tipo.unidadeResponsavelId ? tipo.unidadeResponsavelId : atual.unidadeId)

  if (resolvedUnidadeId !== atual.unidadeId) {
    const unidade = await prisma.tramitacaoUnidade.findUnique({
      where: { id: resolvedUnidadeId }
    })

    if (!unidade) {
      throw new ValidationError('Unidade responsável não encontrada')
    }
  }

  const status = (data.status ?? atual.status) as 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'
  const dataEntrada = data.dataEntrada ? new Date(data.dataEntrada) : atual.dataEntrada
  let dataSaida = data.dataSaida === null
    ? null
    : data.dataSaida
      ? new Date(data.dataSaida)
      : atual.dataSaida

  if (status === 'CONCLUIDA' && !dataSaida) {
    dataSaida = new Date()
  }

  // Calcular prazo
  let prazoVencimento = data.prazoVencimento === null
    ? null
    : data.prazoVencimento
      ? new Date(data.prazoVencimento)
      : atual.prazoVencimento

  if (!prazoVencimento && status === 'EM_ANDAMENTO' && tipo.prazoRegimental > 0) {
    prazoVencimento = addBusinessDays(dataEntrada, tipo.prazoRegimental)
  }

  // Calcular dias vencidos
  let diasVencidos = data.diasVencidos === null ? null : data.diasVencidos ?? atual.diasVencidos
  if (diasVencidos === null && prazoVencimento) {
    const diff = Date.now() - prazoVencimento.getTime()
    diasVencidos = diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0
  }

  const tramitacao = await prisma.tramitacao.update({
    where: { id },
    data: {
      tipoTramitacaoId: tipoId,
      unidadeId: resolvedUnidadeId,
      dataEntrada,
      dataSaida,
      status,
      observacoes: data.observacoes === undefined ? undefined : data.observacoes,
      parecer: data.parecer === undefined ? undefined : data.parecer,
      resultado: data.resultado === undefined ? undefined : data.resultado as any,
      responsavelId: data.responsavelId === undefined ? undefined : data.responsavelId,
      prazoVencimento,
      diasVencidos,
      automatica: data.automatica ?? atual.automatica
    },
    include: {
      tipoTramitacao: true,
      unidade: true,
      proposicao: {
        select: {
          id: true,
          numero: true,
          ano: true,
          tipo: true,
          titulo: true
        }
      }
    }
  })

  await prisma.tramitacaoHistorico.create({
    data: {
      tramitacaoId: id,
      acao: 'ATUALIZACAO',
      descricao: 'Tramitação atualizada',
      usuarioId: userId,
      dadosAnteriores: atual as any,
      dadosNovos: tramitacao as any
    }
  })

  logger.info('Tramitação atualizada via CRUD', {
    action: 'update',
    tramitacaoId: id,
    userId
  })

  return tramitacao
}

/**
 * Reabre uma tramitação concluída/cancelada
 */
export async function reopen(id: string, observacoes: string | null | undefined, userId?: string) {
  const atual = await prisma.tramitacao.findUnique({
    where: { id },
    include: { proposicao: true }
  })

  if (!atual) {
    throw new NotFoundError('Tramitação não encontrada')
  }

  // Validar que só tramitações CONCLUIDA ou CANCELADA podem ser reabertas
  if (!['CONCLUIDA', 'CANCELADA'].includes(atual.status)) {
    throw new ValidationError(`Tramitação com status '${atual.status}' não pode ser reaberta. Apenas tramitações CONCLUIDA ou CANCELADA podem ser reabertas.`)
  }

  const tipo = await prisma.tramitacaoTipo.findUnique({
    where: { id: atual.tipoTramitacaoId }
  })

  const prazoVencimento = tipo?.prazoRegimental
    ? addBusinessDays(new Date(), tipo.prazoRegimental)
    : null

  const tramitacao = await prisma.tramitacao.update({
    where: { id },
    data: {
      status: 'EM_ANDAMENTO',
      dataSaida: null,
      resultado: null,
      observacoes: observacoes
        ? `${atual.observacoes || ''}\n[Reaberta] ${observacoes}`.trim()
        : atual.observacoes,
      diasVencidos: 0,
      prazoVencimento
    },
    include: {
      tipoTramitacao: true,
      unidade: true
    }
  })

  await prisma.tramitacaoHistorico.create({
    data: {
      tramitacaoId: id,
      acao: 'REABERTURA',
      descricao: observacoes || 'Tramitação reaberta',
      usuarioId: userId
    }
  })

  logger.info('Tramitação reaberta via CRUD', {
    action: 'reopen',
    tramitacaoId: id,
    userId
  })

  return tramitacao
}

/**
 * Finaliza uma tramitação em andamento
 */
export async function finalize(
  id: string,
  observacoes: string | null | undefined,
  resultado: string | null | undefined,
  userId?: string
) {
  const atual = await prisma.tramitacao.findUnique({
    where: { id },
    include: {
      proposicao: true,
      tipoTramitacao: true,
      fluxoEtapa: true
    }
  })

  if (!atual) {
    throw new NotFoundError('Tramitação não encontrada')
  }

  // Validar que tramitação está em estado finalizável
  if (!['EM_ANDAMENTO', 'RECEBIDA'].includes(atual.status)) {
    throw new ValidationError(`Tramitação com status '${atual.status}' não pode ser finalizada. Apenas tramitações EM_ANDAMENTO ou RECEBIDA podem ser finalizadas.`)
  }

  // Validar parecer obrigatório
  if (atual.fluxoEtapa && (atual.fluxoEtapa as any).requerParecer && !atual.parecer) {
    throw new ValidationError('Esta etapa requer um parecer antes de ser finalizada.')
  }

  // Validar resultado obrigatório para finalização
  if (!resultado) {
    throw new ValidationError('Resultado é obrigatório para finalizar a tramitação (APROVADO, REJEITADO, ARQUIVADO, etc).')
  }

  const tramitacao = await prisma.tramitacao.update({
    where: { id },
    data: {
      status: 'CONCLUIDA',
      dataSaida: new Date(),
      resultado: resultado as any,
      observacoes: observacoes
        ? `${atual.observacoes || ''}\n[Finalizada] ${observacoes}`.trim()
        : atual.observacoes
    },
    include: {
      tipoTramitacao: true,
      unidade: true
    }
  })

  await prisma.tramitacaoHistorico.create({
    data: {
      tramitacaoId: id,
      acao: 'FINALIZACAO',
      descricao: observacoes || 'Tramitação finalizada',
      usuarioId: userId,
      dadosNovos: { resultado }
    }
  })

  logger.info('Tramitação finalizada via CRUD', {
    action: 'finalize',
    tramitacaoId: id,
    resultado,
    userId
  })

  return tramitacao
}

/**
 * Remove uma tramitação com exclusão em cascata (históricos e notificações)
 */
export async function remove(id: string) {
  const tramitacao = await prisma.tramitacao.findUnique({
    where: { id }
  })

  if (!tramitacao) {
    throw new NotFoundError('Tramitação não encontrada')
  }

  await prisma.$transaction([
    prisma.tramitacaoHistorico.deleteMany({ where: { tramitacaoId: id } }),
    prisma.tramitacaoNotificacao.deleteMany({ where: { tramitacaoId: id } }),
    prisma.tramitacao.delete({ where: { id } })
  ])

  logger.info('Tramitação removida via CRUD', {
    action: 'remove',
    tramitacaoId: id,
    proposicaoId: tramitacao.proposicaoId
  })

  return { id }
}

/**
 * Gera dados agregados para o dashboard de tramitações
 */
export async function getDashboard() {
  const [
    total,
    emAndamentoCount,
    concluidasCount,
    canceladasCount,
    vencidasCount,
    unidades,
    tiposTramitacao,
    tempoMedioResult,
    proximosVencimentos
  ] = await Promise.all([
    prisma.tramitacao.count(),
    prisma.tramitacao.count({ where: { status: 'EM_ANDAMENTO' } }),
    prisma.tramitacao.count({ where: { status: 'CONCLUIDA' } }),
    prisma.tramitacao.count({ where: { status: 'CANCELADA' } }),
    prisma.tramitacao.count({
      where: {
        status: 'EM_ANDAMENTO',
        prazoVencimento: { lt: new Date() }
      }
    }),
    prisma.tramitacaoUnidade.findMany({
      where: { ativo: true },
      select: { id: true, nome: true }
    }),
    prisma.tramitacaoTipo.findMany({
      where: { ativo: true },
      select: { id: true, nome: true }
    }),
    prisma.$queryRaw<{ avg_dias: number | null }[]>`
      SELECT AVG(EXTRACT(DAY FROM ("dataSaida" - "dataEntrada")))::numeric as avg_dias
      FROM "tramitacoes"
      WHERE status = 'CONCLUIDA' AND "dataSaida" IS NOT NULL
    `,
    prisma.tramitacao.findMany({
      where: {
        status: 'EM_ANDAMENTO',
        prazoVencimento: { not: null }
      },
      select: {
        id: true,
        proposicaoId: true,
        prazoVencimento: true,
        unidade: { select: { nome: true } },
        tipoTramitacao: { select: { nome: true } }
      },
      orderBy: { prazoVencimento: 'asc' },
      take: 10
    })
  ])

  // Estatísticas por unidade (groupBy em vez de N×4 counts)
  const unidadeGroupBy = await prisma.tramitacao.groupBy({
    by: ['unidadeId', 'status'],
    _count: { id: true },
    where: { unidadeId: { in: unidades.map(u => u.id) } }
  })

  const unidadeMap = new Map<string, { total: number; emAndamento: number; concluidas: number; canceladas: number }>()
  for (const row of unidadeGroupBy) {
    if (!row.unidadeId) continue
    if (!unidadeMap.has(row.unidadeId)) {
      unidadeMap.set(row.unidadeId, { total: 0, emAndamento: 0, concluidas: 0, canceladas: 0 })
    }
    const entry = unidadeMap.get(row.unidadeId)!
    entry.total += row._count.id
    if (row.status === 'EM_ANDAMENTO') entry.emAndamento = row._count.id
    if (row.status === 'CONCLUIDA') entry.concluidas = row._count.id
    if (row.status === 'CANCELADA') entry.canceladas = row._count.id
  }

  const porUnidade = unidades.map(u => ({
    unidadeId: u.id,
    unidadeNome: u.nome,
    ...(unidadeMap.get(u.id) || { total: 0, emAndamento: 0, concluidas: 0, canceladas: 0 })
  }))

  // Estatísticas por tipo (groupBy em vez de N×4 counts)
  const tipoGroupBy = await prisma.tramitacao.groupBy({
    by: ['tipoTramitacaoId', 'status'],
    _count: { id: true },
    where: { tipoTramitacaoId: { in: tiposTramitacao.map(t => t.id) } }
  })

  const tipoMap = new Map<string, { total: number; emAndamento: number; concluidas: number; canceladas: number }>()
  for (const row of tipoGroupBy) {
    if (!row.tipoTramitacaoId) continue
    if (!tipoMap.has(row.tipoTramitacaoId)) {
      tipoMap.set(row.tipoTramitacaoId, { total: 0, emAndamento: 0, concluidas: 0, canceladas: 0 })
    }
    const entry = tipoMap.get(row.tipoTramitacaoId)!
    entry.total += row._count.id
    if (row.status === 'EM_ANDAMENTO') entry.emAndamento = row._count.id
    if (row.status === 'CONCLUIDA') entry.concluidas = row._count.id
    if (row.status === 'CANCELADA') entry.canceladas = row._count.id
  }

  const porTipo = tiposTramitacao.map(t => ({
    tipoTramitacaoId: t.id,
    tipoTramitacaoNome: t.nome,
    ...(tipoMap.get(t.id) || { total: 0, emAndamento: 0, concluidas: 0, canceladas: 0 })
  }))

  const tempoMedioConclusao = tempoMedioResult[0]?.avg_dias
    ? Math.round(Number(tempoMedioResult[0].avg_dias))
    : null

  return {
    resumo: {
      total,
      emAndamento: emAndamentoCount,
      concluidas: concluidasCount,
      canceladas: canceladasCount,
      vencidas: vencidasCount,
      tempoMedioConclusao
    },
    proximosVencimentos: proximosVencimentos.map(item => ({
      id: item.id,
      proposicaoId: item.proposicaoId,
      prazoVencimento: item.prazoVencimento?.toISOString() ?? null,
      diasRestantes: item.prazoVencimento
        ? Math.max(0, Math.ceil((item.prazoVencimento.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null,
      unidade: item.unidade?.nome ?? null,
      tipoTramitacao: item.tipoTramitacao?.nome ?? null
    })),
    porUnidade,
    porTipo
  }
}

// Tipos e constantes importados de ./tramitacao-types

// Tipos de proposicao que dispensam passagem pela CLJ
const TIPOS_DISPENSADOS_CLJ = ['REQUERIMENTO', 'MOCAO', 'VOTO_PESAR', 'VOTO_APLAUSO', 'INDICACAO']

/**
 * RN-030: Valida se proposição deve passar pela CLJ
 *
 * @param proposicaoId - ID da proposição a validar
 * @param modo - 'enforce' (default) bloqueia se nao passou pela CLJ;
 *               'warning' apenas alerta (comportamento legado)
 */
export async function validarPassagemCLJ(
  proposicaoId: string,
  modo: 'enforce' | 'warning' = 'enforce'
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Busca proposição com histórico de tramitação
  const proposicao = await prisma.proposicao.findUnique({
    where: { id: proposicaoId },
    include: {
      tramitacoes: {
        include: {
          unidade: true
        }
      }
    }
  })

  if (!proposicao) {
    errors.push('Proposição não encontrada.')
    return { valid: false, errors, warnings, rule: 'RN-030' }
  }

  // Tipos que dispensam CLJ
  if (TIPOS_DISPENSADOS_CLJ.includes(proposicao.tipo)) {
    return { valid: true, errors, warnings, rule: 'RN-030' }
  }

  // Verifica se já passou pela CLJ
  const cljComissao = await prisma.comissao.findFirst({
    where: {
      nome: { contains: 'CLJ', mode: 'insensitive' },
      ativa: true
    }
  })

  if (!cljComissao) {
    // Sem CLJ cadastrada no sistema: apenas warning para nao quebrar setups novos
    warnings.push('RN-030: Comissão de Legislação e Justiça não encontrada no sistema.')
    return { valid: true, errors, warnings, rule: 'RN-030' }
  }

  // Busca unidade correspondente à CLJ
  const unidadeCLJ = await prisma.tramitacaoUnidade.findFirst({
    where: {
      nome: { contains: 'CLJ', mode: 'insensitive' },
      ativo: true
    }
  })

  // Se nao existe unidade CLJ, nao da pra validar passagem
  if (!unidadeCLJ) {
    warnings.push('RN-030: Unidade de tramitação CLJ não cadastrada — passagem não pôde ser validada.')
    return { valid: true, errors, warnings, rule: 'RN-030' }
  }

  const passouPelaCLJ = proposicao.tramitacoes.some(
    t => t.unidadeId === unidadeCLJ.id
  )

  if (!passouPelaCLJ) {
    const msg =
      'RN-030: Proposição ' + proposicao.tipo + ' deve passar pela CLJ antes de avançar. ' +
      'A passagem pela Comissão de Legislação e Justiça é obrigatória.'
    if (modo === 'enforce') {
      errors.push(msg)
    } else {
      warnings.push(msg)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    rule: 'RN-030'
  }
}

/**
 * RN-031: Distribui proposição às comissões temáticas
 */
export async function sugerirComissoesDistribuicao(
  proposicaoId: string
): Promise<Array<{ comissaoId: string; sigla: string; nome: string; motivo: string }>> {
  const sugestoes: Array<{ comissaoId: string; sigla: string; nome: string; motivo: string }> = []

  // Busca proposição
  const proposicao = await prisma.proposicao.findUnique({
    where: { id: proposicaoId },
    select: {
      tipo: true,
      ementa: true,
      titulo: true
    }
  })

  if (!proposicao) return sugestoes

  // Busca comissões ativas
  const comissoes = await prisma.comissao.findMany({
    where: { ativa: true }
  })

  const textoAnalise = `${proposicao.ementa || ''} ${proposicao.titulo || ''}`.toLowerCase()

  // CLJ sempre é sugerida para projetos de lei
  const clj = comissoes.find(c => c.nome.toUpperCase().includes('CLJ') || c.nome.toUpperCase().includes('LEGISLAÇÃO'))
  if (clj && ['PROJETO_LEI', 'PROJETO_RESOLUCAO', 'PROJETO_DECRETO'].includes(proposicao.tipo)) {
    sugestoes.push({
      comissaoId: clj.id,
      sigla: 'CLJ',
      nome: clj.nome,
      motivo: 'RN-030: Análise obrigatória de constitucionalidade e legalidade'
    })
  }

  // Mapeamento de palavras-chave para comissões (baseado no nome)
  const mapeamento: Record<string, { palavras: string[]; nomeContains: string[] }> = {
    CFO: { palavras: ['orçamento', 'financeiro', 'fiscal', 'tributo', 'imposto', 'taxa', 'receita', 'despesa', 'crédito'], nomeContains: ['FINANÇAS', 'ORÇAMENTO'] },
    CES: { palavras: ['educação', 'saúde', 'assistência', 'hospital', 'escola', 'creche', 'social'], nomeContains: ['EDUCAÇÃO', 'SAÚDE', 'SOCIAL'] },
    COU: { palavras: ['obra', 'infraestrutura', 'urbanismo', 'zoneamento', 'construção', 'trânsito', 'mobilidade'], nomeContains: ['OBRAS', 'URBANISMO', 'INFRAESTRUTURA'] },
    CMA: { palavras: ['meio ambiente', 'ambiental', 'sustentabilidade', 'resíduos', 'saneamento'], nomeContains: ['AMBIENTE', 'MEIO AMBIENTE'] }
  }

  for (const [siglaRef, config] of Object.entries(mapeamento)) {
    if (config.palavras.some(p => textoAnalise.includes(p))) {
      const comissao = comissoes.find(c =>
        config.nomeContains.some(n => c.nome.toUpperCase().includes(n))
      )
      if (comissao && !sugestoes.some(s => s.comissaoId === comissao.id)) {
        sugestoes.push({
          comissaoId: comissao.id,
          sigla: siglaRef,
          nome: comissao.nome,
          motivo: `RN-031: Matéria relacionada a ${siglaRef}`
        })
      }
    }
  }

  logger.debug('Sugestões de comissões geradas', {
    action: 'sugerir_comissoes',
    proposicaoId,
    sugestoes: sugestoes.map(s => s.nome)
  })

  return sugestoes
}

/**
 * RN-032: Calcula prazo de parecer baseado no regime
 */
export function calcularPrazoParecer(
  regime: RegimeTramitacao,
  dataDistribuicao: Date = new Date()
): { prazo: Date | null; diasUteis: number } {
  const diasUteis = PRAZOS_PARECER_DIAS[regime]

  if (diasUteis === 0) {
    return { prazo: null, diasUteis: 0 } // Imediato
  }

  const prazo = addBusinessDays(dataDistribuicao, diasUteis)

  return {
    prazo,
    diasUteis
  }
}

/**
 * RN-033: Valida se proposição pode ser votada
 */
export async function validarProposicaoParaVotacao(
  proposicaoId: string
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Busca proposição com tramitações
  const proposicao = await prisma.proposicao.findUnique({
    where: { id: proposicaoId },
    include: {
      tramitacoes: {
        include: {
          unidade: true
        }
      }
    }
  })

  if (!proposicao) {
    errors.push('Proposição não encontrada.')
    return { valid: false, errors, warnings, rule: 'RN-033' }
  }

  // Tipos que dispensam parecer
  const tiposDispensadosParecer = ['REQUERIMENTO', 'MOCAO', 'VOTO_PESAR', 'VOTO_APLAUSO']

  if (tiposDispensadosParecer.includes(proposicao.tipo)) {
    return { valid: true, errors, warnings, rule: 'RN-033' }
  }

  // Verifica se tem tramitação com parecer
  const tramitacaoComParecer = proposicao.tramitacoes.find(t => t.parecer !== null)

  if (!tramitacaoComParecer) {
    warnings.push(
      'RN-033: Proposição não possui parecer. ' +
      'Recomenda-se aguardar parecer da comissão antes da votação.'
    )
  } else if (tramitacaoComParecer.parecer === 'PELA_INCONSTITUCIONALIDADE') {
    errors.push(
      'RN-033: Proposição com parecer pela inconstitucionalidade não pode ser votada.'
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    rule: 'RN-033'
  }
}

/**
 * RN-035: Registra movimentação de tramitação
 */
export async function registrarMovimentacao(
  data: TramitacaoData
): Promise<ValidationResult & { tramitacaoId?: string }> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Verifica se proposição existe
    const proposicao = await prisma.proposicao.findUnique({
      where: { id: data.proposicaoId }
    })

    if (!proposicao) {
      errors.push('Proposição não encontrada.')
      return { valid: false, errors, warnings, rule: 'RN-035' }
    }

    // Cria registro de tramitação
    const tramitacao = await prisma.tramitacao.create({
      data: {
        proposicaoId: data.proposicaoId,
        tipoTramitacaoId: data.tipoTramitacaoId,
        unidadeId: data.unidadeId,
        observacoes: data.observacoes,
        responsavelId: data.responsavelId,
        dataEntrada: new Date(),
        status: 'EM_ANDAMENTO'
      }
    })

    // Cria entrada no histórico
    await prisma.tramitacaoHistorico.create({
      data: {
        tramitacaoId: tramitacao.id,
        acao: 'DISTRIBUICAO',
        descricao: `Distribuído para unidade`,
        data: new Date()
      }
    })

    // Atualiza status da proposição se necessário
    if (proposicao.status === 'APRESENTADA') {
      await prisma.proposicao.update({
        where: { id: data.proposicaoId },
        data: {
          status: 'EM_TRAMITACAO'
        }
      })
    }

    logger.info('Movimentação registrada', {
      action: 'registrar_movimentacao',
      tramitacaoId: tramitacao.id,
      proposicaoId: data.proposicaoId,
      unidade: data.unidadeId
    })

    return {
      valid: true,
      errors,
      warnings,
      rule: 'RN-035',
      tramitacaoId: tramitacao.id
    }
  } catch (error) {
    logger.error('Erro ao registrar movimentação', error)
    errors.push('Erro ao registrar movimentação.')
    return { valid: false, errors, warnings, rule: 'RN-035' }
  }
}

/**
 * RN-036: Cria notificação de tramitação
 */
export async function criarNotificacaoTramitacao(
  tramitacaoId: string,
  canal: string,
  destinatario: string,
  mensagem: string
): Promise<void> {
  try {
    await prisma.tramitacaoNotificacao.create({
      data: {
        tramitacaoId,
        canal,
        destinatario,
        mensagem,
        status: 'PENDENTE'
      }
    })

    logger.info('Notificação criada', {
      action: 'criar_notificacao',
      tramitacaoId,
      canal,
      destinatario
    })
  } catch (error) {
    logger.error('Erro ao criar notificação', error)
  }
}

/**
 * RN-037: Verifica prazos vencidos e próximos de vencer
 */
export async function verificarPrazosVencendo(
  diasAntecedencia: number = 3
): Promise<Array<{
  proposicaoId: string
  numero: string
  unidade: string
  prazoVencimento: Date
  diasRestantes: number
  vencido: boolean
}>> {
  const hoje = new Date()
  const limiteAlerta = addBusinessDays(hoje, diasAntecedencia)

  // Busca tramitações com prazo
  const tramitacoes = await prisma.tramitacao.findMany({
    where: {
      prazoVencimento: {
        not: null,
        lte: limiteAlerta || undefined
      },
      status: {
        not: 'CONCLUIDA'
      }
    },
    include: {
      proposicao: {
        select: {
          id: true,
          numero: true
        }
      },
      unidade: {
        select: {
          nome: true
        }
      }
    }
  })

  return tramitacoes
    .filter(t => t.prazoVencimento !== null)
    .map(t => {
      const diasRestantes = differenceInDays(t.prazoVencimento as Date, hoje)

      return {
        proposicaoId: t.proposicaoId,
        numero: t.proposicao.numero || '',
        unidade: t.unidade?.nome || '',
        prazoVencimento: t.prazoVencimento as Date,
        diasRestantes,
        vencido: diasRestantes < 0
      }
    })
}

/**
 * Obtém histórico completo de tramitação
 */
export async function obterHistoricoTramitacao(
  proposicaoId: string
): Promise<Array<{
  data: Date
  unidade: string
  observacoes?: string
  responsavel?: string
  prazo?: Date
  status: string
}>> {
  const tramitacoes = await prisma.tramitacao.findMany({
    where: { proposicaoId },
    include: {
      unidade: true,
      responsavel: true
    },
    orderBy: { dataEntrada: 'asc' }
  })

  return tramitacoes.map(t => ({
    data: t.dataEntrada,
    unidade: t.unidade?.nome || 'N/A',
    observacoes: t.observacoes || undefined,
    responsavel: t.responsavel?.nome || undefined,
    prazo: t.prazoVencimento || undefined,
    status: t.status
  }))
}

/**
 * Fluxo padrão de tramitação para novos projetos
 * RN-038: Unidade inicial padrão é Secretaria Legislativa com status RECEBIDA
 */
export async function iniciarTramitacaoPadrao(
  proposicaoId: string,
  regime: RegimeTramitacao = 'NORMAL'
): Promise<ValidationResult & { tramitacaoId?: string }> {
  const errors: string[] = []
  const warnings: string[] = []

  // RN-038: Busca Secretaria Legislativa como unidade padrão
  const secretariaLegislativa = await prisma.tramitacaoUnidade.findFirst({
    where: {
      ativo: true,
      tipo: 'SECRETARIA',
      nome: { contains: 'Legislativa', mode: 'insensitive' }
    }
  }) ?? await prisma.tramitacaoUnidade.findFirst({
    where: {
      ativo: true,
      tipo: 'SECRETARIA'
    }
  }) ?? await prisma.tramitacaoUnidade.findFirst({
    where: {
      ativo: true,
      OR: [
        { nome: { contains: 'Protocolo', mode: 'insensitive' } },
        { tipo: 'MESA_DIRETORA' }
      ]
    }
  })

  // Busca tipo de tramitação padrão
  const tipoTramitacao = await prisma.tramitacaoTipo.findFirst({
    where: { ativo: true },
    orderBy: { ordem: 'asc' }
  })

  if (!secretariaLegislativa) {
    warnings.push('Unidade inicial não encontrada (Secretaria Legislativa ou Protocolo).')
    return { valid: true, errors, warnings }
  }

  if (!tipoTramitacao) {
    warnings.push('Tipo de tramitação não encontrado.')
    return { valid: true, errors, warnings }
  }

  const prazo = calcularPrazoParecer(regime)

  // Cria tramitação inicial com status RECEBIDA
  const tramitacao = await prisma.tramitacao.create({
    data: {
      proposicaoId,
      tipoTramitacaoId: tipoTramitacao.id,
      unidadeId: secretariaLegislativa.id,
      dataEntrada: new Date(),
      status: 'RECEBIDA',
      prazoVencimento: prazo.prazo || undefined,
      observacoes: `Proposição recebida em regime ${regime}. Prazo: ${prazo.diasUteis} dias úteis.`
    }
  })

  // Atualiza status da proposição
  await prisma.proposicao.update({
    where: { id: proposicaoId },
    data: {
      status: 'EM_TRAMITACAO'
    }
  })

  logger.info('Tramitação padrão iniciada', {
    action: 'iniciar_tramitacao_padrao',
    proposicaoId,
    tramitacaoId: tramitacao.id,
    unidadeId: secretariaLegislativa.id,
    regime
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    tramitacaoId: tramitacao.id
  }
}

/**
 * Inicia tramitação com unidade específica escolhida pelo usuário
 * RN-038: Permite usuário escolher unidade inicial (prioridade sobre fluxo)
 */
export async function iniciarTramitacaoComUnidade(
  proposicaoId: string,
  unidadeId: string,
  regime: RegimeTramitacao = 'NORMAL'
): Promise<ValidationResult & { tramitacaoId?: string }> {
  const errors: string[] = []
  const warnings: string[] = []

  // Valida se unidade existe e está ativa
  const unidade = await prisma.tramitacaoUnidade.findFirst({
    where: {
      id: unidadeId,
      ativo: true
    }
  })

  if (!unidade) {
    errors.push('Unidade especificada não encontrada ou inativa.')
    return { valid: false, errors, warnings }
  }

  // Busca tipo de tramitação padrão
  const tipoTramitacao = await prisma.tramitacaoTipo.findFirst({
    where: { ativo: true },
    orderBy: { ordem: 'asc' }
  })

  if (!tipoTramitacao) {
    warnings.push('Tipo de tramitação não encontrado.')
    return { valid: true, errors, warnings }
  }

  const prazo = calcularPrazoParecer(regime)

  // Cria tramitação com status RECEBIDA na unidade escolhida
  const tramitacao = await prisma.tramitacao.create({
    data: {
      proposicaoId,
      tipoTramitacaoId: tipoTramitacao.id,
      unidadeId: unidade.id,
      dataEntrada: new Date(),
      status: 'RECEBIDA',
      prazoVencimento: prazo.prazo || undefined,
      observacoes: `Proposição recebida diretamente em ${unidade.nome}. Regime: ${regime}. Prazo: ${prazo.diasUteis} dias úteis.`
    }
  })

  // Atualiza status da proposição
  await prisma.proposicao.update({
    where: { id: proposicaoId },
    data: {
      status: 'EM_TRAMITACAO'
    }
  })

  logger.info('Tramitação iniciada com unidade específica', {
    action: 'iniciar_tramitacao_com_unidade',
    proposicaoId,
    tramitacaoId: tramitacao.id,
    unidadeId: unidade.id,
    unidadeNome: unidade.nome,
    regime
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    tramitacaoId: tramitacao.id
  }
}

/**
 * Resumo das regras de tramitação
 */
/**
 * Avança a proposição para a próxima etapa do fluxo de tramitação
 * RN-035: Toda movimentação deve ser registrada
 */
export async function avancarEtapaFluxo(
  proposicaoId: string,
  observacoes?: string,
  parecer?: TipoParecer,
  resultado?: TramitacaoResultado,
  usuarioId?: string,
  ip?: string
): Promise<AvancarEtapaResult> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // 1. Busca proposição com tramitação atual (inclui RECEBIDA e EM_ANDAMENTO)
    const proposicao = await prisma.proposicao.findUnique({
      where: { id: proposicaoId },
      include: {
        tramitacoes: {
          where: { status: { in: ['EM_ANDAMENTO', 'RECEBIDA'] } },
          orderBy: { dataEntrada: 'desc' },
          take: 1,
          include: {
            fluxoEtapa: {
              include: {
                fluxo: true
              }
            },
            unidade: true,
            tipoTramitacao: true
          }
        }
      }
    })

    if (!proposicao) {
      errors.push('Proposição não encontrada.')
      return { success: false, errors, warnings, etapaFinal: false }
    }

    const tramitacaoAtual = proposicao.tramitacoes[0]
    if (!tramitacaoAtual) {
      errors.push('Proposição não possui tramitação em andamento.')
      return { success: false, errors, warnings, etapaFinal: false }
    }

    // 2. Verifica se etapa requer parecer
    if (tramitacaoAtual.fluxoEtapa?.requerParecer && !parecer) {
      errors.push(`RN-034: Etapa "${tramitacaoAtual.fluxoEtapa.nome}" requer parecer para avançar.`)
      return { success: false, errors, warnings, etapaFinal: false }
    }

    // 3. Busca próxima etapa do fluxo
    type ProximaEtapaType = Awaited<ReturnType<typeof prisma.fluxoTramitacaoEtapa.findFirst<{
      include: { unidade: true }
    }>>>
    let proximaEtapa: ProximaEtapaType = null
    let ehEtapaFinal = tramitacaoAtual.fluxoEtapa?.ehEtapaFinal || false

    // Se não tem fluxoEtapa configurada, trata como etapa final (tramitação simples)
    if (!tramitacaoAtual.fluxoEtapa) {
      ehEtapaFinal = true
      warnings.push('Proposição sem fluxo de tramitação configurado. Tramitação concluída diretamente.')
    } else if (!ehEtapaFinal) {
      proximaEtapa = await prisma.fluxoTramitacaoEtapa.findFirst({
        where: {
          fluxoId: tramitacaoAtual.fluxoEtapa.fluxoId,
          ordem: { gt: tramitacaoAtual.fluxoEtapa.ordem }
        },
        orderBy: { ordem: 'asc' },
        include: {
          unidade: true
        }
      })

      if (!proximaEtapa) {
        ehEtapaFinal = true
      }
    }

    // 4. Prepara dados para registro de histórico
    const dadosAnteriores = {
      tramitacaoId: tramitacaoAtual.id,
      etapa: tramitacaoAtual.fluxoEtapa?.nome || tramitacaoAtual.tipoTramitacao?.nome || 'N/A',
      unidade: tramitacaoAtual.unidade?.nome || 'N/A',
      status: tramitacaoAtual.status,
      parecer: tramitacaoAtual.parecer
    }

    // 5. Conclui tramitação atual
    await prisma.tramitacao.update({
      where: { id: tramitacaoAtual.id },
      data: {
        status: 'CONCLUIDA',
        dataSaida: new Date(),
        parecer: parecer || tramitacaoAtual.parecer,
        resultado: resultado || tramitacaoAtual.resultado,
        observacoes: observacoes
          ? `${tramitacaoAtual.observacoes || ''}\n${observacoes}`.trim()
          : tramitacaoAtual.observacoes
      }
    })

    // 6. Registra histórico da conclusão
    await prisma.tramitacaoHistorico.create({
      data: {
        tramitacaoId: tramitacaoAtual.id,
        acao: 'CONCLUSAO_ETAPA',
        descricao: `Etapa "${dadosAnteriores.etapa}" concluída${parecer ? ` com parecer ${parecer}` : ''}`,
        data: new Date(),
        usuarioId,
        ip,
        dadosAnteriores: dadosAnteriores as Prisma.InputJsonValue,
        dadosNovos: {
          status: 'CONCLUIDA',
          parecer,
          resultado,
          observacoes
        } as Prisma.InputJsonValue
      }
    })

    type TramitacaoType = Awaited<ReturnType<typeof prisma.tramitacao.create>>
    let tramitacaoNova: TramitacaoType | null = null
    let novoStatusProposicao = proposicao.status as 'APRESENTADA' | 'EM_TRAMITACAO' | 'AGUARDANDO_PAUTA' | 'EM_PAUTA' | 'EM_DISCUSSAO' | 'EM_VOTACAO' | 'APROVADA' | 'REJEITADA' | 'ARQUIVADA' | 'VETADA' | 'SANCIONADA' | 'PROMULGADA'

    // 7. Se não é etapa final, cria nova tramitação na próxima etapa (em transação)
    if (!ehEtapaFinal && proximaEtapa) {
      const tipoTramitacao = await prisma.tramitacaoTipo.findFirst({
        where: { ativo: true },
        orderBy: { ordem: 'asc' }
      })

      const prazoDias = proximaEtapa.prazoDiasNormal || 15
      const prazoVencimento = addBusinessDays(new Date(), prazoDias)

      try {
        // Transação: criar nova tramitação + histórico + atualizar proposição
        const resultado = await prisma.$transaction(async (tx) => {
          const nova = await tx.tramitacao.create({
            data: {
              proposicaoId,
              tipoTramitacaoId: tipoTramitacao?.id || tramitacaoAtual.tipoTramitacaoId,
              unidadeId: proximaEtapa.unidadeId || tramitacaoAtual.unidadeId,
              fluxoEtapaId: proximaEtapa.id,
              dataEntrada: new Date(),
              status: 'EM_ANDAMENTO',
              prazoVencimento,
              observacoes: `Tramitação avançada automaticamente para etapa "${proximaEtapa.nome}".`
            }
          })

          await tx.tramitacaoHistorico.create({
            data: {
              tramitacaoId: nova.id,
              acao: 'INICIO_ETAPA',
              descricao: `Iniciada etapa "${proximaEtapa.nome}"`,
              data: new Date(),
              usuarioId,
              ip,
              dadosAnteriores: dadosAnteriores as Prisma.InputJsonValue,
              dadosNovos: {
                etapa: proximaEtapa.nome,
                unidade: proximaEtapa.unidade?.nome,
                prazoVencimento: prazoVencimento?.toISOString()
              } as Prisma.InputJsonValue
            }
          })

          // Atualiza status da proposição se etapa habilita pauta
          if (proximaEtapa.habilitaPauta) {
            await tx.proposicao.update({
              where: { id: proposicaoId },
              data: { status: 'AGUARDANDO_PAUTA' }
            })
          }

          return nova
        })

        tramitacaoNova = resultado
        if (proximaEtapa.habilitaPauta) {
          novoStatusProposicao = 'AGUARDANDO_PAUTA'
        }
      } catch (txError) {
        // Se a transação falhar, reverter a conclusão da tramitação anterior
        await prisma.tramitacao.update({
          where: { id: tramitacaoAtual.id },
          data: {
            status: tramitacaoAtual.status,
            dataSaida: tramitacaoAtual.dataSaida,
            parecer: tramitacaoAtual.parecer,
            resultado: tramitacaoAtual.resultado,
            observacoes: tramitacaoAtual.observacoes
          }
        })
        throw new ValidationError(`Falha ao avançar tramitação: ${txError instanceof Error ? txError.message : 'Erro desconhecido'}. A tramitação anterior foi restaurada.`)
      }

      logger.info('Tramitação avançada para próxima etapa', {
        action: 'avancar_etapa',
        proposicaoId,
        etapaAnterior: dadosAnteriores.etapa,
        etapaNova: proximaEtapa.nome,
        tramitacaoNovaId: tramitacaoNova.id
      })
    } else {
      // Etapa final - atualiza status da proposição baseado no resultado
      if (resultado === 'APROVADO' || resultado === 'APROVADO_COM_EMENDAS') {
        novoStatusProposicao = 'APROVADA'
      } else if (resultado === 'REJEITADO') {
        novoStatusProposicao = 'REJEITADA'
      } else if (resultado === 'ARQUIVADO') {
        novoStatusProposicao = 'ARQUIVADA'
      } else {
        // Etapa final sem resultado definido - manter em AGUARDANDO_PAUTA
        // mas logar warning pois etapa final deveria ter resultado
        novoStatusProposicao = 'AGUARDANDO_PAUTA'
        warnings.push('Etapa final concluida sem resultado definido. Proposicao mantida como AGUARDANDO_PAUTA. Defina o resultado (APROVADO/REJEITADO/ARQUIVADO) para atualizar o status.')
      }

      // Validar transição antes de aplicar
      const { validarTransicaoStatus } = await import('./status-transitions')
      const validacao = validarTransicaoStatus(proposicao.status, novoStatusProposicao)
      if (validacao.valid) {
        await prisma.proposicao.update({
          where: { id: proposicaoId },
          data: { status: novoStatusProposicao }
        })
      } else {
        // Se a transição não é válida, logar mas não bloquear o avanço da tramitação
        warnings.push(`Transicao de status '${proposicao.status}' para '${novoStatusProposicao}' nao permitida: ${validacao.error}`)
      }

      logger.info('Tramitação finalizada', {
        action: 'finalizar_tramitacao',
        proposicaoId,
        etapaFinal: dadosAnteriores.etapa,
        resultado,
        novoStatus: novoStatusProposicao
      })
    }

    return {
      success: true,
      errors,
      warnings,
      tramitacaoAnterior: {
        id: tramitacaoAtual.id,
        etapa: dadosAnteriores.etapa,
        status: 'CONCLUIDA'
      },
      tramitacaoNova: tramitacaoNova ? {
        id: tramitacaoNova.id,
        etapa: proximaEtapa?.nome || 'N/A',
        prazoVencimento: tramitacaoNova.prazoVencimento || undefined
      } : undefined,
      etapaFinal: ehEtapaFinal,
      proposicaoStatus: novoStatusProposicao
    }
  } catch (error) {
    logger.error('Erro ao avançar etapa de tramitação', error)
    errors.push('Erro interno ao avançar tramitação.')
    return { success: false, errors, warnings, etapaFinal: false }
  }
}

/**
 * Inicia tramitação de proposição vinculada a um fluxo configurado
 */
export async function iniciarTramitacaoComFluxo(
  proposicaoId: string,
  fluxoId: string,
  etapaInicialId: string,
  regime: RegimeTramitacao = 'NORMAL',
  usuarioId?: string,
  ip?: string
): Promise<ValidationResult & { tramitacaoId?: string }> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Busca proposição
    const proposicao = await prisma.proposicao.findUnique({
      where: { id: proposicaoId }
    })

    if (!proposicao) {
      errors.push('Proposição não encontrada.')
      return { valid: false, errors, warnings }
    }

    // Verifica se já tem tramitação ativa (RECEBIDA ou EM_ANDAMENTO)
    const tramitacaoExistente = await prisma.tramitacao.findFirst({
      where: {
        proposicaoId,
        status: { in: ['RECEBIDA', 'EM_ANDAMENTO'] }
      }
    })

    if (tramitacaoExistente) {
      warnings.push('Proposição já possui tramitação ativa.')
      return { valid: true, errors, warnings, tramitacaoId: tramitacaoExistente.id }
    }

    // Busca etapa inicial
    const etapaInicial = await prisma.fluxoTramitacaoEtapa.findUnique({
      where: { id: etapaInicialId },
      include: {
        unidade: true,
        fluxo: true
      }
    })

    if (!etapaInicial) {
      errors.push('Etapa inicial do fluxo não encontrada.')
      return { valid: false, errors, warnings }
    }

    // Busca tipo de tramitação padrão
    const tipoTramitacao = await prisma.tramitacaoTipo.findFirst({
      where: { ativo: true },
      orderBy: { ordem: 'asc' }
    })

    if (!tipoTramitacao) {
      errors.push('Tipo de tramitação não configurado no sistema.')
      return { valid: false, errors, warnings }
    }

    // Busca unidade (da etapa ou default)
    let unidadeId: string | null | undefined = etapaInicial.unidadeId
    if (!unidadeId) {
      const unidadeDefault = await prisma.tramitacaoUnidade.findFirst({
        where: {
          ativo: true,
          OR: [
            { tipo: 'MESA_DIRETORA' },
            { nome: { contains: 'Protocolo', mode: 'insensitive' } }
          ]
        }
      })
      unidadeId = unidadeDefault?.id
    }

    if (!unidadeId) {
      errors.push('Unidade de tramitação não encontrada.')
      return { valid: false, errors, warnings }
    }

    // Calcula prazo baseado no regime e etapa
    const prazoDias = regime === 'URGENCIA_URGENTISSIMA' ? 0
      : regime === 'URGENCIA' ? Math.ceil((etapaInicial.prazoDiasNormal || 15) * 0.33)
      : regime === 'PRIORIDADE' ? Math.ceil((etapaInicial.prazoDiasNormal || 15) * 0.67)
      : etapaInicial.prazoDiasNormal || 15

    const prazoVencimento = prazoDias > 0 ? addBusinessDays(new Date(), prazoDias) : null

    // Cria tramitação com status inicial RECEBIDA
    const tramitacao = await prisma.tramitacao.create({
      data: {
        proposicaoId,
        tipoTramitacaoId: tipoTramitacao.id,
        unidadeId,
        fluxoEtapaId: etapaInicial.id,
        dataEntrada: new Date(),
        status: 'RECEBIDA',
        prazoVencimento: prazoVencimento || undefined,
        observacoes: `Tramitação iniciada no fluxo "${etapaInicial.fluxo.nome}", etapa "${etapaInicial.nome}". Regime: ${regime}.`
      }
    })

    // Registra histórico
    await prisma.tramitacaoHistorico.create({
      data: {
        tramitacaoId: tramitacao.id,
        acao: 'INICIO_TRAMITACAO',
        descricao: `Tramitação iniciada no fluxo "${etapaInicial.fluxo.nome}"`,
        data: new Date(),
        usuarioId,
        ip,
        dadosAnteriores: {
          proposicaoStatus: proposicao.status
        } as Prisma.InputJsonValue,
        dadosNovos: {
          fluxo: etapaInicial.fluxo.nome,
          etapa: etapaInicial.nome,
          regime,
          prazoVencimento: prazoVencimento?.toISOString()
        } as Prisma.InputJsonValue
      }
    })

    // Atualiza status da proposição
    await prisma.proposicao.update({
      where: { id: proposicaoId },
      data: { status: 'EM_TRAMITACAO' }
    })

    logger.info('Tramitação iniciada com fluxo configurado', {
      action: 'iniciar_tramitacao_fluxo',
      proposicaoId,
      fluxoId,
      etapaInicial: etapaInicial.nome,
      tramitacaoId: tramitacao.id,
      regime
    })

    return {
      valid: true,
      errors,
      warnings,
      tramitacaoId: tramitacao.id
    }
  } catch (error) {
    logger.error('Erro ao iniciar tramitação com fluxo', error)
    errors.push('Erro interno ao iniciar tramitação.')
    return { valid: false, errors, warnings }
  }
}

/**
 * Registra movimentação com auditoria completa
 * RN-035: Toda movimentação deve ser registrada com data, responsável e despacho
 */
export async function registrarMovimentacaoComAuditoria(
  data: TramitacaoData & {
    usuarioId?: string
    ip?: string
    dadosAnteriores?: Record<string, unknown>
  }
): Promise<ValidationResult & { tramitacaoId?: string }> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Verifica se proposição existe
    const proposicao = await prisma.proposicao.findUnique({
      where: { id: data.proposicaoId },
      include: {
        tramitacoes: {
          where: { status: 'EM_ANDAMENTO' },
          orderBy: { dataEntrada: 'desc' },
          take: 1
        }
      }
    })

    if (!proposicao) {
      errors.push('Proposição não encontrada.')
      return { valid: false, errors, warnings, rule: 'RN-035' }
    }

    // Captura dados anteriores se não fornecidos
    const dadosAnteriores = data.dadosAnteriores || {
      status: proposicao.status,
      tramitacaoAtual: proposicao.tramitacoes[0] ? {
        id: proposicao.tramitacoes[0].id,
        status: proposicao.tramitacoes[0].status,
        unidadeId: proposicao.tramitacoes[0].unidadeId
      } : null
    }

    // Cria registro de tramitação
    const tramitacao = await prisma.tramitacao.create({
      data: {
        proposicaoId: data.proposicaoId,
        tipoTramitacaoId: data.tipoTramitacaoId,
        unidadeId: data.unidadeId,
        observacoes: data.observacoes,
        responsavelId: data.responsavelId,
        dataEntrada: new Date(),
        status: 'EM_ANDAMENTO'
      }
    })

    // Cria entrada no histórico com auditoria completa
    await prisma.tramitacaoHistorico.create({
      data: {
        tramitacaoId: tramitacao.id,
        acao: 'DISTRIBUICAO',
        descricao: `Distribuído para unidade`,
        data: new Date(),
        usuarioId: data.usuarioId,
        ip: data.ip,
        dadosAnteriores: dadosAnteriores as Prisma.InputJsonValue,
        dadosNovos: {
          tramitacaoId: tramitacao.id,
          unidadeId: data.unidadeId,
          tipoTramitacaoId: data.tipoTramitacaoId,
          responsavelId: data.responsavelId
        } as Prisma.InputJsonValue
      }
    })

    // Atualiza status da proposição se necessário
    if (proposicao.status === 'APRESENTADA') {
      await prisma.proposicao.update({
        where: { id: data.proposicaoId },
        data: {
          status: 'EM_TRAMITACAO'
        }
      })
    }

    logger.info('Movimentação registrada com auditoria', {
      action: 'registrar_movimentacao_auditoria',
      tramitacaoId: tramitacao.id,
      proposicaoId: data.proposicaoId,
      unidade: data.unidadeId,
      usuarioId: data.usuarioId
    })

    return {
      valid: true,
      errors,
      warnings,
      rule: 'RN-035',
      tramitacaoId: tramitacao.id
    }
  } catch (error) {
    logger.error('Erro ao registrar movimentação', error)
    errors.push('Erro ao registrar movimentação.')
    return { valid: false, errors, warnings, rule: 'RN-035' }
  }
}

/**
 * Obtém a etapa atual da tramitação de uma proposição
 */
export async function obterEtapaAtual(proposicaoId: string): Promise<{
  tramitacao?: {
    id: string
    status: string
    dataEntrada: Date
    prazoVencimento?: Date
  }
  etapa?: {
    id: string
    nome: string
    ordem: number
    habilitaPauta: boolean
    requerParecer: boolean
    ehEtapaFinal: boolean
  }
  fluxo?: {
    id: string
    nome: string
    tipoProposicao: string
  }
} | null> {
  const tramitacao = await prisma.tramitacao.findFirst({
    where: {
      proposicaoId,
      status: 'EM_ANDAMENTO'
    },
    orderBy: { dataEntrada: 'desc' },
    include: {
      fluxoEtapa: {
        include: {
          fluxo: true
        }
      }
    }
  })

  if (!tramitacao) {
    return null
  }

  return {
    tramitacao: {
      id: tramitacao.id,
      status: tramitacao.status,
      dataEntrada: tramitacao.dataEntrada,
      prazoVencimento: tramitacao.prazoVencimento || undefined
    },
    etapa: tramitacao.fluxoEtapa ? {
      id: tramitacao.fluxoEtapa.id,
      nome: tramitacao.fluxoEtapa.nome,
      ordem: tramitacao.fluxoEtapa.ordem,
      habilitaPauta: tramitacao.fluxoEtapa.habilitaPauta,
      requerParecer: tramitacao.fluxoEtapa.requerParecer,
      ehEtapaFinal: tramitacao.fluxoEtapa.ehEtapaFinal
    } : undefined,
    fluxo: tramitacao.fluxoEtapa?.fluxo ? {
      id: tramitacao.fluxoEtapa.fluxo.id,
      nome: tramitacao.fluxoEtapa.fluxo.nome,
      tipoProposicao: tramitacao.fluxoEtapa.fluxo.tipoProposicao
    } : undefined
  }
}

/**
 * Tramita proposição para "Aguardando Pauta"
 * Unidade destino: Secretaria Legislativa
 * Status da proposição: AGUARDANDO_PAUTA
 */
export async function tramitarParaAguardandoPauta(
  proposicaoId: string,
  observacoes?: string,
  usuarioId?: string,
  ip?: string
): Promise<ValidationResult & { tramitacaoId?: string }> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Busca proposição
    const proposicao = await prisma.proposicao.findUnique({
      where: { id: proposicaoId },
      include: {
        tramitacoes: {
          where: { status: { in: ['RECEBIDA', 'EM_ANDAMENTO'] } },
          orderBy: { dataEntrada: 'desc' },
          take: 1
        }
      }
    })

    if (!proposicao) {
      errors.push('Proposição não encontrada.')
      return { valid: false, errors, warnings }
    }

    // Busca unidade "Secretaria" (pode ser "Secretaria Legislativa" ou apenas "Secretaria")
    const unidadeDestino = await prisma.tramitacaoUnidade.findFirst({
      where: {
        ativo: true,
        OR: [
          { tipo: 'SECRETARIA', nome: { contains: 'Legislativa', mode: 'insensitive' } },
          { nome: { contains: 'Secretaria Legislativa', mode: 'insensitive' } },
          { tipo: 'SECRETARIA' } // Fallback para qualquer secretaria
        ]
      }
    })

    if (!unidadeDestino) {
      errors.push('Unidade de Secretaria não encontrada no sistema.')
      return { valid: false, errors, warnings }
    }

    // Busca tipo de tramitação padrão
    const tipoTramitacao = await prisma.tramitacaoTipo.findFirst({
      where: { ativo: true },
      orderBy: { ordem: 'asc' }
    })

    if (!tipoTramitacao) {
      errors.push('Tipo de tramitação não configurado.')
      return { valid: false, errors, warnings }
    }

    // Conclui tramitação anterior se houver
    const tramitacaoAtual = proposicao.tramitacoes[0]
    if (tramitacaoAtual) {
      await prisma.tramitacao.update({
        where: { id: tramitacaoAtual.id },
        data: {
          status: 'CONCLUIDA',
          dataSaida: new Date(),
          observacoes: observacoes
            ? `${tramitacaoAtual.observacoes || ''}\nEncaminhado para Aguardando Pauta: ${observacoes}`.trim()
            : tramitacaoAtual.observacoes
        }
      })

      // Registra histórico
      await prisma.tramitacaoHistorico.create({
        data: {
          tramitacaoId: tramitacaoAtual.id,
          acao: 'ENCAMINHAMENTO_PAUTA',
          descricao: 'Proposição encaminhada para aguardar inclusão em pauta',
          data: new Date(),
          usuarioId,
          ip
        }
      })
    }

    // Cria nova tramitação na Secretaria Legislativa
    const novaTramitacao = await prisma.tramitacao.create({
      data: {
        proposicaoId,
        tipoTramitacaoId: tipoTramitacao.id,
        unidadeId: unidadeDestino.id,
        dataEntrada: new Date(),
        status: 'EM_ANDAMENTO',
        observacoes: observacoes || 'Proposição aguardando inclusão em pauta de sessão.'
      }
    })

    // Registra histórico da nova tramitação
    await prisma.tramitacaoHistorico.create({
      data: {
        tramitacaoId: novaTramitacao.id,
        acao: 'AGUARDANDO_PAUTA',
        descricao: `Proposição recebida em ${unidadeDestino.nome} aguardando inclusão em pauta`,
        data: new Date(),
        usuarioId,
        ip,
        dadosNovos: {
          unidade: unidadeDestino.nome,
          status: 'AGUARDANDO_PAUTA'
        } as Prisma.InputJsonValue
      }
    })

    // Atualiza status da proposição para AGUARDANDO_PAUTA
    await prisma.proposicao.update({
      where: { id: proposicaoId },
      data: { status: 'AGUARDANDO_PAUTA' }
    })

    logger.info('Proposição tramitada para Aguardando Pauta', {
      action: 'tramitar_aguardando_pauta',
      proposicaoId,
      tramitacaoId: novaTramitacao.id,
      unidade: unidadeDestino.nome
    })

    return {
      valid: true,
      errors,
      warnings,
      tramitacaoId: novaTramitacao.id
    }
  } catch (error) {
    logger.error('Erro ao tramitar para Aguardando Pauta', error)
    errors.push('Erro interno ao tramitar proposição.')
    return { valid: false, errors, warnings }
  }
}

/**
 * Tramita proposição para o Plenário (ao incluir na pauta)
 * Unidade destino: Plenário
 * Status da proposição: EM_PAUTA
 */
// Funções do portal público extraídas para ./tramitacao/publica.ts
// Re-exportadas abaixo no final do arquivo para manter compatibilidade com consumidores.

export async function tramitarParaPlenario(
  proposicaoId: string,
  sessaoId?: string,
  observacoes?: string,
  usuarioId?: string,
  ip?: string
): Promise<ValidationResult & { tramitacaoId?: string }> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Busca proposição
    const proposicao = await prisma.proposicao.findUnique({
      where: { id: proposicaoId },
      include: {
        tramitacoes: {
          where: { status: { in: ['RECEBIDA', 'EM_ANDAMENTO'] } },
          orderBy: { dataEntrada: 'desc' },
          take: 1
        }
      }
    })

    if (!proposicao) {
      errors.push('Proposição não encontrada.')
      return { valid: false, errors, warnings }
    }

    // Busca unidade "Plenário"
    const plenario = await prisma.tramitacaoUnidade.findFirst({
      where: {
        ativo: true,
        OR: [
          { tipo: 'PLENARIO' },
          { nome: { contains: 'Plenário', mode: 'insensitive' } },
          { nome: { contains: 'Plenario', mode: 'insensitive' } }
        ]
      }
    })

    if (!plenario) {
      // Se não encontrou plenário, apenas atualiza o status sem criar tramitação
      warnings.push('Unidade "Plenário" não encontrada. Status atualizado sem tramitação.')

      await prisma.proposicao.update({
        where: { id: proposicaoId },
        data: {
          status: 'EM_PAUTA',
          sessaoId: sessaoId || proposicao.sessaoId
        }
      })

      return { valid: true, errors, warnings }
    }

    // Busca tipo de tramitação padrão
    const tipoTramitacao = await prisma.tramitacaoTipo.findFirst({
      where: { ativo: true },
      orderBy: { ordem: 'asc' }
    })

    if (!tipoTramitacao) {
      errors.push('Tipo de tramitação não configurado.')
      return { valid: false, errors, warnings }
    }

    // Conclui tramitação anterior se houver
    const tramitacaoAtual = proposicao.tramitacoes[0]
    if (tramitacaoAtual) {
      await prisma.tramitacao.update({
        where: { id: tramitacaoAtual.id },
        data: {
          status: 'CONCLUIDA',
          dataSaida: new Date(),
          observacoes: `${tramitacaoAtual.observacoes || ''}\nIncluída em pauta de sessão.`.trim()
        }
      })

      // Registra histórico
      await prisma.tramitacaoHistorico.create({
        data: {
          tramitacaoId: tramitacaoAtual.id,
          acao: 'INCLUSAO_PAUTA',
          descricao: 'Proposição incluída em pauta de sessão',
          data: new Date(),
          usuarioId,
          ip
        }
      })
    }

    // Busca informações da sessão se fornecido
    let descricaoSessao = ''
    if (sessaoId) {
      const sessao = await prisma.sessao.findUnique({
        where: { id: sessaoId },
        select: { numero: true, data: true, tipo: true }
      })
      if (sessao) {
        descricaoSessao = ` (${sessao.numero}ª Sessão ${sessao.tipo} - ${new Date(sessao.data).toLocaleDateString('pt-BR')})`
      }
    }

    // Cria nova tramitação no Plenário
    const novaTramitacao = await prisma.tramitacao.create({
      data: {
        proposicaoId,
        tipoTramitacaoId: tipoTramitacao.id,
        unidadeId: plenario.id,
        dataEntrada: new Date(),
        status: 'EM_ANDAMENTO',
        observacoes: observacoes || `Proposição incluída em pauta${descricaoSessao}.`
      }
    })

    // Registra histórico da nova tramitação
    await prisma.tramitacaoHistorico.create({
      data: {
        tramitacaoId: novaTramitacao.id,
        acao: 'EM_PAUTA',
        descricao: `Proposição encaminhada ao Plenário${descricaoSessao}`,
        data: new Date(),
        usuarioId,
        ip,
        dadosNovos: {
          unidade: plenario.nome,
          status: 'EM_PAUTA',
          sessaoId
        } as Prisma.InputJsonValue
      }
    })

    // Atualiza status da proposição para EM_PAUTA e vincula à sessão
    await prisma.proposicao.update({
      where: { id: proposicaoId },
      data: {
        status: 'EM_PAUTA',
        sessaoId: sessaoId || proposicao.sessaoId
      }
    })

    logger.info('Proposição tramitada para Plenário', {
      action: 'tramitar_plenario',
      proposicaoId,
      tramitacaoId: novaTramitacao.id,
      sessaoId,
      unidade: plenario.nome
    })

    return {
      valid: true,
      errors,
      warnings,
      tramitacaoId: novaTramitacao.id
    }
  } catch (error) {
    logger.error('Erro ao tramitar para Plenário', error)
    errors.push('Erro interno ao tramitar proposição.')
    return { valid: false, errors, warnings }
  }
}

// ======================================================================
// Re-exports de submódulos extraídos (mantém compatibilidade de import)
// ======================================================================
export {
  publicList,
  publicGetById,
  findProposicaoBasic,
  updateProposicaoStatus,
} from './tramitacao/publica'
