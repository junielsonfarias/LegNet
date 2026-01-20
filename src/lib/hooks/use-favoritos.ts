'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

export type TipoFavorito = 'PROPOSICAO' | 'SESSAO' | 'PARLAMENTAR' | 'COMISSAO' | 'PUBLICACAO'

export interface Favorito {
  id: string
  userId: string
  tipoItem: TipoFavorito
  itemId: string
  notificarMudancas: boolean
  notificarVotacao: boolean
  notificarParecer: boolean
  anotacao?: string | null
  createdAt: string
  updatedAt: string
  item?: any
}

interface UseFavoritosOptions {
  tipo?: TipoFavorito
  autoLoad?: boolean
}

export function useFavoritos(options: UseFavoritosOptions = {}) {
  const { data: session } = useSession()
  const [favoritos, setFavoritos] = useState<Favorito[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)

  const isAuthenticated = !!session?.user

  // Buscar favoritos
  const buscarFavoritos = useCallback(async (paginaAtual = 1) => {
    if (!isAuthenticated) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        pagina: String(paginaAtual),
        limite: '20',
      })
      if (options.tipo) {
        params.set('tipo', options.tipo)
      }

      const res = await fetch(`/api/favoritos?${params}`)
      const data = await res.json()

      if (res.ok) {
        setFavoritos(data.favoritos)
        setTotal(data.total)
        setPagina(data.pagina)
        setTotalPaginas(data.totalPaginas)
      } else {
        console.error('Erro ao buscar favoritos:', data.error)
      }
    } catch (error) {
      console.error('Erro ao buscar favoritos:', error)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, options.tipo])

  // Auto load
  useEffect(() => {
    if (options.autoLoad !== false && isAuthenticated) {
      buscarFavoritos()
    }
  }, [buscarFavoritos, options.autoLoad, isAuthenticated])

  // Adicionar favorito
  const adicionarFavorito = useCallback(async (
    tipoItem: TipoFavorito,
    itemId: string,
    opcoes?: {
      notificarMudancas?: boolean
      notificarVotacao?: boolean
      notificarParecer?: boolean
      anotacao?: string
    }
  ) => {
    if (!isAuthenticated) {
      toast.error('Faça login para adicionar aos favoritos')
      return null
    }

    try {
      const res = await fetch('/api/favoritos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoItem,
          itemId,
          ...opcoes,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setFavoritos(prev => [data.favorito, ...prev])
        setTotal(prev => prev + 1)
        toast.success('Adicionado aos favoritos')
        return data.favorito
      } else if (res.status === 409) {
        toast.info('Item já está nos favoritos')
        return null
      } else {
        toast.error(data.error || 'Erro ao adicionar favorito')
        return null
      }
    } catch (error) {
      console.error('Erro ao adicionar favorito:', error)
      toast.error('Erro ao adicionar favorito')
      return null
    }
  }, [isAuthenticated])

  // Remover favorito
  const removerFavorito = useCallback(async (tipoItem: TipoFavorito, itemId: string) => {
    if (!isAuthenticated) return false

    try {
      const params = new URLSearchParams({ tipoItem, itemId })
      const res = await fetch(`/api/favoritos?${params}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setFavoritos(prev => prev.filter(f => !(f.tipoItem === tipoItem && f.itemId === itemId)))
        setTotal(prev => Math.max(0, prev - 1))
        toast.success('Removido dos favoritos')
        return true
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erro ao remover favorito')
        return false
      }
    } catch (error) {
      console.error('Erro ao remover favorito:', error)
      toast.error('Erro ao remover favorito')
      return false
    }
  }, [isAuthenticated])

  // Toggle favorito
  const toggleFavorito = useCallback(async (
    tipoItem: TipoFavorito,
    itemId: string,
    opcoes?: {
      notificarMudancas?: boolean
      notificarVotacao?: boolean
      notificarParecer?: boolean
      anotacao?: string
    }
  ) => {
    const existe = favoritos.some(f => f.tipoItem === tipoItem && f.itemId === itemId)

    if (existe) {
      return removerFavorito(tipoItem, itemId)
    } else {
      const resultado = await adicionarFavorito(tipoItem, itemId, opcoes)
      return !!resultado
    }
  }, [favoritos, adicionarFavorito, removerFavorito])

  // Verificar se está nos favoritos
  const isFavorito = useCallback((tipoItem: TipoFavorito, itemId: string) => {
    return favoritos.some(f => f.tipoItem === tipoItem && f.itemId === itemId)
  }, [favoritos])

  // Atualizar configurações do favorito
  const atualizarFavorito = useCallback(async (
    id: string,
    dados: {
      notificarMudancas?: boolean
      notificarVotacao?: boolean
      notificarParecer?: boolean
      anotacao?: string | null
    }
  ) => {
    if (!isAuthenticated) return null

    try {
      const res = await fetch(`/api/favoritos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      })

      const data = await res.json()

      if (res.ok) {
        setFavoritos(prev => prev.map(f => f.id === id ? { ...f, ...data.favorito } : f))
        toast.success('Favorito atualizado')
        return data.favorito
      } else {
        toast.error(data.error || 'Erro ao atualizar favorito')
        return null
      }
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error)
      toast.error('Erro ao atualizar favorito')
      return null
    }
  }, [isAuthenticated])

  return {
    favoritos,
    loading,
    total,
    pagina,
    totalPaginas,
    isAuthenticated,
    buscarFavoritos,
    adicionarFavorito,
    removerFavorito,
    toggleFavorito,
    isFavorito,
    atualizarFavorito,
    setPagina,
  }
}

/**
 * Hook para verificar favorito de um item específico
 */
export function useFavoritoItem(tipoItem: TipoFavorito, itemId: string) {
  const { data: session } = useSession()
  const [isFavorito, setIsFavorito] = useState(false)
  const [loading, setLoading] = useState(true)
  const [favorito, setFavorito] = useState<Favorito | null>(null)

  const isAuthenticated = !!session?.user

  // Verificar se está nos favoritos
  const verificar = useCallback(async () => {
    if (!isAuthenticated || !itemId) {
      setLoading(false)
      return
    }

    try {
      const params = new URLSearchParams({ tipoItem, itemId })
      const res = await fetch(`/api/favoritos/check?${params}`)
      const data = await res.json()

      setIsFavorito(data.favorito)
      setFavorito(data.dados)
    } catch (error) {
      console.error('Erro ao verificar favorito:', error)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, tipoItem, itemId])

  useEffect(() => {
    verificar()
  }, [verificar])

  // Toggle
  const toggle = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Faça login para adicionar aos favoritos')
      return
    }

    if (isFavorito) {
      // Remover
      const params = new URLSearchParams({ tipoItem, itemId })
      const res = await fetch(`/api/favoritos?${params}`, { method: 'DELETE' })

      if (res.ok) {
        setIsFavorito(false)
        setFavorito(null)
        toast.success('Removido dos favoritos')
      }
    } else {
      // Adicionar
      const res = await fetch('/api/favoritos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipoItem, itemId }),
      })
      const data = await res.json()

      if (res.ok) {
        setIsFavorito(true)
        setFavorito(data.favorito)
        toast.success('Adicionado aos favoritos')
      } else if (res.status === 409) {
        setIsFavorito(true)
        toast.info('Item já está nos favoritos')
      }
    }
  }, [isAuthenticated, isFavorito, tipoItem, itemId])

  return {
    isFavorito,
    loading,
    favorito,
    toggle,
    verificar,
    isAuthenticated,
  }
}
