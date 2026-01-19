'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Users,
  Download,
  Calendar,
  FileText,
  Eye,
  DollarSign,
  Loader2,
  Search,
  UserCheck,
  UserX,
  TrendingUp,
  Briefcase
} from 'lucide-react'
import { useServidores, useFolhaPagamento } from '@/lib/hooks/use-servidores'

const situacaoConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  ATIVO: { color: 'bg-green-100 text-green-800', icon: <UserCheck className="h-4 w-4" /> },
  INATIVO: { color: 'bg-gray-100 text-gray-800', icon: <UserX className="h-4 w-4" /> },
  AFASTADO: { color: 'bg-yellow-100 text-yellow-800', icon: <UserX className="h-4 w-4" /> },
  LICENCA: { color: 'bg-blue-100 text-blue-800', icon: <UserX className="h-4 w-4" /> },
  FERIAS: { color: 'bg-cyan-100 text-cyan-800', icon: <UserX className="h-4 w-4" /> },
  CEDIDO: { color: 'bg-purple-100 text-purple-800', icon: <UserX className="h-4 w-4" /> },
  APOSENTADO: { color: 'bg-orange-100 text-orange-800', icon: <UserX className="h-4 w-4" /> },
  EXONERADO: { color: 'bg-red-100 text-red-800', icon: <UserX className="h-4 w-4" /> }
}

export default function FolhaPagamentoPage() {
  const { servidores, loading: loadingServidores } = useServidores()
  const { folhas, loading: loadingFolhas } = useFolhaPagamento()
  const [filtroSituacao, setFiltroSituacao] = useState('all')
  const [filtroVinculo, setFiltroVinculo] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [abaSelecionada, setAbaSelecionada] = useState<'servidores' | 'folhas'>('servidores')

  const loading = loadingServidores || loadingFolhas

  const vinculos = useMemo(() => {
    const vinculosSet = new Set(servidores.map(s => s.vinculo))
    return Array.from(vinculosSet)
  }, [servidores])

  const servidoresFiltrados = useMemo(() => {
    return servidores.filter(s => {
      const matchSituacao = filtroSituacao === 'all' || s.situacao === filtroSituacao
      const matchVinculo = filtroVinculo === 'all' || s.vinculo === filtroVinculo
      const matchSearch = !searchTerm ||
        s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.cargo?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (s.matricula?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
      return matchSituacao && matchVinculo && matchSearch
    })
  }, [servidores, filtroSituacao, filtroVinculo, searchTerm])

  const estatisticas = useMemo(() => {
    const ativos = servidores.filter(s => s.situacao === 'ATIVO').length
    const totalBruto = servidores.reduce((acc, s) => acc + (Number(s.salarioBruto) || 0), 0)
    return {
      total: servidores.length,
      ativos,
      totalBruto,
      mediaSalarial: servidores.length > 0 ? totalBruto / servidores.length : 0
    }
  }, [servidores])

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
          <Users className="h-8 w-8 text-primary" />
          Folha de Pagamento
        </h1>
        <p className="text-muted-foreground">
          Consulte a folha de pagamento e servidores da Camara Municipal
        </p>
      </div>

      {/* Abas */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setAbaSelecionada('servidores')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                abaSelecionada === 'servidores'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
              }`}
            >
              Servidores
            </button>
            <button
              onClick={() => setAbaSelecionada('folhas')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                abaSelecionada === 'folhas'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
              }`}
            >
              Folhas de Pagamento
            </button>
          </nav>
        </div>
      </div>

      {abaSelecionada === 'servidores' ? (
        <>
          {/* Estatisticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Servidores</p>
                    <p className="text-2xl font-bold">{estatisticas.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <UserCheck className="h-6 w-6 text-green-600" />
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
                  <div className="p-3 bg-purple-100 rounded-full">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Bruto</p>
                    <p className="text-xl font-bold">R$ {estatisticas.totalBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-full">
                    <DollarSign className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Media Salarial</p>
                    <p className="text-xl font-bold">R$ {estatisticas.mediaSalarial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
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
                    placeholder="Nome, cargo ou matricula..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Vinculo</label>
                  <Select value={filtroVinculo} onValueChange={setFiltroVinculo}>
                    <SelectTrigger><SelectValue placeholder="Todos os vinculos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os vinculos</SelectItem>
                      {vinculos.map(v => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
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
                      <SelectItem value="INATIVO">Inativo</SelectItem>
                      <SelectItem value="AFASTADO">Afastado</SelectItem>
                      <SelectItem value="LICENCA">Licenca</SelectItem>
                      <SelectItem value="FERIAS">Ferias</SelectItem>
                      <SelectItem value="CEDIDO">Cedido</SelectItem>
                      <SelectItem value="APOSENTADO">Aposentado</SelectItem>
                      <SelectItem value="EXONERADO">Exonerado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Servidores */}
          <div className="space-y-4">
            {servidoresFiltrados.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Nenhum servidor encontrado</p>
                </CardContent>
              </Card>
            ) : (
              servidoresFiltrados.map(servidor => {
                const config = situacaoConfig[servidor.situacao] || situacaoConfig.ATIVO
                return (
                  <Card key={servidor.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-bold text-lg text-primary">{servidor.nome}</span>
                            <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${config.color}`}>
                              {config.icon}
                              {servidor.situacao}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {servidor.cargo && (
                              <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                <span>{servidor.cargo}</span>
                              </div>
                            )}
                            {servidor.matricula && (
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span>Mat: {servidor.matricula}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{servidor.vinculo}</span>
                            </div>
                            {servidor.salarioBruto && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                <span className="text-green-600">R$ {Number(servidor.salarioBruto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                            )}
                          </div>
                          {servidor.lotacao && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                              <span>Lotacao: {servidor.lotacao}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
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
        </>
      ) : (
        <>
          {/* Lista de Folhas de Pagamento */}
          <div className="space-y-4">
            {folhas.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Nenhuma folha de pagamento encontrada</p>
                </CardContent>
              </Card>
            ) : (
              folhas.map(folha => (
                <Card key={folha.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-bold text-lg text-primary">{folha.competencia}</span>
                          <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                            {folha.situacao?.replace(/_/g, ' ') || 'PROCESSADA'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{folha.mes}/{folha.ano}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{folha.totalServidores} servidores</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-blue-600" />
                            <span className="text-blue-600">Bruto: R$ {Number(folha.totalBruto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-green-600">Liquido: R$ {Number(folha.totalLiquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
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
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
