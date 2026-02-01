"use client"

const SECAO_ORDER = ['EXPEDIENTE', 'ORDEM_DO_DIA', 'COMUNICACOES', 'HONRAS', 'OUTROS']

const getSecaoIndex = (secao: string) => {
  const index = SECAO_ORDER.indexOf(secao)
  return index === -1 ? SECAO_ORDER.length : index
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { pautaApi, type PautaSessaoApi, type PautaItemApi, type PautaSugestaoApi } from '@/lib/api/pauta-api'
import { templatesSessaoApi } from '@/lib/api/templates-sessao-api'
import { toast } from 'sonner'

interface UsePautaReturn {
  pauta: PautaSessaoApi | null
  loading: boolean
  refreshing: boolean
  error: string | null
  refetch: () => Promise<void>
  addItem: (payload: Partial<PautaItemApi> & { secao: string; titulo: string }) => Promise<void>
  updateItem: (itemId: string, payload: Partial<PautaItemApi>) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  applyTemplate: (templateId: string, mode?: 'REPLACE' | 'APPEND') => Promise<void>
  suggestions: PautaSugestaoApi[]
  loadingSuggestions: boolean
  refetchSuggestions: () => Promise<void>
  addSuggestionAsItem: (suggestion: PautaSugestaoApi) => Promise<void>
}

export function usePauta(sessaoId?: string | null): UsePautaReturn {
  const [pauta, setPauta] = useState<PautaSessaoApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<PautaSugestaoApi[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  const fetchPauta = useCallback(async () => {
    if (!sessaoId) {
      setPauta(null)
      setLoading(false)
      return
    }

    try {
      setRefreshing(true)
      const data = await pautaApi.getBySessao(sessaoId)
      setPauta(data)
      setError(null)
    } catch (err: any) {
      console.error('Erro ao carregar pauta:', err)
      setError(err.message || 'Erro ao carregar pauta')
      toast.error(err.message || 'Erro ao carregar pauta da sessão')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [sessaoId])

  useEffect(() => {
    setLoading(true)
    fetchPauta()
  }, [fetchPauta])

  const fetchSuggestions = useCallback(async () => {
    if (!sessaoId) {
      setSuggestions([])
      return
    }

    try {
      setLoadingSuggestions(true)
      const data = await pautaApi.getSuggestions(sessaoId)
      // Garantir que data seja sempre um array
      setSuggestions(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Erro ao carregar sugestões de pauta:', err)
      setSuggestions([]) // Garantir array vazio em caso de erro
    } finally {
      setLoadingSuggestions(false)
    }
  }, [sessaoId])

  useEffect(() => {
    fetchSuggestions()
  }, [fetchSuggestions])

  const addItem = useCallback(async (payload: Partial<PautaItemApi> & { secao: string; titulo: string }) => {
    if (!sessaoId) return
    try {
      const data = await pautaApi.createItem(sessaoId, payload)
      setPauta(data)
      toast.success('Item adicionado à pauta')
    } catch (err: any) {
      console.error('Erro ao adicionar item na pauta:', err)
      toast.error(err.message || 'Erro ao adicionar item à pauta')
    }
  }, [sessaoId])

  const updateItem = useCallback(async (itemId: string, payload: Partial<PautaItemApi>) => {
    try {
      const updated = await pautaApi.updateItem(itemId, payload)
      setPauta(prev => {
        if (!prev) return prev
        return {
          ...prev,
          itens: prev.itens.map(item => item.id === itemId ? updated : item)
            .sort((a, b) => getSecaoIndex(a.secao) - getSecaoIndex(b.secao) || a.ordem - b.ordem)
        }
      })
      toast.success('Item da pauta atualizado com sucesso')
    } catch (err: any) {
      console.error('Erro ao atualizar item da pauta:', err)
      toast.error(err.message || 'Erro ao atualizar item da pauta')
    }
  }, [])

  const removeItem = useCallback(async (itemId: string) => {
    try {
      await pautaApi.removeItem(itemId)
      setPauta(prev => {
        if (!prev) return prev
        return {
          ...prev,
          itens: prev.itens.filter(item => item.id !== itemId)
        }
      })
      toast.success('Item removido da pauta com sucesso')
    } catch (err: any) {
      console.error('Erro ao remover item da pauta:', err)
      toast.error(err.message || 'Erro ao remover item da pauta')
    }
  }, [])

  const applyTemplate = useCallback(async (templateId: string, mode: 'REPLACE' | 'APPEND' = 'REPLACE') => {
    if (!sessaoId) return
    try {
      setRefreshing(true)
      const pautaAtualizada = await templatesSessaoApi.applyToSessao(sessaoId, { templateId, mode })
      setPauta(pautaAtualizada)
      toast.success('Template aplicado à pauta da sessão')
      await fetchSuggestions()
    } catch (err: any) {
      console.error('Erro ao aplicar template na pauta:', err)
      toast.error(err.message || 'Erro ao aplicar template na pauta')
    } finally {
      setRefreshing(false)
    }
  }, [sessaoId, fetchSuggestions])

  const addSuggestionAsItem = useCallback(async (suggestion: PautaSugestaoApi) => {
    if (!sessaoId) return
    await addItem({
      secao: suggestion.secao,
      titulo: suggestion.titulo,
      descricao: suggestion.descricao ?? undefined,
      tempoEstimado: suggestion.tempoEstimado ?? undefined,
      tipoAcao: suggestion.tipoAcao ?? undefined,
      proposicaoId: suggestion.proposicao?.id
    })
    setSuggestions(prev => prev.filter(item => item.id !== suggestion.id))
  }, [sessaoId, addItem])

  const refetch = useMemo(() => fetchPauta, [fetchPauta])
  const refetchSuggestions = useMemo(() => fetchSuggestions, [fetchSuggestions])

  return {
    pauta,
    loading,
    refreshing,
    error,
    refetch,
    addItem,
    updateItem,
    removeItem,
    applyTemplate,
    suggestions,
    loadingSuggestions,
    refetchSuggestions,
    addSuggestionAsItem
  }
}

