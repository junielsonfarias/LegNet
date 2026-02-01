'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface RetirarPautaModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (motivo: string) => Promise<void>
  itemTitulo: string
}

export function RetirarPautaModal({ open, onClose, onConfirm, itemTitulo }: RetirarPautaModalProps) {
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (!motivo.trim()) return
    setLoading(true)
    try {
      await onConfirm(motivo)
      setMotivo('')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setMotivo('')
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-400">
            <AlertTriangle className="h-5 w-5" />
            Retirar de Pauta
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            A proposicao sera retirada desta sessao e ficara disponivel para inclusao em pautas futuras.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-3">
            <p className="text-sm font-medium text-orange-200">
              {itemTitulo}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo" className="text-slate-300">
              Motivo da retirada <span className="text-red-400">*</span>
            </Label>
            <Textarea
              id="motivo"
              placeholder="Informe o motivo da retirada de pauta (ex: solicitacao do autor, necessidade de mais analise...)"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={loading}
            className="text-slate-400 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={loading || !motivo.trim()}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Retirando...
              </>
            ) : (
              'Confirmar Retirada'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
