'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Calendar,
  Users,
  Plus,
  Search,
  FileText,
  Clock,
  MapPin,
  ChevronRight
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

interface Comissao {
  id: string
  nome: string
  sigla: string | null
}

interface ReuniaoComissao {
  id: string
  numero: number
  ano: number
  tipo: string
  status: string
  data: string
  horaInicio: string | null
  local: string | null
  comissao: Comissao
  _count: {
    itens: number
    presencas: number
    pareceres: number
  }
}

const STATUS_LABELS: Record<string, string> = {
  AGENDADA: 'Agendada',
  CONVOCADA: 'Convocada',
  EM_ANDAMENTO: 'Em Andamento',
  SUSPENSA: 'Suspensa',
  CONCLUIDA: 'Concluida',
  CANCELADA: 'Cancelada'
}

const STATUS_COLORS: Record<string, string> = {
  AGENDADA: 'bg-blue-100 text-blue-700',
  CONVOCADA: 'bg-purple-100 text-purple-700',
  EM_ANDAMENTO: 'bg-green-100 text-green-700',
  SUSPENSA: 'bg-yellow-100 text-yellow-700',
  CONCLUIDA: 'bg-gray-100 text-gray-700',
  CANCELADA: 'bg-red-100 text-red-700'
}

const TIPO_LABELS: Record<string, string> = {
  ORDINARIA: 'Ordinaria',
  EXTRAORDINARIA: 'Extraordinaria',
  ESPECIAL: 'Especial'
}

export default function ReunioesComissaoPage() {
  const [reunioes, setReunioes] = useState<ReuniaoComissao[]>([])
  const [comissoes, setComissoes] = useState<Comissao[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroComissao, setFiltroComissao] = useState<string>('todos')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [busca, setBusca] = useState('')

  // Dialog de nova reuniao
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [novaReuniao, setNovaReuniao] = useState({
    comissaoId: '',
    tipo: 'ORDINARIA',
    data: '',
    horaInicio: '',
    local: '',
    motivoConvocacao: ''
  })

  useEffect(() => {
    carregarDados()
  }, [filtroComissao, filtroStatus])

  async function carregarDados() {
    try {
      // Carregar comissoes
      const resComissoes = await fetch('/api/comissoes')
      const dataComissoes = await resComissoes.json()
      if (dataComissoes.success) {
        setComissoes(dataComissoes.data || [])
      }

      // Carregar reunioes
      const params = new URLSearchParams()
      if (filtroComissao && filtroComissao !== 'todos') params.set('comissaoId', filtroComissao)
      if (filtroStatus && filtroStatus !== 'todos') params.set('status', filtroStatus)

      const resReunioes = await fetch(`/api/reunioes-comissao?${params}`)
      const dataReunioes = await resReunioes.json()
      if (dataReunioes.success) {
        setReunioes(dataReunioes.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  async function criarReuniao() {
    if (!novaReuniao.comissaoId || !novaReuniao.data) {
      toast.error('Selecione a comissao e a data')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/reunioes-comissao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...novaReuniao,
          horaInicio: novaReuniao.horaInicio ? `${novaReuniao.data}T${novaReuniao.horaInicio}:00` : null
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Reuniao criada com sucesso!')
        setDialogOpen(false)
        setNovaReuniao({
          comissaoId: '',
          tipo: 'ORDINARIA',
          data: '',
          horaInicio: '',
          local: '',
          motivoConvocacao: ''
        })
        carregarDados()
      } else {
        toast.error(data.error || 'Erro ao criar reuniao')
      }
    } catch (error) {
      console.error('Erro ao criar reuniao:', error)
      toast.error('Erro ao criar reuniao')
    } finally {
      setSaving(false)
    }
  }

  const reunioesFiltradas = reunioes.filter(reuniao => {
    if (busca) {
      const termoBusca = busca.toLowerCase()
      const matchComissao = reuniao.comissao.nome.toLowerCase().includes(termoBusca)
      const matchNumero = `${reuniao.numero}/${reuniao.ano}`.includes(termoBusca)
      if (!matchComissao && !matchNumero) return false
    }
    return true
  })

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Calendar className="h-7 w-7 text-blue-600" />
            Reunioes de Comissao
          </h1>
          <p className="mt-1 text-gray-600">
            Gerencie as reunioes das comissoes permanentes e temporarias
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Reuniao
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agendar Nova Reuniao</DialogTitle>
              <DialogDescription>
                Preencha os dados para agendar uma reuniao de comissao
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Comissao *</Label>
                <Select
                  value={novaReuniao.comissaoId}
                  onValueChange={value => setNovaReuniao(prev => ({ ...prev, comissaoId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a comissao" />
                  </SelectTrigger>
                  <SelectContent>
                    {comissoes.map(comissao => (
                      <SelectItem key={comissao.id} value={comissao.id}>
                        {comissao.sigla ? `${comissao.sigla} - ` : ''}{comissao.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={novaReuniao.tipo}
                    onValueChange={value => setNovaReuniao(prev => ({ ...prev, tipo: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ORDINARIA">Ordinaria</SelectItem>
                      <SelectItem value="EXTRAORDINARIA">Extraordinaria</SelectItem>
                      <SelectItem value="ESPECIAL">Especial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Input
                    type="date"
                    value={novaReuniao.data}
                    onChange={e => setNovaReuniao(prev => ({ ...prev, data: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Horario</Label>
                  <Input
                    type="time"
                    value={novaReuniao.horaInicio}
                    onChange={e => setNovaReuniao(prev => ({ ...prev, horaInicio: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Local</Label>
                  <Input
                    value={novaReuniao.local}
                    onChange={e => setNovaReuniao(prev => ({ ...prev, local: e.target.value }))}
                    placeholder="Sala de reunioes"
                  />
                </div>
              </div>

              {novaReuniao.tipo === 'EXTRAORDINARIA' && (
                <div className="space-y-2">
                  <Label>Motivo da Convocacao</Label>
                  <Textarea
                    value={novaReuniao.motivoConvocacao}
                    onChange={e => setNovaReuniao(prev => ({ ...prev, motivoConvocacao: e.target.value }))}
                    placeholder="Descreva o motivo da reuniao extraordinaria..."
                    rows={3}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={criarReuniao} disabled={saving}>
                {saving ? 'Salvando...' : 'Agendar Reuniao'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar reuniao..."
                className="pl-9"
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
            </div>

            <Select value={filtroComissao} onValueChange={setFiltroComissao}>
              <SelectTrigger>
                <SelectValue placeholder="Comissao" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as Comissoes</SelectItem>
                {comissoes.map(comissao => (
                  <SelectItem key={comissao.id} value={comissao.id}>
                    {comissao.sigla || comissao.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="AGENDADA">Agendada</SelectItem>
                <SelectItem value="CONVOCADA">Convocada</SelectItem>
                <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                <SelectItem value="CONCLUIDA">Concluida</SelectItem>
                <SelectItem value="CANCELADA">Cancelada</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-500 flex items-center">
              {reunioesFiltradas.length} reuniao(oes) encontrada(s)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Reunioes */}
      <div className="grid gap-4">
        {reunioesFiltradas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Nenhuma reuniao encontrada</h3>
              <p className="mt-1 text-gray-500">
                Agende uma nova reuniao para comecar
              </p>
            </CardContent>
          </Card>
        ) : (
          reunioesFiltradas.map(reuniao => (
            <Link key={reuniao.id} href={`/admin/comissoes/reunioes/${reuniao.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {reuniao.numero}a Reuniao {TIPO_LABELS[reuniao.tipo]} - {reuniao.ano}
                          </h3>
                          <Badge className={STATUS_COLORS[reuniao.status]}>
                            {STATUS_LABELS[reuniao.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {reuniao.comissao.sigla ? `${reuniao.comissao.sigla} - ` : ''}
                          {reuniao.comissao.nome}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {format(new Date(reuniao.data), "dd/MM/yyyy", { locale: ptBR })}
                          {reuniao.horaInicio && ` as ${format(new Date(reuniao.horaInicio), 'HH:mm')}`}
                        </span>
                      </div>

                      {reuniao.local && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{reuniao.local}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1" title="Itens na pauta">
                          <FileText className="h-4 w-4" />
                          <span>{reuniao._count.itens}</span>
                        </div>
                        <div className="flex items-center gap-1" title="Presencas">
                          <Users className="h-4 w-4" />
                          <span>{reuniao._count.presencas}</span>
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
