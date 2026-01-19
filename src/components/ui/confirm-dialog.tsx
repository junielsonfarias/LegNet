'use client'

import * as React from 'react'
import { AlertTriangle, Trash2, AlertCircle, Info, HelpCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog'
import { Button } from './button'

type ConfirmVariant = 'danger' | 'warning' | 'info' | 'question'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  variant?: ConfirmVariant
  loading?: boolean
  children?: React.ReactNode
}

const variantConfig: Record<ConfirmVariant, {
  icon: React.ElementType
  iconColor: string
  iconBg: string
  confirmButtonVariant: 'destructive' | 'default' | 'outline'
}> = {
  danger: {
    icon: Trash2,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-100',
    confirmButtonVariant: 'destructive'
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-100',
    confirmButtonVariant: 'default'
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    confirmButtonVariant: 'default'
  },
  question: {
    icon: HelpCircle,
    iconColor: 'text-gray-600',
    iconBg: 'bg-gray-100',
    confirmButtonVariant: 'default'
  }
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'danger',
  loading = false,
  children
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const config = variantConfig[variant]
  const Icon = config.icon

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao confirmar:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  const effectiveLoading = loading || isLoading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-full ${config.iconBg}`}>
              <Icon className={`h-6 w-6 ${config.iconColor}`} />
            </div>
            <div className="flex-1">
              <DialogTitle>{title}</DialogTitle>
              {description && (
                <DialogDescription className="mt-2">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        {children && <div className="py-4">{children}</div>}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={effectiveLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={config.confirmButtonVariant}
            onClick={handleConfirm}
            disabled={effectiveLoading}
          >
            {effectiveLoading ? 'Aguarde...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook para facilitar o uso do dialog
interface UseConfirmOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
}

export function useConfirm() {
  const [state, setState] = React.useState<{
    open: boolean
    options: UseConfirmOptions | null
    resolve: ((value: boolean) => void) | null
  }>({
    open: false,
    options: null,
    resolve: null
  })

  const confirm = React.useCallback((options: UseConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        open: true,
        options,
        resolve
      })
    })
  }, [])

  const handleConfirm = React.useCallback(() => {
    state.resolve?.(true)
    setState({ open: false, options: null, resolve: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.resolve])

  const handleCancel = React.useCallback(() => {
    state.resolve?.(false)
    setState({ open: false, options: null, resolve: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.resolve])

  const handleOpenChange = React.useCallback((open: boolean) => {
    if (!open) {
      state.resolve?.(false)
      setState({ open: false, options: null, resolve: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.resolve])

  const ConfirmDialogComponent = React.useCallback(() => {
    if (!state.options) return null

    return (
      <ConfirmDialog
        open={state.open}
        onOpenChange={handleOpenChange}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        {...state.options}
      />
    )
  }, [state.open, state.options, handleOpenChange, handleConfirm, handleCancel])

  return { confirm, ConfirmDialog: ConfirmDialogComponent }
}

// Componentes de conveniência pré-configurados
interface DeleteConfirmProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemName?: string
  itemType?: string
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  itemName,
  itemType = 'item',
  onConfirm,
  onCancel,
  loading
}: DeleteConfirmProps) {
  const title = itemName
    ? `Excluir ${itemName}?`
    : `Excluir ${itemType}?`

  const description = `Esta ação não pode ser desfeita. ${
    itemName
      ? `O ${itemType} "${itemName}" será permanentemente excluído.`
      : `O ${itemType} será permanentemente excluído.`
  }`

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      confirmText="Excluir"
      cancelText="Cancelar"
      variant="danger"
      onConfirm={onConfirm}
      onCancel={onCancel}
      loading={loading}
    />
  )
}

interface UnsavedChangesConfirmProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  onCancel?: () => void
}

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel
}: UnsavedChangesConfirmProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Alterações não salvas"
      description="Você tem alterações não salvas. Deseja sair sem salvar?"
      confirmText="Sair sem salvar"
      cancelText="Continuar editando"
      variant="warning"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}

interface ActionConfirmProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  actionText: string
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
}

export function ActionConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  actionText,
  onConfirm,
  onCancel,
  loading
}: ActionConfirmProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      confirmText={actionText}
      cancelText="Cancelar"
      variant="question"
      onConfirm={onConfirm}
      onCancel={onCancel}
      loading={loading}
    />
  )
}
