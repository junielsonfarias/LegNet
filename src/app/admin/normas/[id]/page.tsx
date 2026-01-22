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
  Scale,
  Save,
  Trash2,
  Eye,
  History,
  Plus,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const TIPOS_NORMA = [
  { value: 'LEI_ORDINARIA', label: 'Lei Ordinaria' },
  { value: 'LEI_COMPLEMENTAR', label: 'Lei Complementar' },
  { value: 'DECRETO_LEGISLATIVO', label: 'Decreto Legislativo' },
  { value: 'RESOLUCAO', label: 'Resolucao' },
  { value: 'EMENDA_LEI_ORGANICA', label: 'Emenda a Lei Organica' },
  { value: 'LEI_ORGANICA', label: 'Lei Organica' },
  { value: 'REGIMENTO_INTERNO', label: 'Regimento Interno' }
]

const SITUACOES = [
  { value: 'VIGENTE', label: 'Vigente' },
  { value: 'REVOGADA', label: 'Revogada' },
  { value: 'REVOGADA_PARCIALMENTE', label: 'Revogada Parcialmente' },
  { value: 'COM_ALTERACOES', label: 'Com Alteracoes' },
  { value: 'SUSPENSA', label: 'Suspensa' }
]

const SITUACAO_COLORS: Record<string, string> = {
  'VIGENTE': 'bg-green-100 text-green-700',
  'REVOGADA': 'bg-red-100 text-red-700',
  'REVOGADA_PARCIALMENTE': 'bg-orange-100 text-orange-700',
  'COM_ALTERACOES': 'bg-yellow-100 text-yellow-700',
  'SUSPENSA': 'bg-gray-100 text-gray-700'
}

interface NormaJuridica {
  id: string
  tipo: string
  numero: string
  ano: number
  ementa: string
  texto: string
  textoCompilado?: string
  situacao: string
  data: string
  dataPublicacao?: string
  dataVigencia?: string
  assunto?: string
  observacao?: string
  createdAt: string
  updatedAt: string
  _count: {
    artigos: number
    alteracoesRecebidas: number
    versoes: number
  }
}

export default function EditarNormaPage() {
  const params = useParams()
  const router = useRouter()
  const normaId = params.id as string

  const [norma, setNorma] = useState<NormaJuridica | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    tipo: '',
    numero: '',
    ano: '',
    ementa: '',
    texto: '',
    situacao: '',
    data: '',
    dataPublicacao: '',
    dataVigencia: '',
    assunto: '',
    observacao: ''
  })

  useEffect(() => {
    carregarNorma()
  }, [normaId])

  async function carregarNorma() {
    try {
      const response = await fetch(`/api/normas/${normaId}`)
      const data = await response.json()

      if (data.success) {
        setNorma(data.data)
        setFormData({
          tipo: data.data.tipo,
          numero: data.data.numero,
          ano: data.data.ano.toString(),
          ementa: data.data.ementa,
          texto: data.data.texto || '',
          situacao: data.data.situacao,
          data: data.data.data ? data.data.data.split('T')[0] : '',
          dataPublicacao: data.data.dataPublicacao ? data.data.dataPublicacao.split('T')[0] : '',
          dataVigencia: data.data.dataVigencia ? data.data.dataVigencia.split('T')[0] : '',
          assunto: data.data.assunto || '',
          observacao: data.data.observacao || ''
        })
      } else {
        toast.error('Norma nao encontrada')
        router.push('/admin/normas')
      }
    } catch (error) {
      console.error('Erro ao carregar norma:', error)
      toast.error('Erro ao carregar norma')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!formData.tipo || !formData.numero || !formData.ementa || !formData.data) {
      toast.error('Preencha os campos obrigatorios')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/normas/${normaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ano: parseInt(formData.ano),
          data: new Date(formData.data).toISOString(),
          dataPublicacao: formData.dataPublicacao ? new Date(formData.dataPublicacao).toISOString() : null,
          dataVigencia: formData.dataVigencia ? new Date(formData.dataVigencia).toISOString() : null
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Norma atualizada com sucesso!')
        carregarNorma()
      } else {
        toast.error(data.error || 'Erro ao atualizar norma')
      }
    } catch (error) {
      console.error('Erro ao atualizar norma:', error)
      toast.error('Erro ao atualizar norma')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    try {
      const response = await fetch(`/api/normas/${normaId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Norma excluida com sucesso!')
        router.push('/admin/normas')
      } else {
        toast.error(data.error || 'Erro ao excluir norma')
      }
    } catch (error) {
      console.error('Erro ao excluir norma:', error)
      toast.error('Erro ao excluir norma')
    }
  }

  async function handleCompilar() {
    try {
      const response = await fetch(`/api/normas/${normaId}/compilar`, {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Texto compilado com sucesso!')
        carregarNorma()
      } else {
        toast.error(data.error || 'Erro ao compilar texto')
      }
    } catch (error) {
      console.error('Erro ao compilar:', error)
      toast.error('Erro ao compilar texto')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!norma) {
    return null
  }

  const titulo = `${TIPOS_NORMA.find(t => t.value === norma.tipo)?.label || norma.tipo} n. ${norma.numero}/${norma.ano}`

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/normas"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <Scale className="h-7 w-7 text-blue-600" />
              {titulo}
            </h1>
            <Badge className={SITUACAO_COLORS[norma.situacao]}>
              {SITUACOES.find(s => s.value === norma.situacao)?.label || norma.situacao}
            </Badge>
          </div>
          <p className="mt-1 text-gray-600 line-clamp-1">{norma.ementa}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/legislativo/normas/${normaId}`} target="_blank">
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir esta norma? Esta acao nao pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="texto">Texto</TabsTrigger>
          <TabsTrigger value="artigos">
            Artigos ({norma._count.artigos})
          </TabsTrigger>
          <TabsTrigger value="alteracoes">
            Alteracoes ({norma._count.alteracoesRecebidas})
          </TabsTrigger>
          <TabsTrigger value="versoes">
            Versoes ({norma._count.versoes})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Identificacao</CardTitle>
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
                          {TIPOS_NORMA.map(tipo => (
                            <SelectItem key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Numero</Label>
                      <Input
                        value={formData.numero}
                        onChange={e => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Ano</Label>
                      <Input
                        type="number"
                        value={formData.ano}
                        onChange={e => setFormData(prev => ({ ...prev, ano: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Ementa</Label>
                    <Textarea
                      value={formData.ementa}
                      onChange={e => setFormData(prev => ({ ...prev, ementa: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Assunto/Indexacao</Label>
                    <Input
                      value={formData.assunto}
                      onChange={e => setFormData(prev => ({ ...prev, assunto: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Datas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Data da Norma</Label>
                    <Input
                      type="date"
                      value={formData.data}
                      onChange={e => setFormData(prev => ({ ...prev, data: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Publicacao</Label>
                    <Input
                      type="date"
                      value={formData.dataPublicacao}
                      onChange={e => setFormData(prev => ({ ...prev, dataPublicacao: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Inicio da Vigencia</Label>
                    <Input
                      type="date"
                      value={formData.dataVigencia}
                      onChange={e => setFormData(prev => ({ ...prev, dataVigencia: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Situacao</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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

                  <div className="space-y-2">
                    <Label>Observacoes</Label>
                    <Textarea
                      value={formData.observacao}
                      onChange={e => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleSave} className="w-full" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Alteracoes'}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="texto" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Texto da Norma</CardTitle>
                <CardDescription>Texto integral da norma juridica</CardDescription>
              </div>
              <Button variant="outline" onClick={handleCompilar}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Compilar Texto
              </Button>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.texto}
                onChange={e => setFormData(prev => ({ ...prev, texto: e.target.value }))}
                rows={25}
                className="font-mono text-sm"
              />
              <div className="flex justify-end mt-4">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Texto'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="artigos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Artigos</CardTitle>
                <CardDescription>Gestao de artigos da norma</CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Artigo
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">
                Funcionalidade de gestao de artigos em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alteracoes">
          <Card>
            <CardHeader>
              <CardTitle>Alteracoes Recebidas</CardTitle>
              <CardDescription>Historico de alteracoes desta norma</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">
                Nenhuma alteracao registrada
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versoes">
          <Card>
            <CardHeader>
              <CardTitle>Historico de Versoes</CardTitle>
              <CardDescription>Versoes anteriores do texto</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">
                Nenhuma versao anterior registrada
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
