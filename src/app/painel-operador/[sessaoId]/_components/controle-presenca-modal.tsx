'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Users } from 'lucide-react'
import { PresencaControl } from '@/components/admin/presenca-control'

type SessaoStatus = 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'

interface ControlePresencaModalProps {
  open: boolean
  sessaoId: string
  sessaoStatus: SessaoStatus
  onClose: () => void
  onRefresh: () => void
}

export function ControlePresencaModal({
  open,
  sessaoId,
  sessaoStatus,
  onClose,
  onRefresh
}: ControlePresencaModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-3xl w-[95vw] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2 text-slate-900">
            <Users className="h-5 w-5 text-blue-600" />
            Controle de Presenca
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto py-2">
          <PresencaControl sessaoId={sessaoId} sessaoStatus={sessaoStatus} />
        </div>
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => { onClose(); onRefresh() }}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
