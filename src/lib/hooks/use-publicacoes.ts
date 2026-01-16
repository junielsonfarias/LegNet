import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  publicacoesApi,
  categoriasPublicacaoApi,
  type Publicacao,
  type PublicacaoPayload,
  type PublicacaoFilters,
  type CategoriaPublicacao,
  type CategoriaPublicacaoPayload
} from '@/lib/api/publicacoes-api'
import { withRetry } from '@/lib/utils/retry'
import { useStableFilters } from '@/lib/utils/use-stable-filters'

interface UsePublicacoesReturn {
  publicacoes: Publicacao[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  loading: boolean
  error: string | null
  refetch: (options?: { page?: number; limit?: number }) => Promise<void>
  create: (data: PublicacaoPayload) => Promise<Publicacao | null>
  update: (id: string, data: Partial<PublicacaoPayload>) => Promise<Publicacao | null>
  remove: (id: string) => Promise<boolean>
}

export const usePublicacoes = (
  filters: PublicacaoFilters = {},
  options: { page?: number; limit?: number } = {}
): UsePublicacoesReturn => {
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: options.page ?? 1,
    limit: options.limit ?? 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  })

  const stableFilters = useStableFilters(filters)

  const fetchPublicacoes = useCallback(
    async (override: { page?: number; limit?: number } = {}) => {
      try {
        setLoading(true)
        setError(null)
        const payload = await withRetry(
          () =>
            publicacoesApi.list({
              ...stableFilters,
              page: override.page ?? pagination.page,
              limit: override.limit ?? pagination.limit
            }),
          3,
          1000
        )
        setPublicacoes(payload.data)
        setPagination(payload.pagination)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar publicações'
        setError(message)
        toast.error(message)
      } finally {
        setLoading(false)
      }
    },
    [stableFilters, pagination.page, pagination.limit]
  )

  useEffect(() => {
    fetchPublicacoes()
  }, [fetchPublicacoes])

  const refetch = useCallback(
    async (override?: { page?: number; limit?: number }) => {
      await fetchPublicacoes(override)
    },
    [fetchPublicacoes]
  )

  const create = useCallback(
    async (data: PublicacaoPayload) => {
      try {
        setError(null)
        const created = await publicacoesApi.create(data)
        await fetchPublicacoes()
        return created
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao criar publicação'
        setError(message)
        toast.error(message)
        return null
      }
    },
    [fetchPublicacoes]
  )

  const update = useCallback(
    async (id: string, data: Partial<PublicacaoPayload>) => {
      try {
        setError(null)
        const updated = await publicacoesApi.update(id, data)
        await fetchPublicacoes()
        return updated
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao atualizar publicação'
        setError(message)
        toast.error(message)
        return null
      }
    },
    [fetchPublicacoes]
  )

  const remove = useCallback(
    async (id: string) => {
      try {
        setError(null)
        await publicacoesApi.remove(id)
        await fetchPublicacoes()
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao excluir publicação'
        setError(message)
        toast.error(message)
        return false
      }
    },
    [fetchPublicacoes]
  )

  return {
    publicacoes,
    pagination,
    loading,
    error,
    refetch,
    create,
    update,
    remove
  }
}

interface UseCategoriasReturn {
  categorias: CategoriaPublicacao[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  create: (data: CategoriaPublicacaoPayload) => Promise<CategoriaPublicacao | null>
  update: (id: string, data: Partial<CategoriaPublicacaoPayload>) => Promise<CategoriaPublicacao | null>
  toggle: (id: string, ativa: boolean) => Promise<CategoriaPublicacao | null>
  remove: (id: string) => Promise<boolean>
}

export const useCategoriasPublicacao = (options: { includeInativas?: boolean } = {}): UseCategoriasReturn => {
  const [categorias, setCategorias] = useState<CategoriaPublicacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const stableOptions = useStableFilters(options)

  const fetchCategorias = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await withRetry(() => categoriasPublicacaoApi.list(stableOptions), 3, 1000)
      setCategorias(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar categorias'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [stableOptions])

  useEffect(() => {
    fetchCategorias()
  }, [fetchCategorias])

  const create = useCallback(
    async (data: CategoriaPublicacaoPayload) => {
      try {
        setError(null)
        const created = await categoriasPublicacaoApi.create(data)
        await fetchCategorias()
        return created
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao criar categoria'
        setError(message)
        toast.error(message)
        return null
      }
    },
    [fetchCategorias]
  )

  const update = useCallback(
    async (id: string, data: Partial<CategoriaPublicacaoPayload>) => {
      try {
        setError(null)
        const updated = await categoriasPublicacaoApi.update(id, data)
        await fetchCategorias()
        return updated
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao atualizar categoria'
        setError(message)
        toast.error(message)
        return null
      }
    },
    [fetchCategorias]
  )

  const toggle = useCallback(
    async (id: string, ativa: boolean) => {
      try {
        setError(null)
        const updated = await categoriasPublicacaoApi.toggle(id, ativa)
        await fetchCategorias()
        return updated
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao atualizar status da categoria'
        setError(message)
        toast.error(message)
        return null
      }
    },
    [fetchCategorias]
  )

  const remove = useCallback(
    async (id: string) => {
      try {
        setError(null)
        await categoriasPublicacaoApi.remove(id)
        await fetchCategorias()
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao remover categoria'
        setError(message)
        toast.error(message)
        return false
      }
    },
    [fetchCategorias]
  )

  return {
    categorias,
    loading,
    error,
    refetch: fetchCategorias,
    create,
    update,
    toggle,
    remove
  }
}

export const usePublicacao = (id: string | null) => {
  const [publicacao, setPublicacao] = useState<Publicacao | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setPublicacao(null)
      return
    }

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await publicacoesApi.getById(id)
        setPublicacao(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar publicação'
        setError(message)
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  return useMemo(
    () => ({
      publicacao,
      loading,
      error
    }),
    [publicacao, loading, error]
  )
}


