'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface LeiDisponivel {
  id: string
  numero: string
  ano: number
  titulo: string
}

interface LeiReferenciadaModalProps {
  isOpen: boolean
  leisDisponiveis: LeiDisponivel[]
  leiSelecionada: string
  tipoRelacao: string
  dispositivo: string
  justificativa: string
  onClose: () => void
  onAdd: () => void
  onLeiChange: (lei: string) => void
  onTipoRelacaoChange: (tipo: string) => void
  onDispositivoChange: (dispositivo: string) => void
  onJustificativaChange: (justificativa: string) => void
}

export function LeiReferenciadaModal({
  isOpen,
  leisDisponiveis,
  leiSelecionada,
  tipoRelacao,
  dispositivo,
  justificativa,
  onClose,
  onAdd,
  onLeiChange,
  onTipoRelacaoChange,
  onDispositivoChange,
  onJustificativaChange
}: LeiReferenciadaModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Adicionar Lei Referenciada</CardTitle>
          <CardDescription>Selecione uma lei e o tipo de relação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Lei</Label>
            <Select value={leiSelecionada} onValueChange={onLeiChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma lei" />
              </SelectTrigger>
              <SelectContent>
                {leisDisponiveis.map((lei) => (
                  <SelectItem key={lei.id} value={lei.id}>
                    {lei.numero}/{lei.ano} - {lei.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tipo de Relação</Label>
            <Select value={tipoRelacao} onValueChange={onTipoRelacaoChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de relação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="altera">Altera</SelectItem>
                <SelectItem value="revoga">Revoga</SelectItem>
                <SelectItem value="inclui">Inclui</SelectItem>
                <SelectItem value="exclui">Exclui</SelectItem>
                <SelectItem value="regulamenta">Regulamenta</SelectItem>
                <SelectItem value="complementa">Complementa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Dispositivo Específico (Opcional)</Label>
            <Input
              value={dispositivo}
              onChange={(e) => onDispositivoChange(e.target.value)}
              placeholder="Ex: Art. 15, § 2º"
            />
          </div>
          <div>
            <Label>Justificativa (Opcional)</Label>
            <Textarea
              value={justificativa}
              onChange={(e) => onJustificativaChange(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" onClick={onAdd}>
              Adicionar Lei
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
