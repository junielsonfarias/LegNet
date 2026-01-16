import { ApiResponse } from '@/lib/error-handler'
import type { PautaSessaoApi, PautaItemApi } from '@/lib/api/pauta-api'

export interface SessaoApi {
  id: string
  numero: number
  tipo: 'ORDINARIA' | 'EXTRAORDINARIA' | 'SOLENE' | 'ESPECIAL'
  data: string
  horario?: string | null
  local?: string | null
  status: 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'
  descricao: string | null
  ata: string | null
  finalizada: boolean
  legislaturaId?: string | null
  periodoId?: string | null
  pauta?: string | null
  tempoInicio?: string | null
  createdAt: string
  updatedAt: string
  pautaSessao?: PautaSessaoApi | null
  legislatura?: {
    id: string
    numero: number
    anoInicio: number
    anoFim: number
  }
  periodo?: {
    id: string
    numero: number
    dataInicio: string
    dataFim: string | null
  }
}

export interface SessaoFilters {
  status?: string
  tipo?: string
  page?: number
  limit?: number
}

export interface SessaoCreate {
  numero?: number // Opcional - será calculado automaticamente se não fornecido
  tipo: 'ORDINARIA' | 'EXTRAORDINARIA' | 'SOLENE' | 'ESPECIAL'
  data: string
  horario?: string
  local?: string
  status?: 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'
  descricao?: string
  ata?: string
  finalizada?: boolean
  legislaturaId?: string // Opcional - será identificada automaticamente se não fornecido
  periodoId?: string // Opcional - será identificado automaticamente se não fornecido
  pauta?: string // JSON da pauta
  tempoInicio?: string // Data/hora real em que a sessão foi iniciada
}

export interface SessaoUpdate {
  numero?: number
  tipo?: 'ORDINARIA' | 'EXTRAORDINARIA' | 'SOLENE' | 'ESPECIAL'
  data?: string
  horario?: string
  local?: string
  status?: 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'
  descricao?: string
  ata?: string
  finalizada?: boolean
  legislaturaId?: string
  periodoId?: string
  pauta?: string
  tempoInicio?: string
}

class SessoesApiService {
  private baseUrl = '/api/sessoes'

  private async handleResponse<T>(response: Response): Promise<T> {
    console.log('📥 handleResponse - Status:', response.status, response.statusText)
    
    let data: ApiResponse<T>
    try {
      data = await response.json()
      console.log('📦 handleResponse - Dados parseados:', {
        success: data.success,
        hasData: !!data.data,
        error: data.error,
        details: (data as any).details
      })
    } catch (error) {
      console.error('❌ Erro ao parsear JSON da resposta:', error)
      const text = await response.text()
      console.error('❌ Resposta como texto:', text)
      throw new Error('Resposta inválida do servidor')
    }
    
    if (!response.ok || !data.success) {
      const error = data.error || 'Erro ao processar requisição'
      const details = (data as any).details
      console.error('❌ Erro na resposta:', {
        error,
        details,
        status: response.status
      })
      throw new Error(details ? `${error}: ${JSON.stringify(details)}` : error)
    }
    
    console.log('✅ handleResponse - Sucesso, retornando dados')
    return data.data
  }

  async getAll(filters?: SessaoFilters): Promise<{ data: SessaoApi[]; meta?: any }> {
    const params = new URLSearchParams()
    
    if (filters?.status) params.append('status', filters.status)
    if (filters?.tipo) params.append('tipo', filters.tipo)
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
    
    const responseData: ApiResponse<SessaoApi[]> = await response.json()
    
    if (!response.ok || !responseData.success) {
      const error = responseData.error || 'Erro ao processar requisição'
      throw new Error(error)
    }
    
    return { 
      data: responseData.data, 
      meta: responseData.meta 
    }
  }

  async getById(id: string): Promise<SessaoApi> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })
    
    return this.handleResponse<SessaoApi>(response)
  }

  async create(sessao: SessaoCreate): Promise<SessaoApi> {
    console.log('📤 sessoesApi.create chamado com:', sessao)
    console.log('📤 URL:', this.baseUrl)
    console.log('📤 Body stringified:', JSON.stringify(sessao))
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessao),
      })
      
      console.log('📥 Resposta recebida:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })
      
      // Sempre tentar processar a resposta, mesmo se não for ok
      const result = await this.handleResponse<SessaoApi>(response)
      console.log('✅ Sessão criada via API:', result)
      return result
    } catch (error) {
      console.error('❌ Erro ao criar sessão na API:', error)
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A')
      throw error
    }
  }

  async update(id: string, sessao: SessaoUpdate): Promise<SessaoApi> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessao),
    })
    
    return this.handleResponse<SessaoApi>(response)
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
      throw new Error(data.error || 'Erro ao excluir sessão')
    }
  }

  async control(id: string, acao: 'iniciar' | 'finalizar' | 'cancelar'): Promise<SessaoApi> {
    const response = await fetch(`${this.baseUrl}/${id}/controle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ acao })
    })

    return this.handleResponse<SessaoApi>(response)
  }

  async controlItem(
    sessaoId: string,
    itemId: string,
    acao: 'iniciar' | 'pausar' | 'retomar' | 'votacao' | 'finalizar',
    resultado?: 'CONCLUIDO' | 'APROVADO' | 'REJEITADO' | 'RETIRADO' | 'ADIADO'
  ): Promise<PautaItemApi> {
    const response = await fetch(`${this.baseUrl}/${sessaoId}/pauta/${itemId}/controle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ acao, resultado })
    })

    return this.handleResponse<PautaItemApi>(response)
  }
}

export const sessoesApi = new SessoesApiService()

