'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import {
  FileText,
  Search,
  Plus,
  Edit,
  Trash2,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Vote,
  Send,
  Archive,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Users,
  AlertTriangle,
  Upload,
  Link,
  File,
  X,
  ExternalLink
} from 'lucide-react'
import { usePareceres, Parecer, CreateParecerInput, UpdateParecerInput } from '@/lib/hooks/use-pareceres'
import { useComissoes } from '@/lib/hooks/use-comissoes'
import { useProposicoes } from '@/lib/hooks/use-proposicoes'
import { toast } from 'sonner'

const TIPOS_PARECER = [
  { value: 'FAVORAVEL', label: 'Favorável' },
  { value: 'FAVORAVEL_COM_EMENDAS', label: 'Favorável com Emendas' },
  { value: 'CONTRARIO', label: 'Contrário' },
  { value: 'PELA_INCONSTITUCIONALIDADE', label: 'Pela Inconstitucionalidade' },
  { value: 'PELA_ILEGALIDADE', label: 'Pela Ilegalidade' },
  { value: 'PELA_PREJUDICIALIDADE', label: 'Pela Prejudicialidade' },
  { value: 'PELA_RETIRADA', label: 'Pela Retirada' }
]

const STATUS_PARECER = [
  { value: 'RASCUNHO', label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
  { value: 'AGUARDANDO_PAUTA', label: 'Aguardando Pauta', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'AGUARDANDO_VOTACAO', label: 'Aguardando Votação', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'APROVADO_COMISSAO', label: 'Aprovado pela Comissão', color: 'bg-green-100 text-green-800' },
  { value: 'REJEITADO_COMISSAO', label: 'Rejeitado pela Comissão', color: 'bg-red-100 text-red-800' },
  { value: 'EMITIDO', label: 'Emitido', color: 'bg-blue-100 text-blue-800' },
  { value: 'ARQUIVADO', label: 'Arquivado', color: 'bg-purple-100 text-purple-800' }
]

interface ProposicaoPendente {
  id: string
  numero: string
  ano: number
  tipo: string
  titulo: string
  ementa?: string
  status: string
  autor?: { id: string; nome: string; apelido?: string }
}

interface ProximoNumeroInfo {
  proximoNumero: number
  numeroFormatado: string
  comissao: { id: string; nome: string; sigla: string }
  ano: number
  totalPareceresAno: number
}

export default function PareceresAdminPage() {
  const [filters, setFilters] = useState<{
    comissaoId?: string
    status?: string
    tipo?: string
  }>({})

  const {
    pareceres,
    loading,
    refetch,
    create,
    update,
    remove,
    votar,
    encerrarVotacao,
    getVotos,
    enviarParaVotacao,
    emitirParecer,
    arquivar
  } = usePareceres(filters)

  const { comissoes } = useComissoes()
  const { proposicoes } = useProposicoes()

  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingParecer, setEditingParecer] = useState<Parecer | null>(null)
  const [showVotacaoDialog, setShowVotacaoDialog] = useState(false)
  const [selectedParecer, setSelectedParecer] = useState<Parecer | null>(null)
  const [votosInfo, setVotosInfo] = useState<any>(null)
  const [showDetalhesDialog, setShowDetalhesDialog] = useState(false)

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
    // Campos de anexo
    arquivoUrl: null,
    arquivoNome: null,
    arquivoTamanho: null,
    driveUrl: null
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)

  const [membrosComissao, setMembrosComissao] = useState<any[]>([])
  const [proposicoesPendentes, setProposicoesPendentes] = useState<ProposicaoPendente[]>([])
  const [proximoNumeroInfo, setProximoNumeroInfo] = useState<ProximoNumeroInfo | null>(null)
  const [loadingProposicoes, setLoadingProposicoes] = useState(false)

  // Atualiza membros quando comissão muda
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

  // Busca proposições pendentes quando comissão muda
  useEffect(() => {
    const fetchProposicoesPendentes = async () => {
      if (!formData.comissaoId) {
        setProposicoesPendentes([])
        setProximoNumeroInfo(null)
        return
      }

      setLoadingProposicoes(true)
      try {
        // Buscar proposições pendentes
        const propResponse = await fetch(`/api/comissoes/${formData.comissaoId}/proposicoes-pendentes`)
        const propData = await propResponse.json()
        if (propData.success && propData.data?.proposicoes) {
          setProposicoesPendentes(propData.data.proposicoes)
        } else {
          setProposicoesPendentes([])
        }

        // Buscar próximo número
        const numResponse = await fetch(`/api/pareceres/proximo-numero?comissaoId=${formData.comissaoId}`)
        const numData = await numResponse.json()
        if (numData.success && numData.data) {
          setProximoNumeroInfo(numData.data)
        } else {
          setProximoNumeroInfo(null)
        }
      } catch (error) {
        console.error('Erro ao buscar dados da comissão:', error)
        setProposicoesPendentes([])
        setProximoNumeroInfo(null)
      } finally {
        setLoadingProposicoes(false)
      }
    }

    fetchProposicoesPendentes()
  }, [formData.comissaoId])

  const getTipoLabel = (tipo: string) => {
    return TIPOS_PARECER.find(t => t.value === tipo)?.label || tipo
  }

  const getStatusInfo = (status: string) => {
    return STATUS_PARECER.find(s => s.value === status) || { label: status, color: 'bg-gray-100 text-gray-800' }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'FAVORAVEL':
      case 'FAVORAVEL_COM_EMENDAS':
        return 'bg-green-100 text-green-800'
      case 'CONTRARIO':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-orange-100 text-orange-800'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // TODO: Implementar upload real de arquivo para storage (S3, Supabase Storage, etc.)
    // Por enquanto, o arquivoUrl será null para novos arquivos (funcionalidade de upload pendente)
    // O campo driveUrl funciona normalmente como URL externa

    if (editingParecer) {
      const updateData: UpdateParecerInput = {
        tipo: formData.tipo,
        fundamentacao: formData.fundamentacao,
        conclusao: formData.conclusao || undefined,
        ementa: formData.ementa || undefined,
        emendasPropostas: formData.emendasPropostas || undefined,
        prazoEmissao: formData.prazoEmissao || undefined,
        observacoes: formData.observacoes || undefined,
        // Campos de anexo
        arquivoUrl: formData.arquivoUrl,
        arquivoNome: formData.arquivoNome,
        arquivoTamanho: formData.arquivoTamanho,
        driveUrl: formData.driveUrl || undefined
      }
      await update(editingParecer.id, updateData)
    } else {
      const createData: CreateParecerInput = {
        ...formData,
        driveUrl: formData.driveUrl || undefined
      }
      await create(createData)
    }

    resetForm()
  }

  const resetForm = () => {
    setFormData({
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
    setSelectedFile(null)
    setShowForm(false)
    setEditingParecer(null)
  }

  const handleEdit = (parecer: Parecer) => {
    setEditingParecer(parecer)
    setFormData({
      proposicaoId: parecer.proposicaoId,
      comissaoId: parecer.comissaoId,
      relatorId: parecer.relatorId,
      tipo: parecer.tipo,
      fundamentacao: parecer.fundamentacao,
      conclusao: parecer.conclusao || '',
      ementa: parecer.ementa || '',
      emendasPropostas: parecer.emendasPropostas || '',
      prazoEmissao: parecer.prazoEmissao ? parecer.prazoEmissao.split('T')[0] : '',
      observacoes: parecer.observacoes || '',
      arquivoUrl: parecer.arquivoUrl,
      arquivoNome: parecer.arquivoNome,
      arquivoTamanho: parecer.arquivoTamanho,
      driveUrl: parecer.driveUrl
    })
    setSelectedFile(null)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este parecer?')) {
      await remove(id)
    }
  }

  const handleOpenVotacao = async (parecer: Parecer) => {
    setSelectedParecer(parecer)
    const votos = await getVotos(parecer.id)
    setVotosInfo(votos)
    setShowVotacaoDialog(true)
  }

  const handleVotar = async (parlamentarId: string, voto: 'SIM' | 'NAO' | 'ABSTENCAO') => {
    if (!selectedParecer) return

    const result = await votar(selectedParecer.id, { parlamentarId, voto })
    if (result) {
      const votos = await getVotos(selectedParecer.id)
      setVotosInfo(votos)
    }
  }

  const handleEncerrarVotacao = async (resultado: 'APROVADO_COMISSAO' | 'REJEITADO_COMISSAO') => {
    if (!selectedParecer) return

    const motivoRejeicao = resultado === 'REJEITADO_COMISSAO'
      ? prompt('Informe o motivo da rejeição (opcional):') || undefined
      : undefined

    await encerrarVotacao(selectedParecer.id, {
      action: 'encerrar',
      resultado,
      motivoRejeicao
    })

    setShowVotacaoDialog(false)
    setSelectedParecer(null)
  }

  const handleEnviarParaVotacao = async (parecer: Parecer) => {
    if (confirm('Enviar parecer para votação na comissão?')) {
      await enviarParaVotacao(parecer.id)
    }
  }

  const handleEmitirParecer = async (parecer: Parecer) => {
    if (confirm('Emitir parecer oficialmente?')) {
      await emitirParecer(parecer.id)
    }
  }

  const handleArquivar = async (parecer: Parecer) => {
    if (confirm('Arquivar este parecer?')) {
      await arquivar(parecer.id)
    }
  }

  const handleOpenDetalhes = (parecer: Parecer) => {
    setSelectedParecer(parecer)
    setShowDetalhesDialog(true)
  }

  // Manipulação de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de arquivo (PDF)
      if (file.type !== 'application/pdf') {
        toast.error('Por favor, selecione apenas arquivos PDF')
        return
      }
      // Validar tamanho (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('O arquivo deve ter no máximo 10MB')
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

  const formatFileSize = (bytes: number | null | undefined): string => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredPareceres = pareceres.filter(parecer => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      parecer.numero?.toLowerCase().includes(search) ||
      parecer.proposicao?.titulo?.toLowerCase().includes(search) ||
      parecer.comissao?.nome?.toLowerCase().includes(search) ||
      parecer.relator?.nome?.toLowerCase().includes(search)
    )
  })

  // Agrupar por status para estatísticas
  const stats = {
    total: pareceres.length,
    rascunho: pareceres.filter(p => p.status === 'RASCUNHO').length,
    aguardandoPauta: pareceres.filter(p => p.status === 'AGUARDANDO_PAUTA').length,
    aguardandoVotacao: pareceres.filter(p => p.status === 'AGUARDANDO_VOTACAO').length,
    aprovados: pareceres.filter(p => p.status === 'APROVADO_COMISSAO').length,
    emitidos: pareceres.filter(p => p.status === 'EMITIDO').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando pareceres...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-600" />
            Pareceres das Comissões
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie os pareceres elaborados pelas comissões sobre proposições
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Parecer
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <p className="text-sm text-gray-600">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">{stats.rascunho}</div>
            <p className="text-sm text-gray-600">Rascunho</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-cyan-600">{stats.aguardandoPauta}</div>
            <p className="text-sm text-gray-600">Aguard. Pauta</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.aguardandoVotacao}</div>
            <p className="text-sm text-gray-600">Aguardando Votação</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.aprovados}</div>
            <p className="text-sm text-gray-600">Aprovados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.emitidos}</div>
            <p className="text-sm text-gray-600">Emitidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar pareceres..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.comissaoId || 'all'}
              onValueChange={(value) => setFilters({ ...filters, comissaoId: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por Comissão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Comissões</SelectItem>
                {comissoes.filter(c => c.ativa).map(comissao => (
                  <SelectItem key={comissao.id} value={comissao.id}>
                    {comissao.sigla || comissao.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                {STATUS_PARECER.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.tipo || 'all'}
              onValueChange={(value) => setFilters({ ...filters, tipo: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                {TIPOS_PARECER.map(tipo => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Parecer */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingParecer ? 'Editar Parecer' : 'Novo Parecer'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Exibição do próximo número do parecer */}
              {!editingParecer && proximoNumeroInfo && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Próximo Parecer</p>
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
                    <Label htmlFor="comissaoId">Comissão *</Label>
                    <Select
                      value={formData.comissaoId}
                      onValueChange={(value) => setFormData({ ...formData, comissaoId: value, relatorId: '', proposicaoId: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a comissão" />
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
                    <Label htmlFor="proposicaoId">Proposição em Tramitação *</Label>
                    <Select
                      value={formData.proposicaoId}
                      onValueChange={(value) => setFormData({ ...formData, proposicaoId: value })}
                      disabled={!formData.comissaoId || loadingProposicoes}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !formData.comissaoId
                            ? "Selecione a comissão primeiro"
                            : loadingProposicoes
                              ? "Carregando..."
                              : proposicoesPendentes.length === 0
                                ? "Nenhuma proposição pendente"
                                : "Selecione a proposição"
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
                        Não há proposições em tramitação para esta comissão sem parecer.
                      </p>
                    )}
                    {formData.comissaoId && proposicoesPendentes.length > 0 && (
                      <p className="text-xs text-gray-500">
                        {proposicoesPendentes.length} proposição(ões) aguardando parecer
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
                  <Label htmlFor="prazoEmissao">Prazo para Emissão</Label>
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
                <Label htmlFor="fundamentacao">Fundamentação *</Label>
                <Textarea
                  id="fundamentacao"
                  value={formData.fundamentacao}
                  onChange={(e) => setFormData({ ...formData, fundamentacao: e.target.value })}
                  placeholder="Análise e fundamentação do parecer..."
                  rows={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conclusao">Conclusão</Label>
                <Textarea
                  id="conclusao"
                  value={formData.conclusao}
                  onChange={(e) => setFormData({ ...formData, conclusao: e.target.value })}
                  placeholder="Conclusão do parecer..."
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
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações adicionais..."
                  rows={2}
                />
              </div>

              {/* Seção de Anexos */}
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
                            Apenas PDF, máximo 10MB
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
                      Cole o link de compartilhamento do arquivo no Google Drive, OneDrive ou outro serviço
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
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Pareceres */}
      <div className="space-y-4">
        {filteredPareceres.map((parecer) => {
          const statusInfo = getStatusInfo(parecer.status)

          return (
            <Card key={parecer.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {parecer.numero ? `Parecer nº ${parecer.numero}` : 'Parecer (sem número)'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={statusInfo.color}>
                          {statusInfo.label}
                        </Badge>
                        <Badge className={getTipoColor(parecer.tipo)}>
                          {getTipoLabel(parecer.tipo)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDetalhes(parecer)}
                      title="Ver detalhes"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>

                    {parecer.status === 'RASCUNHO' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(parecer)}
                          title="Editar"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEnviarParaVotacao(parecer)}
                          title="Enviar para votação"
                          className="text-yellow-600 hover:text-yellow-700"
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(parecer.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Excluir"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}

                    {parecer.status === 'AGUARDANDO_VOTACAO' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenVotacao(parecer)}
                        title="Gerenciar votação"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Vote className="h-3 w-3" />
                      </Button>
                    )}

                    {parecer.status === 'APROVADO_COMISSAO' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEmitirParecer(parecer)}
                        title="Emitir parecer"
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                    )}

                    {['APROVADO_COMISSAO', 'REJEITADO_COMISSAO', 'EMITIDO'].includes(parecer.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleArquivar(parecer)}
                        title="Arquivar"
                        className="text-purple-600 hover:text-purple-700"
                      >
                        <Archive className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Informações da Proposição */}
                {parecer.proposicao && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium text-gray-700">
                      {parecer.proposicao.tipo} {parecer.proposicao.numero}/{parecer.proposicao.ano}
                    </p>
                    <p className="text-sm text-gray-600">{parecer.proposicao.titulo}</p>
                    {parecer.proposicao.autor && (
                      <p className="text-xs text-gray-500 mt-1">
                        Autor: {parecer.proposicao.autor.nome}
                      </p>
                    )}
                  </div>
                )}

                {/* Ementa */}
                {parecer.ementa && (
                  <p className="text-gray-700 mb-4 italic">
                    &ldquo;{parecer.ementa}&rdquo;
                  </p>
                )}

                {/* Grid de informações */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">
                      {parecer.comissao?.sigla || parecer.comissao?.nome || 'Comissão'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">
                      Relator: {parecer.relator?.apelido || parecer.relator?.nome || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">
                      {new Date(parecer.dataDistribuicao).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {parecer.status === 'AGUARDANDO_VOTACAO' && (
                    <div className="flex items-center gap-2">
                      <Vote className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">
                        Votos: {parecer.votosAFavor + parecer.votosContra + parecer.votosAbstencao}
                      </span>
                    </div>
                  )}
                  {(parecer.status === 'APROVADO_COMISSAO' || parecer.status === 'REJEITADO_COMISSAO') && (
                    <div className="flex items-center gap-2">
                      <Vote className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">
                        {parecer.votosAFavor} a favor / {parecer.votosContra} contra / {parecer.votosAbstencao} abst.
                      </span>
                    </div>
                  )}
                </div>

                {/* Indicadores de Anexo */}
                {(parecer.arquivoUrl || parecer.arquivoNome || parecer.driveUrl) && (
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t">
                    {(parecer.arquivoUrl || parecer.arquivoNome) && (
                      <div className="flex items-center gap-1 text-sm text-blue-600">
                        <File className="h-4 w-4" />
                        <span>PDF anexado</span>
                        {parecer.arquivoUrl && (
                          <a
                            href={parecer.arquivoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        )}
                      </div>
                    )}
                    {parecer.driveUrl && (
                      <a
                        href={parecer.driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link className="h-4 w-4" />
                        <span>Link do Drive</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {filteredPareceres.length === 0 && !loading && (
          <Card>
            <CardContent className="pt-6 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum parecer encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || Object.keys(filters).length > 0
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece criando o primeiro parecer.'}
              </p>
              {!searchTerm && Object.keys(filters).length === 0 && (
                <Button onClick={() => setShowForm(true)} className="flex items-center gap-2 mx-auto">
                  <Plus className="h-4 w-4" />
                  Novo Parecer
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de Votação */}
      <Dialog open={showVotacaoDialog} onOpenChange={setShowVotacaoDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Votação do Parecer</DialogTitle>
            <DialogDescription>
              {selectedParecer?.numero
                ? `Parecer nº ${selectedParecer.numero}`
                : 'Gerenciar votação do parecer na comissão'}
            </DialogDescription>
          </DialogHeader>

          {votosInfo && (
            <div className="space-y-4">
              {/* Resumo da votação */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{votosInfo.contagem?.aFavor || 0}</div>
                    <p className="text-sm text-gray-600">A Favor</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{votosInfo.contagem?.contra || 0}</div>
                    <p className="text-sm text-gray-600">Contra</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{votosInfo.contagem?.abstencao || 0}</div>
                    <p className="text-sm text-gray-600">Abstenção</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{votosInfo.totalMembros || 0}</div>
                    <p className="text-sm text-gray-600">Total Membros</p>
                  </div>
                </div>
              </div>

              {/* Membros que votaram */}
              {votosInfo.votos && votosInfo.votos.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Votos Registrados</h4>
                  <div className="space-y-2">
                    {votosInfo.votos.map((voto: any) => (
                      <div key={voto.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span>{voto.parlamentar?.nome || 'Parlamentar'}</span>
                        <Badge className={
                          voto.voto === 'SIM' ? 'bg-green-100 text-green-800' :
                          voto.voto === 'NAO' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {voto.voto === 'SIM' ? 'A Favor' : voto.voto === 'NAO' ? 'Contra' : 'Abstenção'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Membros que não votaram */}
              {votosInfo.membrosNaoVotaram && votosInfo.membrosNaoVotaram.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Aguardando Voto</h4>
                  <div className="space-y-2">
                    {votosInfo.membrosNaoVotaram.map((membro: any) => (
                      <div key={membro.parlamentarId} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span>{membro.parlamentar?.nome || 'Parlamentar'}</span>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600"
                            onClick={() => handleVotar(membro.parlamentarId, 'SIM')}
                          >
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            Sim
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => handleVotar(membro.parlamentarId, 'NAO')}
                          >
                            <ThumbsDown className="h-3 w-3 mr-1" />
                            Não
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-yellow-600"
                            onClick={() => handleVotar(membro.parlamentarId, 'ABSTENCAO')}
                          >
                            <Minus className="h-3 w-3 mr-1" />
                            Abst.
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ações de encerramento */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Encerrar Votação</h4>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEncerrarVotacao('APROVADO_COMISSAO')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar Parecer
                  </Button>
                  <Button
                    onClick={() => handleEncerrarVotacao('REJEITADO_COMISSAO')}
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar Parecer
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  * É necessário quórum mínimo (maioria dos membros) para encerrar a votação.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalhes */}
      <Dialog open={showDetalhesDialog} onOpenChange={setShowDetalhesDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedParecer?.numero
                ? `Parecer nº ${selectedParecer.numero}`
                : 'Detalhes do Parecer'}
            </DialogTitle>
          </DialogHeader>

          {selectedParecer && (
            <div className="space-y-4">
              {/* Status e Tipo */}
              <div className="flex gap-2">
                <Badge className={getStatusInfo(selectedParecer.status).color}>
                  {getStatusInfo(selectedParecer.status).label}
                </Badge>
                <Badge className={getTipoColor(selectedParecer.tipo)}>
                  {getTipoLabel(selectedParecer.tipo)}
                </Badge>
              </div>

              {/* Proposição */}
              {selectedParecer.proposicao && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Proposição Analisada</h4>
                  <p className="font-medium">
                    {selectedParecer.proposicao.tipo} {selectedParecer.proposicao.numero}/{selectedParecer.proposicao.ano}
                  </p>
                  <p className="text-gray-700">{selectedParecer.proposicao.titulo}</p>
                  {selectedParecer.proposicao.ementa && (
                    <p className="text-sm text-gray-600 mt-1 italic">
                      {selectedParecer.proposicao.ementa}
                    </p>
                  )}
                </div>
              )}

              {/* Informações Gerais */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Comissão</Label>
                  <p>{selectedParecer.comissao?.nome}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Relator</Label>
                  <p>{selectedParecer.relator?.nome}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Data de Distribuição</Label>
                  <p>{new Date(selectedParecer.dataDistribuicao).toLocaleDateString('pt-BR')}</p>
                </div>
                {selectedParecer.prazoEmissao && (
                  <div>
                    <Label className="text-gray-500">Prazo para Emissão</Label>
                    <p>{new Date(selectedParecer.prazoEmissao).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
              </div>

              {/* Ementa */}
              {selectedParecer.ementa && (
                <div>
                  <Label className="text-gray-500">Ementa</Label>
                  <p className="italic">&ldquo;{selectedParecer.ementa}&rdquo;</p>
                </div>
              )}

              {/* Fundamentação */}
              <div>
                <Label className="text-gray-500">Fundamentação</Label>
                <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
                  {selectedParecer.fundamentacao}
                </div>
              </div>

              {/* Conclusão */}
              {selectedParecer.conclusao && (
                <div>
                  <Label className="text-gray-500">Conclusão</Label>
                  <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
                    {selectedParecer.conclusao}
                  </div>
                </div>
              )}

              {/* Emendas Propostas */}
              {selectedParecer.emendasPropostas && (
                <div>
                  <Label className="text-gray-500">Emendas Propostas</Label>
                  <div className="bg-yellow-50 rounded-lg p-4 whitespace-pre-wrap">
                    {selectedParecer.emendasPropostas}
                  </div>
                </div>
              )}

              {/* Resultado da Votação */}
              {(selectedParecer.status === 'APROVADO_COMISSAO' ||
                selectedParecer.status === 'REJEITADO_COMISSAO' ||
                selectedParecer.status === 'EMITIDO') && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Resultado da Votação</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold text-green-600">{selectedParecer.votosAFavor}</div>
                      <p className="text-sm text-gray-600">A Favor</p>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-red-600">{selectedParecer.votosContra}</div>
                      <p className="text-sm text-gray-600">Contra</p>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-yellow-600">{selectedParecer.votosAbstencao}</div>
                      <p className="text-sm text-gray-600">Abstenção</p>
                    </div>
                  </div>
                  {selectedParecer.dataVotacao && (
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      Votação realizada em {new Date(selectedParecer.dataVotacao).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              )}

              {/* Motivo de Rejeição */}
              {selectedParecer.motivoRejeicao && (
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">Motivo da Rejeição</h4>
                  <p>{selectedParecer.motivoRejeicao}</p>
                </div>
              )}

              {/* Observações */}
              {selectedParecer.observacoes && (
                <div>
                  <Label className="text-gray-500">Observações</Label>
                  <p className="text-gray-600">{selectedParecer.observacoes}</p>
                </div>
              )}

              {/* Anexos */}
              {(selectedParecer.arquivoUrl || selectedParecer.arquivoNome || selectedParecer.driveUrl) && (
                <div className="border-t pt-4">
                  <Label className="text-gray-500 flex items-center gap-2 mb-3">
                    <Upload className="h-4 w-4" />
                    Anexos
                  </Label>
                  <div className="space-y-2">
                    {(selectedParecer.arquivoUrl || selectedParecer.arquivoNome) && (
                      <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <File className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {selectedParecer.arquivoNome || 'Documento PDF'}
                            </p>
                            {selectedParecer.arquivoTamanho && (
                              <p className="text-xs text-gray-500">
                                {formatFileSize(selectedParecer.arquivoTamanho)}
                              </p>
                            )}
                          </div>
                        </div>
                        {selectedParecer.arquivoUrl && (
                          <a
                            href={selectedParecer.arquivoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Abrir
                          </a>
                        )}
                      </div>
                    )}
                    {selectedParecer.driveUrl && (
                      <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Link className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Link do Drive
                            </p>
                            <p className="text-xs text-gray-500 truncate max-w-[300px]">
                              {selectedParecer.driveUrl}
                            </p>
                          </div>
                        </div>
                        <a
                          href={selectedParecer.driveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Abrir
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
