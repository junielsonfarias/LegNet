import { ApiResponse } from '@/lib/error-handler'

export interface IntegrationToken {
  id: string
  nome: string
  descricao?: string | null
  permissoes: string[]
  ativo: boolean
  createdAt: string
  updatedAt: string
  lastUsedAt?: string | null
  lastUsedIp?: string | null
  lastUsedAgent?: string | null
}

export interface IntegrationTokenCreate {
  nome: string
  descricao?: string
  permissoes: string[]
  ativo?: boolean
}

export interface IntegrationTokenUpdate extends Partial<IntegrationTokenCreate> {
  rotate?: boolean
}

interface CreateTokenResponse {
  token: IntegrationToken
  plainToken: string
}

interface UpdateTokenResponse {
  token: IntegrationToken
  plainToken?: string
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  const json: ApiResponse<T> = await response.json()
  if (!response.ok || !json.success) {
    const error = json.error || 'Erro ao processar requisição'
    throw new Error(error)
  }
  return json.data
}

export const integrationTokensApi = {
  async getAll(): Promise<IntegrationToken[]> {
    const response = await fetch('/api/integracoes/tokens', {
      method: 'GET',
      cache: 'no-store'
    })

    return handleResponse<IntegrationToken[]>(response)
  },

  async create(payload: IntegrationTokenCreate): Promise<CreateTokenResponse> {
    const response = await fetch('/api/integracoes/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    return handleResponse<CreateTokenResponse>(response)
  },

  async update(id: string, payload: IntegrationTokenUpdate): Promise<UpdateTokenResponse> {
    const response = await fetch(`/api/integracoes/tokens/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    return handleResponse<UpdateTokenResponse>(response)
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/integracoes/tokens/${id}`, {
      method: 'DELETE'
    })

    await handleResponse<null>(response)
  }
}

export type IntegrationTokensApi = typeof integrationTokensApi

