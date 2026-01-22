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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Search, Eye, MoreHorizontal, ThumbsUp, FileText, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Sugestao {
  id: string
  titulo: string
  descricao: string
  justificativa: string
  nome: string
  email: string
  bairro?: string
  categoria?: string
  status: string
  totalApoios: number
  motivoRecusa?: string
  createdAt: string
  _count?: {
    apoios: number
  }
}

const STATUS_COLORS: Record<string, string> = {
  PENDENTE: 'bg-yellow-500',
  EM_ANALISE: 'bg-blue-500',
  ACEITA: 'bg-green-500',
  REJEITADA: 'bg-red-500',
  ARQUIVADA: 'bg-gray-500'
}

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  EM_ANALISE: 'Em Analise',
  ACEITA: 'Aceita',
  REJEITADA: 'Rejeitada',
  ARQUIVADA: 'Arquivada'
}

const CATEGORIAS: Record<string, string> = {
  SAUDE: 'Saude',
  EDUCACAO: 'Educacao',
  SEGURANCA: 'Seguranca',
  TRANSPORTE: 'Transporte',
  MEIO_AMBIENTE: 'Meio Ambiente',
  CULTURA: 'Cultura',
  ESPORTE: 'Esporte',
  ASSISTENCIA_SOCIAL: 'Assistencia Social',
  URBANISMO: 'Urbanismo',
  OUTROS: 'Outros'
}

export default function SugestoesPage() {
  const router = useRouter()
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos')
  const [estatisticas, setEstatisticas] = useState<any>(null)

  useEffect(() => {
    carregarSugestoes()
    carregarEstatisticas()
  }, [filtroStatus, filtroCategoria])

  async function carregarSugestoes() {
    try {
      const params = new URLSearchParams()
      if (filtroStatus !== 'todos') {
        params.set('status', filtroStatus)
      }
      if (filtroCategoria !== 'todos') {
        params.set('categoria', filtroCategoria)
      }

      const response = await fetch(`/api/participacao/sugestoes?${params}`)
      const data = await response.json()

      if (data.success) {
        setSugestoes(data.data.sugestoes || [])
      }
    } catch (error) {
      console.error('Erro ao carregar sugestoes:', error)
    } finally {
      setLoading(false)
    }
  }

  async function carregarEstatisticas() {
    try {
      const response = await fetch('/api/participacao/sugestoes?acao=estatisticas')
      const data = await response.json()

      if (data.success) {
        setEstatisticas(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar estatisticas:', error)
    }
  }

  async function moderarSugestao(id: string, status: string, motivoRecusa?: string) {
    try {
      const response = await fetch(`/api/participacao/sugestoes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, motivoRecusa })
      })

      if (response.ok) {
        carregarSugestoes()
        carregarEstatisticas()
      }
    } catch (error) {
      console.error('Erro ao moderar sugestao:', error)
    }
  }

  const sugestoesFiltradas = sugestoes.filter(s =>
    s.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    s.descricao.toLowerCase().includes(busca.toLowerCase()) ||
    s.nome.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sugestoes Legislativas</h1>
          <p className="text-muted-foreground">
            Gerencie sugestoes enviadas pelos cidadaos
          </p>
        </div>
      </div>

      {/* Estatisticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {estatisticas?.porStatus?.find((s: any) => s.status === 'PENDENTE')?.quantidade || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Analise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {estatisticas?.porStatus?.find((s: any) => s.status === 'EM_ANALISE')?.quantidade || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aceitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {estatisticas?.porStatus?.find((s: any) => s.status === 'ACEITA')?.quantidade || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejeitadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {estatisticas?.porStatus?.find((s: any) => s.status === 'REJEITADA')?.quantidade || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar sugestoes..."
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
            <SelectItem value="PENDENTE">Pendente</SelectItem>
            <SelectItem value="EM_ANALISE">Em Analise</SelectItem>
            <SelectItem value="ACEITA">Aceita</SelectItem>
            <SelectItem value="REJEITADA">Rejeitada</SelectItem>
            <SelectItem value="ARQUIVADA">Arquivada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as categorias</SelectItem>
            {Object.entries(CATEGORIAS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sugestao</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Apoios</TableHead>
                <TableHead>Data</TableHead>
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
              ) : sugestoesFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Nenhuma sugestao encontrada
                  </TableCell>
                </TableRow>
              ) : (
                sugestoesFiltradas.map(sugestao => (
                  <TableRow key={sugestao.id}>
                    <TableCell>
                      <div className="max-w-md">
                        <div className="font-medium">{sugestao.titulo}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {sugestao.descricao}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{sugestao.nome}</div>
                        <div className="text-sm text-muted-foreground">{sugestao.bairro || 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {sugestao.categoria ? (
                        <Badge variant="outline">
                          {CATEGORIAS[sugestao.categoria] || sugestao.categoria}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[sugestao.status]}>
                        {STATUS_LABELS[sugestao.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                        {sugestao.totalApoios || sugestao._count?.apoios || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(sugestao.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/admin/participacao/sugestoes/${sugestao.id}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalhes
                          </DropdownMenuItem>
                          {sugestao.status === 'PENDENTE' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => moderarSugestao(sugestao.id, 'EM_ANALISE')}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Iniciar analise
                              </DropdownMenuItem>
                            </>
                          )}
                          {sugestao.status === 'EM_ANALISE' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => moderarSugestao(sugestao.id, 'ACEITA')}
                                className="text-green-600"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Aceitar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => moderarSugestao(sugestao.id, 'REJEITADA', 'Motivo a definir')}
                                className="text-red-600"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Rejeitar
                              </DropdownMenuItem>
                            </>
                          )}
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
