import { publicacoesService, type Publicacao, type PublicacaoPayload, type PublicacaoFilters } from '@/lib/publicacoes-service'
import { categoriasPublicacaoService, type CategoriaPublicacao, type CategoriaPublicacaoPayload } from '@/lib/categorias-publicacao-service'

interface PaginationOptions {
  page?: number
  limit?: number
}

interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

const buildQueryString = (params: Record<string, unknown>) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    query.set(key, String(value))
  })
  const qs = query.toString()
  return qs ? `?${qs}` : ''
}

const handleResponse = async <T>(response: Response, fallback: () => Promise<T>) => {
  if (response.ok) {
    const payload = await response.json()
    return payload.data as T
  }

  if (response.status === 401) {
    return fallback()
  }

  const errorText = await response.text()
  throw new Error(errorText || 'Erro ao processar requisição de publicações.')
}

const handlePaginatedResponse = async <T>(response: Response, fallback: () => Promise<PaginatedResponse<T>>) => {
  if (response.ok) {
    const payload = await response.json()
    return payload as PaginatedResponse<T>
  }

  if (response.status === 401) {
    return fallback()
  }

  const errorText = await response.text()
  throw new Error(errorText || 'Erro ao processar requisição de publicações.')
}

export interface PublicacaoListOptions extends PublicacaoFilters, PaginationOptions {}

export const publicacoesApi = {
  async list(options: PublicacaoListOptions = {}): Promise<PaginatedResponse<Publicacao>> {
    const query = buildQueryString(options as Record<string, unknown>)
    const response = await fetch(`/api/publicacoes${query}`, { cache: 'no-store' })
    return handlePaginatedResponse(response, async () => publicacoesService.paginate(options, options))
  },

  async getById(id: string): Promise<Publicacao> {
    const response = await fetch(`/api/publicacoes/${id}`, { cache: 'no-store' })
    return handleResponse(response, async () => {
      const data = await publicacoesService.getById(id)
      if (!data) {
        throw new Error('Publicação não encontrada.')
      }
      return data
    })
  },

  async create(payload: PublicacaoPayload): Promise<Publicacao> {
    const response = await fetch('/api/publicacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    return handleResponse(response, async () => publicacoesService.create(payload))
  },

  async update(id: string, payload: Partial<PublicacaoPayload>): Promise<Publicacao> {
    const response = await fetch(`/api/publicacoes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    return handleResponse(response, async () => publicacoesService.update(id, payload))
  },

  async remove(id: string): Promise<boolean> {
    const response = await fetch(`/api/publicacoes/${id}`, { method: 'DELETE' })
    if (response.ok) {
      return true
    }

    if (response.status === 401) {
      await publicacoesService.remove(id)
      return true
    }

    const errorText = await response.text()
    throw new Error(errorText || 'Erro ao remover publicação.')
  },

  async incrementarVisualizacoes(id: string): Promise<Publicacao> {
    const response = await fetch(`/api/publicacoes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incrementarVisualizacoes: true })
    })
    return handleResponse(response, async () => publicacoesService.incrementarVisualizacoes(id))
  }
}

export const categoriasPublicacaoApi = {
  async list(options: { includeInativas?: boolean; search?: string } = {}): Promise<CategoriaPublicacao[]> {
    const query = buildQueryString(options)
    const response = await fetch(`/api/publicacoes/categorias${query}`, { cache: 'no-store' })
    return handleResponse(response, async () => categoriasPublicacaoService.list(options))
  },

  async getById(id: string): Promise<CategoriaPublicacao> {
    const response = await fetch(`/api/publicacoes/categorias/${id}`, { cache: 'no-store' })
    return handleResponse(response, async () => {
      const categoria = await categoriasPublicacaoService.getById(id)
      if (!categoria) {
        throw new Error('Categoria não encontrada.')
      }
      return categoria
    })
  },

  async create(payload: CategoriaPublicacaoPayload): Promise<CategoriaPublicacao> {
    const response = await fetch('/api/publicacoes/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    return handleResponse(response, async () => categoriasPublicacaoService.create(payload))
  },

  async update(id: string, payload: Partial<CategoriaPublicacaoPayload>): Promise<CategoriaPublicacao> {
    const response = await fetch(`/api/publicacoes/categorias/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    return handleResponse(response, async () => categoriasPublicacaoService.update(id, payload))
  },

  async toggle(id: string, ativa: boolean): Promise<CategoriaPublicacao> {
    const response = await fetch(`/api/publicacoes/categorias/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativa })
    })
    return handleResponse(response, async () => categoriasPublicacaoService.toggleStatus(id, ativa))
  },

  async remove(id: string): Promise<boolean> {
    const response = await fetch(`/api/publicacoes/categorias/${id}`, { method: 'DELETE' })
    if (response.ok) {
      return true
    }
    if (response.status === 401) {
      await categoriasPublicacaoService.remove(id)
      return true
    }
    const errorText = await response.text()
    throw new Error(errorText || 'Erro ao remover categoria de publicação.')
  }
}

export type { Publicacao, PublicacaoPayload, PublicacaoFilters } from '@/lib/publicacoes-service'
export type { CategoriaPublicacao, CategoriaPublicacaoPayload } from '@/lib/categorias-publicacao-service'
