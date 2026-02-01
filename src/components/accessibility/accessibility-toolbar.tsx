/**
 * Accessibility Toolbar - Barra de Ferramentas de Acessibilidade
 * Permite ao usuario ajustar configuracoes de visualizacao
 * Conformidade: WCAG 2.1 AA
 */

'use client'

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react'
import {
  Type,
  Minus,
  Plus,
  Contrast,
  LayoutList,
  X,
  Settings,
  RotateCcw,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAnnounce } from '@/components/ui/skip-link'

// =============================================================================
// TIPOS
// =============================================================================

type FontSize = 'normal' | 'medium' | 'large'
type LineHeight = 'normal' | 'comfortable' | 'spacious'

interface AccessibilitySettings {
  fontSize: FontSize
  lineHeight: LineHeight
  highContrast: boolean
  reducedMotion: boolean
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 'normal',
  lineHeight: 'normal',
  highContrast: false,
  reducedMotion: false,
}

const STORAGE_KEY = 'accessibility-settings'

// Labels para os tamanhos de fonte e altura de linha
const fontSizeLabels: Record<FontSize, string> = {
  normal: 'Normal',
  medium: 'Medio',
  large: 'Grande',
}

const lineHeightLabels: Record<LineHeight, string> = {
  normal: 'Normal',
  comfortable: 'Confortavel',
  spacious: 'Amplo',
}

// =============================================================================
// HOOK: useAccessibility
// =============================================================================

export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings)
  const [isLoaded, setIsLoaded] = useState(false)

  // Carregar configuracoes do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setSettings({ ...defaultSettings, ...parsed })
      }
    } catch {
      // Ignora erros de parsing
    }
    setIsLoaded(true)
  }, [])

  // Aplicar configuracoes ao DOM
  useEffect(() => {
    if (!isLoaded) return

    const html = document.documentElement

    // Font size
    html.setAttribute('data-font-scale', settings.fontSize)

    // Line height
    html.setAttribute('data-line-height', settings.lineHeight)

    // High contrast
    if (settings.highContrast) {
      html.classList.add('high-contrast')
      html.setAttribute('data-high-contrast', 'true')
    } else {
      html.classList.remove('high-contrast')
      html.setAttribute('data-high-contrast', 'false')
    }

    // Reduced motion
    html.setAttribute('data-reduced-motion', String(settings.reducedMotion))

  }, [settings, isLoaded])

  // Salvar no localStorage
  const saveSettings = useCallback((newSettings: AccessibilitySettings) => {
    setSettings(newSettings)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
    } catch {
      // Ignora erros de storage
    }
  }, [])

  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    saveSettings({ ...settings, [key]: value })
  }, [settings, saveSettings])

  const resetSettings = useCallback(() => {
    saveSettings(defaultSettings)
  }, [saveSettings])

  return {
    settings,
    updateSetting,
    resetSettings,
    isLoaded,
  }
}

// =============================================================================
// COMPONENTE: AccessibilityToolbar
// =============================================================================

interface AccessibilityToolbarProps {
  className?: string
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export function AccessibilityToolbar({
  className,
  position = 'top-right'
}: AccessibilityToolbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { settings, updateSetting, resetSettings, isLoaded } = useAccessibility()
  const { announce } = useAnnounce()

  const positionClasses: Record<string, string> = {
    'top-right': 'top-20 right-4',
    'top-left': 'top-20 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  }

  const cycleFontSize = useCallback(() => {
    const sizes: FontSize[] = ['normal', 'medium', 'large']
    const currentIndex = sizes.indexOf(settings.fontSize)
    const nextIndex = (currentIndex + 1) % sizes.length
    const nextSize = sizes[nextIndex]
    updateSetting('fontSize', nextSize)
    announce(`Tamanho da fonte: ${fontSizeLabels[nextSize]}`)
  }, [settings.fontSize, updateSetting, announce])

  const cycleLineHeight = useCallback(() => {
    const heights: LineHeight[] = ['normal', 'comfortable', 'spacious']
    const currentIndex = heights.indexOf(settings.lineHeight)
    const nextIndex = (currentIndex + 1) % heights.length
    const nextHeight = heights[nextIndex]
    updateSetting('lineHeight', nextHeight)
    announce(`Espacamento de linha: ${lineHeightLabels[nextHeight]}`)
  }, [settings.lineHeight, updateSetting, announce])

  const toggleHighContrast = useCallback(() => {
    const newValue = !settings.highContrast
    updateSetting('highContrast', newValue)
    announce(newValue ? 'Alto contraste ativado' : 'Alto contraste desativado')
  }, [settings.highContrast, updateSetting, announce])

  const toggleReducedMotion = useCallback(() => {
    const newValue = !settings.reducedMotion
    updateSetting('reducedMotion', newValue)
    announce(newValue ? 'Animacoes reduzidas' : 'Animacoes normais')
  }, [settings.reducedMotion, updateSetting, announce])

  const handleReset = useCallback(() => {
    resetSettings()
    announce('Configuracoes de acessibilidade restauradas')
  }, [resetSettings, announce])

  // Nao renderizar no servidor
  if (!isLoaded) {
    return null
  }

  return (
    <div
      id="accessibility-toolbar"
      className={cn(
        'fixed z-[1000]',
        positionClasses[position],
        className
      )}
    >
      {/* Botao de toggle */}
      <Button
        variant="default"
        size="icon"
        onClick={() => {
          setIsOpen(!isOpen)
          announce(isOpen ? 'Painel de acessibilidade fechado' : 'Painel de acessibilidade aberto')
        }}
        className={cn(
          'h-12 w-12 rounded-full shadow-lg',
          'bg-camara-primary hover:bg-camara-primary/90',
          'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2',
          'transition-transform duration-200',
          isOpen && 'rotate-180'
        )}
        aria-label={isOpen ? 'Fechar painel de acessibilidade' : 'Abrir painel de acessibilidade'}
        aria-expanded={isOpen}
        aria-controls="accessibility-panel"
      >
        {isOpen ? (
          <X className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Eye className="h-5 w-5" aria-hidden="true" />
        )}
      </Button>

      {/* Painel de opcoes */}
      <div
        id="accessibility-panel"
        role="dialog"
        aria-label="Opcoes de acessibilidade"
        aria-hidden={!isOpen}
        className={cn(
          'absolute mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200',
          'transition-all duration-200 ease-in-out',
          position.includes('right') ? 'right-0' : 'left-0',
          isOpen
            ? 'opacity-100 visible translate-y-0'
            : 'opacity-0 invisible -translate-y-2 pointer-events-none'
        )}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="h-4 w-4" aria-hidden="true" />
            Acessibilidade
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Ajuste a visualizacao conforme sua necessidade
          </p>
        </div>

        {/* Opcoes */}
        <div className="p-4 space-y-4">
          {/* Tamanho da Fonte */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Type className="h-4 w-4" aria-hidden="true" />
              Tamanho da Fonte
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const sizes: FontSize[] = ['normal', 'medium', 'large']
                  const currentIndex = sizes.indexOf(settings.fontSize)
                  if (currentIndex > 0) {
                    const newSize = sizes[currentIndex - 1]
                    updateSetting('fontSize', newSize)
                    announce(`Tamanho da fonte: ${fontSizeLabels[newSize]}`)
                  }
                }}
                disabled={settings.fontSize === 'normal'}
                className="h-10 w-10 p-0"
                aria-label="Diminuir tamanho da fonte"
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </Button>
              <span
                className="flex-1 text-center text-sm font-medium min-w-[80px] py-2 bg-gray-100 rounded"
                aria-live="polite"
              >
                {fontSizeLabels[settings.fontSize]}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const sizes: FontSize[] = ['normal', 'medium', 'large']
                  const currentIndex = sizes.indexOf(settings.fontSize)
                  if (currentIndex < sizes.length - 1) {
                    const newSize = sizes[currentIndex + 1]
                    updateSetting('fontSize', newSize)
                    announce(`Tamanho da fonte: ${fontSizeLabels[newSize]}`)
                  }
                }}
                disabled={settings.fontSize === 'large'}
                className="h-10 w-10 p-0"
                aria-label="Aumentar tamanho da fonte"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>

          {/* Espacamento de Linha */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <LayoutList className="h-4 w-4" aria-hidden="true" />
              Espacamento de Linha
            </label>
            <div className="flex gap-1">
              {(['normal', 'comfortable', 'spacious'] as LineHeight[]).map((height) => (
                <Button
                  key={height}
                  variant={settings.lineHeight === height ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    updateSetting('lineHeight', height)
                    announce(`Espacamento de linha: ${lineHeightLabels[height]}`)
                  }}
                  className={cn(
                    'flex-1 text-xs',
                    settings.lineHeight === height && 'bg-camara-primary'
                  )}
                  aria-pressed={settings.lineHeight === height}
                >
                  {lineHeightLabels[height]}
                </Button>
              ))}
            </div>
          </div>

          {/* Alto Contraste */}
          <div className="flex items-center justify-between py-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Contrast className="h-4 w-4" aria-hidden="true" />
              Alto Contraste
            </label>
            <button
              onClick={toggleHighContrast}
              role="switch"
              aria-checked={settings.highContrast}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-camara-primary focus:ring-offset-2',
                settings.highContrast ? 'bg-camara-primary' : 'bg-gray-200'
              )}
            >
              <span className="sr-only">Ativar alto contraste</span>
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  settings.highContrast ? 'translate-x-6' : 'translate-x-1'
                )}
                aria-hidden="true"
              />
            </button>
          </div>

          {/* Reducao de Movimento */}
          <div className="flex items-center justify-between py-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Settings className="h-4 w-4" aria-hidden="true" />
              Reduzir Animacoes
            </label>
            <button
              onClick={toggleReducedMotion}
              role="switch"
              aria-checked={settings.reducedMotion}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-camara-primary focus:ring-offset-2',
                settings.reducedMotion ? 'bg-camara-primary' : 'bg-gray-200'
              )}
            >
              <span className="sr-only">Reduzir animacoes</span>
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  settings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                )}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {/* Footer com reset */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-lg">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Restaurar Padrao
          </Button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// COMPONENTE: AccessibilityProvider (Context opcional)
// =============================================================================

const AccessibilityContext = createContext<ReturnType<typeof useAccessibility> | null>(null)

interface AccessibilityProviderProps {
  children: ReactNode
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const accessibility = useAccessibility()

  return (
    <AccessibilityContext.Provider value={accessibility}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibilityContext() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibilityContext must be used within AccessibilityProvider')
  }
  return context
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { AccessibilitySettings, FontSize, LineHeight }
