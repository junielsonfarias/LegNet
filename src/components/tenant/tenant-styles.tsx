'use client'

import { useEffect } from 'react'
import { useTenant } from '@/lib/hooks/use-tenant'

/**
 * Componente que injeta as cores do tenant como variáveis CSS
 *
 * Uso:
 * - Colocar no layout para aplicar cores dinâmicas em toda a aplicação
 * - As cores ficam disponíveis como --tenant-primary e --tenant-secondary
 * - Também atualiza as cores do tema Tailwind (--camara-primary, etc)
 */
export function TenantStyles() {
  const { tenantColors, isLoading } = useTenant()

  useEffect(() => {
    if (isLoading) return

    const root = document.documentElement

    // Define variáveis CSS do tenant
    root.style.setProperty('--tenant-primary', tenantColors.primary)
    root.style.setProperty('--tenant-secondary', tenantColors.secondary)

    // Converte hex para RGB para usar com opacity
    const hexToRgb = (hex: string): string => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      if (result) {
        return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
      }
      return '30 64 175' // Fallback azul
    }

    // Define variáveis RGB para uso com opacity (bg-camara-primary/50)
    root.style.setProperty('--tenant-primary-rgb', hexToRgb(tenantColors.primary))
    root.style.setProperty('--tenant-secondary-rgb', hexToRgb(tenantColors.secondary))

    // Atualiza as cores do tema Tailwind (compatibilidade com classes existentes)
    // Estas variáveis são usadas pelo Tailwind CSS para bg-camara-primary, text-camara-primary, etc
    root.style.setProperty('--color-camara-primary', tenantColors.primary)
    root.style.setProperty('--color-camara-secondary', tenantColors.secondary)

    // Cleanup - restaurar cores padrão quando o componente for desmontado
    return () => {
      root.style.removeProperty('--tenant-primary')
      root.style.removeProperty('--tenant-secondary')
      root.style.removeProperty('--tenant-primary-rgb')
      root.style.removeProperty('--tenant-secondary-rgb')
    }
  }, [tenantColors, isLoading])

  // Este componente não renderiza nada visualmente
  return null
}

/**
 * Componente de debug para visualizar informações do tenant
 * Útil durante o desenvolvimento
 */
export function TenantDebug() {
  const { tenant, tenantSlug, tenantName, tenantColors, isLoading, error, isDefault } = useTenant()

  if (process.env.NODE_ENV === 'production') {
    return null
  }

  if (isLoading) {
    return (
      <div className="fixed bottom-4 left-4 bg-yellow-100 border border-yellow-300 rounded-lg p-3 text-xs z-50">
        Carregando tenant...
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed bottom-4 left-4 bg-red-100 border border-red-300 rounded-lg p-3 text-xs z-50">
        Erro: {error}
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white border border-gray-300 rounded-lg p-3 text-xs z-50 shadow-lg max-w-xs">
      <div className="font-bold mb-2">Tenant Debug</div>
      <div className="space-y-1">
        <div><strong>Slug:</strong> {tenantSlug}</div>
        <div><strong>Nome:</strong> {tenantName}</div>
        <div><strong>Padrão:</strong> {isDefault ? 'Sim' : 'Não'}</div>
        <div className="flex items-center gap-2">
          <strong>Primária:</strong>
          <span
            className="inline-block w-4 h-4 rounded"
            style={{ backgroundColor: tenantColors.primary }}
          />
          {tenantColors.primary}
        </div>
        <div className="flex items-center gap-2">
          <strong>Secundária:</strong>
          <span
            className="inline-block w-4 h-4 rounded"
            style={{ backgroundColor: tenantColors.secondary }}
          />
          {tenantColors.secondary}
        </div>
        {tenant && (
          <>
            <div><strong>Cidade:</strong> {tenant.cidade || 'N/A'}</div>
            <div><strong>Estado:</strong> {tenant.estado || 'N/A'}</div>
            <div><strong>Plano:</strong> {tenant.plano}</div>
          </>
        )}
      </div>
    </div>
  )
}
