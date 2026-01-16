import { ApiResponse } from '@/lib/error-handler'

export interface MandatoApi {
  id: string
  parlamentarId: string
  legislaturaId: string
  numeroVotos: number
  cargo: 'PRESIDENTE' | 'VICE_PRESIDENTE' | 'PRIMEIRO_SECRETARIO' | 'SEGUNDO_SECRETARIO' | 'VEREADOR'
  dataInicio: string
  dataFim: string | null
  ativo: boolean
  legislatura?: {
    id: string
    numero: number
    anoInicio: number
    anoFim: number
    ativa: boolean
  }
}

export interface FiliacaoApi {
  id: string
  parlamentarId: string
  partido: string
  dataInicio: string
  dataFim: string | null
  ativa: boolean
}

export interface ParlamentarApi {
  id: string
  nome: string
  apelido: string | null
  email: string | null
  telefone: string | null
  partido: string | null
  biografia: string | null
  foto: string | null
  cargo: 'PRESIDENTE' | 'VICE_PRESIDENTE' | 'PRIMEIRO_SECRETARIO' | 'SEGUNDO_SECRETARIO' | 'VEREADOR'
  legislatura: string
  ativo: boolean
  createdAt: string
  updatedAt: string
  mandatos?: MandatoApi[]
  filiacoes?: FiliacaoApi[]
}

export type ParticipacaoTipoApi = 'MESA_DIRETORA' | 'COMISSAO'

export interface HistoricoParticipacaoApi {
  id: string
  tipo: ParticipacaoTipoApi
  referenciaId: string
  referenciaNome: string | null
  cargoId: string | null
  cargoNome: string
  legislatura: {
    id: string
    numero?: number
    descricao?: string | null
  } | null
  periodo: {
    id: string
    numero?: number
    dataInicio?: string
    dataFim?: string | null
  } | null
  comissao: {
    id: string
    nome: string
    tipo: 'PERMANENTE' | 'TEMPORARIA' | 'ESPECIAL' | 'INQUERITO'
  } | null
  dataInicio: string
  dataFim: string | null
  ativo: boolean
  observacoes: string | null
  origem: string | null
}

export interface ParlamentarFilters {
  ativo?: boolean
  cargo?: string
  partido?: string
  search?: string
  page?: number
  limit?: number
}

export interface MandatoCreate {
  legislaturaId: string
  numeroVotos: number
  cargo: 'PRESIDENTE' | 'VICE_PRESIDENTE' | 'PRIMEIRO_SECRETARIO' | 'SEGUNDO_SECRETARIO' | 'VEREADOR'
  dataInicio: string
  dataFim?: string
}

export interface FiliacaoCreate {
  partido: string
  dataInicio: string
  dataFim?: string
}

export interface ParlamentarCreate {
  nome: string
  apelido: string
  cargo: 'PRESIDENTE' | 'VICE_PRESIDENTE' | 'PRIMEIRO_SECRETARIO' | 'SEGUNDO_SECRETARIO' | 'VEREADOR'
  partido?: string
  legislatura: string
  email?: string
  telefone?: string
  biografia?: string
  ativo?: boolean
  mandatos?: MandatoCreate[]
  filiacoes?: FiliacaoCreate[]
}

export interface ParlamentarUpdate {
  nome?: string
  apelido?: string
  cargo?: 'PRESIDENTE' | 'VICE_PRESIDENTE' | 'PRIMEIRO_SECRETARIO' | 'SEGUNDO_SECRETARIO' | 'VEREADOR'
  partido?: string
  legislatura?: string
  email?: string
  telefone?: string
  biografia?: string
  ativo?: boolean
  mandatos?: MandatoCreate[]
  filiacoes?: FiliacaoCreate[]
}

class ParlamentaresApiService {
  private baseUrl = '/api/parlamentares'

  private async handleResponse<T>(response: Response): Promise<T> {
    const data: ApiResponse<T> = await response.json()
    
    if (!response.ok || !data.success) {
      const error = data.error || 'Erro ao processar requisição'
      throw new Error(error)
    }
    
    return data.data
  }

  async getAll(filters?: ParlamentarFilters): Promise<{ data: ParlamentarApi[]; meta?: any }> {
    const params = new URLSearchParams()
    
    if (filters?.ativo !== undefined) params.append('ativo', String(filters.ativo))
    if (filters?.cargo) params.append('cargo', filters.cargo)
    if (filters?.partido) params.append('partido', filters.partido)
    if (filters?.search) params.append('search', filters.search)
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
    
    const responseData: ApiResponse<ParlamentarApi[]> = await response.json()
    
    if (!response.ok || !responseData.success) {
      const error = responseData.error || 'Erro ao processar requisição'
      throw new Error(error)
    }
    
    return { 
      data: responseData.data, 
      meta: responseData.meta 
    }
  }

  async getById(id: string): Promise<ParlamentarApi> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })
    
    return this.handleResponse<ParlamentarApi>(response)
  }

  async getHistorico(id: string): Promise<HistoricoParticipacaoApi[]> {
    const response = await fetch(`${this.baseUrl}/${id}/historico`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    return this.handleResponse<HistoricoParticipacaoApi[]>(response)
  }

  async create(parlamentar: ParlamentarCreate): Promise<ParlamentarApi> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parlamentar),
    })
    
    return this.handleResponse<ParlamentarApi>(response)
  }

  async update(id: string, parlamentar: ParlamentarUpdate): Promise<ParlamentarApi> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parlamentar),
    })
    
    return this.handleResponse<ParlamentarApi>(response)
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
      throw new Error(data.error || 'Erro ao excluir parlamentar')
    }
  }
}

export const parlamentaresApi = new ParlamentaresApiService()

