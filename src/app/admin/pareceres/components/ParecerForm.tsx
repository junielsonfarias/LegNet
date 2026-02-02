'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Upload, Link, File, X, ExternalLink } from 'lucide-react'
import type { Parecer, CreateParecerInput, UpdateParecerInput } from '@/lib/hooks/use-pareceres'
import { TIPOS_PARECER, type ProposicaoPendente, type ProximoNumeroInfo, formatFileSize } from '../types'
import { toast } from 'sonner'

interface Comissao {
  id: string
  nome: string
  sigla?: string | null
  ativa: boolean
  membros?: any[]
}

interface ParecerFormProps {
  editingParecer: Parecer | null
  comissoes: Comissao[]
  onSubmit: (data: CreateParecerInput | UpdateParecerInput, isEditing: boolean, parecerId?: string) => Promise<void>
  onCancel: () => void
}

export function ParecerForm({
  editingParecer,
  comissoes,
  onSubmit,
  onCancel
}: ParecerFormProps) {
  const [formData, setFormData] = useState<CreateParecerInput>({
    proposicaoId: '',
    comissaoId: '',
    relatorId: '',
    tipo: 'FAVORAVEL',
    fundamentacao: '',
    conclusao: '',
    ementa: '',
    emendasPropostas: '',
    prazoEmissao: '',
    observacoes: '',
    arquivoUrl: null,
    arquivoNome: null,
    arquivoTamanho: null,
    driveUrl: null
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [membrosComissao, setMembrosComissao] = useState<any[]>([])
  const [proposicoesPendentes, setProposicoesPendentes] = useState<ProposicaoPendente[]>([])
  const [proximoNumeroInfo, setProximoNumeroInfo] = useState<ProximoNumeroInfo | null>(null)
  const [loadingProposicoes, setLoadingProposicoes] = useState(false)

  // Carregar dados do parecer em edicao
  useEffect(() => {
    if (editingParecer) {
      setFormData({
        proposicaoId: editingParecer.proposicaoId,
        comissaoId: editingParecer.comissaoId,
        relatorId: editingParecer.relatorId,
        tipo: editingParecer.tipo,
        fundamentacao: editingParecer.fundamentacao,
        conclusao: editingParecer.conclusao || '',
        ementa: editingParecer.ementa || '',
        emendasPropostas: editingParecer.emendasPropostas || '',
        prazoEmissao: editingParecer.prazoEmissao ? editingParecer.prazoEmissao.split('T')[0] : '',
        observacoes: editingParecer.observacoes || '',
        arquivoUrl: editingParecer.arquivoUrl,
        arquivoNome: editingParecer.arquivoNome,
        arquivoTamanho: editingParecer.arquivoTamanho,
        driveUrl: editingParecer.driveUrl
      })
    }
  }, [editingParecer])

  // Atualiza membros quando comissao muda
  useEffect(() => {
    if (formData.comissaoId) {
      const comissao = comissoes.find(c => c.id === formData.comissaoId)
      if (comissao?.membros) {
        setMembrosComissao(comissao.membros.filter((m: any) => m.ativo))
      }
    } else {
      setMembrosComissao([])
    }
  }, [formData.comissaoId, comissoes])

  // Busca proposicoes pendentes quando comissao muda
  useEffect(() => {
    const fetchProposicoesPendentes = async () => {
      if (!formData.comissaoId) {
        setProposicoesPendentes([])
        setProximoNumeroInfo(null)
        return
      }

      setLoadingProposicoes(true)
      try {
        const propResponse = await fetch(`/api/comissoes/${formData.comissaoId}/proposicoes-pendentes`)
        const propData = await propResponse.json()
        if (propData.success && propData.data?.proposicoes) {
          setProposicoesPendentes(propData.data.proposicoes)
        } else {
          setProposicoesPendentes([])
        }

        const numResponse = await fetch(`/api/pareceres/proximo-numero?comissaoId=${formData.comissaoId}`)
        const numData = await numResponse.json()
        if (numData.success && numData.data) {
          setProximoNumeroInfo(numData.data)
        } else {
          setProximoNumeroInfo(null)
        }
      } catch (error) {
        console.error('Erro ao buscar dados da comissao:', error)
        setProposicoesPendentes([])
        setProximoNumeroInfo(null)
      } finally {
        setLoadingProposicoes(false)
      }
    }

    fetchProposicoesPendentes()
  }, [formData.comissaoId])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Por favor, selecione apenas arquivos PDF')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('O arquivo deve ter no maximo 10MB')
        return
      }
      setSelectedFile(file)
      setFormData({
        ...formData,
        arquivoNome: file.name,
        arquivoTamanho: file.size
      })
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setFormData({
      ...formData,
      arquivoUrl: null,
      arquivoNome: null,
      arquivoTamanho: null
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingParecer) {
      const updateData: UpdateParecerInput = {
        tipo: formData.tipo,
        fundamentacao: formData.fundamentacao,
        conclusao: formData.conclusao || undefined,
        ementa: formData.ementa || undefined,
        emendasPropostas: formData.emendasPropostas || undefined,
        prazoEmissao: formData.prazoEmissao || undefined,
        observacoes: formData.observacoes || undefined,
        arquivoUrl: formData.arquivoUrl,
        arquivoNome: formData.arquivoNome,
        arquivoTamanho: formData.arquivoTamanho,
        driveUrl: formData.driveUrl || undefined
      }
      await onSubmit(updateData, true, editingParecer.id)
    } else {
      const createData: CreateParecerInput = {
        ...formData,
        driveUrl: formData.driveUrl || undefined
      }
      await onSubmit(createData, false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {editingParecer ? 'Editar Parecer' : 'Novo Parecer'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Exibicao do proximo numero do parecer */}
          {!editingParecer && proximoNumeroInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Proximo Parecer</p>
                  <p className="text-2xl font-bold text-blue-800">{proximoNumeroInfo.numeroFormatado}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-600">
                    {proximoNumeroInfo.comissao.sigla || proximoNumeroInfo.comissao.nome}
                  </p>
                  <p className="text-xs text-blue-500">
                    {proximoNumeroInfo.totalPareceresAno} parecer(es) em {proximoNumeroInfo.ano}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!editingParecer && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="comissaoId">Comissao *</Label>
                <Select
                  value={formData.comissaoId}
                  onValueChange={(value) => setFormData({ ...formData, comissaoId: value, relatorId: '', proposicaoId: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a comissao" />
                  </SelectTrigger>
                  <SelectContent>
                    {comissoes.filter(c => c.ativa).map(comissao => (
                      <SelectItem key={comissao.id} value={comissao.id}>
                        {comissao.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="proposicaoId">Proposicao em Tramitacao *</Label>
                <Select
                  value={formData.proposicaoId}
                  onValueChange={(value) => setFormData({ ...formData, proposicaoId: value })}
                  disabled={!formData.comissaoId || loadingProposicoes}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !formData.comissaoId
                        ? "Selecione a comissao primeiro"
                        : loadingProposicoes
                          ? "Carregando..."
                          : proposicoesPendentes.length === 0
                            ? "Nenhuma proposicao pendente"
                            : "Selecione a proposicao"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {proposicoesPendentes.map((proposicao) => (
                      <SelectItem key={proposicao.id} value={proposicao.id}>
                        {proposicao.tipo} {proposicao.numero}/{proposicao.ano} - {proposicao.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.comissaoId && !loadingProposicoes && proposicoesPendentes.length === 0 && (
                  <p className="text-xs text-amber-600">
                    Nao ha proposicoes em tramitacao para esta comissao sem parecer.
                  </p>
                )}
                {formData.comissaoId && proposicoesPendentes.length > 0 && (
                  <p className="text-xs text-gray-500">
                    {proposicoesPendentes.length} proposicao(oes) aguardando parecer
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="relatorId">Relator *</Label>
                <Select
                  value={formData.relatorId}
                  onValueChange={(value) => setFormData({ ...formData, relatorId: value })}
                  disabled={!formData.comissaoId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o relator" />
                  </SelectTrigger>
                  <SelectContent>
                    {membrosComissao.map((membro: any) => (
                      <SelectItem key={membro.parlamentarId} value={membro.parlamentarId}>
                        {membro.parlamentar?.nome || 'Parlamentar'} ({membro.cargo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo do Parecer *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_PARECER.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prazoEmissao">Prazo para Emissao</Label>
              <Input
                id="prazoEmissao"
                type="date"
                value={formData.prazoEmissao}
                onChange={(e) => setFormData({ ...formData, prazoEmissao: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ementa">Ementa</Label>
            <Input
              id="ementa"
              value={formData.ementa}
              onChange={(e) => setFormData({ ...formData, ementa: e.target.value })}
              placeholder="Resumo do parecer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fundamentacao">Fundamentacao *</Label>
            <Textarea
              id="fundamentacao"
              value={formData.fundamentacao}
              onChange={(e) => setFormData({ ...formData, fundamentacao: e.target.value })}
              placeholder="Analise e fundamentacao do parecer..."
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="conclusao">Conclusao</Label>
            <Textarea
              id="conclusao"
              value={formData.conclusao}
              onChange={(e) => setFormData({ ...formData, conclusao: e.target.value })}
              placeholder="Conclusao do parecer..."
              rows={3}
            />
          </div>

          {(formData.tipo === 'FAVORAVEL_COM_EMENDAS') && (
            <div className="space-y-2">
              <Label htmlFor="emendasPropostas">Emendas Propostas</Label>
              <Textarea
                id="emendasPropostas"
                value={formData.emendasPropostas}
                onChange={(e) => setFormData({ ...formData, emendasPropostas: e.target.value })}
                placeholder="Descreva as emendas propostas..."
                rows={4}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observacoes</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observacoes adicionais..."
              rows={2}
            />
          </div>

          {/* Secao de Anexos */}
          <div className="border-t pt-4 mt-4">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Anexos do Parecer
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Upload de Arquivo PDF */}
              <div className="space-y-2">
                <Label htmlFor="arquivoPdf">Arquivo PDF do Parecer</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                  {selectedFile || formData.arquivoNome ? (
                    <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <File className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {selectedFile?.name || formData.arquivoNome}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(selectedFile?.size || formData.arquivoTamanho)}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveFile}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label htmlFor="arquivoPdf" className="cursor-pointer block text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Clique para selecionar ou arraste o arquivo
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Apenas PDF, maximo 10MB
                      </p>
                      <input
                        type="file"
                        id="arquivoPdf"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Anexe o documento PDF do parecer assinado
                </p>
              </div>

              {/* Link do Drive */}
              <div className="space-y-2">
                <Label htmlFor="driveUrl">Link do Drive (Google Drive, OneDrive, etc.)</Label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="driveUrl"
                    type="url"
                    value={formData.driveUrl || ''}
                    onChange={(e) => setFormData({ ...formData, driveUrl: e.target.value || null })}
                    placeholder="https://drive.google.com/..."
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Cole o link de compartilhamento do arquivo no Google Drive, OneDrive ou outro servico
                </p>
                {formData.driveUrl && (
                  <a
                    href={formData.driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Abrir link
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button type="submit">
              {editingParecer ? 'Atualizar' : 'Criar Parecer'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
