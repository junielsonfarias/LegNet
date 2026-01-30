'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const ITEM_RESULTADOS: Array<{ value: 'CONCLUIDO' | 'APROVADO' | 'REJEITADO' | 'RETIRADO' | 'ADIADO'; label: string }> = [
  { value: 'CONCLUIDO', label: 'Concluido' },
  { value: 'APROVADO', label: 'Aprovado' },
  { value: 'REJEITADO', label: 'Rejeitado' },
  { value: 'RETIRADO', label: 'Retirado' },
  { value: 'ADIADO', label: 'Adiado' }
]

interface FinalizarItemModalProps {
  open: boolean
  titulo: string
  resultadoSelecionado: string
  executando: boolean
  onClose: () => void
  onConfirm: () => void
  onResultadoChange: (resultado: string) => void
}

export function FinalizarItemModal({
  open,
  titulo,
  resultadoSelecionado,
  executando,
  onClose,
  onConfirm,
  onResultadoChange
}: FinalizarItemModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Finalizar Item</DialogTitle>
        </DialogHeader>
        <div className="py-3">
          <p className="text-sm text-slate-400 mb-3">
            Resultado para: <span className="text-white font-medium">{titulo}</span>
          </p>
          <Select value={resultadoSelecionado} onValueChange={onResultadoChange}>
            <SelectTrigger className="bg-slate-700 border-slate-600 h-9">
              <SelectValue placeholder="Selecione o resultado" />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              {ITEM_RESULTADOS.map(r => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" onClick={onConfirm} disabled={!resultadoSelecionado || executando}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
