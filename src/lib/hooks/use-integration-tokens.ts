'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  integrationTokensApi,
  type IntegrationToken,
  type IntegrationTokenCreate,
  type IntegrationTokenUpdate
} from '@/lib/api/integration-tokens-api'
import { withRetry } from '@/lib/utils/retry'

interface UseIntegrationTokensReturn {
  tokens: IntegrationToken[]
  loading: boolean
  error: string | null
  lastPlainToken?: string | null
  refetch: () => Promise<void>
  create: (payload: IntegrationTokenCreate) => Promise<IntegrationToken | null>
  update: (id: string, payload: IntegrationTokenUpdate) => Promise<IntegrationToken | null>
  remove: (id: string) => Promise<boolean>
  rotate: (id: string) => Promise<string | null>
}

export function useIntegrationTokens(): UseIntegrationTokensReturn {
  const [tokens, setTokens] = useState<IntegrationToken[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastPlainToken, setLastPlainToken] = useState<string | null>(null)

  const fetchTokens = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await withRetry(() => integrationTokensApi.getAll(), 2, 600)
      setTokens(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar tokens'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTokens()
  }, [fetchTokens])

  const create = useCallback(async (payload: IntegrationTokenCreate): Promise<IntegrationToken | null> => {
    try {
      const { token, plainToken } = await integrationTokensApi.create(payload)
      setLastPlainToken(plainToken)
      toast.success('Token criado com sucesso! Guarde o valor exibido uma única vez.')
      await fetchTokens()
      return token
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar token'
      setError(message)
      toast.error(message)
      return null
    }
  }, [fetchTokens])

  const update = useCallback(async (id: string, payload: IntegrationTokenUpdate): Promise<IntegrationToken | null> => {
    try {
      const { token, plainToken } = await integrationTokensApi.update(id, payload)
      if (plainToken) {
        setLastPlainToken(plainToken)
        toast.success('Token regenerado com sucesso! Copie o valor exibido.')
      } else {
        toast.success('Token atualizado com sucesso!')
      }
      await fetchTokens()
      return token
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar token'
      setError(message)
      toast.error(message)
      return null
    }
  }, [fetchTokens])

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await integrationTokensApi.delete(id)
      toast.success('Token removido com sucesso')
      await fetchTokens()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover token'
      setError(message)
      toast.error(message)
      return false
    }
  }, [fetchTokens])

  const rotate = useCallback(async (id: string): Promise<string | null> => {
    try {
      const { plainToken } = await integrationTokensApi.update(id, { rotate: true })
      if (plainToken) {
        setLastPlainToken(plainToken)
        toast.success('Token regenerado com sucesso!')
      }
      await fetchTokens()
      return plainToken ?? null
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao regenerar token'
      setError(message)
      toast.error(message)
      return null
    }
  }, [fetchTokens])

  return {
    tokens,
    loading,
    error,
    lastPlainToken,
    refetch: fetchTokens,
    create,
    update,
    remove,
    rotate
  }
}


