import { ApiResponse } from '@/lib/error-handler'

export interface ProposicaoApi {
  id: string
  slug?: string | null // URL amigável (ex: pl-0022-2025)
  numero: string
  ano: number
  tipo: 'PROJETO_LEI' | 'PROJETO_RESOLUCAO' | 'PROJETO_DECRETO' | 'INDICACAO' | 'REQUERIMENTO' | 'MOCAO' | 'VOTO_PESAR' | 'VOTO_APLAUSO'
  titulo: string
  ementa: string
  texto: string | null
  urlDocumento: string | null // URL externa do documento (Google Drive, etc)
  status: 'APRESENTADA' | 'EM_TRAMITACAO' | 'AGUARDANDO_PAUTA' | 'EM_PAUTA' | 'EM_DISCUSSAO' | 'EM_VOTACAO' | 'APROVADA' | 'REJEITADA' | 'ARQUIVADA' | 'VETADA' | 'SANCIONADA' | 'PROMULGADA'
  dataApresentacao: string
  dataVotacao: string | null
  resultado: 'APROVADA' | 'REJEITADA' | 'EMPATE' | null
  sessaoId: string | null
  autorId: string
  createdAt: string
  updatedAt: string
  autor?: {
    id: string
    nome: string
    apelido: string | null
    partido: string | null
  }
  sessao?: {
    id: string
    numero: number
    data: string
  } | null
}

export interface ProposicaoFilters {
  status?: string
  tipo?: string
  autorId?: string
  ano?: number
  page?: number
  limit?: number
}

export interface ProposicaoCreate {
  numero: string
  ano: number
  tipo: 'PROJETO_LEI' | 'PROJETO_RESOLUCAO' | 'PROJETO_DECRETO' | 'INDICACAO' | 'REQUERIMENTO' | 'MOCAO' | 'VOTO_PESAR' | 'VOTO_APLAUSO'
  titulo: string
  ementa: string
  texto?: string
  urlDocumento?: string // URL externa do documento (Google Drive, etc)
  status?: 'APRESENTADA' | 'EM_TRAMITACAO' | 'AGUARDANDO_PAUTA' | 'EM_PAUTA' | 'EM_DISCUSSAO' | 'EM_VOTACAO' | 'APROVADA' | 'REJEITADA' | 'ARQUIVADA' | 'VETADA' | 'SANCIONADA' | 'PROMULGADA'
  dataApresentacao: string
  dataVotacao?: string
  resultado?: 'APROVADA' | 'REJEITADA' | 'EMPATE'
  sessaoId?: string
  autorId: string
}

export interface ProposicaoUpdate {
  numero?: string
  ano?: number
  tipo?: 'PROJETO_LEI' | 'PROJETO_RESOLUCAO' | 'PROJETO_DECRETO' | 'INDICACAO' | 'REQUERIMENTO' | 'MOCAO' | 'VOTO_PESAR' | 'VOTO_APLAUSO'
  titulo?: string
  ementa?: string
  texto?: string
  urlDocumento?: string // URL externa do documento (Google Drive, etc)
  status?: 'APRESENTADA' | 'EM_TRAMITACAO' | 'AGUARDANDO_PAUTA' | 'EM_PAUTA' | 'EM_DISCUSSAO' | 'EM_VOTACAO' | 'APROVADA' | 'REJEITADA' | 'ARQUIVADA' | 'VETADA' | 'SANCIONADA' | 'PROMULGADA'
  dataApresentacao?: string
  dataVotacao?: string
  resultado?: 'APROVADA' | 'REJEITADA' | 'EMPATE'
  sessaoId?: string
  autorId?: string
}

class ProposicoesApiService {
  private baseUrl = '/api/proposicoes'

  private async handleResponse<T>(response: Response): Promise<T> {
    const data: ApiResponse<T> = await response.json()
    
    if (!response.ok || !data.success) {
      const error = data.error || 'Erro ao processar requisição'
      throw new Error(error)
    }
    
    return data.data
  }

  async getAll(filters?: ProposicaoFilters): Promise<{ data: ProposicaoApi[]; meta?: any }> {
    const params = new URLSearchParams()
    
    if (filters?.status) params.append('status', filters.status)
    if (filters?.tipo) params.append('tipo', filters.tipo)
    if (filters?.autorId) params.append('autorId', filters.autorId)
    if (filters?.ano) params.append('ano', String(filters.ano))
    if (filters?.page) params.append('page', String(filters.page))
    if (filters?.limit) params.append('limit', String(filters.limit))
    
    const url = `${this.baseUrl}${params.toString() ? `?${params.toString()}` : ''}`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })
    
    const responseData: ApiResponse<ProposicaoApi[]> = await response.json()
    
    if (!response.ok || !responseData.success) {
      const error = responseData.error || 'Erro ao processar requisição'
      throw new Error(error)
    }
    
    return { 
      data: responseData.data, 
      meta: responseData.meta 
    }
  }

  async getById(id: string): Promise<ProposicaoApi> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })
    
    return this.handleResponse<ProposicaoApi>(response)
  }

  async create(proposicao: ProposicaoCreate): Promise<ProposicaoApi> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(proposicao),
    })
    
    return this.handleResponse<ProposicaoApi>(response)
  }

  async update(id: string, proposicao: ProposicaoUpdate): Promise<ProposicaoApi> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(proposicao),
    })
    
    return this.handleResponse<ProposicaoApi>(response)
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      const data: ApiResponse<any> = await response.json()
      throw new Error(data.error || 'Erro ao excluir proposição')
    }
  }
}

export const proposicoesApi = new ProposicoesApiService()

