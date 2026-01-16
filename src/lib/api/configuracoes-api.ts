import { ApiResponse } from '@/lib/error-handler'

export interface ConfiguracaoInstitucionalApi {
  id: string
  slug: string
  nomeCasa: string
  sigla?: string | null
  cnpj?: string | null
  enderecoLogradouro?: string | null
  enderecoNumero?: string | null
  enderecoBairro?: string | null
  enderecoCidade?: string | null
  enderecoEstado?: string | null
  enderecoCep?: string | null
  telefone?: string | null
  email?: string | null
  site?: string | null
  logoUrl?: string | null
  tema?: 'claro' | 'escuro' | 'auto' | null
  timezone?: string | null
  descricao?: string | null
  createdAt: string
  updatedAt: string
}

const baseUrl = '/api/configuracoes'

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData?.error || 'Erro ao processar requisição')
  }

  const data: ApiResponse<T> = await response.json()
  if ('success' in data && data.success) {
    return data.data
  }

  throw new Error('Resposta inválida do servidor')
}

export const configuracoesApi = {
  async get(): Promise<ConfiguracaoInstitucionalApi> {
    const response = await fetch(baseUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    return handleResponse<ConfiguracaoInstitucionalApi>(response)
  },

  async update(data: Partial<ConfiguracaoInstitucionalApi>): Promise<ConfiguracaoInstitucionalApi> {
    const response = await fetch(baseUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    return handleResponse<ConfiguracaoInstitucionalApi>(response)
  }
}

