'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { TenantInfo } from './tenant-resolver'

/**
 * Interface do contexto de tenant
 */
interface TenantContextType {
  tenant: TenantInfo | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Contexto de tenant
 */
const TenantContext = createContext<TenantContextType | undefined>(undefined)

/**
 * Props do provider
 */
interface TenantProviderProps {
  children: ReactNode
  initialTenant?: TenantInfo | null
}

/**
 * Provider de tenant
 *
 * Fornece informações do tenant atual para toda a aplicação.
 * Pode receber um tenant inicial (do server-side) ou buscar automaticamente.
 */
export function TenantProvider({ children, initialTenant = null }: TenantProviderProps) {
  const [tenant, setTenant] = useState<TenantInfo | null>(initialTenant)
  const [isLoading, setIsLoading] = useState(!initialTenant)
  const [error, setError] = useState<string | null>(null)

  /**
   * Busca informações do tenant atual
   */
  const fetchTenant = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/tenant/current')

      if (!response.ok) {
        throw new Error('Falha ao buscar informações do tenant')
      }

      const data = await response.json()
      setTenant(data.tenant)
    } catch (err) {
      console.error('Erro ao buscar tenant:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Refetch manual
   */
  const refetch = async () => {
    await fetchTenant()
  }

  // Busca tenant se não foi fornecido inicialmente
  useEffect(() => {
    if (!initialTenant) {
      fetchTenant()
    }
  }, [initialTenant])

  const value: TenantContextType = {
    tenant,
    isLoading,
    error,
    refetch,
  }

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}

/**
 * Hook para acessar o contexto de tenant
 *
 * IMPORTANTE: Use os hooks de @/lib/hooks/use-tenant para
 * funcionalidades derivadas (useTenantColors, useTenantName, etc.)
 */
export function useTenantContext(): TenantContextType {
  const context = useContext(TenantContext)

  if (context === undefined) {
    throw new Error('useTenantContext deve ser usado dentro de um TenantProvider')
  }

  return context
}
