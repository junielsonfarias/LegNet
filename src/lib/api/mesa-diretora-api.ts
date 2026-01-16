import { ApiResponse } from '@/lib/error-handler'

export interface CargoMesaDiretoraApi {
  id: string
  periodoId: string
  nome: string
  ordem: number
  obrigatorio: boolean
  createdAt: string
  updatedAt: string
}

export interface MembroMesaDiretoraApi {
  id: string
  mesaDiretoraId: string
  parlamentarId: string
  cargoId: string
  dataInicio: string
  dataFim: string | null
  ativo: boolean
  observacoes: string | null
  parlamentar?: {
    id: string
    nome: string
    apelido: string | null
  }
  cargo?: {
    id: string
    nome: string
    ordem: number
  }
}

export interface PeriodoLegislaturaApi {
  id: string
  legislaturaId: string
  numero: number
  dataInicio: string
  dataFim: string | null
  descricao: string | null
  legislatura?: {
    id: string
    numero: number
    anoInicio: number
    anoFim: number
  }
}

export interface MesaDiretoraApi {
  id: string
  periodoId: string
  ativa: boolean
  descricao: string | null
  createdAt: string
  updatedAt: string
  periodo?: PeriodoLegislaturaApi
  membros?: MembroMesaDiretoraApi[]
}

export interface MesaDiretoraFilters {
  legislaturaId?: string
  periodoId?: string
  ativa?: boolean
  search?: string
  page?: number
  limit?: number
}

export interface MembroMesaDiretoraCreate {
  parlamentarId: string
  cargoId: string
  dataInicio: string
  dataFim?: string
  ativo?: boolean
  observacoes?: string
}

export interface MesaDiretoraCreate {
  periodoId: string
  ativa?: boolean
  descricao?: string
  membros: MembroMesaDiretoraCreate[]
}

export interface MesaDiretoraUpdate {
  periodoId?: string
  ativa?: boolean
  descricao?: string
  membros?: MembroMesaDiretoraCreate[]
}

class MesaDiretoraApiService {
  private baseUrl = '/api/mesa-diretora'

  private async handleResponse<T>(response: Response): Promise<T> {
    const data: ApiResponse<T> = await response.json()
    
    if (!response.ok || !data.success) {
      const error = data.error || 'Erro ao processar requisição'
      throw new Error(error)
    }
    
    return data.data
  }

  async getAll(filters?: MesaDiretoraFilters): Promise<{ data: MesaDiretoraApi[]; meta?: any }> {
    const params = new URLSearchParams()
    
    if (filters?.legislaturaId) params.append('legislaturaId', filters.legislaturaId)
    if (filters?.periodoId) params.append('periodoId', filters.periodoId)
    if (filters?.ativa !== undefined) params.append('ativa', String(filters.ativa))
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
    
    const responseData: ApiResponse<MesaDiretoraApi[]> = await response.json()
    
    if (!response.ok || !responseData.success) {
      const error = responseData.error || 'Erro ao processar requisição'
      throw new Error(error)
    }
    
    return { 
      data: responseData.data, 
      meta: responseData.meta 
    }
  }

  async getById(id: string): Promise<MesaDiretoraApi> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })
    
    return this.handleResponse<MesaDiretoraApi>(response)
  }

  async create(mesa: MesaDiretoraCreate): Promise<MesaDiretoraApi> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mesa),
    })
    
    return this.handleResponse<MesaDiretoraApi>(response)
  }

  async update(id: string, mesa: MesaDiretoraUpdate): Promise<MesaDiretoraApi> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mesa),
    })
    
    return this.handleResponse<MesaDiretoraApi>(response)
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
      throw new Error(data.error || 'Erro ao excluir mesa diretora')
    }
  }
}

export const mesaDiretoraApi = new MesaDiretoraApiService()

