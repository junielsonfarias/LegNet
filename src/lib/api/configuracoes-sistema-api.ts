import { ApiResponse } from '@/lib/error-handler'

export type SystemConfigType = 'string' | 'number' | 'boolean' | 'json'

export interface SystemConfigApi {
  id: string
  chave: string
  valor: any
  descricao?: string | null
  categoria: string
  tipo: SystemConfigType
  editavel: boolean
  createdAt: string
  updatedAt: string
}

const baseUrl = '/api/configuracoes/sistema'

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.error || 'Erro ao processar requisição')
  }
  const data: ApiResponse<T> = await response.json()
  if (data && 'success' in data && data.success) {
    return data.data
  }
  throw new Error('Resposta inválida do servidor')
}

export const configuracoesSistemaApi = {
  async getAll(params?: { categoria?: string; prefix?: string }): Promise<SystemConfigApi[]> {
    const searchParams = new URLSearchParams()
    if (params?.categoria) searchParams.set('categoria', params.categoria)
    if (params?.prefix) searchParams.set('prefix', params.prefix)

    const query = searchParams.toString()
    const response = await fetch(query ? `${baseUrl}?${query}` : baseUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    })

    return handleResponse<SystemConfigApi[]>(response)
  },

  async update(configuracoes: Array<{ chave: string; valor: any; tipo?: SystemConfigType }>): Promise<SystemConfigApi[]> {
    const response = await fetch(baseUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configuracoes })
    })

    return handleResponse<SystemConfigApi[]>(response)
  }
}

export interface ConfigBackupPayload {
  generatedAt: string
  institucional: any
  sistema: SystemConfigApi[]
}

export const configuracoesBackupApi = {
  async exportar(): Promise<ConfigBackupPayload> {
    const response = await fetch('/api/configuracoes/backup', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    })
    return handleResponse<ConfigBackupPayload>(response)
  },

  async restaurar(payload: { institucional?: any; sistema?: Array<{ chave: string; valor: any; tipo?: SystemConfigType; descricao?: string; categoria?: string; editavel?: boolean }> }): Promise<{ institucional?: any; sistema?: number }> {
    const response = await fetch('/api/configuracoes/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    return handleResponse<{ institucional?: any; sistema?: number }>(response)
  }
}

