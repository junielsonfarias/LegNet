'use client'

import { useEffect, useCallback, useRef } from 'react'

export interface KeyboardShortcut {
  /** Tecla principal (ex: 'v', 'Space', 'Enter') */
  key: string
  /** Modificadores opcionais */
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  /** Descricao do atalho para exibicao na ajuda */
  description: string
  /** Funcao a ser executada quando o atalho e acionado */
  handler: () => void
  /** Se o atalho esta habilitado (padrao: true) */
  enabled?: boolean
  /** Categoria para agrupamento na ajuda */
  category?: string
}

export interface UseKeyboardShortcutsOptions {
  /** Lista de atalhos */
  shortcuts: KeyboardShortcut[]
  /** Se deve prevenir o comportamento padrao do navegador */
  preventDefault?: boolean
  /** Se os atalhos estao habilitados globalmente */
  enabled?: boolean
  /** Elementos que devem ser ignorados (inputs, textareas, etc) */
  ignoreElements?: string[]
}

/**
 * Formata uma tecla para exibicao
 */
export function formatKey(key: string): string {
  const keyMap: Record<string, string> = {
    ' ': 'Espaco',
    'Space': 'Espaco',
    'ArrowUp': 'Seta Cima',
    'ArrowDown': 'Seta Baixo',
    'ArrowLeft': 'Seta Esq.',
    'ArrowRight': 'Seta Dir.',
    'Enter': 'Enter',
    'Escape': 'Esc',
    'Tab': 'Tab',
    'Backspace': 'Backspace',
    'Delete': 'Delete'
  }
  return keyMap[key] || key.toUpperCase()
}

/**
 * Formata um atalho completo para exibicao
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = []
  if (shortcut.ctrl) parts.push('Ctrl')
  if (shortcut.alt) parts.push('Alt')
  if (shortcut.shift) parts.push('Shift')
  parts.push(formatKey(shortcut.key))
  return parts.join(' + ')
}

/**
 * Hook para gerenciar atalhos de teclado
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   shortcuts: [
 *     { key: ' ', description: 'Pausar/Retomar', handler: togglePause },
 *     { key: 'v', description: 'Iniciar votacao', handler: iniciarVotacao },
 *     { key: 'f', description: 'Finalizar item', handler: finalizarItem },
 *     { key: '?', description: 'Mostrar ajuda', handler: () => setShowHelp(true) }
 *   ]
 * })
 * ```
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions) {
  const {
    shortcuts,
    preventDefault = true,
    enabled = true,
    ignoreElements = ['INPUT', 'TEXTAREA', 'SELECT']
  } = options

  const shortcutsRef = useRef(shortcuts)
  shortcutsRef.current = shortcuts

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    // Ignorar se o foco esta em um elemento de input
    const target = event.target as HTMLElement
    if (ignoreElements.includes(target.tagName)) {
      return
    }

    // Verificar cada atalho
    for (const shortcut of shortcutsRef.current) {
      if (shortcut.enabled === false) continue

      const keyMatches =
        event.key === shortcut.key ||
        event.key.toLowerCase() === shortcut.key.toLowerCase() ||
        (shortcut.key === 'Space' && event.key === ' ') ||
        (shortcut.key === ' ' && event.key === ' ')

      const ctrlMatches = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey
      const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey
      const altMatches = shortcut.alt ? event.altKey : !event.altKey

      if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
        if (preventDefault) {
          event.preventDefault()
        }
        shortcut.handler()
        return
      }
    }
  }, [enabled, preventDefault, ignoreElements])

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])
}

/**
 * Atalhos padrao para o painel do operador
 */
export const OPERATOR_SHORTCUTS_CONFIG = {
  PAUSAR: { key: ' ', description: 'Pausar/Retomar item atual', category: 'Controle' },
  VOTACAO: { key: 'v', description: 'Iniciar votacao', category: 'Controle' },
  FINALIZAR: { key: 'f', description: 'Finalizar item', category: 'Controle' },
  PROXIMO: { key: 'ArrowDown', description: 'Proximo item', category: 'Navegacao' },
  ANTERIOR: { key: 'ArrowUp', description: 'Item anterior', category: 'Navegacao' },
  ATUALIZAR: { key: 'r', description: 'Atualizar dados', category: 'Sistema' },
  AJUDA: { key: '?', shift: true, description: 'Mostrar atalhos', category: 'Sistema' },
  PAINEL_TV: { key: 't', ctrl: true, description: 'Abrir Painel TV', category: 'Sistema' }
}

export default useKeyboardShortcuts
