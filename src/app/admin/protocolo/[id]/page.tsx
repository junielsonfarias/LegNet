'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  FileText,
  Save,
  Trash2,
  Send,
  Archive,
  Clock,
  QrCode,
  Paperclip,
  ArrowRight,
  User,
  Building,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const TIPOS_PROTOCOLO = [
  { value: 'ENTRADA', label: 'Entrada' },
  { value: 'SAIDA', label: 'Saida' },
  { value: 'INTERNO', label: 'Interno' }
]

const SITUACOES = [
  { value: 'ABERTO', label: 'Aberto' },
  { value: 'EM_TRAMITACAO', label: 'Em Tramitacao' },
  { value: 'RESPONDIDO', label: 'Respondido' },
  { value: 'ARQUIVADO', label: 'Arquivado' },
  { value: 'DEVOLVIDO', label: 'Devolvido' },
  { value: 'CANCELADO', label: 'Cancelado' }
]

const PRIORIDADES = [
  { value: 'BAIXA', label: 'Baixa' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'URGENTE', label: 'Urgente' }
]

const SITUACAO_COLORS: Record<string, string> = {
  'ABERTO': 'bg-blue-100 text-blue-700',
  'EM_TRAMITACAO': 'bg-yellow-100 text-yellow-700',
  'RESPONDIDO': 'bg-green-100 text-green-700',
  'ARQUIVADO': 'bg-gray-100 text-gray-700',
  'DEVOLVIDO': 'bg-orange-100 text-orange-700',
  'CANCELADO': 'bg-red-100 text-red-700'
}

const PRIORIDADE_COLORS: Record<string, string> = {
  'BAIXA': 'bg-gray-100 text-gray-600',
  'NORMAL': 'bg-blue-100 text-blue-600',
  'ALTA': 'bg-orange-100 text-orange-600',
  'URGENTE': 'bg-red-100 text-red-600'
}

interface Protocolo {
  id: string
  numero: number
  ano: number
  tipo: string
  nomeRemetente: string
  cpfCnpjRemetente?: string
  enderecoRemetente?: string
  telefoneRemetente?: string
  emailRemetente?: string
  assunto: string
  descricao?: string
  situacao: string
  prioridade: string
  prazoResposta?: string
  dataRecebimento: string
  etiquetaCodigo: string
  sigiloso: boolean
  createdAt: string
  updatedAt: string
  tramitacoes: Array<{
    id: string
    data: string
    unidadeOrigem: string
    unidadeDestino: string
    acao: string
    despacho?: string
  }>
  anexos: Array<{
    id: string
    titulo: string
    arquivo: string
    tamanho: number
    tipo: string
  }>
}

export default function DetalhesProtocoloPage() {
  const params = useParams()
  const router = useRouter()
  const protocoloId = params.id as string

  const [protocolo, setProtocolo] = useState<Protocolo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogTramitar, setDialogTramitar] = useState(false)

  const [formData, setFormData] = useState({
    tipo: '',
    nomeRemetente: '',
    cpfCnpjRemetente: '',
    enderecoRemetente: '',
    telefoneRemetente: '',
    emailRemetente: '',
    assunto: '',
    descricao: '',
    situacao: '',
    prioridade: '',
    prazoResposta: '',
    sigiloso: false
  })

  const [tramitacao, setTramitacao] = useState({
    unidadeDestino: '',
    acao: '',
    despacho: ''
  })

  useEffect(() => {
    carregarProtocolo()
  }, [protocoloId])

  async function carregarProtocolo() {
    try {
      const response = await fetch(`/api/protocolo/${protocoloId}`)
      const data = await response.json()

      if (data.success) {
        setProtocolo(data.data)
        setFormData({
          tipo: data.data.tipo,
          nomeRemetente: data.data.nomeRemetente,
          cpfCnpjRemetente: data.data.cpfCnpjRemetente || '',
          enderecoRemetente: data.data.enderecoRemetente || '',
          telefoneRemetente: data.data.telefoneRemetente || '',
          emailRemetente: data.data.emailRemetente || '',
          assunto: data.data.assunto,
          descricao: data.data.descricao || '',
          situacao: data.data.situacao,
          prioridade: data.data.prioridade,
          prazoResposta: data.data.prazoResposta ? data.data.prazoResposta.split('T')[0] : '',
          sigiloso: data.data.sigiloso
        })
      } else {
        toast.error('Protocolo nao encontrado')
        router.push('/admin/protocolo')
      }
    } catch (error) {
      console.error('Erro ao carregar protocolo:', error)
      toast.error('Erro ao carregar protocolo')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)

    try {
      const response = await fetch(`/api/protocolo/${protocoloId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          prazoResposta: formData.prazoResposta ? new Date(formData.prazoResposta).toISOString() : null
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Protocolo atualizado com sucesso!')
        carregarProtocolo()
      } else {
        toast.error(data.error || 'Erro ao atualizar protocolo')
      }
    } catch (error) {
      console.error('Erro ao atualizar protocolo:', error)
      toast.error('Erro ao atualizar protocolo')
    } finally {
      setSaving(false)
    }
  }

  async function handleTramitar() {
    if (!tramitacao.unidadeDestino || !tramitacao.acao) {
      toast.error('Preencha os campos obrigatorios')
      return
    }

    try {
      const response = await fetch(`/api/protocolo/${protocoloId}/tramitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tramitacao)
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Protocolo tramitado com sucesso!')
        setDialogTramitar(false)
        setTramitacao({ unidadeDestino: '', acao: '', despacho: '' })
        carregarProtocolo()
      } else {
        toast.error(data.error || 'Erro ao tramitar protocolo')
      }
    } catch (error) {
      console.error('Erro ao tramitar:', error)
      toast.error('Erro ao tramitar protocolo')
    }
  }

  async function handleArquivar() {
    try {
      const response = await fetch(`/api/protocolo/${protocoloId}/arquivar`, {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Protocolo arquivado com sucesso!')
        carregarProtocolo()
      } else {
        toast.error(data.error || 'Erro ao arquivar protocolo')
      }
    } catch (error) {
      console.error('Erro ao arquivar:', error)
      toast.error('Erro ao arquivar protocolo')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!protocolo) {
    return null
  }

  const codigoProtocolo = `${protocolo.numero}/${protocolo.ano}`

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/protocolo"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <FileText className="h-7 w-7 text-blue-600" />
              Protocolo {codigoProtocolo}
            </h1>
            <Badge className={SITUACAO_COLORS[protocolo.situacao]}>
              {SITUACOES.find(s => s.value === protocolo.situacao)?.label}
            </Badge>
            <Badge className={PRIORIDADE_COLORS[protocolo.prioridade]}>
              {PRIORIDADES.find(p => p.value === protocolo.prioridade)?.label}
            </Badge>
          </div>
          <p className="mt-1 text-gray-600">{protocolo.assunto}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={dialogTramitar} onOpenChange={setDialogTramitar}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Send className="h-4 w-4 mr-2" />
                Tramitar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tramitar Protocolo</DialogTitle>
                <DialogDescription>
                  Envie este protocolo para outra unidade
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Unidade de Destino *</Label>
                  <Input
                    value={tramitacao.unidadeDestino}
                    onChange={e => setTramitacao(prev => ({ ...prev, unidadeDestino: e.target.value }))}
                    placeholder="Ex: Secretaria de Governo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Acao *</Label>
                  <Select
                    value={tramitacao.acao}
                    onValueChange={value => setTramitacao(prev => ({ ...prev, acao: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ENCAMINHADO">Encaminhado</SelectItem>
                      <SelectItem value="PARA_ANALISE">Para Analise</SelectItem>
                      <SelectItem value="PARA_PROVIDENCIAS">Para Providencias</SelectItem>
                      <SelectItem value="PARA_RESPOSTA">Para Resposta</SelectItem>
                      <SelectItem value="DEVOLVIDO">Devolvido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Despacho</Label>
                  <Textarea
                    value={tramitacao.despacho}
                    onChange={e => setTramitacao(prev => ({ ...prev, despacho: e.target.value }))}
                    placeholder="Observacoes sobre a tramitacao..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogTramitar(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleTramitar}>
                  Tramitar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <Archive className="h-4 w-4 mr-2" />
                Arquivar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Arquivar Protocolo</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja arquivar este protocolo?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleArquivar}>
                  Arquivar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <QrCode className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Codigo</p>
                <p className="font-mono font-bold">{protocolo.etiquetaCodigo}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Recebido em</p>
                <p className="font-bold">
                  {format(new Date(protocolo.dataRecebimento), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-500">Prazo</p>
                <p className="font-bold">
                  {protocolo.prazoResposta
                    ? format(new Date(protocolo.prazoResposta), "dd/MM/yyyy", { locale: ptBR })
                    : 'Nao definido'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <ArrowRight className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">Tramitacoes</p>
                <p className="font-bold">{protocolo.tramitacoes?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="remetente">Remetente</TabsTrigger>
          <TabsTrigger value="tramitacoes">
            Tramitacoes ({protocolo.tramitacoes?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="anexos">
            Anexos ({protocolo.anexos?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informacoes do Protocolo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={value => setFormData(prev => ({ ...prev, tipo: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_PROTOCOLO.map(tipo => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Situacao</Label>
                  <Select
                    value={formData.situacao}
                    onValueChange={value => setFormData(prev => ({ ...prev, situacao: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SITUACOES.map(sit => (
                        <SelectItem key={sit.value} value={sit.value}>
                          {sit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select
                    value={formData.prioridade}
                    onValueChange={value => setFormData(prev => ({ ...prev, prioridade: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORIDADES.map(pri => (
                        <SelectItem key={pri.value} value={pri.value}>
                          {pri.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Assunto</Label>
                <Input
                  value={formData.assunto}
                  onChange={e => setFormData(prev => ({ ...prev, assunto: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Descricao</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={e => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Prazo de Resposta</Label>
                <Input
                  type="date"
                  value={formData.prazoResposta}
                  onChange={e => setFormData(prev => ({ ...prev, prazoResposta: e.target.value }))}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="remetente">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Remetente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={formData.nomeRemetente}
                    onChange={e => setFormData(prev => ({ ...prev, nomeRemetente: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CPF/CNPJ</Label>
                  <Input
                    value={formData.cpfCnpjRemetente}
                    onChange={e => setFormData(prev => ({ ...prev, cpfCnpjRemetente: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Endereco</Label>
                <Input
                  value={formData.enderecoRemetente}
                  onChange={e => setFormData(prev => ({ ...prev, enderecoRemetente: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={formData.telefoneRemetente}
                    onChange={e => setFormData(prev => ({ ...prev, telefoneRemetente: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={formData.emailRemetente}
                    onChange={e => setFormData(prev => ({ ...prev, emailRemetente: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tramitacoes">
          <Card>
            <CardHeader>
              <CardTitle>Historico de Tramitacoes</CardTitle>
              <CardDescription>Movimentacoes do protocolo entre unidades</CardDescription>
            </CardHeader>
            <CardContent>
              {protocolo.tramitacoes?.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhuma tramitacao registrada
                </p>
              ) : (
                <div className="space-y-4">
                  {protocolo.tramitacoes?.map((tram, index) => (
                    <div key={tram.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-blue-600 rounded-full" />
                        {index < (protocolo.tramitacoes?.length || 0) - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{tram.acao}</Badge>
                          <span className="text-sm text-gray-500">
                            {format(new Date(tram.data), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="mt-1 text-sm">
                          <span className="text-gray-500">De:</span> {tram.unidadeOrigem}
                          <ArrowRight className="h-3 w-3 inline mx-1" />
                          <span className="text-gray-500">Para:</span> {tram.unidadeDestino}
                        </p>
                        {tram.despacho && (
                          <p className="mt-1 text-sm text-gray-600 italic">
                            &ldquo;{tram.despacho}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anexos">
          <Card>
            <CardHeader>
              <CardTitle>Anexos</CardTitle>
              <CardDescription>Documentos anexados ao protocolo</CardDescription>
            </CardHeader>
            <CardContent>
              {protocolo.anexos?.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhum anexo registrado
                </p>
              ) : (
                <div className="space-y-2">
                  {protocolo.anexos?.map(anexo => (
                    <div key={anexo.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Paperclip className="h-5 w-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="font-medium">{anexo.titulo}</p>
                        <p className="text-sm text-gray-500">
                          {anexo.tipo} - {(anexo.tamanho / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Baixar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
