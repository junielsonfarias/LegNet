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
  BookOpen,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  FileText,
  Scale,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'

interface NormaJuridica {
  id: string
  tipo: string
  numero: string
  ano: number
  ementa: string
  situacao: string
  data: string
  dataPublicacao?: string
  _count: {
    artigos: number
    alteracoesRecebidas: number
    versoes: number
  }
}

interface Estatisticas {
  ano: number
  total: number
  porTipo: Array<{ tipo: string; quantidade: number }>
  porSituacao: Array<{ situacao: string; quantidade: number }>
}

const TIPO_LABELS: Record<string, string> = {
  'LEI_ORDINARIA': 'Lei Ordinaria',
  'LEI_COMPLEMENTAR': 'Lei Complementar',
  'DECRETO_LEGISLATIVO': 'Decreto Legislativo',
  'RESOLUCAO': 'Resolucao',
  'EMENDA_LEI_ORGANICA': 'Emenda a Lei Organica',
  'LEI_ORGANICA': 'Lei Organica',
  'REGIMENTO_INTERNO': 'Regimento Interno'
}

const SITUACAO_LABELS: Record<string, string> = {
  'VIGENTE': 'Vigente',
  'REVOGADA': 'Revogada',
  'REVOGADA_PARCIALMENTE': 'Revogada Parcialmente',
  'COM_ALTERACOES': 'Com Alteracoes',
  'SUSPENSA': 'Suspensa'
}

const SITUACAO_COLORS: Record<string, string> = {
  'VIGENTE': 'bg-green-100 text-green-700',
  'REVOGADA': 'bg-red-100 text-red-700',
  'REVOGADA_PARCIALMENTE': 'bg-orange-100 text-orange-700',
  'COM_ALTERACOES': 'bg-yellow-100 text-yellow-700',
  'SUSPENSA': 'bg-gray-100 text-gray-700'
}

export default function NormasListPage() {
  const [normas, setNormas] = useState<NormaJuridica[]>([])
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string>('')
  const [filtroSituacao, setFiltroSituacao] = useState<string>('')
  const [filtroAno, setFiltroAno] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const carregarNormas = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')

      if (busca) params.set('busca', busca)
      if (filtroTipo) params.set('tipo', filtroTipo)
      if (filtroSituacao) params.set('situacao', filtroSituacao)
      if (filtroAno) params.set('ano', filtroAno)

      const response = await fetch(`/api/normas?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setNormas(data.data.normas)
        setTotalPages(data.data.totalPages)
      } else {
        toast.error(data.error || 'Erro ao carregar normas')
      }
    } catch (error) {
      console.error('Erro ao carregar normas:', error)
      toast.error('Erro ao carregar normas')
    } finally {
      setLoading(false)
    }
  }, [page, busca, filtroTipo, filtroSituacao, filtroAno])

  const carregarEstatisticas = async () => {
    try {
      const response = await fetch('/api/normas?acao=estatisticas')
      const data = await response.json()
      if (data.success) {
        setEstatisticas(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar estatisticas:', error)
    }
  }

  useEffect(() => {
    carregarNormas()
  }, [carregarNormas])

  useEffect(() => {
    carregarEstatisticas()
  }, [])

  // Gerar lista de anos
  const anos = []
  const anoAtual = new Date().getFullYear()
  for (let i = anoAtual; i >= anoAtual - 20; i--) {
    anos.push(i)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Scale className="h-7 w-7 text-blue-600" />
            Normas Juridicas
          </h1>
          <p className="mt-1 text-gray-600">
            Gestao de leis, decretos e resolucoes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={carregarNormas}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button asChild>
            <Link href="/admin/normas/nova">
              <Plus className="mr-2 h-4 w-4" />
              Nova Norma
            </Link>
          </Button>
        </div>
      </div>

      {/* Cards de Estatisticas */}
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
                <CheckCircle className="h-4 w-4 text-green-500" /> Vigentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {estatisticas.porSituacao.find(s => s.situacao === 'VIGENTE')?.quantidade || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <AlertTriangle className="h-4 w-4 text-yellow-500" /> Com Alteracoes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {estatisticas.porSituacao.find(s => s.situacao === 'COM_ALTERACOES')?.quantidade || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <XCircle className="h-4 w-4 text-red-500" /> Revogadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {estatisticas.porSituacao.find(s => s.situacao === 'REVOGADA')?.quantidade || 0}
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
                  placeholder="Buscar por ementa, numero ou assunto..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="LEI_ORDINARIA">Lei Ordinaria</SelectItem>
                <SelectItem value="LEI_COMPLEMENTAR">Lei Complementar</SelectItem>
                <SelectItem value="DECRETO_LEGISLATIVO">Decreto Legislativo</SelectItem>
                <SelectItem value="RESOLUCAO">Resolucao</SelectItem>
                <SelectItem value="EMENDA_LEI_ORGANICA">Emenda a Lei Organica</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Situacao" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="VIGENTE">Vigente</SelectItem>
                <SelectItem value="COM_ALTERACOES">Com Alteracoes</SelectItem>
                <SelectItem value="REVOGADA">Revogada</SelectItem>
                <SelectItem value="REVOGADA_PARCIALMENTE">Revogada Parcialmente</SelectItem>
                <SelectItem value="SUSPENSA">Suspensa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroAno} onValueChange={setFiltroAno}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {anos.map(ano => (
                  <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setBusca('')
                setFiltroTipo('')
                setFiltroSituacao('')
                setFiltroAno('')
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
          ) : normas.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              Nenhuma norma encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Identificacao</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ementa</TableHead>
                  <TableHead>Situacao</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Artigos</TableHead>
                  <TableHead>Alteracoes</TableHead>
                  <TableHead>Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {normas.map((norma) => (
                  <TableRow key={norma.id}>
                    <TableCell>
                      <div className="font-medium">
                        {norma.numero}/{norma.ano}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {TIPO_LABELS[norma.tipo] || norma.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {norma.ementa}
                    </TableCell>
                    <TableCell>
                      <Badge className={SITUACAO_COLORS[norma.situacao]}>
                        {SITUACAO_LABELS[norma.situacao] || norma.situacao}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(norma.data).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4 text-gray-400" />
                        {norma._count.artigos}
                      </div>
                    </TableCell>
                    <TableCell>
                      {norma._count.alteracoesRecebidas > 0 ? (
                        <Badge variant="secondary">
                          {norma._count.alteracoesRecebidas}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/admin/normas/${norma.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/legislativo/normas/${norma.id}`}>
                            <BookOpen className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Paginacao */}
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
            Pagina {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Proxima
          </Button>
        </div>
      )}
    </div>
  )
}
