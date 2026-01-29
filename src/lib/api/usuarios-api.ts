import { withRetry } from '@/lib/utils/retry'

export type UsuarioRole = 'ADMIN' | 'SECRETARIA' | 'AUXILIAR_LEGISLATIVO' | 'EDITOR' | 'USER' | 'PARLAMENTAR' | 'OPERADOR'

export interface UsuarioApi {
  id: string
  name: string | null
  email: string
  role: UsuarioRole
  ativo: boolean
  parlamentarId: string | null
  parlamentar?: {
    id: string
    nome: string
  }
  createdAt: string
  updatedAt: string
}

export interface UsuarioCreate {
  name?: string
  email: string
  password: string
  role: UsuarioRole
  parlamentarId?: string
  ativo?: boolean
}

export interface UsuarioUpdate {
  name?: string
  email?: string
  password?: string
  role?: UsuarioRole
  parlamentarId?: string
  ativo?: boolean
}

const API_BASE_URL = '/api/usuarios'

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
    throw new Error(error.message || `Erro ${response.status}`)
  }
  const data = await response.json()
  return data.data || data
}

export const usuariosApi = {
  getAll: async (): Promise<UsuarioApi[]> => {
    return withRetry(async () => {
      const response = await fetch(API_BASE_URL)
      return handleResponse<UsuarioApi[]>(response)
    })
  },

  getById: async (id: string): Promise<UsuarioApi> => {
    return withRetry(async () => {
      const response = await fetch(`${API_BASE_URL}/${id}`)
      return handleResponse<UsuarioApi>(response)
    })
  },

  create: async (usuario: UsuarioCreate): Promise<UsuarioApi> => {
    return withRetry(async () => {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usuario)
      })
      return handleResponse<UsuarioApi>(response)
    })
  },

  update: async (id: string, usuario: UsuarioUpdate): Promise<UsuarioApi> => {
    return withRetry(async () => {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usuario)
      })
      return handleResponse<UsuarioApi>(response)
    })
  },

  delete: async (id: string): Promise<void> => {
    return withRetry(async () => {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
        throw new Error(error.message || `Erro ${response.status}`)
      }
    })
  }
}

