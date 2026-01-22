'use client'

import { useState, useEffect } from 'react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  Play,
  Trash2,
  MoreHorizontal,
  Calendar,
  FileText,
  Clock,
  Download
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

interface RelatorioAgendado {
  id: string
  nome: string
  descricao?: string
  tipo: string
  filtros?: string
  frequencia: string
  diaSemana?: number
  diaHora?: string
  destinatarios?: string
  formato: string
  ativo: boolean
  ultimaExecucao?: string
  proximaExecucao?: string
  createdAt: string
}

const TIPOS_RELATORIO = [
  { value: 'PRODUCAO_LEGISLATIVA', label: 'Producao Legislativa' },
  { value: 'PRESENCA_SESSOES', label: 'Presenca em Sessoes' },
  { value: 'VOTACOES', label: 'Votacoes' },
  { value: 'TRAMITACAO', label: 'Tramitacao' },
  { value: 'PROTOCOLO', label: 'Protocolo' },
  { value: 'COMISSOES', label: 'Comissoes' }
]

const FREQUENCIAS = [
  { value: 'DIARIO', label: 'Diario' },
  { value: 'SEMANAL', label: 'Semanal' },
  { value: 'MENSAL', label: 'Mensal' },
  { value: 'SOB_DEMANDA', label: 'Sob Demanda' }
]

const FORMATOS = [
  { value: 'PDF', label: 'PDF' },
  { value: 'EXCEL', label: 'Excel' },
  { value: 'CSV', label: 'CSV' }
]

const DIAS_SEMANA = [
  { value: '0', label: 'Domingo' },
  { value: '1', label: 'Segunda' },
  { value: '2', label: 'Terca' },
  { value: '3', label: 'Quarta' },
  { value: '4', label: 'Quinta' },
  { value: '5', label: 'Sexta' },
  { value: '6', label: 'Sabado' }
]

export default function RelatoriosAgendadosPage() {
  const [relatorios, setRelatorios] = useState<RelatorioAgendado[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [novoRelatorio, setNovoRelatorio] = useState({
    nome: '',
    descricao: '',
    tipo: 'PRODUCAO_LEGISLATIVA',
    frequencia: 'MENSAL',
    diaSemana: 1,
    diaHora: '08:00',
    destinatarios: '',
    formato: 'PDF'
  })

  useEffect(() => {
    carregarRelatorios()
  }, [])

  async function carregarRelatorios() {
    try {
      const response = await fetch('/api/relatorios/agendados')
      const data = await response.json()

      if (data.success) {
        setRelatorios(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar relatorios:', error)
    } finally {
      setLoading(false)
    }
  }

  async function criarRelatorio() {
    try {
      const destinatariosArray = novoRelatorio.destinatarios
        .split(',')
        .map(e => e.trim())
        .filter(e => e.length > 0)

      const response = await fetch('/api/relatorios/agendados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...novoRelatorio,
          destinatarios: destinatariosArray
        })
      })

      if (response.ok) {
        toast.success('Relatorio agendado criado!')
        setDialogOpen(false)
        setNovoRelatorio({
          nome: '',
          descricao: '',
          tipo: 'PRODUCAO_LEGISLATIVA',
          frequencia: 'MENSAL',
          diaSemana: 1,
          diaHora: '08:00',
          destinatarios: '',
          formato: 'PDF'
        })
        carregarRelatorios()
      } else {
        toast.error('Erro ao criar relatorio')
      }
    } catch (error) {
      console.error('Erro ao criar relatorio:', error)
      toast.error('Erro ao criar relatorio')
    }
  }

  async function executarRelatorio(id: string) {
    try {
      const response = await fetch(`/api/relatorios/agendados/${id}`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Relatorio executado!')
        carregarRelatorios()
      } else {
        toast.error('Erro ao executar relatorio')
      }
    } catch (error) {
      console.error('Erro ao executar relatorio:', error)
      toast.error('Erro ao executar relatorio')
    }
  }

  async function removerRelatorio(id: string) {
    if (!confirm('Deseja realmente remover este relatorio?')) return

    try {
      const response = await fetch(`/api/relatorios/agendados/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Relatorio removido!')
        carregarRelatorios()
      } else {
        toast.error('Erro ao remover relatorio')
      }
    } catch (error) {
      console.error('Erro ao remover relatorio:', error)
      toast.error('Erro ao remover relatorio')
    }
  }

  const relatoriosFiltrados = relatorios.filter(r =>
    r.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (r.descricao?.toLowerCase().includes(busca.toLowerCase()) || false)
  )

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatorios Agendados</h1>
          <p className="text-muted-foreground">
            Configure relatorios automaticos e sob demanda
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Relatorio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Relatorio Agendado</DialogTitle>
              <DialogDescription>
                Configure um novo relatorio automatico
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={novoRelatorio.nome}
                    onChange={e => setNovoRelatorio({ ...novoRelatorio, nome: e.target.value })}
                    placeholder="Nome do relatorio"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={novoRelatorio.tipo}
                    onValueChange={v => setNovoRelatorio({ ...novoRelatorio, tipo: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_RELATORIO.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descricao</Label>
                <Textarea
                  id="descricao"
                  value={novoRelatorio.descricao}
                  onChange={e => setNovoRelatorio({ ...novoRelatorio, descricao: e.target.value })}
                  placeholder="Descricao do relatorio"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequencia">Frequencia</Label>
                  <Select
                    value={novoRelatorio.frequencia}
                    onValueChange={v => setNovoRelatorio({ ...novoRelatorio, frequencia: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIAS.map(f => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {novoRelatorio.frequencia === 'SEMANAL' && (
                  <div className="space-y-2">
                    <Label htmlFor="diaSemana">Dia da Semana</Label>
                    <Select
                      value={String(novoRelatorio.diaSemana)}
                      onValueChange={v => setNovoRelatorio({ ...novoRelatorio, diaSemana: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIAS_SEMANA.map(d => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="diaHora">Horario</Label>
                  <Input
                    id="diaHora"
                    type="time"
                    value={novoRelatorio.diaHora}
                    onChange={e => setNovoRelatorio({ ...novoRelatorio, diaHora: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="formato">Formato</Label>
                  <Select
                    value={novoRelatorio.formato}
                    onValueChange={v => setNovoRelatorio({ ...novoRelatorio, formato: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMATOS.map(f => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destinatarios">Destinatarios (emails separados por virgula)</Label>
                <Input
                  id="destinatarios"
                  value={novoRelatorio.destinatarios}
                  onChange={e => setNovoRelatorio({ ...novoRelatorio, destinatarios: e.target.value })}
                  placeholder="email1@exemplo.com, email2@exemplo.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={criarRelatorio}>Criar Relatorio</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatisticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Relatorios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{relatorios.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {relatorios.filter(r => r.ativo).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Diarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {relatorios.filter(r => r.frequencia === 'DIARIO').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sob Demanda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {relatorios.filter(r => r.frequencia === 'SOB_DEMANDA').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtro */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar relatorios..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Frequencia</TableHead>
                <TableHead>Formato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ultima Execucao</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : relatoriosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Nenhum relatorio encontrado
                  </TableCell>
                </TableRow>
              ) : (
                relatoriosFiltrados.map(relatorio => (
                  <TableRow key={relatorio.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{relatorio.nome}</div>
                        {relatorio.descricao && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {relatorio.descricao}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {TIPOS_RELATORIO.find(t => t.value === relatorio.tipo)?.label || relatorio.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {FREQUENCIAS.find(f => f.value === relatorio.frequencia)?.label}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{relatorio.formato}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={relatorio.ativo ? 'bg-green-500' : 'bg-gray-500'}>
                        {relatorio.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {relatorio.ultimaExecucao ? (
                        <div className="text-sm">
                          {format(new Date(relatorio.ultimaExecucao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => executarRelatorio(relatorio.id)}>
                            <Play className="mr-2 h-4 w-4" />
                            Executar agora
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => removerRelatorio(relatorio.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
