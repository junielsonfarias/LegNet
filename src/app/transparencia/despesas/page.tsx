'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  TrendingDown,
  Download,
  Calendar,
  FileText,
  Eye,
  DollarSign,
  Loader2,
  Search,
  CreditCard,
  CheckCircle2
} from 'lucide-react'
import { useDespesas } from '@/lib/hooks/use-despesas'

const situacaoConfig: Record<string, { color: string }> = {
  EMPENHADO: { color: 'bg-blue-100 text-blue-800' },
  LIQUIDADO: { color: 'bg-yellow-100 text-yellow-800' },
  PAGO: { color: 'bg-green-100 text-green-800' },
  ANULADO: { color: 'bg-red-100 text-red-800' }
}

export default function DespesasPage() {
  const { despesas, loading } = useDespesas()
  const [filtroSituacao, setFiltroSituacao] = useState('all')
  const [filtroAno, setFiltroAno] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const anos = useMemo(() => {
    const anosSet = new Set(despesas.map(d => d.ano.toString()))
    return Array.from(anosSet).sort((a, b) => parseInt(b) - parseInt(a))
  }, [despesas])

  const despesasFiltradas = useMemo(() => {
    return despesas.filter(d => {
      const matchSituacao = filtroSituacao === 'all' || d.situacao === filtroSituacao
      const matchAno = filtroAno === 'all' || d.ano.toString() === filtroAno
      const matchSearch = !searchTerm ||
        d.numeroEmpenho.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.credor.toLowerCase().includes(searchTerm.toLowerCase())
      return matchSituacao && matchAno && matchSearch
    })
  }, [despesas, filtroSituacao, filtroAno, searchTerm])

  const estatisticas = useMemo(() => ({
    total: despesas.length,
    totalEmpenhado: despesas.reduce((acc, d) => acc + (Number(d.valorEmpenhado) || 0), 0),
    totalLiquidado: despesas.reduce((acc, d) => acc + (Number(d.valorLiquidado) || 0), 0),
    totalPago: despesas.reduce((acc, d) => acc + (Number(d.valorPago) || 0), 0)
  }), [despesas])

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
          <TrendingDown className="h-8 w-8 text-primary" />
          Despesas
        </h1>
        <p className="text-muted-foreground">
          Consulte todas as despesas da Camara Municipal
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
                <p className="text-sm text-muted-foreground">Total de Despesas</p>
                <p className="text-2xl font-bold">{estatisticas.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Empenhado</p>
                <p className="text-xl font-bold">R$ {estatisticas.totalEmpenhado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Liquidado</p>
                <p className="text-xl font-bold">R$ {estatisticas.totalLiquidado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pago</p>
                <p className="text-xl font-bold">R$ {estatisticas.totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <Input
                placeholder="Numero do empenho ou credor..."
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
              <label className="text-sm font-medium mb-2 block">Situacao</label>
              <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
                <SelectTrigger><SelectValue placeholder="Todas as situacoes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as situacoes</SelectItem>
                  <SelectItem value="EMPENHADO">Empenhado</SelectItem>
                  <SelectItem value="LIQUIDADO">Liquidado</SelectItem>
                  <SelectItem value="PAGO">Pago</SelectItem>
                  <SelectItem value="ANULADO">Anulado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Despesas */}
      <div className="space-y-4">
        {despesasFiltradas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma despesa encontrada</p>
            </CardContent>
          </Card>
        ) : (
          despesasFiltradas.map(despesa => {
            const config = situacaoConfig[despesa.situacao] || situacaoConfig.EMPENHADO
            return (
              <Card key={despesa.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-lg text-primary">Empenho {despesa.numeroEmpenho}</span>
                        <span className={`px-3 py-1 rounded-full text-sm ${config.color}`}>
                          {despesa.situacao}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-muted-foreground" />
                          <span>{despesa.credor}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{despesa.mes}/{despesa.ano}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <span className="text-blue-600">Emp: R$ {Number(despesa.valorEmpenhado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">Pago: R$ {Number(despesa.valorPago || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                      {despesa.cnpjCpf && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <span>CNPJ/CPF: {despesa.cnpjCpf}</span>
                        </div>
                      )}
                      {despesa.elemento && (
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <span>Elemento: {despesa.elemento}</span>
                        </div>
                      )}
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
