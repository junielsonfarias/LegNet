'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Keyboard } from 'lucide-react'
import { formatShortcut, type KeyboardShortcut } from '@/lib/hooks/use-keyboard-shortcuts'

interface ShortcutsHelpDialogProps {
  open: boolean
  onClose: () => void
  shortcuts: KeyboardShortcut[]
}

/**
 * Dialog de ajuda com atalhos de teclado
 *
 * Exibe todos os atalhos disponiveis agrupados por categoria
 */
export function ShortcutsHelpDialog({
  open,
  onClose,
  shortcuts
}: ShortcutsHelpDialogProps) {
  // Agrupar atalhos por categoria
  const shortcutsByCategory = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'Geral'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(shortcut)
    return acc
  }, {} as Record<string, KeyboardShortcut[]>)

  // Ordenar categorias
  const categoryOrder = ['Controle', 'Navegacao', 'Sistema', 'Geral']
  const sortedCategories = Object.keys(shortcutsByCategory).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a)
    const indexB = categoryOrder.indexOf(b)
    if (indexA === -1 && indexB === -1) return a.localeCompare(b)
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Keyboard className="h-5 w-5 text-blue-400" />
            Atalhos de Teclado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {sortedCategories.map((category) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcutsByCategory[category].map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
                  >
                    <span className="text-slate-200">{shortcut.description}</span>
                    <Badge
                      variant="outline"
                      className="font-mono text-xs bg-slate-800 border-slate-600 text-blue-300"
                    >
                      {formatShortcut(shortcut)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-700">
          <p className="text-sm text-slate-400 text-center">
            Pressione <Badge variant="outline" className="font-mono text-xs mx-1">Esc</Badge> para fechar
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ShortcutsHelpDialog
