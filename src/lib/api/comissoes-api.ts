import { ApiResponse } from '@/lib/error-handler'

export interface MembroComissaoApi {
  id: string
  comissaoId: string
  parlamentarId: string
  cargo: 'PRESIDENTE' | 'VICE_PRESIDENTE' | 'RELATOR' | 'MEMBRO'
  dataInicio: string
  dataFim: string | null
  ativo: boolean
  observacoes: string | null
  createdAt: string
  updatedAt?: string
  parlamentar?: {
    id: string
    nome: string
    apelido?: string | null
    partido?: string | null
  }
}

export interface ComissaoApi {
  id: string
  nome: string
  descricao: string | null
  tipo: 'PERMANENTE' | 'TEMPORARIA' | 'ESPECIAL' | 'INQUERITO'
  ativa: boolean
  createdAt: string
  updatedAt: string
  membros?: MembroComissaoApi[]
}

export interface ComissaoCreate {
  nome: string
  descricao?: string
  tipo: 'PERMANENTE' | 'TEMPORARIA' | 'ESPECIAL' | 'INQUERITO'
  ativa?: boolean
}

export interface ComissaoUpdate {
  nome?: string
  descricao?: string
  tipo?: 'PERMANENTE' | 'TEMPORARIA' | 'ESPECIAL' | 'INQUERITO'
  ativa?: boolean
}

export interface MembroComissaoCreate {
  parlamentarId: string
  cargo: 'PRESIDENTE' | 'VICE_PRESIDENTE' | 'RELATOR' | 'MEMBRO'
  dataInicio: string
  dataFim?: string
  ativo?: boolean
  observacoes?: string
}

export interface MembroComissaoUpdate {
  parlamentarId?: string
  cargo?: 'PRESIDENTE' | 'VICE_PRESIDENTE' | 'RELATOR' | 'MEMBRO'
  dataInicio?: string
  dataFim?: string | null
  ativo?: boolean
  observacoes?: string
}

class ComissoesApiService {
  private baseUrl = '/api/comissoes'

  private async handleResponse<T>(response: Response): Promise<T> {
    const data: ApiResponse<T> = await response.json()

    if (!response.ok || !data.success) {
      const error = (data as any).error || 'Erro ao processar requisição'
      throw new Error(error)
    }

    return data.data
  }

  async getAll(filters?: { ativa?: boolean }): Promise<ComissaoApi[]> {
    const params = new URLSearchParams()
    
    if (filters?.ativa !== undefined) params.append('ativa', String(filters.ativa))
    
    const url = `${this.baseUrl}${params.toString() ? `?${params.toString()}` : ''}`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })
    
    return this.handleResponse<ComissaoApi[]>(response)
  }

  async getById(id: string): Promise<ComissaoApi> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })
    
    return this.handleResponse<ComissaoApi>(response)
  }

  async create(comissao: ComissaoCreate): Promise<ComissaoApi> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(comissao),
    })
    
    return this.handleResponse<ComissaoApi>(response)
  }

  async update(id: string, comissao: ComissaoUpdate): Promise<ComissaoApi> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(comissao),
    })
    
    return this.handleResponse<ComissaoApi>(response)
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
      throw new Error((data as any).error || 'Erro ao excluir comissão')
    }
  }

  async addMember(comissaoId: string, membro: MembroComissaoCreate): Promise<MembroComissaoApi> {
    const response = await fetch(`${this.baseUrl}/${comissaoId}/membros`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(membro)
    })

    return this.handleResponse<MembroComissaoApi>(response)
  }

  async updateMember(comissaoId: string, membroId: string, membro: MembroComissaoUpdate): Promise<MembroComissaoApi> {
    const response = await fetch(`${this.baseUrl}/${comissaoId}/membros/${membroId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(membro)
    })

    return this.handleResponse<MembroComissaoApi>(response)
  }

  async removeMember(comissaoId: string, membroId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${comissaoId}/membros/${membroId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const data: ApiResponse<any> = await response.json()
      throw new Error((data as any).error || 'Erro ao remover membro da comissão')
    }
  }
}

export const comissoesApi = new ComissoesApiService()

