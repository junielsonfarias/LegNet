'use client'

import { useState, useEffect, useCallback } from 'react'
import { noticiasApi, NoticiaApi, NoticiaCreate, NoticiaUpdate } from '@/lib/api/noticias-api'
import { toast } from 'sonner'
import { withRetry } from '@/lib/utils/retry'
import { useStableFilters } from '@/lib/utils/use-stable-filters'

interface UseNoticiasReturn {
  noticias: NoticiaApi[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  create: (data: NoticiaCreate) => Promise<NoticiaApi | null>
  update: (id: string, data: NoticiaUpdate) => Promise<NoticiaApi | null>
  remove: (id: string) => Promise<boolean>
}

export function useNoticias(filters?: { publicada?: boolean; categoria?: string }): UseNoticiasReturn {
  const [noticias, setNoticias] = useState<NoticiaApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const stableFilters = useStableFilters(filters)

  const fetchNoticias = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await withRetry(() => noticiasApi.getAll(stableFilters), 3, 1000)
      setNoticias(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar notícias'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [stableFilters])

  useEffect(() => {
    fetchNoticias()
  }, [fetchNoticias])

  const create = useCallback(async (data: NoticiaCreate): Promise<NoticiaApi | null> => {
    try {
      setError(null)
      const nova = await noticiasApi.create(data)
      await fetchNoticias()
      // Toast será mostrado pelo componente que chama
      return nova
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar notícia'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    }
  }, [fetchNoticias])

  const update = useCallback(async (id: string, data: NoticiaUpdate): Promise<NoticiaApi | null> => {
    try {
      setError(null)
      const atualizada = await noticiasApi.update(id, data)
      await fetchNoticias()
      // Toast será mostrado pelo componente que chama
      return atualizada
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar notícia'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    }
  }, [fetchNoticias])

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null)
      await noticiasApi.delete(id)
      await fetchNoticias()
      // Toast será mostrado pelo componente que chama
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir notícia'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    }
  }, [fetchNoticias])

  return {
    noticias,
    loading,
    error,
    refetch: fetchNoticias,
    create,
    update,
    remove,
  }
}

export function useNoticia(id: string | null) {
  const [noticia, setNoticia] = useState<NoticiaApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    const fetchNoticia = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await noticiasApi.getById(id)
        setNoticia(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar notícia'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchNoticia()
  }, [id])

  return { noticia, loading, error }
}

