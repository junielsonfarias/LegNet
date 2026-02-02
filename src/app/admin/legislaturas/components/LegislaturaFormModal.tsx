'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Save, Loader2, Plus } from 'lucide-react'
import type { LegislaturaFormData, Periodo } from '../types'

interface LegislaturaFormModalProps {
  open: boolean
  editingId: string | null
  formData: LegislaturaFormData
  periodos: Periodo[]
  loadingSave: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  onFormChange: (data: LegislaturaFormData) => void
  onAdicionarPeriodo: () => void
  onRemoverPeriodo: (index: number) => void
  onAtualizarPeriodo: (index: number, campo: string, valor: any) => void
  onAdicionarCargo: (periodoIndex: number) => void
  onRemoverCargo: (periodoIndex: number, cargoIndex: number) => void
  onAtualizarCargo: (periodoIndex: number, cargoIndex: number, campo: string, valor: any) => void
}

export function LegislaturaFormModal({
  open,
  editingId,
  formData,
  periodos,
  loadingSave,
  onClose,
  onSubmit,
  onFormChange,
  onAdicionarPeriodo,
  onRemoverPeriodo,
  onAtualizarPeriodo,
  onAdicionarCargo,
  onRemoverCargo,
  onAtualizarCargo
}: LegislaturaFormModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {editingId ? 'Editar Legislatura' : 'Nova Legislatura'}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Dados Basicos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="numero">Numero da Legislatura *</Label>
                <Input
                  id="numero"
                  type="number"
                  value={formData.numero}
                  onChange={(e) => onFormChange({ ...formData, numero: e.target.value })}
                  placeholder="Ex: 1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="anoInicio">Ano de Inicio *</Label>
                <Input
                  id="anoInicio"
                  type="number"
                  value={formData.anoInicio}
                  onChange={(e) => onFormChange({ ...formData, anoInicio: e.target.value })}
                  placeholder="Ex: 2025"
                  required
                />
              </div>
              <div>
                <Label htmlFor="anoFim">Ano de Fim *</Label>
                <Input
                  id="anoFim"
                  type="number"
                  value={formData.anoFim}
                  onChange={(e) => onFormChange({ ...formData, anoFim: e.target.value })}
                  placeholder="Ex: 2028"
                  required
                />
              </div>
            </div>

            {/* Datas Completas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="dataInicio">Data de Inicio (dia/mes/ano)</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={formData.dataInicio}
                  onChange={(e) => onFormChange({ ...formData, dataInicio: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Opcional - Data exata do inicio da legislatura</p>
              </div>
              <div>
                <Label htmlFor="dataFim">Data de Fim (dia/mes/ano)</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={formData.dataFim}
                  onChange={(e) => onFormChange({ ...formData, dataFim: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Opcional - Data exata do fim da legislatura</p>
              </div>
            </div>

            {/* Descricao */}
            <div>
              <Label htmlFor="descricao">Descricao</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => onFormChange({ ...formData, descricao: e.target.value })}
                placeholder="Descricao opcional da legislatura"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ativa"
                checked={formData.ativa}
                onChange={(e) => onFormChange({ ...formData, ativa: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="ativa">Legislatura ativa</Label>
            </div>

            {/* Periodos e Cargos */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Periodos e Cargos da Mesa Diretora</h3>
                <Button type="button" variant="outline" size="sm" onClick={onAdicionarPeriodo}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Periodo
                </Button>
              </div>

              {periodos.length === 0 ? (
                <div className="p-4 border rounded-lg bg-gray-50 text-center">
                  <p className="text-gray-600">
                    Nenhum periodo cadastrado. Adicione periodos para configurar os cargos da mesa diretora.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {periodos.map((periodo, periodoIndex) => (
                    <Card key={periodoIndex} className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Periodo {periodo.numero}</CardTitle>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoverPeriodo(periodoIndex)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Data de Inicio *</Label>
                            <Input
                              type="date"
                              value={periodo.dataInicio}
                              onChange={(e) => onAtualizarPeriodo(periodoIndex, 'dataInicio', e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <Label>Data de Fim</Label>
                            <Input
                              type="date"
                              value={periodo.dataFim || ''}
                              onChange={(e) => onAtualizarPeriodo(periodoIndex, 'dataFim', e.target.value || undefined)}
                            />
                          </div>
                          <div>
                            <Label>Descricao</Label>
                            <Input
                              value={periodo.descricao || ''}
                              onChange={(e) => onAtualizarPeriodo(periodoIndex, 'descricao', e.target.value || undefined)}
                              placeholder="Ex: Primeiro bienio"
                            />
                          </div>
                        </div>

                        {/* Cargos */}
                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <Label className="text-sm font-semibold">Cargos da Mesa Diretora</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => onAdicionarCargo(periodoIndex)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Adicionar Cargo
                            </Button>
                          </div>

                          {periodo.cargos.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-2">
                              Nenhum cargo configurado. Adicione os cargos para este periodo.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {periodo.cargos.map((cargo, cargoIndex) => (
                                <div key={cargoIndex} className="flex items-center gap-2 p-2 border rounded">
                                  <Input
                                    placeholder="Nome do cargo (ex: Presidente)"
                                    value={cargo.nome}
                                    onChange={(e) => onAtualizarCargo(periodoIndex, cargoIndex, 'nome', e.target.value)}
                                    className="flex-1"
                                    required
                                  />
                                  <Input
                                    type="number"
                                    placeholder="Ordem"
                                    value={cargo.ordem}
                                    onChange={(e) => onAtualizarCargo(periodoIndex, cargoIndex, 'ordem', parseInt(e.target.value) || 1)}
                                    className="w-20"
                                    min="1"
                                    required
                                  />
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={cargo.obrigatorio}
                                      onChange={(e) => onAtualizarCargo(periodoIndex, cargoIndex, 'obrigatorio', e.target.checked)}
                                      className="rounded border-gray-300"
                                    />
                                    <Label className="text-xs">Obrigatorio</Label>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onRemoverCargo(periodoIndex, cargoIndex)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loadingSave} className="bg-camara-primary hover:bg-camara-primary/90">
                {loadingSave ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingId ? 'Atualizar' : 'Salvar'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
