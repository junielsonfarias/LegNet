/**
 * Cliente API para Analytics e Relatorios
 */

// ============ TIPOS - METRICAS ============

export interface PeriodoAnalise {
  inicio: string
  fim: string
  nome?: string
}

export interface MetricasProposicoes {
  total: number
  porTipo: Record<string, number>
  porStatus: Record<string, number>
  porAutor: Array<{ autorId: string; nome: string; quantidade: number }>
  porMes: Array<{ mes: string; quantidade: number }>
  taxaAprovacao: number
  tempoMedioTramitacao: number
}

export interface MetricasSessoes {
  total: number
  porTipo: Record<string, number>
  porStatus: Record<string, number>
  porMes: Array<{ mes: string; quantidade: number }>
  duracaoMedia: number
  presencaMedia: number
}

export interface MetricasVotacoes {
  total: number
  aprovadas: number
  rejeitadas: number
  empates: number
  participacaoMedia: number
  porMes: Array<{ mes: string; aprovadas: number; rejeitadas: number }>
}

export interface MetricasParlamentar {
  parlamentarId: string
  nome: string
  proposicoesApresentadas: number
  proposicoesAprovadas: number
  presencaSessoes: number
  totalSessoes: number
  taxaPresenca: number
  participacaoVotacoes: number
  totalVotacoes: number
  taxaParticipacaoVotacoes: number
}

export interface DashboardMetrics {
  periodo: PeriodoAnalise
  proposicoes: MetricasProposicoes
  sessoes: MetricasSessoes
  votacoes: MetricasVotacoes
  destaques: {
    proposicoesMaisVotadas: Array<{ id: string; numero: string; votos: number }>
    parlamentaresMaisAtivos: Array<{ id: string; nome: string; proposicoes: number }>
    sessoesComMaisItens: Array<{ id: string; data: string; itens: number }>
  }
  comparativo?: {
    periodoAnterior: PeriodoAnalise
    variacaoProposicoes: number
    variacaoSessoes: number
    variacaoAprovacoes: number
  }
}

export interface RelatorioProdutividade {
  periodo: PeriodoAnalise
  indicadores: {
    proposicoesApresentadas: number
    proposicoesAprovadas: number
    taxaAprovacao: number
    sessoesRealizadas: number
    presencaMedia: number
    tempoMedioTramitacao: number
  }
  ranking: {
    parlamentares: MetricasParlamentar[]
    comissoes: Array<{ id: string; nome: string; pareceresEmitidos: number }>
  }
  tendencias: {
    proposicoesPorMes: Array<{ mes: string; quantidade: number }>
    aprovacoesPorMes: Array<{ mes: string; aprovadas: number; rejeitadas: number }>
  }
}

// ============ TIPOS - RELATORIOS AGENDADOS ============

export interface RelatorioAgendadoApi {
  id: string
  nome: string
  descricao?: string
  tipo: string
  filtros: Record<string, any>
  frequencia: string
  diaSemana?: number
  diaHora?: string
  destinatarios: string[]
  formato: string
  ativo: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    execucoes: number
  }
}

export interface ExecucaoRelatorioApi {
  id: string
  relatorioId: string
  dataExecucao: string
  status: string
  arquivoUrl?: string
  erro?: string
  tempoExecucao?: number
}

export interface TipoRelatorioApi {
  id: string
  nome: string
  descricao: string
}

// ============ INPUTS ============

export interface CriarRelatorioAgendadoInput {
  nome: string
  descricao?: string
  tipo: string
  filtros?: Record<string, any>
  frequencia: 'DIARIO' | 'SEMANAL' | 'MENSAL' | 'SOB_DEMANDA'
  diaSemana?: number
  diaHora?: string
  destinatarios: string[]
  formato: 'PDF' | 'EXCEL' | 'CSV'
}

export interface AtualizarRelatorioAgendadoInput {
  nome?: string
  descricao?: string
  filtros?: Record<string, any>
  frequencia?: 'DIARIO' | 'SEMANAL' | 'MENSAL' | 'SOB_DEMANDA'
  diaSemana?: number
  diaHora?: string
  destinatarios?: string[]
  formato?: 'PDF' | 'EXCEL' | 'CSV'
  ativo?: boolean
}

export interface FiltrosRelatorio {
  tipo?: string
  formato?: string
  ativo?: boolean
  status?: string
  tipoSessao?: string
  ano?: number
  dataInicio?: string
  dataFim?: string
  parlamentarId?: string
  legislaturaId?: string
}

// ============ RESPONSES ============

export interface ListaRelatoriosResponse {
  relatorios: RelatorioAgendadoApi[]
  total: number
}

// ============ API CLIENT ============

const BASE_URL_ANALYTICS = '/api/analytics'
const BASE_URL_RELATORIOS = '/api/relatorios'

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error || 'Erro na requisicao')
  }
  return data.data
}

// ============ ANALYTICS ============

/**
 * Obtem dashboard do mes atual
 */
export async function getDashboardMesAtual(
  comparativo: boolean = true
): Promise<DashboardMetrics> {
  const params = new URLSearchParams()
  params.set('tipo', 'mes')
  if (comparativo) params.set('comparativo', 'true')

  const response = await fetch(`${BASE_URL_ANALYTICS}?${params.toString()}`)
  return handleResponse(response)
}

/**
 * Obtem dashboard do ano atual
 */
export async function getDashboardAnoAtual(
  comparativo: boolean = true
): Promise<DashboardMetrics> {
  const params = new URLSearchParams()
  params.set('tipo', 'ano')
  if (comparativo) params.set('comparativo', 'true')

  const response = await fetch(`${BASE_URL_ANALYTICS}?${params.toString()}`)
  return handleResponse(response)
}

/**
 * Obtem dashboard para periodo personalizado
 */
export async function getDashboardPeriodo(
  inicio: string,
  fim: string,
  comparativo: boolean = false
): Promise<DashboardMetrics> {
  const params = new URLSearchParams()
  params.set('tipo', 'periodo')
  params.set('inicio', inicio)
  params.set('fim', fim)
  if (comparativo) params.set('comparativo', 'true')

  const response = await fetch(`${BASE_URL_ANALYTICS}?${params.toString()}`)
  return handleResponse(response)
}

/**
 * Obtem metricas de parlamentares
 */
export async function getMetricasParlamentares(
  inicio?: string,
  fim?: string
): Promise<MetricasParlamentar[]> {
  const params = new URLSearchParams()
  params.set('tipo', 'parlamentares')
  if (inicio) params.set('inicio', inicio)
  if (fim) params.set('fim', fim)

  const response = await fetch(`${BASE_URL_ANALYTICS}?${params.toString()}`)
  return handleResponse(response)
}

/**
 * Obtem relatorio de produtividade
 */
export async function getRelatorioProdutividade(
  inicio?: string,
  fim?: string
): Promise<RelatorioProdutividade> {
  const params = new URLSearchParams()
  params.set('tipo', 'produtividade')
  if (inicio) params.set('inicio', inicio)
  if (fim) params.set('fim', fim)

  const response = await fetch(`${BASE_URL_ANALYTICS}?${params.toString()}`)
  return handleResponse(response)
}

// ============ RELATORIOS SOB DEMANDA ============

/**
 * Gera relatorio sob demanda (retorna arquivo)
 */
export async function gerarRelatorio(
  tipo: 'parlamentares' | 'sessoes' | 'proposicoes' | 'presenca' | 'votacoes',
  filtros?: FiltrosRelatorio
): Promise<Blob> {
  const params = new URLSearchParams()
  params.set('tipo', tipo)
  params.set('formato', 'excel')

  if (filtros?.ativo !== undefined) params.set('ativo', String(filtros.ativo))
  if (filtros?.status) params.set('status', filtros.status)
  if (filtros?.tipoSessao) params.set('tipoSessao', filtros.tipoSessao)
  if (filtros?.ano) params.set('ano', filtros.ano.toString())
  if (filtros?.dataInicio) params.set('dataInicio', filtros.dataInicio)
  if (filtros?.dataFim) params.set('dataFim', filtros.dataFim)
  if (filtros?.legislaturaId) params.set('legislaturaId', filtros.legislaturaId)

  const response = await fetch(`${BASE_URL_RELATORIOS}?${params.toString()}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erro ao gerar relatorio')
  }

  return response.blob()
}

/**
 * Baixa relatorio como arquivo
 */
export async function downloadRelatorio(
  tipo: 'parlamentares' | 'sessoes' | 'proposicoes' | 'presenca' | 'votacoes',
  filtros?: FiltrosRelatorio
): Promise<void> {
  const blob = await gerarRelatorio(tipo, filtros)
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `relatorio-${tipo}-${new Date().toISOString().slice(0, 10)}.xlsx`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

// ============ RELATORIOS AGENDADOS ============

/**
 * Lista tipos de relatorios disponiveis
 */
export async function listarTiposRelatorio(): Promise<TipoRelatorioApi[]> {
  const response = await fetch(`${BASE_URL_RELATORIOS}/agendados?acao=tipos`)
  return handleResponse(response)
}

/**
 * Lista relatorios agendados
 */
export async function listarRelatoriosAgendados(): Promise<RelatorioAgendadoApi[]> {
  const response = await fetch(`${BASE_URL_RELATORIOS}/agendados`)
  return handleResponse(response)
}

/**
 * Busca relatorio agendado por ID
 */
export async function buscarRelatorioAgendado(
  id: string
): Promise<RelatorioAgendadoApi & { execucoes: ExecucaoRelatorioApi[] }> {
  const response = await fetch(`${BASE_URL_RELATORIOS}/agendados/${id}`)
  return handleResponse(response)
}

/**
 * Cria novo relatorio agendado
 */
export async function criarRelatorioAgendado(
  input: CriarRelatorioAgendadoInput
): Promise<RelatorioAgendadoApi> {
  const response = await fetch(`${BASE_URL_RELATORIOS}/agendados`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  return handleResponse(response)
}

/**
 * Atualiza relatorio agendado
 */
export async function atualizarRelatorioAgendado(
  id: string,
  input: AtualizarRelatorioAgendadoInput
): Promise<RelatorioAgendadoApi> {
  const response = await fetch(`${BASE_URL_RELATORIOS}/agendados/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  return handleResponse(response)
}

/**
 * Remove relatorio agendado
 */
export async function removerRelatorioAgendado(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL_RELATORIOS}/agendados/${id}`, {
    method: 'DELETE'
  })
  await handleResponse(response)
}

/**
 * Executa relatorio agendado manualmente
 */
export async function executarRelatorioAgendado(
  id: string
): Promise<{ execucao: ExecucaoRelatorioApi; dados: any }> {
  const response = await fetch(`${BASE_URL_RELATORIOS}/agendados/${id}?acao=executar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
  return handleResponse(response)
}

/**
 * Lista execucoes de um relatorio
 */
export async function listarExecucoesRelatorio(
  relatorioId: string
): Promise<ExecucaoRelatorioApi[]> {
  const response = await fetch(`${BASE_URL_RELATORIOS}/agendados/${relatorioId}?acao=execucoes`)
  return handleResponse(response)
}

// ============ TIPOS DE RELATORIOS DISPONIVEIS ============

export const TIPOS_RELATORIO = {
  PRODUCAO_LEGISLATIVA: 'producao_legislativa',
  PRESENCA_PARLAMENTAR: 'presenca_parlamentar',
  VOTACOES: 'votacoes',
  TRAMITACAO: 'tramitacao',
  PROTOCOLO: 'protocolo',
  PARTICIPACAO_CIDADA: 'participacao_cidada',
  COMISSOES: 'comissoes'
} as const

export const FREQUENCIAS_RELATORIO = {
  DIARIO: 'DIARIO',
  SEMANAL: 'SEMANAL',
  MENSAL: 'MENSAL',
  SOB_DEMANDA: 'SOB_DEMANDA'
} as const

export const FORMATOS_RELATORIO = {
  PDF: 'PDF',
  EXCEL: 'EXCEL',
  CSV: 'CSV'
} as const
