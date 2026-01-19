'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  TrendingUp,
  Download,
  Calendar,
  FileText,
  Eye,
  DollarSign,
  Loader2,
  Search,
  BarChart3
} from 'lucide-react'
import { useReceitas } from '@/lib/hooks/use-receitas'

const situacaoConfig: Record<string, { color: string }> = {
  PREVISTA: { color: 'bg-blue-100 text-blue-800' },
  ARRECADADA: { color: 'bg-green-100 text-green-800' },
  CANCELADA: { color: 'bg-red-100 text-red-800' }
}

export default function ReceitasPage() {
  const { receitas, loading } = useReceitas()
  const [filtroCategoria, setFiltroCategoria] = useState('all')
  const [filtroOrigem, setFiltroOrigem] = useState('all')
  const [filtroSituacao, setFiltroSituacao] = useState('all')
  const [filtroAno, setFiltroAno] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const anos = useMemo(() => {
    const anosSet = new Set(receitas.map(r => r.ano.toString()))
    return Array.from(anosSet).sort((a, b) => parseInt(b) - parseInt(a))
  }, [receitas])

  const categorias = useMemo(() => {
    const categoriasSet = new Set(receitas.map(r => r.categoria))
    return Array.from(categoriasSet)
  }, [receitas])

  const origens = useMemo(() => {
    const origensSet = new Set(receitas.map(r => r.origem))
    return Array.from(origensSet)
  }, [receitas])

  const receitasFiltradas = useMemo(() => {
    return receitas.filter(r => {
      const matchCategoria = filtroCategoria === 'all' || r.categoria === filtroCategoria
      const matchOrigem = filtroOrigem === 'all' || r.origem === filtroOrigem
      const matchSituacao = filtroSituacao === 'all' || r.situacao === filtroSituacao
      const matchAno = filtroAno === 'all' || r.ano.toString() === filtroAno
      const matchSearch = !searchTerm ||
        (r.numero?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (r.contribuinte?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
      return matchCategoria && matchOrigem && matchSituacao && matchAno && matchSearch
    })
  }, [receitas, filtroCategoria, filtroOrigem, filtroSituacao, filtroAno, searchTerm])

  const estatisticas = useMemo(() => {
    const totalPrevisto = receitas.reduce((acc, r) => acc + (Number(r.valorPrevisto) || 0), 0)
    const totalArrecadado = receitas.reduce((acc, r) => acc + (Number(r.valorArrecadado) || 0), 0)
    const percentual = totalPrevisto > 0 ? (totalArrecadado / totalPrevisto) * 100 : 0
    return {
      total: receitas.length,
      totalPrevisto,
      totalArrecadado,
      percentualArrecadado: percentual
    }
  }, [receitas])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-primary" />
          Receitas
        </h1>
        <p className="text-muted-foreground">
          Consulte todas as receitas da Camara Municipal
        </p>
      </div>

      {/* Estatisticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Receitas</p>
                <p className="text-2xl font-bold">{estatisticas.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Previsto</p>
                <p className="text-xl font-bold">R$ {estatisticas.totalPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Arrecadado</p>
                <p className="text-xl font-bold">R$ {estatisticas.totalArrecadado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">% Arrecadado</p>
                <p className="text-2xl font-bold">{estatisticas.percentualArrecadado.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <Input
                placeholder="Numero ou contribuinte..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Ano</label>
              <Select value={filtroAno} onValueChange={setFiltroAno}>
                <SelectTrigger><SelectValue placeholder="Todos os anos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os anos</SelectItem>
                  {anos.map(ano => (
                    <SelectItem key={ano} value={ano}>{ano}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Categoria</label>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger><SelectValue placeholder="Todas as categorias" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categorias.map(c => (
                    <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Origem</label>
              <Select value={filtroOrigem} onValueChange={setFiltroOrigem}>
                <SelectTrigger><SelectValue placeholder="Todas as origens" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as origens</SelectItem>
                  {origens.map(o => (
                    <SelectItem key={o} value={o}>{o.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Situacao</label>
              <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
                <SelectTrigger><SelectValue placeholder="Todas as situacoes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as situacoes</SelectItem>
                  <SelectItem value="PREVISTA">Prevista</SelectItem>
                  <SelectItem value="ARRECADADA">Arrecadada</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Receitas */}
      <div className="space-y-4">
        {receitasFiltradas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma receita encontrada</p>
            </CardContent>
          </Card>
        ) : (
          receitasFiltradas.map(receita => {
            const config = situacaoConfig[receita.situacao] || situacaoConfig.ARRECADADA
            return (
              <Card key={receita.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-lg text-primary">{receita.numero || `${receita.mes}/${receita.ano}`}</span>
                        <span className={`px-3 py-1 rounded-full text-sm ${config.color}`}>
                          {receita.situacao.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span>{receita.origem.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{receita.mes}/{receita.ano}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <span className="text-blue-600">Previsto: R$ {Number(receita.valorPrevisto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">Arrecadado: R$ {Number(receita.valorArrecadado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                      {receita.contribuinte && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <span>Contribuinte: {receita.contribuinte}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span>Categoria: {receita.categoria.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Detalhes
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
