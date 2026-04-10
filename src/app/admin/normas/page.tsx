"use client"

import { createLogger } from '@/lib/logging/logger'
const log = createLogger('admin/normas')

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  BookOpen,
  RefreshCw,
  Eye,
  FileText,
  Scale,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { RedirectConfig } from '@/components/admin/redirect-config'
import { StatsGrid, StatItem } from '@/components/admin/stats-grid'
import { PageHeader } from '@/components/admin/page-header'
import { ListFilters, FilterSelect } from '@/components/admin/list-filters'
import { EmptyState } from '@/components/admin/empty-state'
import { NORMA_TIPO, NORMA_SITUACAO, getStatusInfo, formatDateBR } from '@/lib/utils/legislative-labels'

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

export default function NormasListPage() {
  const router = useRouter()
  const [normas, setNormas] = useState<NormaJuridica[]>([])
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string>('all')
  const [filtroSituacao, setFiltroSituacao] = useState<string>('all')
  const [filtroAno, setFiltroAno] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const carregarNormas = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')

      if (busca) params.set('busca', busca)
      if (filtroTipo && filtroTipo !== 'all') params.set('tipo', filtroTipo)
      if (filtroSituacao && filtroSituacao !== 'all') params.set('situacao', filtroSituacao)
      if (filtroAno && filtroAno !== 'all') params.set('ano', filtroAno)

      const response = await fetch(`/api/normas?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setNormas(data.data.normas)
        setTotalPages(data.data.totalPages)
      } else {
        toast.error(data.error || 'Erro ao carregar normas')
      }
    } catch (error) {
      log.error('Erro ao carregar normas', error)
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
      log.error('Erro ao carregar estatisticas', error)
    }
  }

  useEffect(() => {
    carregarNormas()
  }, [carregarNormas])

  useEffect(() => {
    carregarEstatisticas()
  }, [])

  // Gerar lista de anos
  const anos: number[] = []
  const anoAtual = new Date().getFullYear()
  for (let i = anoAtual; i >= anoAtual - 20; i--) {
    anos.push(i)
  }

  // Build filter options from centralized labels
  const tipoOptions = [
    { value: 'all', label: 'Todos' },
    ...Object.entries(NORMA_TIPO)
      .filter(([key]) => key !== 'LEI_ORGANICA' && key !== 'REGIMENTO_INTERNO')
      .map(([value, label]) => ({ value, label })),
  ]

  const situacaoOptions = [
    { value: 'all', label: 'Todas' },
    ...Object.entries(NORMA_SITUACAO).map(([value, { label }]) => ({ value, label })),
  ]

  const anoOptions = [
    { value: 'all', label: 'Todos' },
    ...anos.map(ano => ({ value: ano.toString(), label: ano.toString() })),
  ]

  const filters: FilterSelect[] = [
    {
      label: 'Tipo',
      value: filtroTipo,
      onChange: setFiltroTipo,
      options: tipoOptions,
      placeholder: 'Tipo',
      width: 'w-full sm:w-[200px]',
    },
    {
      label: 'Situacao',
      value: filtroSituacao,
      onChange: setFiltroSituacao,
      options: situacaoOptions,
      placeholder: 'Situacao',
      width: 'w-full sm:w-[180px]',
    },
    {
      label: 'Ano',
      value: filtroAno,
      onChange: setFiltroAno,
      options: anoOptions,
      placeholder: 'Ano',
      width: 'w-full sm:w-[120px]',
    },
  ]

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Normas Juridicas"
        subtitle="Gestao de leis, decretos e resolucoes"
        icon={Scale}
        onNewClick={() => router.push('/admin/normas/nova')}
        newLabel="Nova Norma"
      >
        <Button variant="outline" onClick={carregarNormas}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </PageHeader>

      <RedirectConfig slug="leis" label="Legislação" />

      {/* Cards de Estatisticas */}
      {estatisticas && (
        <StatsGrid
          items={[
            {
              label: `Total ${estatisticas.ano}`,
              value: estatisticas.total,
              color: 'blue',
            },
            {
              label: 'Vigentes',
              value: estatisticas.porSituacao.find(s => s.situacao === 'VIGENTE')?.quantidade || 0,
              icon: CheckCircle,
              color: 'green',
            },
            {
              label: 'Com Alteracoes',
              value: estatisticas.porSituacao.find(s => s.situacao === 'COM_ALTERACOES')?.quantidade || 0,
              icon: AlertTriangle,
              color: 'yellow',
            },
            {
              label: 'Revogadas',
              value: estatisticas.porSituacao.find(s => s.situacao === 'REVOGADA')?.quantidade || 0,
              icon: XCircle,
              color: 'red',
            },
          ] satisfies StatItem[]}
        />
      )}

      {/* Filtros */}
      <ListFilters
        searchTerm={busca}
        onSearchChange={setBusca}
        searchPlaceholder="Buscar por ementa, numero ou assunto..."
        filters={filters}
        onClear={() => {
          setBusca('')
          setFiltroTipo('all')
          setFiltroSituacao('all')
          setFiltroAno('all')
          setPage(1)
        }}
      />

      {/* Tabela */}
      {loading ? (
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
          </CardContent>
        </Card>
      ) : normas.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="Nenhuma norma encontrada"
          description="Nenhuma norma juridica corresponde aos filtros aplicados."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
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
                {normas.map((norma) => {
                  const situacao = getStatusInfo(norma.situacao, NORMA_SITUACAO)
                  return (
                    <TableRow key={norma.id}>
                      <TableCell>
                        <div className="font-medium">
                          {norma.numero}/{norma.ano}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {NORMA_TIPO[norma.tipo] || norma.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {norma.ementa}
                      </TableCell>
                      <TableCell>
                        <Badge className={situacao.color}>
                          {situacao.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDateBR(norma.data)}
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
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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
