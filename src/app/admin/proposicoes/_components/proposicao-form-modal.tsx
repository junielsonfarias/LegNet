'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'
import type {
  ProposicaoFormData,
  ProposicaoApi,
  TipoProposicaoConfig,
  ParlamentarSimples,
  LeiReferenciada
} from '../_types'

interface ProposicaoFormModalProps {
  isOpen: boolean
  editingProposicao: ProposicaoApi | null
  formData: ProposicaoFormData
  tiposProposicao: TipoProposicaoConfig[]
  loadingTiposProposicao: boolean
  parlamentares: ParlamentarSimples[]
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  onFormDataChange: (data: ProposicaoFormData) => void
  onNumeroAutomaticoChange: (checked: boolean) => void
  onTipoChange: (tipo: string) => void
  onAnoChange: (ano: number) => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveFile: (index: number) => void
  onOpenLeiModal: () => void
  onRemoverLei: (index: number) => void
  validarNumeroManual: (numero: string) => boolean
}

export function ProposicaoFormModal({
  isOpen,
  editingProposicao,
  formData,
  tiposProposicao,
  loadingTiposProposicao,
  parlamentares,
  onClose,
  onSubmit,
  onFormDataChange,
  onNumeroAutomaticoChange,
  onTipoChange,
  onAnoChange,
  onFileUpload,
  onRemoveFile,
  onOpenLeiModal,
  onRemoverLei,
  validarNumeroManual
}: ProposicaoFormModalProps) {
  if (!isOpen) return null

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getTipoRelacaoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'altera': 'Altera',
      'revoga': 'Revoga',
      'inclui': 'Inclui',
      'exclui': 'Exclui',
      'regulamenta': 'Regulamenta',
      'complementa': 'Complementa'
    }
    return labels[tipo] || tipo
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>
            {editingProposicao ? 'Editar Proposição' : 'Nova Proposição'}
          </CardTitle>
          <CardDescription>
            {editingProposicao ? 'Atualize os dados da proposição' : 'Preencha os dados para criar uma nova proposição'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Controle de Numeração */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  id="numeroAutomatico"
                  checked={formData.numeroAutomatico}
                  onChange={(e) => onNumeroAutomaticoChange(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="numeroAutomatico" className="text-sm font-medium">
                  Numeração Automática Sequencial
                </Label>
              </div>
              <p className="text-xs text-gray-600 mb-4">
                {formData.numeroAutomatico
                  ? "O número será gerado automaticamente de forma sequencial para cada tipo de proposição."
                  : "Desmarque apenas para cadastrar dados históricos com numeração específica da Câmara."
                }
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="numero">
                  Número {formData.numeroAutomatico ? '(Gerado)' : '(Manual)'}
                </Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => onFormDataChange({ ...formData, numero: e.target.value })}
                  disabled={formData.numeroAutomatico}
                  required
                  className={!validarNumeroManual(formData.numero) ? 'border-red-500' : ''}
                />
                {!validarNumeroManual(formData.numero) && (
                  <p className="text-xs text-red-500 mt-1">
                    Este número já existe para este tipo no ano selecionado.
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="ano">Ano</Label>
                <Input
                  id="ano"
                  type="number"
                  value={formData.ano}
                  onChange={(e) => onAnoChange(parseInt(e.target.value))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="dataApresentacao">Data de Apresentação</Label>
                <Input
                  id="dataApresentacao"
                  type="date"
                  value={formData.dataApresentacao}
                  onChange={(e) => onFormDataChange({ ...formData, dataApresentacao: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={formData.tipo} onValueChange={onTipoChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingTiposProposicao ? (
                      <SelectItem value="loading" disabled>Carregando tipos...</SelectItem>
                    ) : tiposProposicao.length === 0 ? (
                      <SelectItem value="empty" disabled>Nenhum tipo cadastrado</SelectItem>
                    ) : (
                      tiposProposicao.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.codigo}>
                          <div className="flex items-center gap-2">
                            {tipo.corBadge && (
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: tipo.corBadge }}
                              />
                            )}
                            <span>{tipo.nome} ({tipo.sigla})</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview do número final */}
            {formData.numero && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Número final:</span> {formData.numero}/{formData.ano}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => onFormDataChange({ ...formData, titulo: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="ementa">Ementa</Label>
              <Textarea
                id="ementa"
                value={formData.ementa}
                onChange={(e) => onFormDataChange({ ...formData, ementa: e.target.value })}
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="textoCompleto">Texto Completo</Label>
              <Textarea
                id="textoCompleto"
                value={formData.textoCompleto}
                onChange={(e) => onFormDataChange({ ...formData, textoCompleto: e.target.value })}
                rows={5}
              />
            </div>

            <div>
              <Label htmlFor="urlDocumento">URL do Documento (Opcional)</Label>
              <Input
                id="urlDocumento"
                type="url"
                value={formData.urlDocumento}
                onChange={(e) => onFormDataChange({ ...formData, urlDocumento: e.target.value })}
                placeholder="https://drive.google.com/..."
              />
            </div>

            <div>
              <Label htmlFor="autorId">Autor Principal</Label>
              <Select value={formData.autorId} onValueChange={(value) => onFormDataChange({ ...formData, autorId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o autor principal" />
                </SelectTrigger>
                <SelectContent>
                  {parlamentares.map((parlamentar) => (
                    <SelectItem key={parlamentar.id} value={parlamentar.id}>
                      {parlamentar.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Coautores</Label>
              <Select
                value=""
                onValueChange={(value) => {
                  if (value && !formData.autores.includes(value)) {
                    onFormDataChange({ ...formData, autores: [...formData.autores, value] })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Adicionar coautor" />
                </SelectTrigger>
                <SelectContent>
                  {parlamentares.filter(p => p.id !== formData.autorId).map((parlamentar) => (
                    <SelectItem key={parlamentar.id} value={parlamentar.id}>
                      {parlamentar.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.autores.length > 0 && (
                <div className="mt-2 space-y-1">
                  {formData.autores.map((autorId) => {
                    const autor = parlamentares.find(p => p.id === autorId)
                    return autor ? (
                      <div key={autorId} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded text-sm">
                        <span>{autor.nome}</span>
                        <button
                          type="button"
                          onClick={() => onFormDataChange({
                            ...formData,
                            autores: formData.autores.filter(id => id !== autorId)
                          })}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ) : null
                  })}
                </div>
              )}
            </div>

            {/* Anexos */}
            <div>
              <Label>Anexos</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  id="anexos"
                  multiple
                  accept=".pdf,.doc,.docx"
                  onChange={onFileUpload}
                  className="hidden"
                />
                <label htmlFor="anexos" className="cursor-pointer flex flex-col items-center text-gray-500">
                  <span className="text-sm">Clique para anexar arquivos (PDF, DOC, DOCX)</span>
                  <span className="text-xs text-gray-400 mt-1">Máximo: 10MB por arquivo</span>
                </label>
              </div>
              {formData.anexos.length > 0 && (
                <div className="mt-2 space-y-1">
                  {formData.anexos.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded text-sm">
                      <span>{file.name} ({formatFileSize(file.size)})</span>
                      <button type="button" onClick={() => onRemoveFile(index)} className="text-red-500">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Leis Referenciadas */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Leis Referenciadas</Label>
                <Button type="button" variant="outline" size="sm" onClick={onOpenLeiModal}>
                  <Plus className="h-3 w-3 mr-1" /> Adicionar Lei
                </Button>
              </div>
              {formData.leisReferenciadas.length > 0 && (
                <div className="space-y-2">
                  {formData.leisReferenciadas.map((lei, index) => (
                    <div key={lei.id} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                      <div>
                        <span className="font-medium">{lei.leiNumero}</span>
                        <span className="mx-2">-</span>
                        <span>{getTipoRelacaoLabel(lei.tipoRelacao)}</span>
                        {lei.dispositivo && <span className="text-gray-500 ml-2">({lei.dispositivo})</span>}
                      </div>
                      <button type="button" onClick={() => onRemoverLei(index)} className="text-red-500">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingProposicao ? 'Atualizar' : 'Criar'} Proposição
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
