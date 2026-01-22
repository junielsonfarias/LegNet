"use client"

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  FileText,
  Plus,
  Search,
  Filter,
  Clock,
  AlertTriangle,
  Archive,
  ArrowRight,
  RefreshCw,
  QrCode
} from 'lucide-react'
import { toast } from 'sonner'

interface Protocolo {
  id: string
  numero: number
  ano: number
  tipo: string
  nomeRemetente: string
  assunto: string
  situacao: string
  prioridade: string
  prazoResposta: string | null
  dataRecebimento: string
  etiquetaCodigo: string
  _count: {
    anexos: number
    tramitacoes: number
  }
}

interface Estatisticas {
  ano: number
  total: number
  porTipo: Array<{ tipo: string; quantidade: number }>
  porSituacao: Array<{ situacao: string; quantidade: number }>
  porPrioridade: Array<{ prioridade: string; quantidade: number }>
}

const TIPO_LABELS: Record<string, string> = {
  'ENTRADA': 'Entrada',
  'SAIDA': 'Saída',
  'INTERNO': 'Interno'
}

const SITUACAO_LABELS: Record<string, string> = {
  'ABERTO': 'Aberto',
  'EM_TRAMITACAO': 'Em Tramitação',
  'RESPONDIDO': 'Respondido',
  'ARQUIVADO': 'Arquivado',
  'DEVOLVIDO': 'Devolvido',
  'CANCELADO': 'Cancelado'
}

const SITUACAO_COLORS: Record<string, string> = {
  'ABERTO': 'bg-blue-100 text-blue-700',
  'EM_TRAMITACAO': 'bg-yellow-100 text-yellow-700',
  'RESPONDIDO': 'bg-green-100 text-green-700',
  'ARQUIVADO': 'bg-gray-100 text-gray-700',
  'DEVOLVIDO': 'bg-orange-100 text-orange-700',
  'CANCELADO': 'bg-red-100 text-red-700'
}

const PRIORIDADE_LABELS: Record<string, string> = {
  'BAIXA': 'Baixa',
  'NORMAL': 'Normal',
  'ALTA': 'Alta',
  'URGENTE': 'Urgente'
}

const PRIORIDADE_COLORS: Record<string, string> = {
  'BAIXA': 'bg-gray-100 text-gray-600',
  'NORMAL': 'bg-blue-100 text-blue-600',
  'ALTA': 'bg-orange-100 text-orange-600',
  'URGENTE': 'bg-red-100 text-red-600'
}

export default function ProtocoloListPage() {
  const [protocolos, setProtocolos] = useState<Protocolo[]>([])
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroSituacao, setFiltroSituacao] = useState<string>('todos')
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todos')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const carregarProtocolos = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')

      if (busca) params.set('busca', busca)
      if (filtroTipo && filtroTipo !== 'todos') params.set('tipo', filtroTipo)
      if (filtroSituacao && filtroSituacao !== 'todos') params.set('situacao', filtroSituacao)
      if (filtroPrioridade && filtroPrioridade !== 'todos') params.set('prioridade', filtroPrioridade)

      const response = await fetch(`/api/protocolo?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setProtocolos(data.data.protocolos)
        setTotalPages(data.data.totalPages)
      } else {
        toast.error(data.error || 'Erro ao carregar protocolos')
      }
    } catch (error) {
      console.error('Erro ao carregar protocolos:', error)
      toast.error('Erro ao carregar protocolos')
    } finally {
      setLoading(false)
    }
  }, [page, busca, filtroTipo, filtroSituacao, filtroPrioridade])

  const carregarEstatisticas = async () => {
    try {
      const response = await fetch('/api/protocolo?acao=estatisticas')
      const data = await response.json()
      if (data.success) {
        setEstatisticas(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  useEffect(() => {
    carregarProtocolos()
  }, [carregarProtocolos])

  useEffect(() => {
    carregarEstatisticas()
  }, [])

  const verificarPrazoVencido = (prazo: string | null) => {
    if (!prazo) return false
    return new Date(prazo) < new Date()
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <FileText className="h-7 w-7 text-blue-600" />
            Protocolo Administrativo
          </h1>
          <p className="mt-1 text-gray-600">
            Gestão de documentos de entrada, saída e internos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => carregarProtocolos()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button asChild>
            <Link href="/admin/protocolo/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo Protocolo
            </Link>
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      {estatisticas && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total {estatisticas.ano}
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
                <Clock className="h-4 w-4" /> Abertos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {estatisticas.porSituacao.find(s => s.situacao === 'ABERTO')?.quantidade || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <ArrowRight className="h-4 w-4" /> Em Tramitação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {estatisticas.porSituacao.find(s => s.situacao === 'EM_TRAMITACAO')?.quantidade || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Archive className="h-4 w-4" /> Arquivados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600">
                {estatisticas.porSituacao.find(s => s.situacao === 'ARQUIVADO')?.quantidade || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar por assunto, remetente ou código..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ENTRADA">Entrada</SelectItem>
                <SelectItem value="SAIDA">Saída</SelectItem>
                <SelectItem value="INTERNO">Interno</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Situação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="ABERTO">Aberto</SelectItem>
                <SelectItem value="EM_TRAMITACAO">Em Tramitação</SelectItem>
                <SelectItem value="RESPONDIDO">Respondido</SelectItem>
                <SelectItem value="ARQUIVADO">Arquivado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroPrioridade} onValueChange={setFiltroPrioridade}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="BAIXA">Baixa</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="ALTA">Alta</SelectItem>
                <SelectItem value="URGENTE">Urgente</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setBusca('')
                setFiltroTipo('todos')
                setFiltroSituacao('todos')
                setFiltroPrioridade('todos')
                setPage(1)
              }}
            >
              <Filter className="mr-2 h-4 w-4" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
          ) : protocolos.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              Nenhum protocolo encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Remetente</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {protocolos.map((protocolo) => (
                  <TableRow key={protocolo.id}>
                    <TableCell>
                      <div className="font-medium">
                        {protocolo.numero.toString().padStart(5, '0')}/{protocolo.ano}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <QrCode className="h-3 w-3" />
                        {protocolo.etiquetaCodigo?.slice(0, 15)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {TIPO_LABELS[protocolo.tipo] || protocolo.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {protocolo.nomeRemetente}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {protocolo.assunto}
                    </TableCell>
                    <TableCell>
                      <Badge className={SITUACAO_COLORS[protocolo.situacao]}>
                        {SITUACAO_LABELS[protocolo.situacao] || protocolo.situacao}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={PRIORIDADE_COLORS[protocolo.prioridade]}>
                        {PRIORIDADE_LABELS[protocolo.prioridade] || protocolo.prioridade}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {protocolo.prazoResposta ? (
                        <div className="flex items-center gap-1">
                          {verificarPrazoVencido(protocolo.prazoResposta) && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                          <span className={
                            verificarPrazoVencido(protocolo.prazoResposta)
                              ? 'text-red-600 font-medium'
                              : 'text-gray-600'
                          }>
                            {new Date(protocolo.prazoResposta).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/protocolo/${protocolo.id}`}>
                          Ver
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  )
}
