'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  Search, Loader2, Eye, FileText, Clock, AlertTriangle,
  CheckCircle, MessageSquare, ChevronLeft, ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface SolicitacaoESIC {
  id: string
  protocolo: string
  nome: string
  email: string
  assunto: string
  descricao: string
  status: string
  prazoResposta: string
  dataProrrogacao?: string
  resposta?: string
  respondidoPor?: string
  dataResposta?: string
  formaResposta?: string
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const statusColors: Record<string, string> = {
  ABERTO: 'bg-blue-100 text-blue-800',
  EM_ANALISE: 'bg-yellow-100 text-yellow-800',
  RESPONDIDO: 'bg-green-100 text-green-800',
  PRORROGADO: 'bg-orange-100 text-orange-800',
  RECURSO: 'bg-purple-100 text-purple-800',
  NEGADO: 'bg-red-100 text-red-800',
  ARQUIVADO: 'bg-gray-100 text-gray-800',
}

const statusLabels: Record<string, string> = {
  ABERTO: 'Aberto',
  EM_ANALISE: 'Em Analise',
  RESPONDIDO: 'Respondido',
  PRORROGADO: 'Prorrogado',
  RECURSO: 'Recurso',
  NEGADO: 'Negado',
  ARQUIVADO: 'Arquivado',
}

export default function ESICAdminPage() {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoESIC[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [statusFilter, setStatusFilter] = useState('')
  const [busca, setBusca] = useState('')
  const [anoFilter, setAnoFilter] = useState('')
  const [stats, setStats] = useState({ total: 0, abertos: 0, emAnalise: 0, respondidos: 0, atrasados: 0 })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', pagination.page.toString())
      params.set('limit', '10')
      if (statusFilter) params.set('status', statusFilter)
      if (busca) params.set('busca', busca)
      if (anoFilter) params.set('ano', anoFilter)

      const res = await fetch(`/api/e-sic?${params}`)
      const json = await res.json()
      if (json.success) {
        setSolicitacoes(json.data)
        setPagination(prev => ({ ...prev, ...json.pagination }))
      }
    } catch {
      toast.error('Erro ao carregar solicitacoes')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, statusFilter, busca, anoFilter])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/e-sic/estatisticas')
      const json = await res.json()
      if (json.success) {
        const d = json.data
        setStats({
          total: d.total || 0,
          abertos: d.porStatus?.ABERTO || 0,
          emAnalise: d.porStatus?.EM_ANALISE || 0,
          respondidos: d.porStatus?.RESPONDIDO || 0,
          atrasados: d.atrasados || 0,
        })
      }
    } catch {
      // silently ignore stats error
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchStats() }, [fetchStats])

  const isAtrasado = (sol: SolicitacaoESIC) => {
    if (['RESPONDIDO', 'ARQUIVADO', 'NEGADO'].includes(sol.status)) return false
    return new Date(sol.prazoResposta) < new Date()
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR')

  if (loading && solicitacoes.length === 0) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">e-SIC - Sistema de Informacao ao Cidadao</h1>
        <p className="text-muted-foreground">Gerencie as solicitacoes de acesso a informacao</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.abertos}</p>
                <p className="text-xs text-muted-foreground">Abertos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.emAnalise}</p>
                <p className="text-xs text-muted-foreground">Em Analise</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.respondidos}</p>
                <p className="text-xs text-muted-foreground">Respondidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.atrasados}</p>
                <p className="text-xs text-muted-foreground">Atrasados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por protocolo, nome ou assunto..."
                className="pl-10"
                value={busca}
                onChange={e => { setBusca(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
              />
            </div>
            <select
              className="px-3 py-2 border rounded-md"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
            >
              <option value="">Todos os status</option>
              {Object.entries(statusLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 border rounded-md"
              value={anoFilter}
              onChange={e => { setAnoFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
            >
              <option value="">Todos os anos</option>
              {[2026, 2025, 2024, 2023].map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitacoes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitacoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhuma solicitacao encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  solicitacoes.map(sol => (
                    <TableRow key={sol.id}>
                      <TableCell className="font-mono text-sm">{sol.protocolo}</TableCell>
                      <TableCell>{sol.nome}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{sol.assunto}</TableCell>
                      <TableCell>{formatDate(sol.createdAt)}</TableCell>
                      <TableCell>{formatDate(sol.prazoResposta)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge className={statusColors[sol.status] || 'bg-gray-100 text-gray-800'}>
                            {statusLabels[sol.status] || sol.status}
                          </Badge>
                          {isAtrasado(sol) && (
                            <Badge className="bg-red-100 text-red-800">ATRASADO</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/e-sic/${sol.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />Ver detalhes
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Pagina {pagination.page} de {pagination.totalPages} ({pagination.total} registros)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
