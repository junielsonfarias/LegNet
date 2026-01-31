'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, FileText, Link2, Users, Paperclip, X } from 'lucide-react'
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

  // Encontra o tipo selecionado para exibir a sigla
  const tipoSelecionado = tiposProposicao.find(t => t.codigo === formData.tipo)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <CardHeader className="border-b bg-gray-50/80 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {editingProposicao ? 'Editar Proposição' : 'Nova Proposição'}
              </CardTitle>
              <CardDescription className="mt-1">
                {editingProposicao ? 'Atualize os dados da proposição' : 'Preencha os dados para criar uma nova proposição'}
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Seção: Identificação */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Identificação
              </h3>

              {/* Linha 1: Tipo e Numeração */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Tipo - Ocupa mais espaço */}
                <div className="lg:col-span-5">
                  <Label htmlFor="tipo">Tipo de Proposição</Label>
                  <Select value={formData.tipo} onValueChange={onTipoChange}>
                    <SelectTrigger className="mt-1.5">
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
                                  className="w-3 h-3 rounded-full flex-shrink-0"
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

                {/* Número */}
                <div className="lg:col-span-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => onFormDataChange({ ...formData, numero: e.target.value })}
                    disabled={formData.numeroAutomatico}
                    required
                    className={`mt-1.5 ${!validarNumeroManual(formData.numero) ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder={formData.numeroAutomatico ? 'Auto' : '001'}
                  />
                </div>

                {/* Ano */}
                <div className="lg:col-span-2">
                  <Label htmlFor="ano">Ano</Label>
                  <Input
                    id="ano"
                    type="number"
                    value={formData.ano}
                    onChange={(e) => onAnoChange(parseInt(e.target.value))}
                    required
                    className="mt-1.5"
                  />
                </div>

                {/* Data de Apresentação */}
                <div className="lg:col-span-3">
                  <Label htmlFor="dataApresentacao">Data de Apresentação</Label>
                  <Input
                    id="dataApresentacao"
                    type="date"
                    value={formData.dataApresentacao}
                    onChange={(e) => onFormDataChange({ ...formData, dataApresentacao: e.target.value })}
                    required
                    className="mt-1.5"
                  />
                </div>
              </div>

              {/* Controle de Numeração e Preview */}
              <div className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 rounded-lg border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id="numeroAutomatico"
                    checked={formData.numeroAutomatico}
                    onChange={(e) => onNumeroAutomaticoChange(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-sm text-gray-700">Numeração automática sequencial</span>
                </label>

                {formData.numero && formData.tipo && (
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-sm text-gray-500">Identificador:</span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {tipoSelecionado && (
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: tipoSelecionado.corBadge || '#3b82f6' }}
                        />
                      )}
                      {tipoSelecionado?.sigla || 'PROP'} {formData.numero}/{formData.ano}
                    </span>
                  </div>
                )}
              </div>

              {!validarNumeroManual(formData.numero) && (
                <p className="text-xs text-red-500">
                  Este número já existe para este tipo no ano selecionado.
                </p>
              )}
            </div>

            {/* Seção: Conteúdo */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Conteúdo
              </h3>

              <div>
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => onFormDataChange({ ...formData, titulo: e.target.value })}
                  required
                  className="mt-1.5"
                  placeholder="Título da proposição"
                />
              </div>

              <div>
                <Label htmlFor="ementa">Ementa</Label>
                <Textarea
                  id="ementa"
                  value={formData.ementa}
                  onChange={(e) => onFormDataChange({ ...formData, ementa: e.target.value })}
                  rows={2}
                  required
                  className="mt-1.5 resize-none"
                  placeholder="Resumo da proposição (será exibido nas listagens)"
                />
              </div>

              <div>
                <Label htmlFor="textoCompleto">Texto Completo (Opcional)</Label>
                <Textarea
                  id="textoCompleto"
                  value={formData.textoCompleto}
                  onChange={(e) => onFormDataChange({ ...formData, textoCompleto: e.target.value })}
                  rows={4}
                  className="mt-1.5 resize-none"
                  placeholder="Texto integral da proposição"
                />
              </div>

              <div>
                <Label htmlFor="urlDocumento" className="flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5" />
                  URL do Documento (Opcional)
                </Label>
                <Input
                  id="urlDocumento"
                  type="url"
                  value={formData.urlDocumento}
                  onChange={(e) => onFormDataChange({ ...formData, urlDocumento: e.target.value })}
                  placeholder="https://drive.google.com/... ou outro link"
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* Seção: Autoria */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                <Users className="h-4 w-4" />
                Autoria
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="autorId">Autor Principal *</Label>
                  <Select value={formData.autorId} onValueChange={(value) => onFormDataChange({ ...formData, autorId: value })}>
                    <SelectTrigger className="mt-1.5">
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
                  <Label>Coautores (Opcional)</Label>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (value && !formData.autores.includes(value)) {
                        onFormDataChange({ ...formData, autores: [...formData.autores, value] })
                      }
                    }}
                  >
                    <SelectTrigger className="mt-1.5">
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
                </div>
              </div>

              {formData.autores.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.autores.map((autorId) => {
                    const autor = parlamentares.find(p => p.id === autorId)
                    return autor ? (
                      <span
                        key={autorId}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {autor.nome}
                        <button
                          type="button"
                          onClick={() => onFormDataChange({
                            ...formData,
                            autores: formData.autores.filter(id => id !== autorId)
                          })}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ) : null
                  })}
                </div>
              )}
            </div>

            {/* Seção: Anexos e Referências */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Anexos */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Anexos
                </h3>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <input
                    type="file"
                    id="anexos"
                    multiple
                    accept=".pdf,.doc,.docx"
                    onChange={onFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="anexos" className="cursor-pointer flex flex-col items-center text-gray-500">
                    <Paperclip className="h-6 w-6 mb-1 text-gray-400" />
                    <span className="text-sm">Clique para anexar arquivos</span>
                    <span className="text-xs text-gray-400">PDF, DOC, DOCX (max. 10MB)</span>
                  </label>
                </div>
                {formData.anexos.length > 0 && (
                  <div className="space-y-1.5">
                    {formData.anexos.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded text-sm">
                        <span className="truncate flex-1">{file.name}</span>
                        <span className="text-gray-400 text-xs mx-2">{formatFileSize(file.size)}</span>
                        <button
                          type="button"
                          onClick={() => onRemoveFile(index)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Leis Referenciadas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Leis Referenciadas
                  </h3>
                  <Button type="button" variant="outline" size="sm" onClick={onOpenLeiModal}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
                  </Button>
                </div>
                {formData.leisReferenciadas.length > 0 ? (
                  <div className="space-y-1.5">
                    {formData.leisReferenciadas.map((lei, index) => (
                      <div key={lei.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded text-sm">
                        <div className="flex-1">
                          <span className="font-medium">{lei.leiNumero}</span>
                          <span className="mx-1.5 text-gray-400">-</span>
                          <span className="text-gray-600">{getTipoRelacaoLabel(lei.tipoRelacao)}</span>
                          {lei.dispositivo && (
                            <span className="text-gray-400 ml-1">({lei.dispositivo})</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoverLei(index)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4 border-2 border-dashed rounded-lg">
                    Nenhuma lei referenciada
                  </p>
                )}
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-3 pt-4 border-t">
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
