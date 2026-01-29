import { ApiResponse } from '@/lib/error-handler'

export interface PautaItemApi {
  id: string
  pautaId: string
  secao: string
  ordem: number
  titulo: string
  descricao?: string | null
  proposicaoId?: string | null
  tempoEstimado?: number | null
  tempoReal?: number | null
  tempoAcumulado?: number
  status: string
  tipoAcao?: 'LEITURA' | 'DISCUSSAO' | 'VOTACAO' | 'COMUNICADO' | 'HOMENAGEM' | null
  autor?: string | null
  observacoes?: string | null
  iniciadoEm?: string | null
  finalizadoEm?: string | null
  tipoVotacao?: 'NOMINAL' | 'SECRETA' | 'SIMBOLICA' | 'LEITURA' | null

  // === CAMPOS DE TURNO (SAPL) ===
  turnoAtual?: number
  turnoFinal?: number | null
  resultadoTurno1?: string | null
  resultadoTurno2?: string | null
  dataVotacaoTurno1?: string | null
  dataVotacaoTurno2?: string | null
  intersticio?: boolean
  dataIntersticio?: string | null
  prazoIntersticio?: string | null

  createdAt: string
  updatedAt: string
  proposicao?: {
    id: string
    numero: string
    ano: number
    titulo: string
    ementa?: string | null
    tipo: string
    status: string
  } | null
}

export interface PautaSessaoApi {
  id: string
  sessaoId: string
  status: string
  geradaAutomaticamente: boolean
  observacoes?: string | null
  tempoTotalEstimado: number
  tempoTotalReal?: number | null
  itemAtualId?: string | null
  itemAtual?: PautaItemApi | null
  createdAt: string
  updatedAt: string
  itens: PautaItemApi[]
}

export interface PautaSugestaoApi {
  id: string
  titulo: string
  descricao?: string | null
  secao: 'EXPEDIENTE' | 'ORDEM_DO_DIA' | 'COMUNICACOES' | 'HONRAS' | 'OUTROS'
  tipoAcao?: 'LEITURA' | 'DISCUSSAO' | 'VOTACAO' | 'COMUNICADO' | 'HOMENAGEM' | null
  tempoEstimado?: number | null
  prioridade: 'ALTA' | 'MEDIA' | 'BAIXA'
  tipoProposicao?: string | null
  requisitos?: {
    requerParecerCLJ: boolean
    temParecerCLJ: boolean
    podeOrdemDoDia: boolean
    totalPareceres: number
  } | null
  proposicao?: {
    id: string
    numero: string
    ano: number
    titulo: string
    tipo: string
    status: string
    autor?: {
      id: string
      nome: string
      apelido?: string | null
      partido?: string | null
    } | null
  } | null
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  const json: ApiResponse<T> = await response.json()
  if ('success' in json && json.success) {
    return json.data
  }
  throw new Error(json && 'error' in json ? (json as any).error : 'Erro inesperado na API de pauta')
}

export const pautaApi = {
  async getBySessao(sessaoId: string): Promise<PautaSessaoApi> {
    const response = await fetch(`/api/sessoes/${sessaoId}/pauta`, {
      method: 'GET',
      cache: 'no-store'
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error?.error || 'Erro ao carregar pauta da sessão')
    }

    return handleResponse<PautaSessaoApi>(response)
  },

  async createItem(sessaoId: string, payload: Partial<PautaItemApi> & { secao: string; titulo: string }): Promise<PautaSessaoApi> {
    const response = await fetch(`/api/sessoes/${sessaoId}/pauta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error?.error || 'Erro ao adicionar item à pauta')
    }

    return handleResponse<PautaSessaoApi>(response)
  },

  async updateItem(itemId: string, payload: Partial<PautaItemApi>): Promise<PautaItemApi> {
    const response = await fetch(`/api/pauta/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error?.error || 'Erro ao atualizar item da pauta')
    }

    return handleResponse<PautaItemApi>(response)
  },

  async removeItem(itemId: string): Promise<void> {
    const response = await fetch(`/api/pauta/${itemId}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error?.error || 'Erro ao remover item da pauta')
    }
  },

  async getSuggestions(sessaoId: string): Promise<PautaSugestaoApi[]> {
    const response = await fetch(`/api/sessoes/${sessaoId}/pauta/sugestoes`, {
      method: 'GET',
      cache: 'no-store'
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error?.error || 'Erro ao carregar sugestões de pauta')
    }

    return handleResponse<PautaSugestaoApi[]>(response)
  },

  // ==================== AÇÕES DE TURNO ====================

  /**
   * Inicia turno de votação para um item
   * Configura campos de turno baseado no tipo da proposição
   */
  async iniciarTurno(sessaoId: string, itemId: string): Promise<{
    item: PautaItemApi
    configuracao: {
      totalTurnos: number
      tipoQuorum: string
      descricao: string
    }
  }> {
    const response = await fetch(`/api/sessoes/${sessaoId}/pauta/${itemId}/controle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'iniciar-turno' })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error?.error || 'Erro ao iniciar turno de votação')
    }

    return handleResponse(response)
  },

  /**
   * Finaliza turno de votação e registra resultado
   */
  async finalizarTurno(sessaoId: string, itemId: string, resultado: 'APROVADO' | 'REJEITADO'): Promise<{
    item: PautaItemApi
    resultado: {
      proximoTurno: boolean
      mensagem: string
      prazoIntersticio?: string
    }
    votos: {
      sim: number
      nao: number
      abstencao: number
      total: number
    }
  }> {
    const response = await fetch(`/api/sessoes/${sessaoId}/pauta/${itemId}/controle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'finalizar-turno', resultado })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error?.error || 'Erro ao finalizar turno de votação')
    }

    return handleResponse(response)
  },

  /**
   * Verifica se interstício foi cumprido para segundo turno
   */
  async verificarIntersticio(sessaoId: string, itemId: string): Promise<{
    pode: boolean
    motivo: string
    prazoIntersticio?: string
    horasRestantes?: number
  }> {
    const response = await fetch(`/api/sessoes/${sessaoId}/pauta/${itemId}/controle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'verificar-intersticio' })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error?.error || 'Erro ao verificar interstício')
    }

    return handleResponse(response)
  },

  /**
   * Inicia segundo turno de votação após interstício
   */
  async iniciarSegundoTurno(sessaoId: string, itemId: string): Promise<PautaItemApi> {
    const response = await fetch(`/api/sessoes/${sessaoId}/pauta/${itemId}/controle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'segundo-turno' })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error?.error || 'Erro ao iniciar segundo turno')
    }

    return handleResponse(response)
  },

  /**
   * Lista itens em interstício aguardando segundo turno
   */
  async listarItensEmIntersticio(sessaoId: string, itemId: string): Promise<Array<{
    id: string
    titulo: string
    prazoIntersticio: string
    podeProsseguir: boolean
  }>> {
    const response = await fetch(`/api/sessoes/${sessaoId}/pauta/${itemId}/controle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'listar-intersticio' })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error?.error || 'Erro ao listar itens em interstício')
    }

    return handleResponse(response)
  }
}

