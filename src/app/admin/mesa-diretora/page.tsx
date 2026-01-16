'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Calendar, Search, Plus, Edit, Trash2, Eye, ChevronRight, X, Loader2, Save, History, Download } from 'lucide-react'
import Link from 'next/link'
import { useLegislaturas } from '@/lib/hooks/use-legislaturas'
import { useParlamentares } from '@/lib/hooks/use-parlamentares'
import { useMesaDiretora } from '@/lib/hooks/use-mesa-diretora'
import { usePeriodosLegislatura } from '@/lib/hooks/use-periodos-legislatura'
import { useCargosMesaDiretora } from '@/lib/hooks/use-cargos-mesa-diretora'
import { toast } from 'sonner'
import type { MesaDiretoraApi } from '@/lib/api/mesa-diretora-api'
import { formatDateOnly } from '@/lib/utils/date'

export default function MesaDiretoraAdminPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLegislatura, setFilterLegislatura] = useState('all')
  const [filterPeriodo, setFilterPeriodo] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedLegislaturas, setExpandedLegislaturas] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const { legislaturas } = useLegislaturas()
  const { parlamentares } = useParlamentares()
  const { mesas, loading: loadingMesas, create, update, remove } = useMesaDiretora()

  const [formData, setFormData] = useState({
    periodoId: '',
    ativa: false,
    descricao: '',
    membros: [] as Array<{
      parlamentarId: string
      cargoId: string
      dataInicio: string
      dataFim?: string
      ativo: boolean
      observacoes?: string
    }>
  })

  const [selectedLegislaturaId, setSelectedLegislaturaId] = useState<string>('')
  const { periodos, loading: loadingPeriodos } = usePeriodosLegislatura(selectedLegislaturaId || undefined)
  const { cargos, loading: loadingCargos } = useCargosMesaDiretora(formData.periodoId || undefined)

  // Carregar dados ao editar
  useEffect(() => {
    if (editingId && mesas.length > 0) {
      const mesa = mesas.find(m => m.id === editingId)
      if (mesa) {
        setFormData({
          periodoId: mesa.periodoId,
          ativa: mesa.ativa,
          descricao: mesa.descricao || '',
          membros: mesa.membros?.map(m => ({
            parlamentarId: m.parlamentarId,
            cargoId: m.cargoId,
            dataInicio: formatDateOnly(m.dataInicio) || '',
            dataFim: formatDateOnly(m.dataFim) || undefined,
            ativo: m.ativo,
            observacoes: m.observacoes || undefined
          })) || []
        })
        // Definir legislatura selecionada baseada no período
        if (mesa.periodo?.legislaturaId) {
          setSelectedLegislaturaId(mesa.periodo.legislaturaId)
        }
      }
    }
  }, [editingId, mesas])

  // Carregar cargos quando período muda
  useEffect(() => {
    if (formData.periodoId && cargos.length > 0 && formData.membros.length === 0) {
      // Inicializar membros com os cargos do período
      const dataAtual = formatDateOnly(new Date()) || ''
      const novosMembros = cargos.map(cargo => ({
        parlamentarId: '',
        cargoId: cargo.id,
        dataInicio: dataAtual,
        dataFim: undefined as string | undefined,
        ativo: true,
        observacoes: undefined as string | undefined
      }))
      setFormData(prev => ({ ...prev, membros: novosMembros }))
    }
  }, [cargos, formData.membros.length, formData.periodoId])

  // Filtrar mesas
  const filteredMesas = useMemo(() => {
    if (!mesas || !Array.isArray(mesas)) return []
    return mesas.filter(mesa => {
      if (!mesa) return false
      
      const matchesSearch = !searchTerm || 
        (mesa.periodo?.legislatura?.numero.toString().includes(searchTerm)) ||
        (mesa.periodo?.numero.toString().includes(searchTerm)) ||
        (mesa.descricao && mesa.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesLegislatura = !filterLegislatura || filterLegislatura === 'all' || 
        mesa.periodo?.legislaturaId === filterLegislatura
      
      const matchesPeriodo = !filterPeriodo || filterPeriodo === 'all' || 
        mesa.periodo?.numero.toString() === filterPeriodo

      return matchesSearch && matchesLegislatura && matchesPeriodo
    })
  }, [mesas, searchTerm, filterLegislatura, filterPeriodo])

  // Agrupar mesas por legislatura
  const mesasPorLegislatura = useMemo(() => {
    const grupos: Record<string, MesaDiretoraApi[]> = {}
    filteredMesas.forEach(mesa => {
      const legislaturaId = mesa.periodo?.legislaturaId || 'sem-legislatura'
      if (!grupos[legislaturaId]) {
        grupos[legislaturaId] = []
      }
      grupos[legislaturaId].push(mesa)
    })
    return grupos
  }, [filteredMesas])

  const resumoPorLegislatura = useMemo(() => {
    const mapa: Record<string, { titulo: string; total: number; ativas: number; periodosSet: Set<string> }> = {}

    filteredMesas.forEach(mesa => {
      const legislatura = mesa.periodo?.legislatura
      const key = legislatura?.id || 'sem-legislatura'
      if (!mapa[key]) {
        const titulo = legislatura
          ? `${legislatura.numero}ª (${legislatura.anoInicio}/${legislatura.anoFim})`
          : 'Sem legislatura'
        mapa[key] = {
          titulo,
          total: 0,
          ativas: 0,
          periodosSet: new Set<string>()
        }
      }
      mapa[key].total += 1
      if (mesa.ativa) {
        mapa[key].ativas += 1
      }
      if (mesa.periodoId) {
        mapa[key].periodosSet.add(mesa.periodoId)
      }
    })

    return Object.values(mapa).map(item => ({
      titulo: item.titulo,
      total: item.total,
      ativas: item.ativas,
      periodos: item.periodosSet.size
    }))
  }, [filteredMesas])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validação
      if (!formData.periodoId) {
        toast.error('Selecione um período')
        setLoading(false)
        return
      }

      if (formData.membros.length === 0) {
        toast.error('Adicione pelo menos um membro à mesa')
        setLoading(false)
        return
      }

      // Validar cargos obrigatórios
      const cargosObrigatorios = cargos.filter(c => c.obrigatorio)
      const cargosPreenchidos = formData.membros
        .filter(m => m.parlamentarId && m.ativo)
        .map(m => m.cargoId)
      const cargosFaltantes = cargosObrigatorios.filter(c => !cargosPreenchidos.includes(c.id))

      if (cargosFaltantes.length > 0) {
        toast.error(`Preencha os cargos obrigatórios: ${cargosFaltantes.map(c => c.nome).join(', ')}`)
        setLoading(false)
        return
      }

      const dadosMesa = {
        periodoId: formData.periodoId,
        ativa: formData.ativa,
        descricao: formData.descricao || undefined,
        membros: formData.membros
          .filter(m => m.parlamentarId) // Apenas membros com parlamentar selecionado
          .map(m => ({
            parlamentarId: m.parlamentarId,
            cargoId: m.cargoId,
            dataInicio: m.dataInicio,
            dataFim: m.dataFim,
            ativo: m.ativo,
            observacoes: m.observacoes
          }))
      }

      if (editingId) {
        const atualizada = await update(editingId, dadosMesa)
        if (atualizada) {
          handleClose()
        }
      } else {
        const nova = await create(dadosMesa)
        if (nova) {
          handleClose()
        }
      }
    } catch (error) {
      console.error('Erro ao salvar mesa diretora:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar mesa diretora')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (mesa: MesaDiretoraApi) => {
    setEditingId(mesa.id)
    setSelectedLegislaturaId(mesa.periodo?.legislaturaId || '')
    setFormData({
      periodoId: mesa.periodoId,
      ativa: mesa.ativa,
      descricao: mesa.descricao || '',
      membros: mesa.membros?.map(m => ({
        parlamentarId: m.parlamentarId,
        cargoId: m.cargoId,
        dataInicio: m.dataInicio.split('T')[0],
        dataFim: m.dataFim ? m.dataFim.split('T')[0] : undefined,
        ativo: m.ativo,
        observacoes: m.observacoes || undefined
      })) || []
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta mesa diretora?')) {
      await remove(id)
    }
  }

  const handleClose = () => {
    setShowForm(false)
    setEditingId(null)
    setSelectedLegislaturaId('')
    setFormData({
      periodoId: '',
      ativa: false,
      descricao: '',
      membros: []
    })
  }

  const toggleLegislatura = (legislaturaId: string) => {
    setExpandedLegislaturas(prev => 
      prev.includes(legislaturaId) 
        ? prev.filter(id => id !== legislaturaId)
        : [...prev, legislaturaId]
    )
  }

  const handleExportRelatorio = () => {
    if (!mesas || mesas.length === 0) {
      toast.info('Não há dados de mesas diretora para exportar.')
      return
    }

    const payload = mesas.map(mesa => ({
      legislatura: mesa.periodo?.legislatura?.numero || null,
      periodo: mesa.periodo?.numero || null,
      descricao: mesa.descricao,
      ativa: mesa.ativa,
      dataInicio: mesa.periodo?.dataInicio || null,
      dataFim: mesa.periodo?.dataFim || null,
      membros: mesa.membros?.map(membro => ({
        cargo: membro.cargo?.nome,
        parlamentar: membro.parlamentar?.nome,
        ativo: membro.ativo,
        dataInicio: membro.dataInicio,
        dataFim: membro.dataFim
      })) || []
    }))

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `relatorio-mesas-diretora-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Relatório exportado com sucesso.')
  }

  const atualizarMembro = (index: number, campo: string, valor: any) => {
    const novosMembros = [...formData.membros]
    novosMembros[index] = { ...novosMembros[index], [campo]: valor }
    setFormData(prev => ({ ...prev, membros: novosMembros }))
  }

  if (loadingMesas) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-camara-primary mx-auto mb-4" />
          <p className="text-gray-600">Carregando mesas diretora...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mesa Diretora</h1>
          <p className="text-gray-600 mt-1">
            Gerencie as composições da mesa diretora por legislatura e período
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleExportRelatorio} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar Relatório
          </Button>
          <Link href="/admin/mesa-diretora/historico">
            <Button variant="outline">
              <History className="h-4 w-4 mr-2" />
              Ver Histórico
            </Button>
          </Link>
          <Button onClick={() => setShowForm(true)} className="bg-camara-primary hover:bg-camara-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Nova Mesa Diretora
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
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
                <p className="text-2xl font-bold text-gray-900">{(legislaturas && Array.isArray(legislaturas) ? legislaturas.length : 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Períodos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(periodos && Array.isArray(periodos) ? periodos.length : 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo por Legislatura</CardTitle>
        </CardHeader>
        <CardContent>
          {resumoPorLegislatura.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma mesa diretora cadastrada para gerar o relatório.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {resumoPorLegislatura.map(item => (
                <div
                  key={item.titulo}
                  className="rounded-lg border border-gray-200 p-4 shadow-sm"
                  tabIndex={0}
                  aria-label={`Legislatura ${item.titulo} com ${item.total} mesas, ${item.ativas} ativas`}
                >
                  <p className="text-sm font-semibold text-gray-900">{item.titulo}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                    <span>Total: {item.total}</span>
                    <span>Ativas: {item.ativas}</span>
                    <span>Períodos: {item.periodos}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative mt-1">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Legislatura, período..."
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
                  <SelectValue placeholder="Todas as legislaturas" />
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
                  <SelectValue placeholder="Todos os períodos" />
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

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setFilterLegislatura('all')
                  setFilterPeriodo('all')
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Listagem de Mesas por Legislatura */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Mesas Diretora por Legislatura
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {legislaturas && legislaturas.length > 0 ? (
              legislaturas.map((legislatura) => {
                const mesasLegislatura = filteredMesas.filter(m => m.periodo?.legislaturaId === legislatura.id)
                const isExpanded = expandedLegislaturas.includes(legislatura.id)
                
                return (
                  <div key={legislatura.id} className="border rounded-lg bg-white shadow-sm">
                    {/* Header da Legislatura */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleLegislatura(legislatura.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <ChevronRight 
                            className={`h-5 w-5 text-gray-400 transition-transform ${
                              isExpanded ? 'rotate-90' : ''
                            }`} 
                          />
                          <div>
                            <h3 className="font-semibold text-gray-900">{legislatura.numero}ª Legislatura</h3>
                            <p className="text-sm text-gray-600">
                              {legislatura.anoInicio} - {legislatura.anoFim}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {mesasLegislatura.length} mesa(s)
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {/* Mesas da Legislatura */}
                    {isExpanded && (
                      <div className="border-t bg-gray-50 p-4">
                        {mesasLegislatura.length === 0 ? (
                          <p className="text-gray-500 text-center py-4">
                            Nenhuma mesa diretora cadastrada para esta legislatura
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {mesasLegislatura.map(mesa => (
                              <Card key={mesa.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <h4 className="font-semibold text-gray-900">
                                        Período {mesa.periodo?.numero}
                                      </h4>
                                      <p className="text-sm text-gray-600">
                                        {mesa.periodo?.dataInicio ? (() => {
                                          const date = new Date(mesa.periodo.dataInicio)
                                          const year = date.getUTCFullYear()
                                          const month = String(date.getUTCMonth() + 1).padStart(2, '0')
                                          const day = String(date.getUTCDate()).padStart(2, '0')
                                          return `${day}/${month}/${year}`
                                        })() : 'Data não definida'}
                                        {mesa.periodo?.dataFim && ` - ${(() => {
                                          const date = new Date(mesa.periodo.dataFim)
                                          const year = date.getUTCFullYear()
                                          const month = String(date.getUTCMonth() + 1).padStart(2, '0')
                                          const day = String(date.getUTCDate()).padStart(2, '0')
                                          return `${day}/${month}/${year}`
                                        })()}`}
                                      </p>
                                    </div>
                                    <Badge className={mesa.ativa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                      {mesa.ativa ? 'Ativa' : 'Inativa'}
                                    </Badge>
                                  </div>

                                  {/* Membros */}
                                  <div className="space-y-2 mb-3">
                                    {mesa.membros?.filter(m => m.ativo).map(membro => {
                                      console.log('🔍 Exibindo membro:', {
                                        membroId: membro.id,
                                        parlamentarId: membro.parlamentarId,
                                        parlamentar: membro.parlamentar,
                                        cargo: membro.cargo
                                      })
                                      return (
                                        <div key={membro.id} className="text-sm">
                                          <span className="font-medium text-gray-700">
                                            {membro.cargo?.nome}:
                                          </span>
                                          <span className="text-gray-600 ml-2">
                                            {membro.parlamentar?.nome || `N/A (ID: ${membro.parlamentarId})`}
                                          </span>
                                          {membro.dataFim && (
                                            <Badge variant="outline" className="ml-2 text-xs">
                                              Até {(() => {
                                                const date = new Date(membro.dataFim)
                                                const year = date.getUTCFullYear()
                                                const month = String(date.getUTCMonth() + 1).padStart(2, '0')
                                                const day = String(date.getUTCDate()).padStart(2, '0')
                                                return `${day}/${month}/${year}`
                                              })()}
                                            </Badge>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>

                                  <div className="flex items-center space-x-2 pt-3 border-t">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEdit(mesa)}
                                    >
                                      <Edit className="h-4 w-4 mr-1" />
                                      Editar
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDelete(mesa.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Excluir
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <p className="text-gray-500 text-center py-8">
                Nenhuma legislatura cadastrada. Cadastre uma legislatura primeiro.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Formulário */}
      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {editingId ? 'Editar Mesa Diretora' : 'Nova Mesa Diretora'}
              </CardTitle>
              <Button variant="outline" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="legislatura">Legislatura *</Label>
                  <Select 
                    value={selectedLegislaturaId} 
                    onValueChange={(value) => {
                      setSelectedLegislaturaId(value)
                      setFormData(prev => ({ ...prev, periodoId: '', membros: [] }))
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione a legislatura" />
                    </SelectTrigger>
                    <SelectContent>
                      {legislaturas?.map(legislatura => (
                        <SelectItem key={legislatura.id} value={legislatura.id}>
                          {legislatura.numero}ª ({legislatura.anoInicio}/{legislatura.anoFim})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="periodo">Período *</Label>
                  <Select 
                    value={formData.periodoId} 
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, periodoId: value, membros: [] }))
                    }}
                    disabled={!selectedLegislaturaId || loadingPeriodos}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={loadingPeriodos ? "Carregando..." : "Selecione o período"} />
                    </SelectTrigger>
                    <SelectContent>
                      {periodos?.map(periodo => {
                        // Corrigir conversão de data para usar UTC e evitar problemas de timezone
                        const dataInicio = periodo.dataInicio 
                          ? (() => {
                              const date = new Date(periodo.dataInicio)
                              // Usar UTC para evitar problemas de timezone
                              const year = date.getUTCFullYear()
                              const month = String(date.getUTCMonth() + 1).padStart(2, '0')
                              const day = String(date.getUTCDate()).padStart(2, '0')
                              return `${day}/${month}/${year}`
                            })()
                          : 'Data não definida'
                        return (
                          <SelectItem key={periodo.id} value={periodo.id}>
                            Período {periodo.numero} - {dataInicio}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  {selectedLegislaturaId && periodos.length === 0 && !loadingPeriodos && (
                    <p className="text-sm text-gray-500 mt-1">
                      Nenhum período cadastrado. Crie períodos para esta legislatura primeiro.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  rows={3}
                  placeholder="Observações sobre esta mesa diretora..."
                  className="mt-1"
                />
              </div>

              {/* Membros da Mesa */}
              {formData.periodoId && (
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Composição da Mesa</h3>
                    {loadingCargos && (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    )}
                  </div>
                  
                  {cargos.length === 0 && !loadingCargos ? (
                    <div className="p-4 border rounded-lg bg-yellow-50">
                      <p className="text-sm text-yellow-800">
                        Nenhum cargo configurado para este período. Configure os cargos primeiro.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.membros.map((membro, index) => {
                        const cargo = cargos.find(c => c.id === membro.cargoId)
                        return (
                          <div key={index} className="p-4 border rounded-lg space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">
                                {cargo?.nome || 'Cargo não encontrado'}
                                {cargo?.obrigatorio && (
                                  <Badge variant="outline" className="ml-2 text-xs">Obrigatório</Badge>
                                )}
                              </h4>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Parlamentar *</Label>
                                <Select
                                  value={membro.parlamentarId}
                                  onValueChange={(value) => atualizarMembro(index, 'parlamentarId', value)}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Selecione o parlamentar" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {parlamentares?.map(parlamentar => (
                                      <SelectItem key={parlamentar.id} value={parlamentar.id}>
                                        {parlamentar.nome} {parlamentar.apelido && `(${parlamentar.apelido})`}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label>Data de Início *</Label>
                                <Input
                                  type="date"
                                  value={membro.dataInicio}
                                  onChange={(e) => atualizarMembro(index, 'dataInicio', e.target.value)}
                                  className="mt-1"
                                  required
                                />
                              </div>

                              <div>
                                <Label>Data de Fim (para substituição/afastamento)</Label>
                                <Input
                                  type="date"
                                  value={membro.dataFim || ''}
                                  onChange={(e) => atualizarMembro(index, 'dataFim', e.target.value || undefined)}
                                  className="mt-1"
                                />
                              </div>

                              <div>
                                <Label>Status</Label>
                                <Select
                                  value={membro.ativo ? 'ativo' : 'inativo'}
                                  onValueChange={(value) => atualizarMembro(index, 'ativo', value === 'ativo')}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="ativo">Ativo</SelectItem>
                                    <SelectItem value="inativo">Inativo (Substituído/Afastado)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="md:col-span-2">
                                <Label>Observações (motivo de afastamento, substituição, etc.)</Label>
                                <Textarea
                                  value={membro.observacoes || ''}
                                  onChange={(e) => atualizarMembro(index, 'observacoes', e.target.value || undefined)}
                                  rows={2}
                                  placeholder="Ex: Afastado por motivo de saúde, substituído por..."
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="ativa"
                  checked={formData.ativa}
                  onChange={(e) => setFormData(prev => ({ ...prev, ativa: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="ativa">Esta é a mesa diretora ativa para o período</Label>
              </div>

              <div className="flex space-x-4">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-camara-primary hover:bg-camara-primary/90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingId ? 'Atualizar' : 'Salvar'} Mesa Diretora
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
