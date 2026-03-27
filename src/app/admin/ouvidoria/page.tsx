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
  Search, Loader2, Eye, FileText, Clock,
  CheckCircle, MessageSquare, ChevronLeft, ChevronRight, Inbox
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface ManifestacaoOuvidoria {
  id: string
  protocolo: string
  tipo: string
  anonimo: boolean
  nome?: string
  assunto: string
  status: string
  prioridade: string
  prazoResposta: string
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const statusColors: Record<string, string> = {
  REGISTRADA: 'bg-blue-100 text-blue-800',
  EM_ANALISE: 'bg-yellow-100 text-yellow-800',
  ENCAMINHADA: 'bg-orange-100 text-orange-800',
  RESPONDIDA: 'bg-green-100 text-green-800',
  CONCLUIDA: 'bg-emerald-100 text-emerald-800',
  ARQUIVADA: 'bg-gray-100 text-gray-800',
}

const statusLabels: Record<string, string> = {
  REGISTRADA: 'Registrada',
  EM_ANALISE: 'Em Analise',
  ENCAMINHADA: 'Encaminhada',
  RESPONDIDA: 'Respondida',
  CONCLUIDA: 'Concluida',
  ARQUIVADA: 'Arquivada',
}

const tipoColors: Record<string, string> = {
  RECLAMACAO: 'bg-red-100 text-red-800',
  SUGESTAO: 'bg-blue-100 text-blue-800',
  ELOGIO: 'bg-green-100 text-green-800',
  DENUNCIA: 'bg-orange-100 text-orange-800',
  SOLICITACAO: 'bg-purple-100 text-purple-800',
}

const tipoLabels: Record<string, string> = {
  RECLAMACAO: 'Reclamacao',
  SUGESTAO: 'Sugestao',
  ELOGIO: 'Elogio',
  DENUNCIA: 'Denuncia',
  SOLICITACAO: 'Solicitacao',
}

export default function OuvidoriaAdminPage() {
  const [manifestacoes, setManifestacoes] = useState<ManifestacaoOuvidoria[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [statusFilter, setStatusFilter] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')
  const [busca, setBusca] = useState('')
  const [anoFilter, setAnoFilter] = useState('')
  const [stats, setStats] = useState({ total: 0, registradas: 0, emAnalise: 0, respondidas: 0, concluidas: 0 })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', pagination.page.toString())
      params.set('limit', '10')
      if (statusFilter) params.set('status', statusFilter)
      if (tipoFilter) params.set('tipo', tipoFilter)
      if (busca) params.set('busca', busca)
      if (anoFilter) params.set('ano', anoFilter)

      const res = await fetch(`/api/ouvidoria?${params}`)
      const json = await res.json()
      if (json.success) {
        setManifestacoes(json.data)
        setPagination(prev => ({ ...prev, ...json.pagination }))
      }
    } catch {
      toast.error('Erro ao carregar manifestacoes')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, statusFilter, tipoFilter, busca, anoFilter])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/ouvidoria/estatisticas')
      const json = await res.json()
      if (json.success) {
        const d = json.data
        setStats({
          total: d.total || 0,
          registradas: d.porStatus?.REGISTRADA || 0,
          emAnalise: d.porStatus?.EM_ANALISE || 0,
          respondidas: d.porStatus?.RESPONDIDA || 0,
          concluidas: d.porStatus?.CONCLUIDA || 0,
        })
      }
    } catch {
      // silently ignore
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchStats() }, [fetchStats])

  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR')

  if (loading && manifestacoes.length === 0) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ouvidoria</h1>
        <p className="text-muted-foreground">Gerencie as manifestacoes da ouvidoria</p>
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
              <Inbox className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.registradas}</p>
                <p className="text-xs text-muted-foreground">Registradas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
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
              <MessageSquare className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.respondidas}</p>
                <p className="text-xs text-muted-foreground">Respondidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{stats.concluidas}</p>
                <p className="text-xs text-muted-foreground">Concluidas</p>
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
              value={tipoFilter}
              onChange={e => { setTipoFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
            >
              <option value="">Todos os tipos</option>
              {Object.entries(tipoLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
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
          <CardTitle>Manifestacoes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Manifestante</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {manifestacoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhuma manifestacao encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  manifestacoes.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-sm">{m.protocolo}</TableCell>
                      <TableCell>
                        <Badge className={tipoColors[m.tipo] || 'bg-gray-100 text-gray-800'}>
                          {tipoLabels[m.tipo] || m.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{m.assunto}</TableCell>
                      <TableCell>{m.anonimo ? 'Anonimo' : (m.nome || '-')}</TableCell>
                      <TableCell>{formatDate(m.createdAt)}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[m.status] || 'bg-gray-100 text-gray-800'}>
                          {statusLabels[m.status] || m.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/ouvidoria/${m.id}`}>
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

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Pagina {pagination.page} de {pagination.totalPages} ({pagination.total} registros)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pagination.page <= 1}
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>
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
