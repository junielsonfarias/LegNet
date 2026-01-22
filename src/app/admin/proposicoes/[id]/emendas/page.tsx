"use client"

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
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
  FileText,
  ArrowLeft,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  FileSignature,
  Users
} from 'lucide-react'
import { toast } from 'sonner'
import type { EmendaApi, CriarEmendaInput } from '@/lib/api/emendas-api'

const TIPO_LABELS: Record<string, string> = {
  'ADITIVA': 'Aditiva',
  'MODIFICATIVA': 'Modificativa',
  'SUPRESSIVA': 'Supressiva',
  'SUBSTITUTIVA': 'Substitutiva',
  'EMENDA_DE_REDACAO': 'De Redacao'
}

const STATUS_LABELS: Record<string, string> = {
  'APRESENTADA': 'Apresentada',
  'EM_ANALISE': 'Em Analise',
  'APROVADA': 'Aprovada',
  'REJEITADA': 'Rejeitada',
  'PREJUDICADA': 'Prejudicada',
  'RETIRADA': 'Retirada',
  'INCORPORADA': 'Incorporada'
}

const STATUS_COLORS: Record<string, string> = {
  'APRESENTADA': 'bg-blue-100 text-blue-700',
  'EM_ANALISE': 'bg-yellow-100 text-yellow-700',
  'APROVADA': 'bg-green-100 text-green-700',
  'REJEITADA': 'bg-red-100 text-red-700',
  'PREJUDICADA': 'bg-gray-100 text-gray-700',
  'RETIRADA': 'bg-orange-100 text-orange-700',
  'INCORPORADA': 'bg-purple-100 text-purple-700'
}

interface Proposicao {
  id: string
  numero: string
  ano: number
  titulo: string
  tipo: string
  ementa: string
}

interface Parlamentar {
  id: string
  nome: string
  partido?: string
}

export default function EmendasProposicaoPage() {
  const params = useParams()
  const router = useRouter()
  const proposicaoId = params.id as string

  const [proposicao, setProposicao] = useState<Proposicao | null>(null)
  const [emendas, setEmendas] = useState<EmendaApi[]>([])
  const [parlamentares, setParlamentares] = useState<Parlamentar[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingEmenda, setEditingEmenda] = useState<EmendaApi | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')

  const [formData, setFormData] = useState<CriarEmendaInput>({
    autorId: '',
    tipo: 'MODIFICATIVA',
    textoNovo: '',
    justificativa: '',
    artigo: '',
    paragrafo: '',
    inciso: '',
    alinea: '',
    textoOriginal: ''
  })

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true)

      // Carregar proposicao
      const propResponse = await fetch(`/api/proposicoes/${proposicaoId}`)
      const propData = await propResponse.json()
      if (propData.success) {
        setProposicao(propData.data)
      }

      // Carregar emendas
      const emendResponse = await fetch(`/api/proposicoes/${proposicaoId}/emendas`)
      const emendData = await emendResponse.json()
      if (emendData.success) {
        setEmendas(emendData.data)
      }

      // Carregar parlamentares
      const parlResponse = await fetch('/api/parlamentares?ativos=true')
      const parlData = await parlResponse.json()
      if (parlData.success) {
        setParlamentares(parlData.data || parlData)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [proposicaoId])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  const handleSubmit = async () => {
    if (!formData.autorId) {
      toast.error('Selecione o autor da emenda')
      return
    }

    if (!formData.textoNovo.trim()) {
      toast.error('Texto novo e obrigatorio')
      return
    }

    if (!formData.justificativa.trim()) {
      toast.error('Justificativa e obrigatoria')
      return
    }

    try {
      const response = await fetch(`/api/proposicoes/${proposicaoId}/emendas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Emenda ${data.data.numero} criada com sucesso`)
        setShowDialog(false)
        setFormData({
          autorId: '',
          tipo: 'MODIFICATIVA',
          textoNovo: '',
          justificativa: '',
          artigo: '',
          paragrafo: '',
          inciso: '',
          alinea: '',
          textoOriginal: ''
        })
        carregarDados()
      } else {
        toast.error(data.error || 'Erro ao criar emenda')
      }
    } catch (error) {
      console.error('Erro ao criar emenda:', error)
      toast.error('Erro ao criar emenda')
    }
  }

  const handleRetirar = async (emendaId: string) => {
    if (!confirm('Deseja retirar esta emenda?')) return

    try {
      const response = await fetch(`/api/emendas/${emendaId}?acao=retirar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Emenda retirada')
        carregarDados()
      } else {
        toast.error(data.error || 'Erro ao retirar emenda')
      }
    } catch (error) {
      toast.error('Erro ao retirar emenda')
    }
  }

  const emendasFiltradas = emendas.filter(e => {
    if (filtroTipo && filtroTipo !== 'todos' && e.tipo !== filtroTipo) return false
    if (filtroStatus && filtroStatus !== 'todos' && e.status !== filtroStatus) return false
    return true
  })

  const estatisticas = {
    total: emendas.length,
    aprovadas: emendas.filter(e => e.status === 'APROVADA').length,
    rejeitadas: emendas.filter(e => e.status === 'REJEITADA').length,
    pendentes: emendas.filter(e => ['APRESENTADA', 'EM_ANALISE'].includes(e.status)).length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href={`/admin/proposicoes/${proposicaoId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <FileSignature className="h-7 w-7 text-blue-600" />
            Emendas
          </h1>
          {proposicao && (
            <p className="text-gray-600">
              {proposicao.tipo} {proposicao.numero}/{proposicao.ano} - {proposicao.titulo}
            </p>
          )}
        </div>
        <Button onClick={() => carregarDados()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Emenda
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Emenda</DialogTitle>
              <DialogDescription>
                Apresentar emenda a proposicao
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Autor *</Label>
                  <Select
                    value={formData.autorId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, autorId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o autor" />
                    </SelectTrigger>
                    <SelectContent>
                      {parlamentares.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome} {p.partido && `(${p.partido})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Emenda *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, tipo: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADITIVA">Aditiva</SelectItem>
                      <SelectItem value="MODIFICATIVA">Modificativa</SelectItem>
                      <SelectItem value="SUPRESSIVA">Supressiva</SelectItem>
                      <SelectItem value="SUBSTITUTIVA">Substitutiva</SelectItem>
                      <SelectItem value="EMENDA_DE_REDACAO">De Redacao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Artigo</Label>
                  <Input
                    value={formData.artigo}
                    onChange={(e) => setFormData(prev => ({ ...prev, artigo: e.target.value }))}
                    placeholder="Ex: 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Paragrafo</Label>
                  <Input
                    value={formData.paragrafo}
                    onChange={(e) => setFormData(prev => ({ ...prev, paragrafo: e.target.value }))}
                    placeholder="Ex: 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Inciso</Label>
                  <Input
                    value={formData.inciso}
                    onChange={(e) => setFormData(prev => ({ ...prev, inciso: e.target.value }))}
                    placeholder="Ex: I"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Alinea</Label>
                  <Input
                    value={formData.alinea}
                    onChange={(e) => setFormData(prev => ({ ...prev, alinea: e.target.value }))}
                    placeholder="Ex: a"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Texto Original (referencia)</Label>
                <Textarea
                  value={formData.textoOriginal}
                  onChange={(e) => setFormData(prev => ({ ...prev, textoOriginal: e.target.value }))}
                  placeholder="Texto original que sera modificado..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Texto Novo *</Label>
                <Textarea
                  value={formData.textoNovo}
                  onChange={(e) => setFormData(prev => ({ ...prev, textoNovo: e.target.value }))}
                  placeholder="Novo texto proposto pela emenda..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Justificativa *</Label>
                <Textarea
                  value={formData.justificativa}
                  onChange={(e) => setFormData(prev => ({ ...prev, justificativa: e.target.value }))}
                  placeholder="Justificativa para a emenda..."
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                Apresentar Emenda
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Estatisticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Emendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {estatisticas.total}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-500" /> Aprovadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {estatisticas.aprovadas}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <XCircle className="h-4 w-4 text-red-500" /> Rejeitadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {estatisticas.rejeitadas}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <AlertCircle className="h-4 w-4 text-yellow-500" /> Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {estatisticas.pendentes}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="ADITIVA">Aditiva</SelectItem>
                <SelectItem value="MODIFICATIVA">Modificativa</SelectItem>
                <SelectItem value="SUPRESSIVA">Supressiva</SelectItem>
                <SelectItem value="SUBSTITUTIVA">Substitutiva</SelectItem>
                <SelectItem value="EMENDA_DE_REDACAO">De Redacao</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="APRESENTADA">Apresentada</SelectItem>
                <SelectItem value="EM_ANALISE">Em Analise</SelectItem>
                <SelectItem value="APROVADA">Aprovada</SelectItem>
                <SelectItem value="REJEITADA">Rejeitada</SelectItem>
                <SelectItem value="PREJUDICADA">Prejudicada</SelectItem>
                <SelectItem value="RETIRADA">Retirada</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setFiltroTipo('todos')
                setFiltroStatus('todos')
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Emendas */}
      <Card>
        <CardContent className="p-0">
          {emendasFiltradas.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              Nenhuma emenda encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emendasFiltradas.map((emenda) => (
                  <TableRow key={emenda.id}>
                    <TableCell className="font-medium">
                      EMD-{emenda.numero}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {TIPO_LABELS[emenda.tipo] || emenda.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        {emenda.autor?.nome || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {[
                        emenda.artigo ? `Art. ${emenda.artigo}` : null,
                        emenda.paragrafo ? `§ ${emenda.paragrafo}` : null,
                        emenda.inciso ? `Inc. ${emenda.inciso}` : null,
                        emenda.alinea ? `Al. ${emenda.alinea}` : null
                      ].filter(Boolean).join(', ') || 'Texto geral'}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[emenda.status]}>
                        {STATUS_LABELS[emenda.status] || emenda.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {emenda.turnoApresentacao}o turno
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <Link href={`/admin/emendas/${emenda.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {emenda.status === 'APRESENTADA' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRetirar(emenda.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
