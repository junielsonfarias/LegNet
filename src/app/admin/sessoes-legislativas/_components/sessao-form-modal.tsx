'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { SessaoFormData, SessaoLocal, TipoSessao } from '../_types'

interface SessaoFormModalProps {
  isOpen: boolean
  editingSessao: SessaoLocal | null
  formData: SessaoFormData
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  onFormDataChange: (data: SessaoFormData) => void
}

export function SessaoFormModal({
  isOpen,
  editingSessao,
  formData,
  onClose,
  onSubmit,
  onFormDataChange
}: SessaoFormModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{editingSessao ? 'Editar Sessão' : 'Nova Sessão'}</CardTitle>
          <CardDescription>
            {editingSessao ? 'Atualize os dados da sessão' : 'Preencha os dados para criar uma nova sessão'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numero">Número (opcional)</Label>
                <Input
                  id="numero"
                  type="number"
                  value={formData.numero}
                  onChange={(e) => onFormDataChange({ ...formData, numero: e.target.value })}
                  placeholder="Gerado automaticamente"
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <select
                  id="tipo"
                  value={formData.tipo}
                  onChange={(e) => onFormDataChange({ ...formData, tipo: e.target.value as TipoSessao })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="ORDINARIA">Ordinária</option>
                  <option value="EXTRAORDINARIA">Extraordinária</option>
                  <option value="ESPECIAL">Especial</option>
                  <option value="SOLENE">Solene</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data">Data</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => onFormDataChange({ ...formData, data: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="horario">Horário</Label>
                <Input
                  id="horario"
                  type="time"
                  value={formData.horario}
                  onChange={(e) => onFormDataChange({ ...formData, horario: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="local">Local</Label>
              <Input
                id="local"
                value={formData.local}
                onChange={(e) => onFormDataChange({ ...formData, local: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => onFormDataChange({ ...formData, descricao: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="finalizada"
                checked={formData.finalizada}
                onChange={(e) => onFormDataChange({ ...formData, finalizada: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="finalizada">Sessão já realizada (dados históricos)</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingSessao ? 'Atualizar' : 'Criar'} Sessão
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
