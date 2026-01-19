'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Handshake,
  Download,
  Calendar,
  FileText,
  Eye,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Search
} from 'lucide-react'
import { useConvenios } from '@/lib/hooks/use-convenios'

const situacaoConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  ATIVO: { color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="h-4 w-4" /> },
  EM_EXECUCAO: { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-4 w-4" /> },
  SUSPENSO: { color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="h-4 w-4" /> },
  ENCERRADO: { color: 'bg-gray-100 text-gray-800', icon: <XCircle className="h-4 w-4" /> },
  CANCELADO: { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-4 w-4" /> }
}

export default function ConveniosPage() {
  const { convenios, loading } = useConvenios()
  const [filtroSituacao, setFiltroSituacao] = useState('all')
  const [filtroAno, setFiltroAno] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const anos = useMemo(() => {
    const anosSet = new Set(convenios.map(c => c.ano.toString()))
    return Array.from(anosSet).sort((a, b) => parseInt(b) - parseInt(a))
  }, [convenios])

  const conveniosFiltrados = useMemo(() => {
    return convenios.filter(c => {
      const matchSituacao = filtroSituacao === 'all' || c.situacao === filtroSituacao
      const matchAno = filtroAno === 'all' || c.ano.toString() === filtroAno
      const matchSearch = !searchTerm ||
        c.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.objeto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.convenente.toLowerCase().includes(searchTerm.toLowerCase())
      return matchSituacao && matchAno && matchSearch
    })
  }, [convenios, filtroSituacao, filtroAno, searchTerm])

  const estatisticas = useMemo(() => ({
    total: convenios.length,
    ativos: convenios.filter(c => c.situacao === 'ATIVO' || c.situacao === 'EM_EXECUCAO').length,
    encerrados: convenios.filter(c => c.situacao === 'ENCERRADO').length,
    valorTotal: convenios.reduce((acc, c) => acc + (Number(c.valorTotal) || 0), 0),
    valorRepasse: convenios.reduce((acc, c) => acc + (Number(c.valorRepasse) || 0), 0)
  }), [convenios])

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
          <Handshake className="h-8 w-8 text-primary" />
          Convenios
        </h1>
        <p className="text-muted-foreground">
          Consulte todos os convenios firmados pela Camara Municipal
        </p>
      </div>

      {/* Estatisticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
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
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold">{estatisticas.ativos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-full">
                <XCircle className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Encerrados</p>
                <p className="text-2xl font-bold">{estatisticas.encerrados}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-lg font-bold">R$ {estatisticas.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
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
                <p className="text-sm text-muted-foreground">Valor Repasse</p>
                <p className="text-lg font-bold">R$ {estatisticas.valorRepasse.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
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
                placeholder="Numero, objeto ou convenente..."
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
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="EM_EXECUCAO">Em Execucao</SelectItem>
                  <SelectItem value="SUSPENSO">Suspenso</SelectItem>
                  <SelectItem value="ENCERRADO">Encerrado</SelectItem>
                  <SelectItem value="CANCELADO">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Convenios */}
      <div className="space-y-4">
        {conveniosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum convenio encontrado</p>
            </CardContent>
          </Card>
        ) : (
          conveniosFiltrados.map(convenio => {
            const config = situacaoConfig[convenio.situacao] || situacaoConfig.ATIVO
            return (
              <Card key={convenio.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-lg text-primary">{convenio.numero}</span>
                        <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${config.color}`}>
                          {config.icon}
                          {convenio.situacao.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-muted-foreground mb-4">{convenio.objeto}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Handshake className="h-4 w-4 text-muted-foreground" />
                          <span>{convenio.convenente}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Celebracao: {new Date(convenio.dataCelebracao).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Vigencia: {new Date(convenio.vigenciaInicio).toLocaleDateString('pt-BR')} a {new Date(convenio.vigenciaFim).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>R$ {Number(convenio.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                      {convenio.cnpjConvenente && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <span>CNPJ Convenente: {convenio.cnpjConvenente}</span>
                        </div>
                      )}
                      {convenio.orgaoConcedente && (
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <span>Orgao Concedente: {convenio.orgaoConcedente}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {convenio.arquivo && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={convenio.arquivo} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Convenio
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
