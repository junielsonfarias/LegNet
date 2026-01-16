import { ApiResponse } from '@/lib/error-handler'

export interface NoticiaApi {
  id: string
  titulo: string
  resumo: string | null
  conteudo: string
  imagem: string | null
  categoria: string | null
  tags: string[]
  publicada: boolean
  dataPublicacao: string | null
  createdAt: string
  updatedAt: string
}

export interface NoticiaCreate {
  titulo: string
  resumo?: string
  conteudo: string
  imagem?: string
  categoria?: string
  tags?: string[]
  publicada?: boolean
  dataPublicacao?: string
}

export interface NoticiaUpdate {
  titulo?: string
  resumo?: string
  conteudo?: string
  imagem?: string
  categoria?: string
  tags?: string[]
  publicada?: boolean
  dataPublicacao?: string
}

class NoticiasApiService {
  private baseUrl = '/api/noticias'

  private async handleResponse<T>(response: Response): Promise<T> {
    const data: ApiResponse<T> = await response.json()
    
    if (!response.ok || !data.success) {
      const error = data.error || 'Erro ao processar requisição'
      throw new Error(error)
    }
    
    return data.data
  }

  async getAll(filters?: { publicada?: boolean; categoria?: string }): Promise<NoticiaApi[]> {
    const params = new URLSearchParams()
    
    if (filters?.publicada !== undefined) params.append('publicada', String(filters.publicada))
    if (filters?.categoria) params.append('categoria', filters.categoria)
    
    const url = `${this.baseUrl}${params.toString() ? `?${params.toString()}` : ''}`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })
    
    return this.handleResponse<NoticiaApi[]>(response)
  }

  async getById(id: string): Promise<NoticiaApi> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })
    
    return this.handleResponse<NoticiaApi>(response)
  }

  async create(noticia: NoticiaCreate): Promise<NoticiaApi> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noticia),
    })
    
    return this.handleResponse<NoticiaApi>(response)
  }

  async update(id: string, noticia: NoticiaUpdate): Promise<NoticiaApi> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noticia),
    })
    
    return this.handleResponse<NoticiaApi>(response)
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
      throw new Error(data.error || 'Erro ao excluir notícia')
    }
  }
}

export const noticiasApi = new NoticiasApiService()

