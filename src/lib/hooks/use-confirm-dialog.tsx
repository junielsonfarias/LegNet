'use client'

import * as React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

interface ConfirmOptions {
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** Estilo do botao confirmar */
  variant?: 'default' | 'destructive'
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = React.createContext<ConfirmFn | null>(null)

/**
 * Provider que disponibiliza o hook `useConfirm` em toda a aplicacao.
 * Renderize uma vez em layout (admin ou root).
 *
 * ```tsx
 * // app/admin/layout.tsx
 * <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
 * ```
 */
export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const [options, setOptions] = React.useState<ConfirmOptions | null>(null)
  const resolveRef = React.useRef<((value: boolean) => void) | null>(null)

  const confirm = React.useCallback<ConfirmFn>((opts) => {
    setOptions(opts)
    setOpen(true)
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  const handleResolve = (value: boolean) => {
    setOpen(false)
    resolveRef.current?.(value)
    resolveRef.current = null
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={open} onOpenChange={(o) => !o && handleResolve(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options?.title}</AlertDialogTitle>
            {options?.description && (
              <AlertDialogDescription>{options.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleResolve(false)}>
              {options?.cancelLabel || 'Cancelar'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleResolve(true)}
              className={cn(
                options?.variant === 'destructive' && 'bg-destructive hover:bg-destructive/90'
              )}
            >
              {options?.confirmLabel || 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  )
}

/**
 * Hook que substitui `window.confirm()` por AlertDialog estilizado.
 *
 * ```tsx
 * const confirm = useConfirm()
 *
 * const handleDelete = async () => {
 *   const ok = await confirm({
 *     title: 'Excluir item?',
 *     description: 'Esta acao nao pode ser desfeita.',
 *     variant: 'destructive',
 *     confirmLabel: 'Excluir',
 *   })
 *   if (!ok) return
 *   await deleteItem()
 * }
 * ```
 */
export function useConfirm(): ConfirmFn {
  const ctx = React.useContext(ConfirmContext)
  if (!ctx) {
    throw new Error('useConfirm precisa estar dentro de <ConfirmDialogProvider>. Adicione o provider em admin/layout.tsx.')
  }
  return ctx
}
