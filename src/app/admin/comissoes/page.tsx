'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Calendar,
  User,
  Crown,
  Shield,
  FileText,
  CheckCircle,
  XCircle,
  ToggleLeft,
  ToggleRight,
  LayoutDashboard,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { useParlamentares } from '@/lib/hooks/use-parlamentares'
import { useComissoes } from '@/lib/hooks/use-comissoes'
import { toast } from 'sonner'

export default function ComissoesAdminPage() {
  const {
    comissoes: comissoesApi,
    loading: loadingComissoes,
    create,
    update,
    remove,
    addMember,
    updateMember,
    removeMember,
    refetch
  } = useComissoes()
  const [comissoes, setComissoes] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showMembrosForm, setShowMembrosForm] = useState(false)
  const [selectedComissao, setSelectedComissao] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: 'PERMANENTE',
    ativa: true
  })

  const [membroFormData, setMembroFormData] = useState({
    parlamentarId: '',
    cargo: 'MEMBRO',
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: '',
    ativo: true,
    observacoes: ''
  })

  useEffect(() => {
    if (comissoesApi && Array.isArray(comissoesApi)) {
      if (comissoesApi.length > 0) {
        setComissoes(comissoesApi)
      } else {
        setComissoes([])
      }
    }
  }, [comissoesApi])

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'PERMANENTE':
        return 'bg-blue-100 text-blue-800'
      case 'TEMPORARIA':
        return 'bg-orange-100 text-orange-800'
      case 'ESPECIAL':
        return 'bg-purple-100 text-purple-800'
      case 'INQUERITO':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCargoColor = (cargo: string) => {
    switch (cargo) {
      case 'PRESIDENTE':
        return 'bg-yellow-100 text-yellow-800'
      case 'VICE_PRESIDENTE':
        return 'bg-blue-100 text-blue-800'
      case 'RELATOR':
        return 'bg-green-100 text-green-800'
      case 'MEMBRO':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'PERMANENTE':
        return 'Permanente'
      case 'TEMPORARIA':
        return 'Temporária'
      case 'ESPECIAL':
        return 'Especial'
      case 'INQUERITO':
        return 'Inquérito'
      default:
        return tipo
    }
  }

  const getCargoLabel = (cargo: string) => {
    switch (cargo) {
      case 'PRESIDENTE':
        return 'Presidente'
      case 'VICE_PRESIDENTE':
        return 'Vice-presidente'
      case 'RELATOR':
        return 'Relator'
      case 'MEMBRO':
        return 'Membro'
      default:
        return cargo
    }
  }

  const getCargoIcon = (cargo: string) => {
    switch (cargo) {
      case 'PRESIDENTE':
        return <Crown className="h-4 w-4" />
      case 'VICE_PRESIDENTE':
        return <Shield className="h-4 w-4" />
      case 'RELATOR':
        return <FileText className="h-4 w-4" />
      case 'MEMBRO':
        return <User className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingId) {
        // Editar comissão existente
        await update(editingId, {
          nome: formData.nome,
          descricao: formData.descricao,
          tipo: formData.tipo as any,
          ativa: formData.ativa
        })
        await refetch()
      } else {
        // Adicionar nova comissão
        await create({
          nome: formData.nome,
          descricao: formData.descricao,
          tipo: formData.tipo as any,
          ativa: formData.ativa
        })
        await refetch()
      }
      
      // Limpar formulário
      setFormData({
        nome: '',
        descricao: '',
        tipo: 'PERMANENTE',
        ativa: true
      })
      setShowForm(false)
      setEditingId(null)
    } catch (error) {
      console.error('Erro ao salvar comissão:', error)
    }
  }

  const handleMembroSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedComissao) return
    
    try {
      const novoMembro = await addMember(selectedComissao, {
        parlamentarId: membroFormData.parlamentarId,
        cargo: membroFormData.cargo as any,
        dataInicio: membroFormData.dataInicio,
        dataFim: membroFormData.dataFim || undefined,
        ativo: membroFormData.ativo,
        observacoes: membroFormData.observacoes || undefined
      })

      if (novoMembro) {
        toast.success('Membro adicionado com sucesso')
      }

      await refetch()

      setMembroFormData({
        parlamentarId: '',
        cargo: 'MEMBRO',
        dataInicio: new Date().toISOString().split('T')[0],
        dataFim: '',
        ativo: true,
        observacoes: ''
      })
      setShowMembrosForm(false)
      setSelectedComissao(null)
    } catch (error) {
      console.error('Erro ao adicionar membro:', error)
      toast.error('Não foi possível adicionar o membro')
    }
  }

  const handleToggleMembro = async (comissaoId: string, membro: any) => {
    const novoStatus = !membro.ativo
    const dataFim = novoStatus ? null : new Date().toISOString().split('T')[0]

    const atualizado = await updateMember(comissaoId, membro.id, {
      ativo: novoStatus,
      dataFim
    })

    if (atualizado) {
      toast.success(`Membro ${novoStatus ? 'reativado' : 'inativado'} com sucesso`)
    }
  }

  const handleRemoveMembro = async (comissaoId: string, membroId: string) => {
    if (!confirm('Deseja remover este parlamentar da comissão?')) {
      return
    }

    const sucesso = await removeMember(comissaoId, membroId)
    if (sucesso) {
      toast.success('Membro removido com sucesso')
    }
  }

  const handleEdit = (comissao: any) => {
    setFormData({
      nome: comissao.nome,
      descricao: comissao.descricao || '',
      tipo: comissao.tipo,
      ativa: comissao.ativa
    })
    setEditingId(comissao.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta comissão?')) {
      try {
        await remove(id)
        await refetch()
      } catch (error) {
        console.error('Erro ao excluir comissão:', error)
      }
    }
  }

  const handleAddMembro = (comissaoId: string) => {
    setSelectedComissao(comissaoId)
    setShowMembrosForm(true)
  }

  const filteredComissoes = (comissoes && Array.isArray(comissoes) ? comissoes : []).filter(comissao => {
    if (!comissao) return false
    const searchLower = searchTerm.toLowerCase()
    const matchesNome = comissao.nome && typeof comissao.nome === 'string' && comissao.nome.toLowerCase().includes(searchLower)
    const matchesTipo = getTipoLabel(comissao.tipo || '').toLowerCase().includes(searchLower)
    const matchesDescricao = comissao.descricao && typeof comissao.descricao === 'string' && comissao.descricao.toLowerCase().includes(searchLower)
    return matchesNome || matchesTipo || matchesDescricao
  })

  const { parlamentares } = useParlamentares()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando comissões...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-8 w-8 text-blue-600" />
            Gerenciar Comissões
          </h1>
          <p className="text-gray-600 mt-1">
            Cadastre e gerencie as comissões da Câmara Municipal
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Comissão
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {comissoes.length}
            </div>
            <p className="text-sm text-gray-600">Total de Comissões</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {(comissoes && Array.isArray(comissoes) ? comissoes.filter(c => c?.ativa).length : 0)}
            </div>
            <p className="text-sm text-gray-600">Ativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {(comissoes && Array.isArray(comissoes) ? comissoes.filter(c => c?.tipo === 'PERMANENTE').length : 0)}
            </div>
            <p className="text-sm text-gray-600">Permanentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {comissoes.reduce((acc, c) => acc + c.membros.length, 0)}
            </div>
            <p className="text-sm text-gray-600">Total de Membros</p>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar comissões..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Comissão */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? 'Editar Comissão' : 'Nova Comissão'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Comissão</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    placeholder="Nome da comissão"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({...formData, tipo: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERMANENTE">Permanente</SelectItem>
                      <SelectItem value="TEMPORARIA">Temporária</SelectItem>
                      <SelectItem value="ESPECIAL">Especial</SelectItem>
                      <SelectItem value="INQUERITO">Inquérito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  placeholder="Descrição da comissão"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="ativa"
                  checked={formData.ativa}
                  onChange={(e) => setFormData({...formData, ativa: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="ativa">Comissão ativa</Label>
              </div>

              <div className="flex items-center gap-4">
                <Button type="submit">
                  {editingId ? 'Atualizar' : 'Salvar'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                    setFormData({
                      nome: '',
                      descricao: '',
                      tipo: 'PERMANENTE',
                      ativa: true
                    })
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Formulário de Membro */}
      {showMembrosForm && (
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Membro à Comissão</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleMembroSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parlamentarId">Parlamentar</Label>
                  <Select value={membroFormData.parlamentarId} onValueChange={(value) => setMembroFormData({...membroFormData, parlamentarId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o parlamentar" />
                    </SelectTrigger>
                    <SelectContent>
                      {parlamentares.map((parlamentar) => (
                        <SelectItem key={parlamentar.id} value={parlamentar.id}>
                          {parlamentar.nome} ({parlamentar.apelido})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <Select value={membroFormData.cargo} onValueChange={(value) => setMembroFormData({...membroFormData, cargo: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRESIDENTE">Presidente</SelectItem>
                      <SelectItem value="VICE_PRESIDENTE">Vice-presidente</SelectItem>
                      <SelectItem value="RELATOR">Relator</SelectItem>
                      <SelectItem value="MEMBRO">Membro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data de Início</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={membroFormData.dataInicio}
                    onChange={(e) => setMembroFormData({...membroFormData, dataInicio: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataFim">Data de Fim (Opcional)</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={membroFormData.dataFim}
                    onChange={(e) => setMembroFormData({...membroFormData, dataFim: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={membroFormData.ativo}
                  onChange={(e) => setMembroFormData({...membroFormData, ativo: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="ativo">Membro ativo</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={membroFormData.observacoes}
                  onChange={(e) => setMembroFormData({...membroFormData, observacoes: e.target.value})}
                  rows={3}
                  placeholder="Informações adicionais sobre a participação"
                />
              </div>

              <div className="flex items-center gap-4">
                <Button type="submit">
                  Adicionar Membro
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setShowMembrosForm(false)
                    setSelectedComissao(null)
                    setMembroFormData({
                      parlamentarId: '',
                      cargo: 'MEMBRO',
                      dataInicio: new Date().toISOString().split('T')[0],
                      dataFim: '',
                      ativo: true,
                      observacoes: ''
                    })
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Comissões */}
      <div className="space-y-4">
        {filteredComissoes.map((comissao) => (
          <Card key={comissao.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {comissao.nome}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getTipoColor(comissao.tipo)}>
                        {getTipoLabel(comissao.tipo)}
                      </Badge>
                      <Badge className={comissao.ativa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {comissao.ativa ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <Link href={`/admin/comissoes/${comissao.id}`}>
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <LayoutDashboard className="h-3 w-3 mr-1" />
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddMembro(comissao.id)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(comissao)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(comissao.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {comissao.descricao && (
                <p className="text-gray-700 mb-4">
                  {comissao.descricao}
                </p>
              )}

              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Membros ({comissao.membros.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {comissao.membros.map((membro: any) => {
                    const parlamentar = parlamentares.find(p => p.id === membro.parlamentarId)
                    return (
                      <div key={membro.id} className="flex flex-col gap-2 rounded bg-gray-50 p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {getCargoIcon(membro.cargo)}
                            <Badge className={getCargoColor(membro.cargo)}>
                              {getCargoLabel(membro.cargo)}
                            </Badge>
                          </div>
                          <span className="text-sm text-gray-700">
                            {parlamentar ? `${parlamentar.nome} (${parlamentar.apelido})` : 'Parlamentar não encontrado'}
                          </span>
                          <div className="ml-auto flex items-center gap-1">
                            {membro.ativo ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => handleToggleMembro(comissao.id, membro)}
                              aria-label={membro.ativo ? 'Inativar membro' : 'Reativar membro'}
                            >
                              {membro.ativo ? (
                                <ToggleRight className="h-4 w-4 text-green-600" />
                              ) : (
                                <ToggleLeft className="h-4 w-4 text-gray-500" />
                              )}
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="text-red-600"
                              onClick={() => handleRemoveMembro(comissao.id, membro.id)}
                              aria-label="Remover membro"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Início:</span>{' '}
                          {new Date(membro.dataInicio).toLocaleDateString('pt-BR')}
                          {membro.dataFim && (
                            <>
                              {' '}
                              <span className="font-medium">| Fim:</span>{' '}
                              {new Date(membro.dataFim).toLocaleDateString('pt-BR')}
                            </>
                          )}
                          {membro.observacoes && (
                            <p className="mt-1 italic text-gray-600">
                              {membro.observacoes}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">
                    {comissao.membros.length} membros
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">
                    {comissao.membros.filter((m: any) => m.ativo).length} ativos
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">
                    {comissao.membros.filter((m: any) => m.cargo === 'PRESIDENTE' && m.ativo).length} presidente(s)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredComissoes.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma comissão encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece cadastrando a primeira comissão.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowForm(true)} className="flex items-center gap-2 mx-auto">
                <Plus className="h-4 w-4" />
                Nova Comissão
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
