'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
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
import { Plus, Search, Eye, Users, Calendar, BarChart3 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Consulta {
  id: string
  titulo: string
  descricao: string
  status: string
  dataInicio: string
  dataFim: string
  permitirAnonimo: boolean
  requerCadastro: boolean
  moderacao: boolean
  _count: {
    participacoes: number
    perguntas: number
  }
}

const STATUS_COLORS: Record<string, string> = {
  RASCUNHO: 'bg-gray-500',
  ABERTA: 'bg-green-500',
  ENCERRADA: 'bg-blue-500',
  ANALISE: 'bg-yellow-500',
  PUBLICADA: 'bg-purple-500'
}

const STATUS_LABELS: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  ABERTA: 'Aberta',
  ENCERRADA: 'Encerrada',
  ANALISE: 'Em Analise',
  PUBLICADA: 'Publicada'
}

export default function ConsultasPage() {
  const router = useRouter()
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [novaConsulta, setNovaConsulta] = useState({
    titulo: '',
    descricao: '',
    dataInicio: '',
    dataFim: '',
    permitirAnonimo: true,
    requerCadastro: false,
    moderacao: false
  })

  useEffect(() => {
    carregarConsultas()
  }, [filtroStatus])

  async function carregarConsultas() {
    try {
      const params = new URLSearchParams()
      if (filtroStatus !== 'todos') {
        params.set('status', filtroStatus)
      }

      const response = await fetch(`/api/participacao/consultas?${params}`)
      const data = await response.json()

      if (data.success) {
        setConsultas(data.data.consultas || [])
      }
    } catch (error) {
      console.error('Erro ao carregar consultas:', error)
    } finally {
      setLoading(false)
    }
  }

  async function criarConsulta() {
    try {
      const response = await fetch('/api/participacao/consultas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...novaConsulta,
          dataInicio: new Date(novaConsulta.dataInicio).toISOString(),
          dataFim: new Date(novaConsulta.dataFim).toISOString()
        })
      })

      if (response.ok) {
        setDialogOpen(false)
        setNovaConsulta({
          titulo: '',
          descricao: '',
          dataInicio: '',
          dataFim: '',
          permitirAnonimo: true,
          requerCadastro: false,
          moderacao: false
        })
        carregarConsultas()
      }
    } catch (error) {
      console.error('Erro ao criar consulta:', error)
    }
  }

  const consultasFiltradas = consultas.filter(c =>
    c.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    c.descricao.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Consultas Publicas</h1>
          <p className="text-muted-foreground">
            Gerencie consultas publicas e enquetes
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Consulta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Consulta Publica</DialogTitle>
              <DialogDescription>
                Crie uma nova consulta para coletar opiniao dos cidadaos
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Titulo</Label>
                <Input
                  id="titulo"
                  value={novaConsulta.titulo}
                  onChange={e => setNovaConsulta({ ...novaConsulta, titulo: e.target.value })}
                  placeholder="Titulo da consulta"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descricao</Label>
                <Textarea
                  id="descricao"
                  value={novaConsulta.descricao}
                  onChange={e => setNovaConsulta({ ...novaConsulta, descricao: e.target.value })}
                  placeholder="Descreva o objetivo da consulta"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data de Inicio</Label>
                  <Input
                    id="dataInicio"
                    type="datetime-local"
                    value={novaConsulta.dataInicio}
                    onChange={e => setNovaConsulta({ ...novaConsulta, dataInicio: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataFim">Data de Fim</Label>
                  <Input
                    id="dataFim"
                    type="datetime-local"
                    value={novaConsulta.dataFim}
                    onChange={e => setNovaConsulta({ ...novaConsulta, dataFim: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={novaConsulta.permitirAnonimo}
                    onChange={e => setNovaConsulta({ ...novaConsulta, permitirAnonimo: e.target.checked })}
                    className="rounded"
                  />
                  Permitir anonimo
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={novaConsulta.requerCadastro}
                    onChange={e => setNovaConsulta({ ...novaConsulta, requerCadastro: e.target.checked })}
                    className="rounded"
                  />
                  Requer cadastro
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={novaConsulta.moderacao}
                    onChange={e => setNovaConsulta({ ...novaConsulta, moderacao: e.target.checked })}
                    className="rounded"
                  />
                  Com moderacao
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={criarConsulta}>Criar Consulta</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatisticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Consultas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultas.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Abertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {consultas.filter(c => c.status === 'ABERTA').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Participacoes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {consultas.reduce((acc, c) => acc + (c._count?.participacoes || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Encerradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {consultas.filter(c => c.status === 'ENCERRADA').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar consultas..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="RASCUNHO">Rascunho</SelectItem>
            <SelectItem value="ABERTA">Aberta</SelectItem>
            <SelectItem value="ENCERRADA">Encerrada</SelectItem>
            <SelectItem value="ANALISE">Em Analise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titulo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead className="text-center">Perguntas</TableHead>
                <TableHead className="text-center">Participacoes</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : consultasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Nenhuma consulta encontrada
                  </TableCell>
                </TableRow>
              ) : (
                consultasFiltradas.map(consulta => (
                  <TableRow key={consulta.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{consulta.titulo}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {consulta.descricao}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[consulta.status]}>
                        {STATUS_LABELS[consulta.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(consulta.dataInicio), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                        <div className="text-muted-foreground">
                          ate {format(new Date(consulta.dataFim), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {consulta._count?.perguntas || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {consulta._count?.participacoes || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/participacao/consultas/${consulta.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/participacao/consultas/${consulta.id}/resultados`)}
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
