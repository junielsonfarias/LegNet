import { ApiResponse } from '@/lib/error-handler'

export type TramitacaoStatus = 'RECEBIDA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'
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
  parecer?: string | null
  resultado?: string | null
}

export interface TramitacaoReopenPayload {
  observacoes?: string | null
}

export interface TramitacaoFinalizePayload {
  observacoes?: string | null
  resultado?: TramitacaoResultado | null
}

export interface TramitacaoAdvanceResponse {
  etapaFinalizada: TramitacaoApi | null
  novaEtapa?: TramitacaoApi | null
  historicos: TramitacaoHistoricoApi[]
  notificacoes: TramitacaoNotificacaoApi[]
  regraAplicada?: TramitacaoRegraApi | null
  etapaDestino?: TramitacaoRegraEtapaApi | null
  etapaFinal?: boolean
  proposicaoStatus?: string
}

class TramitacoesApiService {
  private baseUrl = '/api/tramitacoes'

  private async handleResponse<T>(response: Response): Promise<T> {
    const data: ApiResponse<T> = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erro ao processar requisição')
    }

    return data.data
  }

  async list(filters?: TramitacaoFilters): Promise<{ data: TramitacaoApi[]; meta?: { total?: number; page?: number; limit?: number; totalPages?: number }; total?: number }> {
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
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    })

    const responseData: ApiResponse<TramitacaoApi[]> = await response.json()

    if (!response.ok || !responseData.success) {
      throw new Error(responseData.error || 'Erro ao carregar tramitações')
    }

    return {
      data: responseData.data,
      meta: responseData.meta,
      total: responseData.total ?? responseData.meta?.total
    }
  }

  async getById(id: string): Promise<TramitacaoApi> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    })
    return this.handleResponse<TramitacaoApi>(response)
  }

  async create(payload: TramitacaoCreate): Promise<TramitacaoApi> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    return this.handleResponse<TramitacaoApi>(response)
  }

  async update(id: string, payload: TramitacaoUpdate): Promise<TramitacaoApi> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    return this.handleResponse<TramitacaoApi>(response)
  }

  async advance(proposicaoId: string, payload: TramitacaoAdvancePayload = {}): Promise<TramitacaoAdvanceResponse> {
    const response = await fetch(`/api/proposicoes/${proposicaoId}/tramitar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acao: 'AVANCAR_ETAPA',
        observacoes: payload.comentario ?? undefined,
        parecer: payload.parecer ?? undefined,
        resultado: payload.resultado ?? undefined
      })
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erro ao avançar tramitação')
    }

    return {
      etapaFinalizada: data.data.tramitacaoAnterior ? {
        id: data.data.tramitacaoAnterior.id,
        etapa: data.data.tramitacaoAnterior.etapa,
        status: 'CONCLUIDA'
      } as any : null,
      novaEtapa: data.data.tramitacaoNova ? {
        id: data.data.tramitacaoNova.id,
        etapa: data.data.tramitacaoNova.etapa
      } as any : null,
      historicos: [],
      notificacoes: [],
      regraAplicada: null,
      etapaDestino: null,
      etapaFinal: data.data.etapaFinal,
      proposicaoStatus: data.data.proposicaoStatus
    }
  }

  async reopen(id: string, payload: TramitacaoReopenPayload = {}): Promise<TramitacaoApi> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'reopen',
        observacoes: payload.observacoes ?? undefined
      })
    })
    return this.handleResponse<TramitacaoApi>(response)
  }

  async finalize(id: string, payload: TramitacaoFinalizePayload = {}): Promise<TramitacaoApi> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'finalize',
        observacoes: payload.observacoes ?? undefined,
        resultado: payload.resultado ?? null
      })
    })
    return this.handleResponse<TramitacaoApi>(response)
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      const data: ApiResponse<unknown> = await response.json()
      throw new Error(data.error || 'Erro ao remover tramitação')
    }
  }

  async getDashboard(): Promise<TramitacaoDashboardApi> {
    const response = await fetch(`${this.baseUrl}/dashboard`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    })
    return this.handleResponse<TramitacaoDashboardApi>(response)
  }

  async sendToAgenda(proposicaoId: string, observacoes?: string): Promise<{
    proposicaoId: string
    tramitacaoId?: string
    proposicaoStatus: string
    warnings?: string[]
  }> {
    const response = await fetch(`/api/proposicoes/${proposicaoId}/tramitar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acao: 'AGUARDANDO_PAUTA',
        observacoes
      })
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erro ao enviar proposição para pauta')
    }

    return data.data
  }
}

class TramitacaoRegrasApiService {
  private baseUrl = '/api/tramitacoes/regras'

  private async handleResponse<T>(response: Response): Promise<T> {
    const data: ApiResponse<T> = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erro ao processar requisição')
    }

    return data.data
  }

  async list(filters?: { ativo?: boolean }): Promise<TramitacaoRegraApi[]> {
    const params = new URLSearchParams()
    if (filters?.ativo !== undefined) params.append('ativo', String(filters.ativo))

    const url = `${this.baseUrl}${params.toString() ? `?${params.toString()}` : ''}`
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    })
    return this.handleResponse<TramitacaoRegraApi[]>(response)
  }

  async getById(id: string): Promise<TramitacaoRegraApi> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    })
    return this.handleResponse<TramitacaoRegraApi>(response)
  }

  async create(payload: TramitacaoRegraPayload): Promise<TramitacaoRegraApi> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    return this.handleResponse<TramitacaoRegraApi>(response)
  }

  async update(id: string, payload: TramitacaoRegraPayload): Promise<TramitacaoRegraApi> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    return this.handleResponse<TramitacaoRegraApi>(response)
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      const data: ApiResponse<unknown> = await response.json()
      throw new Error(data.error || 'Erro ao remover regra de tramitação')
    }
  }
}

export const tramitacoesApi = new TramitacoesApiService()
export const tramitacaoRegrasApi = new TramitacaoRegrasApiService()
