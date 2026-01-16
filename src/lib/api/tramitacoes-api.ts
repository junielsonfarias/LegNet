import { ApiResponse } from '@/lib/error-handler'
import {
  tramitacoesService,
  tramitacaoHistoricosService,
  tramitacaoNotificacoesService,
  tiposTramitacaoService,
  tiposOrgaosService,
  regrasTramitacaoService,
  regrasTramitacaoEtapasService
} from '@/lib/tramitacao-service'
import type { Tramitacao } from '@/lib/types/tramitacao'

export type TramitacaoStatus = 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'
export type TramitacaoResultado = 'APROVADO' | 'REJEITADO' | 'APROVADO_COM_EMENDAS' | 'ARQUIVADO'

export interface TramitacaoHistoricoApi {
  id: string
  tramitacaoId: string
  data: string
  acao: string
  descricao?: string | null
  usuarioId?: string | null
  dadosAnteriores?: unknown
  dadosNovos?: unknown
  ip?: string | null
}

export interface TramitacaoNotificacaoApi {
  id: string
  tramitacaoId: string
  canal: string
  destinatario: string
  enviadoEm?: string | null
  status?: string | null
  mensagem?: string | null
  parametros?: Record<string, unknown> | null
}

export interface TramitacaoTipoResumo {
  id: string
  nome: string
  descricao?: string | null
  prazoRegimental?: number | null
  ativo?: boolean
}

export interface TramitacaoUnidadeResumo {
  id: string
  nome: string
  sigla?: string | null
  descricao?: string | null
  tipo?: string | null
}

export interface TramitacaoApi {
  id: string
  proposicaoId: string
  tipoTramitacaoId: string
  unidadeId: string
  dataEntrada: string
  dataSaida?: string | null
  status: TramitacaoStatus
  observacoes?: string | null
  parecer?: string | null
  resultado?: TramitacaoResultado | null
  responsavelId?: string | null
  prazoVencimento?: string | null
  diasVencidos?: number | null
  automatica: boolean
  createdAt?: string
  updatedAt?: string
  tipoTramitacao?: TramitacaoTipoResumo | null
  unidade?: TramitacaoUnidadeResumo | null
  historicos?: TramitacaoHistoricoApi[]
  notificacoes?: TramitacaoNotificacaoApi[]
}

export interface TramitacaoFilters {
  proposicaoId?: string
  tipoTramitacaoId?: string
  unidadeId?: string
  status?: TramitacaoStatus | string
  resultado?: TramitacaoResultado | string
  automatica?: boolean
  from?: string
  to?: string
  search?: string
  page?: number
  limit?: number
}

export interface TramitacaoCreate {
  proposicaoId: string
  tipoTramitacaoId: string
  unidadeId?: string
  dataEntrada?: string
  dataSaida?: string | null
  status?: TramitacaoStatus
  observacoes?: string | null
  parecer?: string | null
  resultado?: TramitacaoResultado | null
  responsavelId?: string | null
  prazoVencimento?: string | null
  diasVencidos?: number | null
  automatica?: boolean
}

export interface TramitacaoUpdate {
  tipoTramitacaoId?: string
  unidadeId?: string
  dataEntrada?: string
  dataSaida?: string | null
  status?: TramitacaoStatus
  observacoes?: string | null
  parecer?: string | null
  resultado?: TramitacaoResultado | null
  responsavelId?: string | null
  prazoVencimento?: string | null
  diasVencidos?: number | null
  automatica?: boolean
}

export interface TramitacaoRegraEtapaApi {
  id: string
  regraId: string
  ordem: number
  nome: string
  descricao?: string | null
  tipoTramitacaoId?: string | null
  unidadeId?: string | null
  notificacoes?: Record<string, unknown> | null
  alertas?: Record<string, unknown> | null
  prazoDias?: number | null
}

export interface TramitacaoRegraApi {
  id: string
  nome: string
  descricao?: string | null
  condicoes: Record<string, unknown>
  acoes: Record<string, unknown>
  excecoes?: Record<string, unknown> | null
  ativo: boolean
  ordem: number
  createdAt?: string
  updatedAt?: string
  etapas?: TramitacaoRegraEtapaApi[]
}

export interface TramitacaoRegraPayload {
  nome: string
  descricao?: string | null
  condicoes: Record<string, unknown>
  acoes: Record<string, unknown>
  excecoes?: Record<string, unknown> | null
  ativo?: boolean
  ordem?: number
  etapas?: Array<Omit<TramitacaoRegraEtapaApi, 'id' | 'regraId' | 'createdAt' | 'updatedAt'> & { id?: string }>
}

export interface TramitacaoDashboardResumo {
  total: number
  emAndamento: number
  concluidas: number
  canceladas: number
  vencidas: number
  tempoMedioConclusao: number | null
}

export interface TramitacaoDashboardItem {
  id: string
  proposicaoId: string
  prazoVencimento?: string | null
  diasRestantes: number | null
  unidade: string | null
  tipoTramitacao: string | null
}

export interface TramitacaoDashboardGrupo {
  unidadeId: string
  unidadeNome: string
  total: number
  emAndamento: number
  concluidas: number
  canceladas: number
}

export interface TramitacaoDashboardTipoGrupo {
  tipoTramitacaoId: string
  tipoTramitacaoNome: string
  total: number
  emAndamento: number
  concluidas: number
  canceladas: number
}

export interface TramitacaoDashboardApi {
  resumo: TramitacaoDashboardResumo
  proximosVencimentos: TramitacaoDashboardItem[]
  porUnidade: TramitacaoDashboardGrupo[]
  porTipo: TramitacaoDashboardTipoGrupo[]
}

export interface TramitacaoAdvancePayload {
  comentario?: string | null
  regraId?: string
  etapaId?: string
}

export interface TramitacaoReopenPayload {
  observacoes?: string | null
}

export interface TramitacaoFinalizePayload {
  observacoes?: string | null
  resultado?: TramitacaoResultado | null
}

export interface TramitacaoAdvanceResponse {
  etapaFinalizada: TramitacaoApi
  novaEtapa?: TramitacaoApi | null
  historicos: TramitacaoHistoricoApi[]
  notificacoes: TramitacaoNotificacaoApi[]
  regraAplicada?: TramitacaoRegraApi | null
  etapaDestino?: TramitacaoRegraEtapaApi | null
}

interface ListResponse<T> {
  data: T
  meta?: {
    total?: number
    page?: number
    limit?: number
    totalPages?: number
  }
  total?: number
}

type RegraInterna = NonNullable<ReturnType<typeof regrasTramitacaoService.getById>>

const RESULTADO_TO_API: Record<string, TramitacaoResultado> = {
  aprovado: 'APROVADO',
  rejeitado: 'REJEITADO',
  aprovado_com_emendas: 'APROVADO_COM_EMENDAS',
  arquivado: 'ARQUIVADO',
  APROVADO: 'APROVADO',
  REJEITADO: 'REJEITADO',
  APROVADO_COM_EMENDAS: 'APROVADO_COM_EMENDAS',
  ARQUIVADO: 'ARQUIVADO'
}

const RESULTADO_TO_SERVICE: Record<TramitacaoResultado, string> = {
  APROVADO: 'aprovado',
  REJEITADO: 'rejeitado',
  APROVADO_COM_EMENDAS: 'aprovado_com_emendas',
  ARQUIVADO: 'arquivado'
}

const toApiResultado = (resultado?: string | null): TramitacaoResultado | null => {
  if (!resultado) return null
  const normalized = resultado.toString().toLowerCase()
  return RESULTADO_TO_API[normalized] ?? null
}

const toServiceResultado = (resultado?: TramitacaoResultado | null): TramitacaoResultado | undefined => {
  if (!resultado) return undefined
  return RESULTADO_TO_SERVICE[resultado] as TramitacaoResultado | undefined
}

const calculateDiasVencidos = (prazo?: string | null): number | null => {
  if (!prazo) return null
  const prazoDate = new Date(prazo)
  if (Number.isNaN(prazoDate.getTime())) return null
  const now = new Date()
  const diffMs = now.getTime() - prazoDate.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
}

const ensureUnidadeId = (unidadeId: string | undefined, tipoTramitacaoId: string): string => {
  if (unidadeId) {
    return unidadeId
  }

  const tipo = tiposTramitacaoService.getById(tipoTramitacaoId)
  const fromTipo = tipo?.unidadeResponsavelId ?? tipo?.unidadeResponsavel
  if (fromTipo) {
    return fromTipo
  }

  const primeiraUnidade = tiposOrgaosService.getAll()[0]
  if (primeiraUnidade) {
    return primeiraUnidade.id
  }

  throw new Error('Unidade responsável não encontrada para a tramitação (modo offline).')
}

const buildTramitacaoApi = (tramitacao: Tramitacao): TramitacaoApi => {
  const tipo = tiposTramitacaoService.getById(tramitacao.tipoTramitacaoId)
  const unidade = tiposOrgaosService.getById(tramitacao.unidadeId)
  const historicos = tramitacaoHistoricosService.getByTramitacao(tramitacao.id).map(buildHistoricoApi)
  const notificacoes = tramitacaoNotificacoesService.getByTramitacao(tramitacao.id).map(buildNotificacaoApi)

  const diasVencidos =
    typeof tramitacao.diasVencidos === 'number'
      ? tramitacao.diasVencidos
      : calculateDiasVencidos(tramitacao.prazoVencimento)

  return {
    id: tramitacao.id,
    proposicaoId: tramitacao.proposicaoId,
    tipoTramitacaoId: tramitacao.tipoTramitacaoId,
    unidadeId: tramitacao.unidadeId,
    dataEntrada: tramitacao.dataEntrada,
    dataSaida: tramitacao.dataSaida ?? null,
    status: tramitacao.status as TramitacaoStatus,
    observacoes: tramitacao.observacoes ?? null,
    parecer: tramitacao.parecer ?? null,
    resultado: toApiResultado(tramitacao.resultado),
    responsavelId: tramitacao.responsavelId ?? null,
    prazoVencimento: tramitacao.prazoVencimento ?? null,
    diasVencidos,
    automatica: tramitacao.automatica,
    createdAt: (tramitacao as any).createdAt,
    updatedAt: (tramitacao as any).updatedAt,
    tipoTramitacao: tipo
      ? {
          id: tipo.id,
          nome: tipo.nome,
          descricao: tipo.descricao ?? null,
          prazoRegimental: tipo.prazoRegimental ?? null,
          ativo: tipo.ativo
        }
      : null,
    unidade: unidade
      ? {
          id: unidade.id,
          nome: unidade.nome,
          sigla: unidade.sigla ?? null,
          descricao: unidade.descricao ?? null,
          tipo: unidade.tipo ?? null
        }
      : null,
    historicos,
    notificacoes
  }
}

const buildHistoricoApi = (
  historico: ReturnType<typeof tramitacaoHistoricosService.getAll>[number]
): TramitacaoHistoricoApi => ({
  id: historico.id,
  tramitacaoId: historico.tramitacaoId,
  data: historico.data,
  acao: historico.acao,
  descricao: historico.descricao ?? null,
  usuarioId: historico.usuarioId ?? null,
  dadosAnteriores: historico.dadosAnteriores ?? null,
  dadosNovos: historico.dadosNovos ?? null,
  ip: historico.ip ?? null
})

const buildNotificacaoApi = (
  notificacao: ReturnType<typeof tramitacaoNotificacoesService.getAll>[number]
): TramitacaoNotificacaoApi => ({
  id: notificacao.id,
  tramitacaoId: notificacao.tramitacaoId,
  canal: notificacao.canal,
  destinatario: notificacao.destinatario,
  enviadoEm: notificacao.enviadoEm ?? null,
  status: notificacao.status ?? null,
  mensagem: notificacao.mensagem ?? null,
  parametros: notificacao.parametros ?? null
})

const buildEtapaApiFromInterno = (etapa: {
  id: string
  regraId: string
  ordem: number
  nome: string
  descricao?: string | null
  tipoTramitacaoId?: string | null
  unidadeId?: string | null
  notificacoes?: Record<string, unknown> | null
  alertas?: Record<string, unknown> | null
  prazoDias?: number | null
}): TramitacaoRegraEtapaApi => ({
  id: etapa.id,
  regraId: etapa.regraId,
  ordem: etapa.ordem ?? 0,
  nome: etapa.nome,
  descricao: etapa.descricao ?? null,
  tipoTramitacaoId: etapa.tipoTramitacaoId ?? null,
  unidadeId: etapa.unidadeId ?? null,
  notificacoes: etapa.notificacoes ?? null,
  alertas: etapa.alertas ?? null,
  prazoDias: etapa.prazoDias ?? null
})

const applyFilters = (tramitacoes: Tramitacao[], filters?: TramitacaoFilters): Tramitacao[] => {
  if (!filters) {
    return [...tramitacoes]
  }

  return tramitacoes.filter(item => {
    if (filters.proposicaoId && item.proposicaoId !== filters.proposicaoId) return false
    if (filters.tipoTramitacaoId && item.tipoTramitacaoId !== filters.tipoTramitacaoId) return false
    if (filters.unidadeId && item.unidadeId !== filters.unidadeId) return false

    if (filters.status) {
      const expected = filters.status.toString().toUpperCase()
      if ((item.status ?? '').toUpperCase() !== expected) return false
    }

    if (filters.resultado) {
      const expected = (toServiceResultado(filters.resultado as TramitacaoResultado) ?? filters.resultado.toString()).toLowerCase()
      const current = (item.resultado ?? '').toLowerCase()
      if (expected && current !== expected) return false
    }

    if (filters.automatica !== undefined && item.automatica !== filters.automatica) return false

    if (filters.from) {
      const fromDate = new Date(filters.from)
      if (!Number.isNaN(fromDate.getTime())) {
        const entradaDate = new Date(item.dataEntrada)
        if (entradaDate < fromDate) return false
      }
    }

    if (filters.to) {
      const toDate = new Date(filters.to)
      if (!Number.isNaN(toDate.getTime())) {
        const entradaDate = new Date(item.dataEntrada)
        if (entradaDate > toDate) return false
      }
    }

    return true
  })
}

const applySearch = (itens: TramitacaoApi[], term?: string): TramitacaoApi[] => {
  if (!term) return itens
  const normalized = term.trim().toLowerCase()
  if (!normalized) return itens

  return itens.filter(item => {
    const candidates = [
      item.proposicaoId,
      item.observacoes ?? '',
      item.parecer ?? '',
      item.tipoTramitacao?.nome ?? '',
      item.unidade?.nome ?? ''
    ]

    return candidates.some(value => value.toLowerCase().includes(normalized))
  })
}

const paginate = (items: TramitacaoApi[], filters?: TramitacaoFilters) => {
  const total = items.length
  const limit = filters?.limit && filters.limit > 0 ? filters.limit : total || 1
  const page = filters?.page && filters.page > 0 ? filters.page : 1
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const paginated = filters?.limit
    ? items.slice((page - 1) * limit, (page - 1) * limit + limit)
    : items

  return {
    data: paginated,
    meta: {
      total,
      page,
      limit,
      totalPages
    },
    total
  }
}

const fallbackListTramitacoes = async (filters?: TramitacaoFilters) => {
  const todas = tramitacoesService.getAll()
  const filtradas = applyFilters(todas, filters)
  const mapeadas = filtradas.map(buildTramitacaoApi)
  const pesquisadas = applySearch(mapeadas, filters?.search)
  return paginate(pesquisadas, filters)
}

const fallbackGetTramitacao = async (id: string): Promise<TramitacaoApi> => {
  const tramitacao = tramitacoesService.getById(id)
  if (!tramitacao) {
    throw new Error('Tramitação não encontrada (modo offline).')
  }
  return buildTramitacaoApi(tramitacao)
}

const fallbackCreateTramitacao = async (payload: TramitacaoCreate): Promise<TramitacaoApi> => {
  const resolvedTipoId = payload.tipoTramitacaoId
  const resolvedUnidadeId = ensureUnidadeId(payload.unidadeId, resolvedTipoId)
  const dataEntradaISO = payload.dataEntrada ? new Date(payload.dataEntrada).toISOString() : new Date().toISOString()

  const prazoISO = payload.prazoVencimento
    ? new Date(payload.prazoVencimento).toISOString()
    : tramitacoesService.calcularPrazoVencimento(resolvedTipoId).toISOString()

  const nova = tramitacoesService.create({
    proposicaoId: payload.proposicaoId,
    tipoTramitacaoId: resolvedTipoId,
    unidadeId: resolvedUnidadeId,
    dataEntrada: dataEntradaISO,
    dataSaida: payload.dataSaida ?? undefined,
    status: (payload.status ?? 'EM_ANDAMENTO') as Tramitacao['status'],
    observacoes: payload.observacoes ?? undefined,
    parecer: payload.parecer ?? undefined,
    resultado: toServiceResultado(payload.resultado) ?? undefined,
    responsavelId: payload.responsavelId ?? undefined,
    prazoVencimento: prazoISO,
    diasVencidos: payload.diasVencidos ?? undefined,
    automatica: payload.automatica ?? false
  })

  tramitacaoHistoricosService.create({
    tramitacaoId: nova.id,
    proposicaoId: nova.proposicaoId,
    acao: 'Tramitação criada (modo offline)',
    descricao: payload.observacoes ?? 'Registro criado em ambiente sem autenticação.',
    usuarioId: 'mock-user'
  })

  return buildTramitacaoApi(nova)
}

const fallbackUpdateTramitacao = async (id: string, payload: TramitacaoUpdate): Promise<TramitacaoApi> => {
  const existente = tramitacoesService.getById(id)
  if (!existente) {
    throw new Error('Tramitação não encontrada (modo offline).')
  }

  const resolvedTipoId = payload.tipoTramitacaoId ?? existente.tipoTramitacaoId
  const resolvedUnidadeId =
    payload.unidadeId !== undefined
      ? ensureUnidadeId(payload.unidadeId, resolvedTipoId)
      : existente.unidadeId

  const atualizada = tramitacoesService.update({
    ...existente,
    ...payload,
    tipoTramitacaoId: resolvedTipoId,
    unidadeId: resolvedUnidadeId,
    dataEntrada: payload.dataEntrada ? new Date(payload.dataEntrada).toISOString() : existente.dataEntrada,
    dataSaida: payload.dataSaida ?? existente.dataSaida,
    prazoVencimento: payload.prazoVencimento
      ? new Date(payload.prazoVencimento).toISOString()
      : existente.prazoVencimento,
    resultado: payload.resultado !== undefined ? toServiceResultado(payload.resultado) ?? undefined : existente.resultado,
    status: payload.status ?? existente.status,
    automatica: payload.automatica ?? existente.automatica
  } as any)

  tramitacaoHistoricosService.create({
    tramitacaoId: atualizada.id,
    proposicaoId: atualizada.proposicaoId,
    acao: 'Tramitação atualizada (modo offline)',
    descricao: payload.observacoes ?? 'Alterações aplicadas em ambiente sem autenticação.',
    usuarioId: 'mock-user'
  })

  return buildTramitacaoApi(atualizada)
}

const fallbackAdvanceTramitacao = async (
  id: string,
  payload: TramitacaoAdvancePayload
): Promise<TramitacaoAdvanceResponse> => {
  const resultado = tramitacoesService.advance(id, {
    usuarioId: 'mock-user',
    comentario: payload.comentario ?? undefined,
    regraId: payload.regraId,
    etapaId: payload.etapaId
  })

  return {
    etapaFinalizada: buildTramitacaoApi(resultado.etapaFinalizada),
    novaEtapa: resultado.novaEtapa ? buildTramitacaoApi(resultado.novaEtapa) : null,
    historicos: resultado.historicos.map(buildHistoricoApi),
    notificacoes: resultado.notificacoes.map(buildNotificacaoApi),
    regraAplicada: resultado.regraAplicada ? buildRegraApi(resultado.regraAplicada as RegraInterna) : null,
    etapaDestino: resultado.etapaDestino ? buildEtapaApiFromInterno(resultado.etapaDestino) : null
  }
}

const fallbackReopenTramitacao = async (
  id: string,
  payload: TramitacaoReopenPayload
): Promise<TramitacaoApi> => {
  const resultado = tramitacoesService.reopen(id, {
    usuarioId: 'mock-user',
    observacoes: payload.observacoes ?? undefined
  })
  return buildTramitacaoApi(resultado.tramitacao)
}

const fallbackFinalizeTramitacao = async (
  id: string,
  payload: TramitacaoFinalizePayload
): Promise<TramitacaoApi> => {
  const resultadoInterno = payload.resultado ? toServiceResultado(payload.resultado) : undefined
  const resposta = tramitacoesService.finalize(id, {
    usuarioId: 'mock-user',
    resultado: resultadoInterno,
    observacoes: payload.observacoes ?? undefined
  })
  return buildTramitacaoApi(resposta.tramitacao)
}

const fallbackDeleteTramitacao = async (id: string): Promise<void> => {
  tramitacoesService.delete(id)
  tramitacaoHistoricosService.deleteByTramitacao(id)
  tramitacaoNotificacoesService.deleteByTramitacao(id)
}

const fallbackDashboard = async (): Promise<TramitacaoDashboardApi> => {
  const itens = tramitacoesService.getAll()
  const agora = new Date()
  const umDia = 1000 * 60 * 60 * 24

  const resumo = {
    total: itens.length,
    emAndamento: itens.filter(item => item.status === 'EM_ANDAMENTO').length,
    concluidas: itens.filter(item => item.status === 'CONCLUIDA').length,
    canceladas: itens.filter(item => item.status === 'CANCELADA').length,
    vencidas: itens.filter(item => item.prazoVencimento && new Date(item.prazoVencimento) < agora && item.status === 'EM_ANDAMENTO').length,
    tempoMedioConclusao: (() => {
      const concluidas = itens.filter(item => item.status === 'CONCLUIDA' && item.dataSaida)
      if (!concluidas.length) return null
      const somaDias = concluidas.reduce((acc, item) => {
        const entrada = new Date(item.dataEntrada)
        const saida = new Date(item.dataSaida as string)
        if (Number.isNaN(entrada.getTime()) || Number.isNaN(saida.getTime())) {
          return acc
        }
        const diff = Math.max(0, Math.floor((saida.getTime() - entrada.getTime()) / umDia))
        return acc + diff
      }, 0)
      return Math.round(somaDias / concluidas.length)
    })()
  }

  const proximosVencimentos = itens
    .filter(item => item.prazoVencimento)
    .map(item => {
      const prazoDate = new Date(item.prazoVencimento as string)
      const diasRestantes = Math.floor((prazoDate.getTime() - agora.getTime()) / umDia)
      const tipo = tiposTramitacaoService.getById(item.tipoTramitacaoId)
      const unidade = tiposOrgaosService.getById(item.unidadeId)

      return {
        id: item.id,
        proposicaoId: item.proposicaoId,
        prazoVencimento: item.prazoVencimento ?? null,
        diasRestantes,
        unidade: unidade?.nome ?? null,
        tipoTramitacao: tipo?.nome ?? null
      }
    })
    .sort((a, b) => {
      const prazoA = a.prazoVencimento ? new Date(a.prazoVencimento).getTime() : Number.POSITIVE_INFINITY
      const prazoB = b.prazoVencimento ? new Date(b.prazoVencimento).getTime() : Number.POSITIVE_INFINITY
      return prazoA - prazoB
    })
    .slice(0, 10)

  const porUnidadeMap = new Map<string, TramitacaoDashboardGrupo>()
  itens.forEach(item => {
    const unidade = tiposOrgaosService.getById(item.unidadeId)
    if (!porUnidadeMap.has(item.unidadeId)) {
      porUnidadeMap.set(item.unidadeId, {
        unidadeId: item.unidadeId,
        unidadeNome: unidade?.nome ?? 'Unidade não cadastrada',
        total: 0,
        emAndamento: 0,
        concluidas: 0,
        canceladas: 0
      })
    }
    const grupo = porUnidadeMap.get(item.unidadeId)!
    grupo.total += 1
    if (item.status === 'EM_ANDAMENTO') grupo.emAndamento += 1
    if (item.status === 'CONCLUIDA') grupo.concluidas += 1
    if (item.status === 'CANCELADA') grupo.canceladas += 1
  })

  const porTipoMap = new Map<string, TramitacaoDashboardTipoGrupo>()
  itens.forEach(item => {
    const tipo = tiposTramitacaoService.getById(item.tipoTramitacaoId)
    if (!porTipoMap.has(item.tipoTramitacaoId)) {
      porTipoMap.set(item.tipoTramitacaoId, {
        tipoTramitacaoId: item.tipoTramitacaoId,
        tipoTramitacaoNome: tipo?.nome ?? 'Tipo não cadastrado',
        total: 0,
        emAndamento: 0,
        concluidas: 0,
        canceladas: 0
      })
    }
    const grupo = porTipoMap.get(item.tipoTramitacaoId)!
    grupo.total += 1
    if (item.status === 'EM_ANDAMENTO') grupo.emAndamento += 1
    if (item.status === 'CONCLUIDA') grupo.concluidas += 1
    if (item.status === 'CANCELADA') grupo.canceladas += 1
  })

  return {
    resumo,
    proximosVencimentos,
    porUnidade: Array.from(porUnidadeMap.values()),
    porTipo: Array.from(porTipoMap.values())
  }
}

const buildRegraApi = (regra: RegraInterna): TramitacaoRegraApi => {
  const etapas = regrasTramitacaoEtapasService.getByRegra(regra.id).map(etapa => ({
    id: etapa.id,
    regraId: etapa.regraId,
    ordem: etapa.ordem,
    nome: etapa.nome,
    descricao: etapa.descricao ?? null,
    tipoTramitacaoId: etapa.tipoTramitacaoId ?? null,
    unidadeId: etapa.unidadeId ?? null,
    notificacoes: etapa.notificacoes ?? null,
    alertas: etapa.alertas ?? null,
    prazoDias: etapa.prazoDias ?? null
  }))

  return {
    id: regra.id,
    nome: regra.nome,
    descricao: regra.descricao ?? null,
    condicoes: regra.condicoes ?? {},
    acoes: regra.acoes ?? {},
    excecoes: regra.excecoes ?? null,
    ativo: regra.ativo,
    ordem: regra.ordem ?? 0,
    createdAt: (regra as any).createdAt,
    updatedAt: (regra as any).updatedAt,
    etapas
  }
}

const fallbackListRegras = async (filters?: { ativo?: boolean }): Promise<TramitacaoRegraApi[]> => {
  let regras = regrasTramitacaoService.getAll()
  if (filters?.ativo !== undefined) {
    regras = regras.filter(regra => regra.ativo === filters.ativo)
  }
  return regras.map(regra => buildRegraApi(regra))
}

const fallbackGetRegra = async (id: string): Promise<TramitacaoRegraApi> => {
  const regra = regrasTramitacaoService.getById(id)
  if (!regra) {
    throw new Error('Regra de tramitação não encontrada (modo offline).')
  }
  return buildRegraApi(regra)
}

const fallbackCreateRegra = async (payload: TramitacaoRegraPayload): Promise<TramitacaoRegraApi> => {
  const regra = regrasTramitacaoService.create({
    nome: payload.nome,
    descricao: payload.descricao ?? '',
    condicoes: payload.condicoes ?? {},
    acoes: payload.acoes ?? {},
    excecoes: payload.excecoes ?? undefined,
    ativo: payload.ativo ?? true,
    ordem: payload.ordem ?? 0
  } as any) as any

  regrasTramitacaoEtapasService.deleteByRegra(regra.id)
  ;(payload.etapas ?? []).forEach((etapa, index) => {
    regrasTramitacaoEtapasService.create({
      regraId: regra.id,
      ordem: etapa.ordem ?? index,
      nome: etapa.nome,
      descricao: etapa.descricao ?? undefined,
      tipoTramitacaoId: etapa.tipoTramitacaoId ?? undefined,
      unidadeId: etapa.unidadeId ?? undefined,
      notificacoes: etapa.notificacoes ?? undefined,
      alertas: etapa.alertas ?? undefined,
      prazoDias: etapa.prazoDias ?? null
    })
  })

  return buildRegraApi(regra)
}

const fallbackUpdateRegra = async (id: string, payload: TramitacaoRegraPayload): Promise<TramitacaoRegraApi> => {
  const existente = regrasTramitacaoService.getById(id)
  if (!existente) {
    throw new Error('Regra de tramitação não encontrada (modo offline).')
  }

  const atualizada = regrasTramitacaoService.update({
    ...existente,
    nome: payload.nome ?? existente.nome,
    descricao: payload.descricao ?? existente.descricao,
    condicoes: payload.condicoes ?? existente.condicoes,
    acoes: payload.acoes ?? existente.acoes,
    excecoes: payload.excecoes ?? existente.excecoes,
    ativo: payload.ativo ?? existente.ativo,
    ordem: payload.ordem ?? existente.ordem
  } as any) as any

  regrasTramitacaoEtapasService.deleteByRegra(id)
  ;(payload.etapas ?? []).forEach((etapa, index) => {
    regrasTramitacaoEtapasService.create({
      regraId: id,
      ordem: etapa.ordem ?? index,
      nome: etapa.nome,
      descricao: etapa.descricao ?? undefined,
      tipoTramitacaoId: etapa.tipoTramitacaoId ?? undefined,
      unidadeId: etapa.unidadeId ?? undefined,
      notificacoes: etapa.notificacoes ?? undefined,
      alertas: etapa.alertas ?? undefined,
      prazoDias: etapa.prazoDias ?? null
    })
  })

  return buildRegraApi(atualizada)
}

const fallbackDeleteRegra = async (id: string): Promise<void> => {
  regrasTramitacaoService.delete(id)
  regrasTramitacaoEtapasService.deleteByRegra(id)
}

class TramitacoesApiService {
  private baseUrl = '/api/tramitacoes'

  private async handleResponse<T>(response: Response, fallback?: () => Promise<T> | T): Promise<T> {
    if (response.status === 401 && fallback) {
      return await Promise.resolve(fallback())
    }

    let data: ApiResponse<T>
    try {
      data = await response.json()
    } catch (error) {
      if (fallback) {
        return await Promise.resolve(fallback())
      }
      throw error
    }

    if (!response.ok || !data.success) {
      if (fallback && response.status === 401) {
        return await Promise.resolve(fallback())
      }
      const error = data.error || 'Erro ao processar requisição'
      throw new Error(error)
    }

    return data.data
  }

  async list(filters?: TramitacaoFilters): Promise<{ data: TramitacaoApi[]; meta?: ListResponse<TramitacaoApi[]>['meta']; total?: number }> {
    const params = new URLSearchParams()

    if (filters?.proposicaoId) params.append('proposicaoId', filters.proposicaoId)
    if (filters?.tipoTramitacaoId) params.append('tipoTramitacaoId', filters.tipoTramitacaoId)
    if (filters?.unidadeId) params.append('unidadeId', filters.unidadeId)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.resultado) params.append('resultado', filters.resultado)
    if (filters?.automatica !== undefined) params.append('automatica', String(filters.automatica))
    if (filters?.from) params.append('from', filters.from)
    if (filters?.to) params.append('to', filters.to)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.page) params.append('page', String(filters.page))
    if (filters?.limit) params.append('limit', String(filters.limit))

    const url = `${this.baseUrl}${params.toString() ? `?${params.toString()}` : ''}`
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      })

      if (response.status === 401) {
        return fallbackListTramitacoes(filters)
      }

      const responseData: ApiResponse<TramitacaoApi[]> = await response.json()

      if (!response.ok || !responseData.success) {
        const error = responseData.error || 'Erro ao carregar tramitações'
        throw new Error(error)
      }

      return {
        data: responseData.data,
        meta: responseData.meta,
        total: responseData.total ?? responseData.meta?.total
      }
    } catch (error) {
      return fallbackListTramitacoes(filters)
    }
  }

  async getById(id: string): Promise<TramitacaoApi> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      })

      return this.handleResponse<TramitacaoApi>(response, () => fallbackGetTramitacao(id))
    } catch (error) {
      return fallbackGetTramitacao(id)
    }
  }

  async create(payload: TramitacaoCreate): Promise<TramitacaoApi> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      return this.handleResponse<TramitacaoApi>(response, () => fallbackCreateTramitacao(payload))
    } catch (error) {
      return fallbackCreateTramitacao(payload)
    }
  }

  async update(id: string, payload: TramitacaoUpdate): Promise<TramitacaoApi> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      return this.handleResponse<TramitacaoApi>(response, () => fallbackUpdateTramitacao(id, payload))
    } catch (error) {
      return fallbackUpdateTramitacao(id, payload)
    }
  }

  async advance(id: string, payload: TramitacaoAdvancePayload = {}): Promise<TramitacaoAdvanceResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'advance',
          comentario: payload.comentario ?? undefined,
          regraId: payload.regraId,
          etapaId: payload.etapaId
        })
      })

      return this.handleResponse<TramitacaoAdvanceResponse>(response, () => fallbackAdvanceTramitacao(id, payload))
    } catch (error) {
      return fallbackAdvanceTramitacao(id, payload)
    }
  }

  async reopen(id: string, payload: TramitacaoReopenPayload = {}): Promise<TramitacaoApi> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'reopen',
          observacoes: payload.observacoes ?? undefined
        })
      })

      return this.handleResponse<TramitacaoApi>(response, () => fallbackReopenTramitacao(id, payload))
    } catch (error) {
      return fallbackReopenTramitacao(id, payload)
    }
  }

  async finalize(id: string, payload: TramitacaoFinalizePayload = {}): Promise<TramitacaoApi> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'finalize',
          observacoes: payload.observacoes ?? undefined,
          resultado: payload.resultado ?? null
        })
      })

      return this.handleResponse<TramitacaoApi>(response, () => fallbackFinalizeTramitacao(id, payload))
    } catch (error) {
      return fallbackFinalizeTramitacao(id, payload)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 401) {
        await fallbackDeleteTramitacao(id)
        return
      }

      if (!response.ok) {
        const data: ApiResponse<unknown> = await response.json()
        throw new Error(data.error || 'Erro ao remover tramitação')
      }
    } catch (error) {
      await fallbackDeleteTramitacao(id)
    }
  }

  async getDashboard(): Promise<TramitacaoDashboardApi> {
    try {
      const response = await fetch(`${this.baseUrl}/dashboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      })

      return this.handleResponse<TramitacaoDashboardApi>(response, () => fallbackDashboard())
    } catch (error) {
      return fallbackDashboard()
    }
  }
}

class TramitacaoRegrasApiService {
  private baseUrl = '/api/tramitacoes/regras'

  private async handleResponse<T>(response: Response, fallback?: () => Promise<T> | T): Promise<T> {
    if (response.status === 401 && fallback) {
      return await Promise.resolve(fallback())
    }

    let data: ApiResponse<T>
    try {
      data = await response.json()
    } catch (error) {
      if (fallback) {
        return await Promise.resolve(fallback())
      }
      throw error
    }

    if (!response.ok || !data.success) {
      if (fallback && response.status === 401) {
        return await Promise.resolve(fallback())
      }
      const error = data.error || 'Erro ao processar requisição'
      throw new Error(error)
    }

    return data.data
  }

  async list(filters?: { ativo?: boolean }): Promise<TramitacaoRegraApi[]> {
    const params = new URLSearchParams()

    if (filters?.ativo !== undefined) params.append('ativo', String(filters.ativo))

    const url = `${this.baseUrl}${params.toString() ? `?${params.toString()}` : ''}`
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      })

      if (response.status === 401) {
        return fallbackListRegras(filters)
      }

      return this.handleResponse<TramitacaoRegraApi[]>(response)
    } catch (error) {
      return fallbackListRegras(filters)
    }
  }

  async getById(id: string): Promise<TramitacaoRegraApi> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      })

      return this.handleResponse<TramitacaoRegraApi>(response, () => fallbackGetRegra(id))
    } catch (error) {
      return fallbackGetRegra(id)
    }
  }

  async create(payload: TramitacaoRegraPayload): Promise<TramitacaoRegraApi> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      return this.handleResponse<TramitacaoRegraApi>(response, () => fallbackCreateRegra(payload))
    } catch (error) {
      return fallbackCreateRegra(payload)
    }
  }

  async update(id: string, payload: TramitacaoRegraPayload): Promise<TramitacaoRegraApi> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      return this.handleResponse<TramitacaoRegraApi>(response, () => fallbackUpdateRegra(id, payload))
    } catch (error) {
      return fallbackUpdateRegra(id, payload)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 401) {
        await fallbackDeleteRegra(id)
        return
      }

      if (!response.ok) {
        const data: ApiResponse<unknown> = await response.json()
        throw new Error(data.error || 'Erro ao remover regra de tramitação')
      }
    } catch (error) {
      await fallbackDeleteRegra(id)
    }
  }
}

export const tramitacoesApi = new TramitacoesApiService()
export const tramitacaoRegrasApi = new TramitacaoRegrasApiService()


