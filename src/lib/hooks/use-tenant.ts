'use client'

import { useTenantContext } from '@/lib/tenant/tenant-context'
import type { TenantInfo } from '@/lib/tenant/tenant-resolver'

/**
 * Interface do retorno do hook useTenant
 */
export interface UseTenantReturn {
  tenant: TenantInfo | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  isDefault: boolean
  tenantSlug: string
  tenantName: string
  tenantLogo: string | null
  tenantColors: {
    primary: string
    secondary: string
  }
}

/**
 * Hook principal para acessar informações do tenant atual
 *
 * Este hook usa o TenantContext para obter os dados do tenant,
 * evitando requisições duplicadas.
 *
 * @example
 * ```tsx
 * const { tenant, isLoading, tenantColors } = useTenant()
 *
 * if (isLoading) return <Skeleton />
 *
 * return (
 *   <div style={{ color: tenantColors.primary }}>
 *     {tenant?.nome}
 *   </div>
 * )
 * ```
 */
export function useTenant(): UseTenantReturn {
  const { tenant, isLoading, error, refetch } = useTenantContext()

  // Valores derivados
  const isDefault = tenant?.slug === 'default' || !tenant
  const tenantSlug = tenant?.slug || 'default'
  const tenantName = tenant?.nome || 'Câmara Municipal'
  const tenantLogo = tenant?.logoUrl || null
  const tenantColors = {
    primary: tenant?.corPrimaria || '#1e40af',
    secondary: tenant?.corSecundaria || '#3b82f6',
  }

  return {
    tenant,
    isLoading,
    error,
    refetch,
    isDefault,
    tenantSlug,
    tenantName,
    tenantLogo,
    tenantColors,
  }
}

/**
 * Hook para obter apenas o slug do tenant
 */
export function useTenantSlug(): string {
  const { tenantSlug } = useTenant()
  return tenantSlug
}

/**
 * Hook para obter o nome do tenant
 */
export function useTenantName(): string {
  const { tenantName } = useTenant()
  return tenantName
}

/**
 * Hook para obter as cores do tenant
 */
export function useTenantColors(): { primary: string; secondary: string } {
  const { tenantColors } = useTenant()
  return tenantColors
}

/**
 * Hook para verificar se está usando tenant padrão
 */
export function useIsDefaultTenant(): boolean {
  const { isDefault } = useTenant()
  return isDefault
}

/**
 * Hook para obter o logo do tenant
 */
export function useTenantLogo(): string | null {
  const { tenantLogo } = useTenant()
  return tenantLogo
}
