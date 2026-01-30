'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { LogOut } from 'lucide-react'

interface PresencaParlamentar {
  id: string
  presente: boolean
  justificativa?: string | null
  parlamentar: {
    id: string
    nome: string
    apelido?: string | null
    partido?: string | null
  }
}

interface RetiradaPautaModalProps {
  open: boolean
  itemTitulo: string
  motivoRetirada: string
  autorRetirada: string
  executando: boolean
  presencas?: PresencaParlamentar[]
  onClose: () => void
  onConfirm: () => void
  onMotivoChange: (motivo: string) => void
  onAutorChange: (autor: string) => void
}

export function RetiradaPautaModal({
  open,
  itemTitulo,
  motivoRetirada,
  autorRetirada,
  executando,
  presencas,
  onClose,
  onConfirm,
  onMotivoChange,
  onAutorChange
}: RetiradaPautaModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-yellow-700">
            <LogOut className="h-5 w-5" />
            Retirar de Pauta
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium">Item a ser retirado:</p>
            <p className="text-sm text-gray-700 mt-1">{itemTitulo}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="autorRetirada">Solicitante da retirada (opcional)</Label>
            <Select value={autorRetirada} onValueChange={onAutorChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione quem solicitou" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nao informado</SelectItem>
                <SelectItem value="Mesa Diretora">Mesa Diretora</SelectItem>
                <SelectItem value="Autor da Proposicao">Autor da Proposicao</SelectItem>
                {presencas?.filter(p => p.presente).map(presenca => (
                  <SelectItem key={presenca.parlamentar.id} value={presenca.parlamentar.apelido || presenca.parlamentar.nome}>
                    {presenca.parlamentar.apelido || presenca.parlamentar.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivoRetirada">Motivo da retirada *</Label>
            <Textarea
              id="motivoRetirada"
              value={motivoRetirada}
              onChange={(e) => onMotivoChange(e.target.value)}
              placeholder="Descreva o motivo da retirada da pauta..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={executando || !motivoRetirada.trim()}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            {executando ? 'Retirando...' : 'Confirmar Retirada'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
