'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Clock,
  CheckCircle,
  XCircle,
  X,
  Save,
  Loader2,
  ChevronDown,
  ChevronRight,
  Users,
  Briefcase
} from 'lucide-react'
import { useLegislaturas } from '@/lib/hooks/use-legislaturas'
import { usePeriodosLegislatura, type PeriodoLegislaturaCreate } from '@/lib/hooks/use-periodos-legislatura'
import { useCargosMesaDiretora, type CargoMesaDiretoraCreate } from '@/lib/hooks/use-cargos-mesa-diretora'
import { LegislaturaDetalhes } from '@/components/admin/legislatura-detalhes'
import { toast } from 'sonner'

export default function LegislaturasAdminPage() {
  const { legislaturas, loading, create, update, remove, refetch } = useLegislaturas()
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedLegislaturas, setExpandedLegislaturas] = useState<string[]>([])
  const [formData, setFormData] = useState({
    numero: '',
    anoInicio: '',
    anoFim: '',
    descricao: '',
    ativa: true
  })
  const [periodos, setPeriodos] = useState<Array<{
    numero: number
    dataInicio: string
    dataFim?: string
    descricao?: string
    cargos: Array<{
      nome: string
      ordem: number
      obrigatorio: boolean
    }>
  }>>([])
  const [loadingSave, setLoadingSave] = useState(false)

  const filteredLegislaturas = legislaturas.filter(legislatura =>
    legislatura.numero.toString().includes(searchTerm) ||
    legislatura.anoInicio.toString().includes(searchTerm) ||
    legislatura.anoFim.toString().includes(searchTerm) ||
    (legislatura.descricao && legislatura.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingSave(true)
    
    // Validação básica
    if (!formData.numero || !formData.anoInicio || !formData.anoFim) {
      toast.error('Por favor, preencha todos os campos obrigatórios')
      setLoadingSave(false)
      return
    }
    
    // Validação de anos
    if (parseInt(formData.anoInicio) >= parseInt(formData.anoFim)) {
      toast.error('O ano de início deve ser anterior ao ano de fim')
      setLoadingSave(false)
      return
    }
    
    try {
      let legislaturaId: string
      
      if (editingId) {
        // Atualizar legislatura existente
        const atualizada = await update(editingId, {
          numero: parseInt(formData.numero),
          anoInicio: parseInt(formData.anoInicio),
          anoFim: parseInt(formData.anoFim),
          descricao: formData.descricao || undefined,
          ativa: formData.ativa
        })
        if (!atualizada) {
          setLoadingSave(false)
          return
        }
        legislaturaId = atualizada.id
      } else {
        // Criar nova legislatura
        const nova = await create({
          numero: parseInt(formData.numero),
          anoInicio: parseInt(formData.anoInicio),
          anoFim: parseInt(formData.anoFim),
          descricao: formData.descricao || undefined,
          ativa: formData.ativa
        })
        if (!nova) {
          setLoadingSave(false)
          return
        }
        legislaturaId = nova.id
      }
      
      // Criar períodos e cargos se fornecidos (apenas se não estiver editando ou se for novo)
      if (periodos.length > 0 && !editingId) {
        console.log('📋 Criando períodos e cargos:', periodos)
        for (const periodo of periodos) {
          // Verificar se período já existe antes de criar
          const periodoExistenteResponse = await fetch(`/api/periodos-legislatura?legislaturaId=${legislaturaId}`)
          const periodoExistenteData = await periodoExistenteResponse.json()
          const periodoJaExiste = periodoExistenteData.success && periodoExistenteData.data?.some(
            (p: any) => p.numero === periodo.numero
          )
          
          if (periodoJaExiste) {
            console.log(`⚠️ Período ${periodo.numero} já existe, pulando criação`)
            continue
          }
          
          // Criar período
          console.log(`📅 Criando período ${periodo.numero}...`)
          const periodoResponse = await fetch('/api/periodos-legislatura', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              legislaturaId,
              numero: periodo.numero,
              dataInicio: periodo.dataInicio,
              dataFim: periodo.dataFim,
              descricao: periodo.descricao
            })
          })
          
          if (!periodoResponse.ok) {
            const error = await periodoResponse.json()
            // Se for erro de conflito (409), apenas avisar mas continuar
            if (periodoResponse.status === 409) {
              console.warn(`⚠️ Período ${periodo.numero} já existe:`, error.error)
              continue
            }
            console.error(`❌ Erro ao criar período ${periodo.numero}:`, error)
            toast.error(`Erro ao criar período ${periodo.numero}: ${error.error || 'Erro desconhecido'}`)
            continue
          }
          
          const periodoData = await periodoResponse.json()
          const periodoId = periodoData.data.id
          console.log(`✅ Período ${periodo.numero} criado com ID:`, periodoId)
          
          // Criar cargos para o período
          if (periodo.cargos.length > 0) {
            console.log(`📝 Criando ${periodo.cargos.length} cargo(s) para o período ${periodo.numero}...`)
            for (const cargo of periodo.cargos) {
              if (!cargo.nome || cargo.nome.trim() === '') {
                console.warn('⚠️ Cargo sem nome, pulando...')
                continue
              }
              
              const cargoResponse = await fetch('/api/cargos-mesa-diretora', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  periodoId,
                  nome: cargo.nome,
                  ordem: cargo.ordem,
                  obrigatorio: cargo.obrigatorio
                })
              })
              
              if (!cargoResponse.ok) {
                const error = await cargoResponse.json()
                console.error(`❌ Erro ao criar cargo ${cargo.nome}:`, error)
                toast.error(`Erro ao criar cargo ${cargo.nome}: ${error.error || 'Erro desconhecido'}`)
              } else {
                console.log(`✅ Cargo "${cargo.nome}" criado com sucesso`)
              }
            }
          }
        }
        
        toast.success('Legislatura e períodos criados com sucesso!')
      } else {
        toast.success('Legislatura criada com sucesso!')
      }
      
      console.log('🔄 Fechando formulário e recarregando lista...')
      setShowForm(false)
      setEditingId(null)
      resetForm()
      
      // Aguardar um pouco antes de recarregar para garantir que os dados foram persistidos
      await new Promise(resolve => setTimeout(resolve, 300))
      await refetch()
      console.log('✅ Lista recarregada')
    } catch (error) {
      console.error('Erro ao salvar legislatura:', error)
      toast.error('Erro ao salvar legislatura')
    } finally {
      setLoadingSave(false)
    }
  }

  const handleEdit = async (legislatura: any) => {
    setFormData({
      numero: legislatura.numero.toString(),
      anoInicio: legislatura.anoInicio.toString(),
      anoFim: legislatura.anoFim.toString(),
      descricao: legislatura.descricao || '',
      ativa: legislatura.ativa
    })
    setEditingId(legislatura.id)
    
    // Carregar períodos existentes
    try {
      const response = await fetch(`/api/periodos-legislatura?legislaturaId=${legislatura.id}`)
      const data = await response.json()
      if (data.success && data.data) {
        const periodosComCargos = await Promise.all(
          data.data.map(async (periodo: any) => {
            const cargosResponse = await fetch(`/api/cargos-mesa-diretora?periodoId=${periodo.id}`)
            const cargosData = await cargosResponse.json()
            
            // Corrigir conversão de data para evitar problemas de timezone
            let dataInicio = periodo.dataInicio
            if (typeof dataInicio === 'string') {
              // Se for string ISO, converter para formato YYYY-MM-DD
              const date = new Date(dataInicio)
              // Usar UTC para evitar problemas de timezone
              const year = date.getUTCFullYear()
              const month = String(date.getUTCMonth() + 1).padStart(2, '0')
              const day = String(date.getUTCDate()).padStart(2, '0')
              dataInicio = `${year}-${month}-${day}`
            }
            
            let dataFim = periodo.dataFim
            if (dataFim && typeof dataFim === 'string') {
              const date = new Date(dataFim)
              const year = date.getUTCFullYear()
              const month = String(date.getUTCMonth() + 1).padStart(2, '0')
              const day = String(date.getUTCDate()).padStart(2, '0')
              dataFim = `${year}-${month}-${day}`
            }
            
            return {
              numero: periodo.numero,
              dataInicio: dataInicio,
              dataFim: dataFim || undefined,
              descricao: periodo.descricao || undefined,
              cargos: cargosData.success ? cargosData.data.map((c: any) => ({
                nome: c.nome,
                ordem: c.ordem,
                obrigatorio: c.obrigatorio
              })) : []
            }
          })
        )
        setPeriodos(periodosComCargos)
      }
    } catch (error) {
      console.error('Erro ao carregar períodos:', error)
    }
    
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta legislatura?')) {
      await remove(id)
    }
  }

  const resetForm = () => {
    setFormData({
      numero: '',
      anoInicio: '',
      anoFim: '',
      descricao: '',
      ativa: true
    })
    setPeriodos([])
    setEditingId(null)
  }

  const adicionarPeriodo = () => {
    const novoNumero = periodos.length > 0 ? Math.max(...periodos.map(p => p.numero)) + 1 : 1
    setPeriodos([...periodos, {
      numero: novoNumero,
      dataInicio: new Date().toISOString().split('T')[0],
      cargos: []
    }])
  }

  const removerPeriodo = (index: number) => {
    setPeriodos(periodos.filter((_, i) => i !== index))
  }

  const adicionarCargo = (periodoIndex: number) => {
    const novosPeriodos = [...periodos]
    const novaOrdem = novosPeriodos[periodoIndex].cargos.length > 0 
      ? Math.max(...novosPeriodos[periodoIndex].cargos.map(c => c.ordem)) + 1 
      : 1
    novosPeriodos[periodoIndex].cargos.push({
      nome: '',
      ordem: novaOrdem,
      obrigatorio: true
    })
    setPeriodos(novosPeriodos)
  }

  const removerCargo = (periodoIndex: number, cargoIndex: number) => {
    const novosPeriodos = [...periodos]
    novosPeriodos[periodoIndex].cargos = novosPeriodos[periodoIndex].cargos.filter((_, i) => i !== cargoIndex)
    setPeriodos(novosPeriodos)
  }

  const atualizarPeriodo = (index: number, campo: string, valor: any) => {
    const novosPeriodos = [...periodos]
    novosPeriodos[index] = { ...novosPeriodos[index], [campo]: valor }
    setPeriodos(novosPeriodos)
  }

  const atualizarCargo = (periodoIndex: number, cargoIndex: number, campo: string, valor: any) => {
    const novosPeriodos = [...periodos]
    novosPeriodos[periodoIndex].cargos[cargoIndex] = {
      ...novosPeriodos[periodoIndex].cargos[cargoIndex],
      [campo]: valor
    }
    setPeriodos(novosPeriodos)
  }

  const toggleLegislatura = (legislaturaId: string) => {
    setExpandedLegislaturas(prev => 
      prev.includes(legislaturaId) 
        ? prev.filter(id => id !== legislaturaId)
        : [...prev, legislaturaId]
    )
  }

  const getStatusBadge = (ativa: boolean) => {
    return ativa ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Ativa
      </Badge>
    ) : (
      <Badge variant="secondary">
        <XCircle className="h-3 w-3 mr-1" />
        Inativa
      </Badge>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Legislaturas</h1>
          <p className="text-gray-600 mt-2">
            Cadastre e gerencie as legislaturas da Câmara Municipal
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Legislatura
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{legislaturas.length}</h3>
            <p className="text-gray-600">Total de Legislaturas</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {legislaturas.filter(l => l.ativa).length}
            </h3>
            <p className="text-gray-600">Legislaturas Ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {legislaturas.filter(l => !l.ativa).length}
            </h3>
            <p className="text-gray-600">Legislaturas Inativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
              <Search className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{filteredLegislaturas.length}</h3>
            <p className="text-gray-600">Resultados da Busca</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por número ou ano..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Legislaturas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLegislaturas.map((legislatura) => (
          <Card key={legislatura.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{legislatura.numero}ª Legislatura</CardTitle>
                  <p className="text-gray-600">{legislatura.anoInicio}-{legislatura.anoFim}</p>
                </div>
                {getStatusBadge(legislatura.ativa)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Ano Início</p>
                  <p className="font-semibold">{legislatura.anoInicio}</p>
                </div>
                <div>
                  <p className="text-gray-600">Ano Fim</p>
                  <p className="font-semibold">{legislatura.anoFim}</p>
                </div>
              </div>
              {legislatura.descricao && (
                <div className="text-sm">
                  <p className="text-gray-600">Descrição</p>
                  <p className="font-semibold">{legislatura.descricao}</p>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{legislatura.anoInicio}-{legislatura.anoFim}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(legislatura)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(legislatura.id)}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLegislaturas.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma legislatura encontrada</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece cadastrando a primeira legislatura.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingId ? 'Editar Legislatura' : 'Nova Legislatura'}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dados Básicos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="numero">Número da Legislatura *</Label>
                    <Input
                      id="numero"
                      type="number"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      placeholder="Ex: 19"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="anoInicio">Ano de Início *</Label>
                    <Input
                      id="anoInicio"
                      type="number"
                      value={formData.anoInicio}
                      onChange={(e) => setFormData({ ...formData, anoInicio: e.target.value })}
                      placeholder="Ex: 2021"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="anoFim">Ano de Fim *</Label>
                    <Input
                      id="anoFim"
                      type="number"
                      value={formData.anoFim}
                      onChange={(e) => setFormData({ ...formData, anoFim: e.target.value })}
                      placeholder="Ex: 2024"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="descricao">Descrição</Label>
                    <Input
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Descrição opcional"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="ativa"
                    checked={formData.ativa}
                    onChange={(e) => setFormData({ ...formData, ativa: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="ativa">Legislatura ativa</Label>
                </div>

                {/* Períodos e Cargos */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Períodos e Cargos da Mesa Diretora</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={adicionarPeriodo}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Período
                    </Button>
                  </div>

                  {periodos.length === 0 ? (
                    <div className="p-4 border rounded-lg bg-gray-50 text-center">
                      <p className="text-gray-600">
                        Nenhum período cadastrado. Adicione períodos para configurar os cargos da mesa diretora.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {periodos.map((periodo, periodoIndex) => (
                        <Card key={periodoIndex} className="border-2">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">
                                Período {periodo.numero}
                              </CardTitle>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removerPeriodo(periodoIndex)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <Label>Data de Início *</Label>
                                <Input
                                  type="date"
                                  value={periodo.dataInicio}
                                  onChange={(e) => atualizarPeriodo(periodoIndex, 'dataInicio', e.target.value)}
                                  required
                                />
                              </div>
                              <div>
                                <Label>Data de Fim</Label>
                                <Input
                                  type="date"
                                  value={periodo.dataFim || ''}
                                  onChange={(e) => atualizarPeriodo(periodoIndex, 'dataFim', e.target.value || undefined)}
                                />
                              </div>
                              <div>
                                <Label>Descrição</Label>
                                <Input
                                  value={periodo.descricao || ''}
                                  onChange={(e) => atualizarPeriodo(periodoIndex, 'descricao', e.target.value || undefined)}
                                  placeholder="Ex: Primeiro biênio"
                                />
                              </div>
                            </div>

                            {/* Cargos */}
                            <div className="border-t pt-4">
                              <div className="flex items-center justify-between mb-3">
                                <Label className="text-sm font-semibold">Cargos da Mesa Diretora</Label>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => adicionarCargo(periodoIndex)}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Adicionar Cargo
                                </Button>
                              </div>

                              {periodo.cargos.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-2">
                                  Nenhum cargo configurado. Adicione os cargos para este período.
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {periodo.cargos.map((cargo, cargoIndex) => (
                                    <div key={cargoIndex} className="flex items-center gap-2 p-2 border rounded">
                                      <Input
                                        placeholder="Nome do cargo (ex: Presidente)"
                                        value={cargo.nome}
                                        onChange={(e) => atualizarCargo(periodoIndex, cargoIndex, 'nome', e.target.value)}
                                        className="flex-1"
                                        required
                                      />
                                      <Input
                                        type="number"
                                        placeholder="Ordem"
                                        value={cargo.ordem}
                                        onChange={(e) => atualizarCargo(periodoIndex, cargoIndex, 'ordem', parseInt(e.target.value) || 1)}
                                        className="w-20"
                                        min="1"
                                        required
                                      />
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          checked={cargo.obrigatorio}
                                          onChange={(e) => atualizarCargo(periodoIndex, cargoIndex, 'obrigatorio', e.target.checked)}
                                          className="rounded border-gray-300"
                                        />
                                        <Label className="text-xs">Obrigatório</Label>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removerCargo(periodoIndex, cargoIndex)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false)
                      resetForm()
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loadingSave} className="bg-camara-primary hover:bg-camara-primary/90">
                    {loadingSave ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {editingId ? 'Atualizar' : 'Salvar'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

