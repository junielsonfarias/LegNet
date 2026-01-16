import { ApiResponse } from '@/lib/error-handler'

export interface LegislaturaApi {
  id: string
  numero: number
  anoInicio: number
  anoFim: number
  ativa: boolean
  descricao: string | null
  createdAt: string
  updatedAt: string
}

export interface LegislaturaFilters {
  ativa?: boolean
  search?: string
  page?: number
  limit?: number
}

export interface LegislaturaCreate {
  numero: number
  anoInicio: number
  anoFim: number
  ativa?: boolean
  descricao?: string
}

export interface LegislaturaUpdate {
  numero?: number
  anoInicio?: number
  anoFim?: number
  ativa?: boolean
  descricao?: string
}

class LegislaturasApiService {
  private baseUrl = '/api/legislaturas'

  private async handleResponse<T>(response: Response): Promise<T> {
    const data: ApiResponse<T> = await response.json()
    
    if (!response.ok || !data.success) {
      const error = data.error || 'Erro ao processar requisição'
      throw new Error(error)
    }
    
    return data.data
  }

  async getAll(filters?: LegislaturaFilters): Promise<{ data: LegislaturaApi[]; meta?: any }> {
    const params = new URLSearchParams()
    
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
    
    const responseData: ApiResponse<LegislaturaApi[]> = await response.json()
    
    if (!response.ok || !responseData.success) {
      const error = responseData.error || 'Erro ao processar requisição'
      throw new Error(error)
    }
    
    return { 
      data: responseData.data, 
      meta: responseData.meta 
    }
  }

  async getById(id: string): Promise<LegislaturaApi> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })
    
    return this.handleResponse<LegislaturaApi>(response)
  }

  async create(legislatura: LegislaturaCreate): Promise<LegislaturaApi> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(legislatura),
    })
    
    return this.handleResponse<LegislaturaApi>(response)
  }

  async update(id: string, legislatura: LegislaturaUpdate): Promise<LegislaturaApi> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(legislatura),
    })
    
    return this.handleResponse<LegislaturaApi>(response)
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
      throw new Error(data.error || 'Erro ao excluir legislatura')
    }
  }
}

export const legislaturasApi = new LegislaturasApiService()

