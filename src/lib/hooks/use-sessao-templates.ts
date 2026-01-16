'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

import {
  templatesSessaoApi,
  type TemplateSessaoApi,
  type TemplateSessaoCreate,
  type TemplateSessaoUpdate
} from '@/lib/api/templates-sessao-api'
import type { PautaSessaoApi } from '@/lib/api/pauta-api'
import { withRetry } from '@/lib/utils/retry'

export interface UseSessaoTemplatesOptions {
  tipo?: 'ORDINARIA' | 'EXTRAORDINARIA' | 'SOLENE' | 'ESPECIAL'
  ativo?: boolean
}

export interface UseSessaoTemplatesReturn {
  templates: TemplateSessaoApi[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  create: (payload: TemplateSessaoCreate) => Promise<TemplateSessaoApi | null>
  update: (id: string, payload: TemplateSessaoUpdate) => Promise<TemplateSessaoApi | null>
  remove: (id: string) => Promise<boolean>
  applyToSessao: (sessaoId: string, templateId: string, mode?: 'REPLACE' | 'APPEND') => Promise<PautaSessaoApi | null>
}

export function useSessaoTemplates(options?: UseSessaoTemplatesOptions): UseSessaoTemplatesReturn {
  const [templates, setTemplates] = useState<TemplateSessaoApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await withRetry(
        () => templatesSessaoApi.getAll({
          tipo: options?.tipo,
          ativo: options?.ativo,
          includeItems: true
        }),
        2,
        800
      )
      setTemplates(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar templates'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [options?.ativo, options?.tipo])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const create = useCallback(async (payload: TemplateSessaoCreate): Promise<TemplateSessaoApi | null> => {
    try {
      const created = await templatesSessaoApi.create(payload)
      toast.success('Template criado com sucesso!')
      await fetchTemplates()
      return created
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar template'
      setError(message)
      toast.error(message)
      return null
    }
  }, [fetchTemplates])

  const update = useCallback(async (id: string, payload: TemplateSessaoUpdate): Promise<TemplateSessaoApi | null> => {
    try {
      const updated = await templatesSessaoApi.update(id, payload)
      toast.success('Template atualizado com sucesso!')
      await fetchTemplates()
      return updated
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar template'
      setError(message)
      toast.error(message)
      return null
    }
  }, [fetchTemplates])

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await templatesSessaoApi.delete(id)
      toast.success('Template removido com sucesso!')
      await fetchTemplates()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover template'
      setError(message)
      toast.error(message)
      return false
    }
  }, [fetchTemplates])

  const applyToSessao = useCallback(async (
    sessaoId: string,
    templateId: string,
    mode: 'REPLACE' | 'APPEND' = 'REPLACE'
  ): Promise<PautaSessaoApi | null> => {
    try {
      const pauta = await templatesSessaoApi.applyToSessao(sessaoId, { templateId, mode })
      toast.success('Template aplicado à pauta da sessão!')
      return pauta
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao aplicar template na pauta'
      setError(message)
      toast.error(message)
      return null
    }
  }, [])

  return {
    templates,
    loading,
    error,
    refetch: fetchTemplates,
    create,
    update,
    remove,
    applyToSessao
  }
}


