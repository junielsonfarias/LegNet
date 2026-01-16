'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  History, 
  Search, 
  Calendar, 
  Users, 
  ChevronRight,
  ChevronDown,
  Eye,
  Loader2,
  FileText
} from 'lucide-react'
import { useMesaDiretora } from '@/lib/hooks/use-mesa-diretora'
import { useLegislaturas } from '@/lib/hooks/use-legislaturas'
import Link from 'next/link'

export default function HistoricoMesaDiretoraPage() {
  const { mesas, loading } = useMesaDiretora()
  const { legislaturas } = useLegislaturas()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLegislatura, setFilterLegislatura] = useState('all')
  const [filterPeriodo, setFilterPeriodo] = useState('all')
  const [filterAtiva, setFilterAtiva] = useState('all')
  const [expandedMesas, setExpandedMesas] = useState<string[]>([])

  // Filtrar mesas
  const filteredMesas = useMemo(() => {
    if (!mesas || !Array.isArray(mesas)) return []
    return mesas.filter(mesa => {
      if (!mesa) return false
      
      const matchesSearch = !searchTerm || 
        (mesa.periodo?.legislatura?.numero.toString().includes(searchTerm)) ||
        (mesa.periodo?.numero.toString().includes(searchTerm)) ||
        (mesa.descricao && mesa.descricao.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (mesa.membros?.some(m => m.parlamentar?.nome.toLowerCase().includes(searchTerm.toLowerCase())))
      
      const matchesLegislatura = !filterLegislatura || filterLegislatura === 'all' || 
        mesa.periodo?.legislaturaId === filterLegislatura
      
      const matchesPeriodo = !filterPeriodo || filterPeriodo === 'all' || 
        mesa.periodo?.numero.toString() === filterPeriodo

      const matchesAtiva = !filterAtiva || filterAtiva === 'all' || 
        (filterAtiva === 'ativa' && mesa.ativa) ||
        (filterAtiva === 'inativa' && !mesa.ativa)

      return matchesSearch && matchesLegislatura && matchesPeriodo && matchesAtiva
    })
  }, [mesas, searchTerm, filterLegislatura, filterPeriodo, filterAtiva])

  // Agrupar por legislatura
  const mesasPorLegislatura = useMemo(() => {
    const grupos: Record<string, typeof filteredMesas> = {}
    filteredMesas.forEach(mesa => {
      const legislaturaId = mesa.periodo?.legislaturaId || 'sem-legislatura'
      if (!grupos[legislaturaId]) {
        grupos[legislaturaId] = []
      }
      grupos[legislaturaId].push(mesa)
    })
    return grupos
  }, [filteredMesas])

  const toggleMesa = (mesaId: string) => {
    setExpandedMesas(prev => 
      prev.includes(mesaId) 
        ? prev.filter(id => id !== mesaId)
        : [...prev, mesaId]
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-camara-primary mx-auto mb-4" />
          <p className="text-gray-600">Carregando histórico...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Histórico de Mesas Diretora</h1>
          <p className="text-gray-600 mt-1">
            Visualize todas as mesas diretora cadastradas no sistema
          </p>
        </div>
        <Link href="/admin/mesa-diretora">
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Gerenciar Mesas
          </Button>
        </Link>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <History className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Mesas</p>
                <p className="text-2xl font-bold text-gray-900">{(mesas && Array.isArray(mesas) ? mesas.length : 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mesas Ativas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(mesas && Array.isArray(mesas) ? mesas.filter(m => m.ativa).length : 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Legislaturas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.keys(mesasPorLegislatura).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resultados</p>
                <p className="text-2xl font-bold text-gray-900">{filteredMesas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative mt-1">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Legislatura, período, membro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="legislatura">Legislatura</Label>
              <Select value={filterLegislatura} onValueChange={setFilterLegislatura}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as legislaturas</SelectItem>
                  {legislaturas?.map(legislatura => (
                    <SelectItem key={legislatura.id} value={legislatura.id}>
                      {legislatura.numero}ª ({legislatura.anoInicio}/{legislatura.anoFim})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="periodo">Período</Label>
              <Select value={filterPeriodo} onValueChange={setFilterPeriodo}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os períodos</SelectItem>
                  <SelectItem value="1">Período 1</SelectItem>
                  <SelectItem value="2">Período 2</SelectItem>
                  <SelectItem value="3">Período 3</SelectItem>
                  <SelectItem value="4">Período 4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="ativa">Status</Label>
              <Select value={filterAtiva} onValueChange={setFilterAtiva}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="ativa">Ativas</SelectItem>
                  <SelectItem value="inativa">Inativas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setFilterLegislatura('all')
                  setFilterPeriodo('all')
                  setFilterAtiva('all')
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Listagem por Legislatura */}
      <div className="space-y-4">
        {legislaturas && legislaturas.length > 0 ? (
          legislaturas
            .filter(leg => mesasPorLegislatura[leg.id]?.length > 0)
            .map((legislatura) => {
              const mesasLegislatura = mesasPorLegislatura[legislatura.id] || []
              
              return (
                <Card key={legislatura.id}>
                  <CardHeader>
                    <CardTitle className="text-xl">
                      {legislatura.numero}ª Legislatura ({legislatura.anoInicio}/{legislatura.anoFim})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mesasLegislatura
                        .sort((a, b) => {
                          // Ordenar por período e depois por data de criação
                          if (a.periodo?.numero !== b.periodo?.numero) {
                            return (a.periodo?.numero || 0) - (b.periodo?.numero || 0)
                          }
                          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                        })
                        .map(mesa => {
                          const isExpanded = expandedMesas.includes(mesa.id)
                          return (
                            <Card key={mesa.id} className="border-l-4 border-l-blue-500">
                              <CardContent className="p-4">
                                <div 
                                  className="cursor-pointer"
                                  onClick={() => toggleMesa(mesa.id)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3 flex-1">
                                      {isExpanded ? (
                                        <ChevronDown className="h-5 w-5 text-gray-400" />
                                      ) : (
                                        <ChevronRight className="h-5 w-5 text-gray-400" />
                                      )}
                                      <div>
                                        <h4 className="font-semibold text-gray-900">
                                          Período {mesa.periodo?.numero} - Mesa Diretora
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                          {new Date(mesa.periodo?.dataInicio || '').toLocaleDateString('pt-BR')}
                                          {mesa.periodo?.dataFim && ` até ${new Date(mesa.periodo.dataFim).toLocaleDateString('pt-BR')}`}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                      <Badge className={mesa.ativa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                        {mesa.ativa ? 'Ativa' : 'Inativa'}
                                      </Badge>
                                      <Badge variant="outline">
                                        {mesa.membros?.filter(m => m.ativo).length || 0} membro(s)
                                      </Badge>
                                    </div>
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="mt-4 pt-4 border-t space-y-3">
                                    {mesa.descricao && (
                                      <div>
                                        <p className="text-sm font-medium text-gray-700 mb-1">Descrição:</p>
                                        <p className="text-sm text-gray-600">{mesa.descricao}</p>
                                      </div>
                                    )}

                                    <div>
                                      <p className="text-sm font-medium text-gray-700 mb-2">Composição:</p>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {mesa.membros
                                          ?.sort((a, b) => (a.cargo?.ordem || 0) - (b.cargo?.ordem || 0))
                                          .map(membro => (
                                            <div 
                                              key={membro.id} 
                                              className={`p-3 rounded-lg border ${
                                                membro.ativo ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                              }`}
                                            >
                                              <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                  <p className="font-semibold text-gray-900">
                                                    {membro.cargo?.nome || 'Cargo não definido'}
                                                  </p>
                                                  <p className="text-sm text-gray-600 mt-1">
                                                    {membro.parlamentar?.nome || 'N/A'}
                                                    {membro.parlamentar?.apelido && ` (${membro.parlamentar.apelido})`}
                                                  </p>
                                                  <div className="text-xs text-gray-500 mt-2 space-y-1">
                                                    <p>
                                                      <span className="font-medium">Início:</span>{' '}
                                                      {new Date(membro.dataInicio).toLocaleDateString('pt-BR')}
                                                    </p>
                                                    {membro.dataFim && (
                                                      <p>
                                                        <span className="font-medium">Fim:</span>{' '}
                                                        {new Date(membro.dataFim).toLocaleDateString('pt-BR')}
                                                      </p>
                                                    )}
                                                    {membro.observacoes && (
                                                      <p>
                                                        <span className="font-medium">Obs:</span> {membro.observacoes}
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>
                                                <Badge 
                                                  variant={membro.ativo ? 'default' : 'secondary'}
                                                  className={membro.ativo ? 'bg-green-100 text-green-800' : ''}
                                                >
                                                  {membro.ativo ? 'Ativo' : 'Inativo'}
                                                </Badge>
                                              </div>
                                            </div>
                                          ))}
                                      </div>
                                    </div>

                                    <div className="text-xs text-gray-500 pt-2 border-t">
                                      <p>
                                        <span className="font-medium">Criada em:</span>{' '}
                                        {new Date(mesa.createdAt).toLocaleString('pt-BR')}
                                      </p>
                                      {mesa.updatedAt !== mesa.createdAt && (
                                        <p>
                                          <span className="font-medium">Atualizada em:</span>{' '}
                                          {new Date(mesa.updatedAt).toLocaleString('pt-BR')}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )
                        })}
                    </div>
                  </CardContent>
                </Card>
              )
            })
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma mesa diretora encontrada
              </h3>
              <p className="text-gray-600">
                {searchTerm || filterLegislatura !== 'all' || filterPeriodo !== 'all' || filterAtiva !== 'all'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Nenhuma mesa diretora foi cadastrada ainda.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

