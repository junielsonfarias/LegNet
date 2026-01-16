import { ApiResponse } from '@/lib/error-handler'
import type { PautaSessaoApi } from '@/lib/api/pauta-api'

export interface TemplateItemApi {
  id: string
  templateId: string
  secao: 'EXPEDIENTE' | 'ORDEM_DO_DIA' | 'COMUNICACOES' | 'HONRAS' | 'OUTROS'
  ordem: number
  titulo: string
  descricao?: string | null
  tempoEstimado?: number | null
  tipoProposicao?: string | null
  obrigatorio: boolean
  createdAt: string
  updatedAt: string
}

export interface TemplateSessaoApi {
  id: string
  nome: string
  descricao?: string | null
  tipo: 'ORDINARIA' | 'EXTRAORDINARIA' | 'SOLENE' | 'ESPECIAL'
  ativo: boolean
  duracaoEstimativa?: number | null
  createdAt: string
  updatedAt: string
  itens: TemplateItemApi[]
}

export interface TemplateSessaoCreate {
  nome: string
  descricao?: string
  tipo: 'ORDINARIA' | 'EXTRAORDINARIA' | 'SOLENE' | 'ESPECIAL'
  ativo?: boolean
  duracaoEstimativa?: number
  itens: Array<{
    secao: TemplateItemApi['secao']
    ordem?: number
    titulo: string
    descricao?: string
    tempoEstimado?: number
    tipoProposicao?: string
    obrigatorio?: boolean
  }>
}

export interface TemplateSessaoUpdate extends Partial<TemplateSessaoCreate> {}

const handleResponse = async <T>(response: Response): Promise<T> => {
  const json: ApiResponse<T> = await response.json()
  if (!response.ok || !json.success) {
    const error = json.error || 'Erro ao processar requisição'
    throw new Error(error)
  }
  return json.data
}

export const templatesSessaoApi = {
  async getAll(params?: { tipo?: string; ativo?: boolean; includeItems?: boolean }): Promise<TemplateSessaoApi[]> {
    const search = new URLSearchParams()
    if (params?.tipo) search.append('tipo', params.tipo)
    if (params?.ativo !== undefined) search.append('ativo', String(params.ativo))
    if (params?.includeItems) search.append('includeItems', 'true')

    const response = await fetch(`/api/templates-sessao${search.toString() ? `?${search.toString()}` : ''}`, {
      method: 'GET',
      cache: 'no-store'
    })

    return handleResponse<TemplateSessaoApi[]>(response)
  },

  async getById(id: string): Promise<TemplateSessaoApi> {
    const response = await fetch(`/api/templates-sessao/${id}`, {
      method: 'GET',
      cache: 'no-store'
    })

    return handleResponse<TemplateSessaoApi>(response)
  },

  async create(payload: TemplateSessaoCreate): Promise<TemplateSessaoApi> {
    const response = await fetch('/api/templates-sessao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    return handleResponse<TemplateSessaoApi>(response)
  },

  async update(id: string, payload: TemplateSessaoUpdate): Promise<TemplateSessaoApi> {
    const response = await fetch(`/api/templates-sessao/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    return handleResponse<TemplateSessaoApi>(response)
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/templates-sessao/${id}`, {
      method: 'DELETE'
    })

    await handleResponse<null>(response)
  },

  async applyToSessao(sessaoId: string, payload: { templateId: string; mode?: 'REPLACE' | 'APPEND' }): Promise<PautaSessaoApi> {
    const response = await fetch(`/api/sessoes/${sessaoId}/pauta/apply-template`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    return handleResponse<PautaSessaoApi>(response)
  }
}

export type TemplatesSessaoApi = typeof templatesSessaoApi

