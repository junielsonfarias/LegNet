'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Gavel,
  Download,
  Calendar,
  FileText,
  Eye,
  Building2,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  Search
} from 'lucide-react'
import { useLicitacoes } from '@/lib/hooks/use-licitacoes'

const situacaoConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  EM_ANDAMENTO: { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-4 w-4" /> },
  HOMOLOGADA: { color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="h-4 w-4" /> },
  DESERTA: { color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="h-4 w-4" /> },
  FRACASSADA: { color: 'bg-orange-100 text-orange-800', icon: <AlertCircle className="h-4 w-4" /> },
  REVOGADA: { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-4 w-4" /> },
  ANULADA: { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-4 w-4" /> },
  SUSPENSA: { color: 'bg-gray-100 text-gray-800', icon: <AlertCircle className="h-4 w-4" /> }
}

export default function LicitacoesPage() {
  const { licitacoes, loading } = useLicitacoes()
  const [filtroModalidade, setFiltroModalidade] = useState('all')
  const [filtroSituacao, setFiltroSituacao] = useState('all')
  const [filtroAno, setFiltroAno] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const anos = useMemo(() => {
    const anosSet = new Set(licitacoes.map(l => l.ano.toString()))
    return Array.from(anosSet).sort((a, b) => parseInt(b) - parseInt(a))
  }, [licitacoes])

  const modalidades = useMemo(() => {
    const modalidadesSet = new Set(licitacoes.map(l => l.modalidade))
    return Array.from(modalidadesSet)
  }, [licitacoes])

  const licitacoesFiltradas = useMemo(() => {
    return licitacoes.filter(l => {
      const matchModalidade = filtroModalidade === 'all' || l.modalidade === filtroModalidade
      const matchSituacao = filtroSituacao === 'all' || l.situacao === filtroSituacao
      const matchAno = filtroAno === 'all' || l.ano.toString() === filtroAno
      const matchSearch = !searchTerm ||
        l.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.objeto.toLowerCase().includes(searchTerm.toLowerCase())
      return matchModalidade && matchSituacao && matchAno && matchSearch
    })
  }, [licitacoes, filtroModalidade, filtroSituacao, filtroAno, searchTerm])

  const estatisticas = useMemo(() => ({
    total: licitacoes.length,
    emAndamento: licitacoes.filter(l => l.situacao === 'EM_ANDAMENTO').length,
    homologadas: licitacoes.filter(l => l.situacao === 'HOMOLOGADA').length,
    valorTotal: licitacoes.reduce((acc, l) => acc + (Number(l.valorEstimado) || 0), 0)
  }), [licitacoes])

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
          <Gavel className="h-8 w-8 text-primary" />
          Licitacoes
        </h1>
        <p className="text-muted-foreground">
          Consulte todas as licitacoes realizadas pela Camara Municipal
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
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{estatisticas.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold">{estatisticas.emAndamento}</p>
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
                <p className="text-sm text-muted-foreground">Homologadas</p>
                <p className="text-2xl font-bold">{estatisticas.homologadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total Estimado</p>
                <p className="text-xl font-bold">R$ {estatisticas.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <Input
                placeholder="Numero ou objeto..."
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
              <label className="text-sm font-medium mb-2 block">Modalidade</label>
              <Select value={filtroModalidade} onValueChange={setFiltroModalidade}>
                <SelectTrigger><SelectValue placeholder="Todas as modalidades" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as modalidades</SelectItem>
                  {modalidades.map(m => (
                    <SelectItem key={m} value={m}>{m.replace(/_/g, ' ')}</SelectItem>
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
                  <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                  <SelectItem value="HOMOLOGADA">Homologada</SelectItem>
                  <SelectItem value="DESERTA">Deserta</SelectItem>
                  <SelectItem value="FRACASSADA">Fracassada</SelectItem>
                  <SelectItem value="REVOGADA">Revogada</SelectItem>
                  <SelectItem value="ANULADA">Anulada</SelectItem>
                  <SelectItem value="SUSPENSA">Suspensa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Licitacoes */}
      <div className="space-y-4">
        {licitacoesFiltradas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma licitacao encontrada</p>
            </CardContent>
          </Card>
        ) : (
          licitacoesFiltradas.map(licitacao => {
            const config = situacaoConfig[licitacao.situacao] || situacaoConfig.EM_ANDAMENTO
            return (
              <Card key={licitacao.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-lg text-primary">{licitacao.numero}</span>
                        <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${config.color}`}>
                          {config.icon}
                          {licitacao.situacao.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-muted-foreground mb-4">{licitacao.objeto}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Gavel className="h-4 w-4 text-muted-foreground" />
                          <span>{licitacao.modalidade.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Abertura: {new Date(licitacao.dataAbertura).toLocaleDateString('pt-BR')}</span>
                        </div>
                        {licitacao.horaAbertura && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{licitacao.horaAbertura}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>R$ {Number(licitacao.valorEstimado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                      {licitacao.unidadeGestora && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          <span>{licitacao.unidadeGestora}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {licitacao.linkEdital && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={licitacao.linkEdital} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Edital
                          </a>
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Detalhes
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
