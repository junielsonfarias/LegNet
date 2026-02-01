'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  Clock,
  Users,
  FileText,
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Eye,
  MapPin
} from 'lucide-react'
import { useSessoes } from '@/lib/hooks/use-sessoes'
import { toast } from 'sonner'
import Link from 'next/link'
import { SessoesListSkeleton } from '@/components/skeletons/sessao-skeleton'
import { gerarSlugSessao } from '@/lib/utils/sessoes-utils'

export default function SessoesAdminPage() {
  const { sessoes, loading, create, update, remove } = useSessoes()
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    numero: '',
    tipo: 'ORDINARIA' as 'ORDINARIA' | 'EXTRAORDINARIA' | 'SOLENE' | 'ESPECIAL',
    data: '',
    local: '',
    status: 'AGENDADA' as 'AGENDADA' | 'EM_ANDAMENTO' | 'SUSPENSA' | 'CONCLUIDA' | 'CANCELADA',
    descricao: ''
  })


  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'ORDINARIA':
        return 'bg-blue-100 text-blue-800'
      case 'EXTRAORDINARIA':
        return 'bg-orange-100 text-orange-800'
      case 'ESPECIAL':
        return 'bg-purple-100 text-purple-800'
      case 'SOLENE':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONCLUIDA':
        return 'bg-green-100 text-green-800'
      case 'AGENDADA':
        return 'bg-blue-100 text-blue-800'
      case 'CANCELADA':
        return 'bg-red-100 text-red-800'
      case 'EM_ANDAMENTO':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'ORDINARIA':
        return 'Ordinária'
      case 'EXTRAORDINARIA':
        return 'Extraordinária'
      case 'ESPECIAL':
        return 'Especial'
      case 'SOLENE':
        return 'Solene'
      default:
        return tipo
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CONCLUIDA':
        return 'Concluída'
      case 'AGENDADA':
        return 'Agendada'
      case 'CANCELADA':
        return 'Cancelada'
      case 'EM_ANDAMENTO':
        return 'Em Andamento'
      default:
        return status
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validar campos obrigatórios
    if (!formData.numero || !formData.data) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    
    try {
      if (editingId) {
        const updated = await update(editingId, {
          numero: parseInt(formData.numero),
          tipo: formData.tipo,
          data: formData.data,
          local: formData.local || undefined,
          status: formData.status,
          descricao: formData.descricao || undefined
        })
        
        if (updated) {
          toast.success('Sessão atualizada com sucesso')
        }
      } else {
        const dadosParaEnviar = {
          numero: parseInt(formData.numero),
          tipo: formData.tipo,
          data: formData.data,
          local: formData.local || undefined,
          status: formData.status,
          descricao: formData.descricao || undefined
        }

        try {
          const nova = await create(dadosParaEnviar)

          if (nova) {
            toast.success('Sessão criada com sucesso')
            
            // Limpar formulário
            setFormData({
              numero: '',
              tipo: 'ORDINARIA',
              data: '',
              local: '',
              status: 'AGENDADA',
              descricao: ''
            })
            setShowForm(false)
            setEditingId(null)
          } else {
            toast.error('Erro ao criar sessão')
          }
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Erro ao criar sessão')
        }
      }
      
      // Limpar formulário
      setFormData({
        numero: '',
        tipo: 'ORDINARIA',
        data: '',
        local: '',
        status: 'AGENDADA',
        descricao: ''
      })
      setShowForm(false)
      setEditingId(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar sessão')
    }
  }

  const handleEdit = (sessao: typeof sessoes[0]) => {
    const dataFormatada = new Date(sessao.data).toISOString().slice(0, 16)
    setFormData({
      numero: sessao.numero.toString(),
      tipo: sessao.tipo,
      data: dataFormatada,
      local: sessao.local || '',
      status: sessao.status,
      descricao: sessao.descricao || ''
    })
    setEditingId(sessao.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta sessão?')) {
      const sucesso = await remove(id)
      if (sucesso) {
        toast.success('Sessão excluída com sucesso')
      }
    }
  }

  const filteredSessoes = sessoes.filter(sessao => {
    if (!searchTerm) return true // Se não há termo de busca, mostra todas
    
    const searchLower = searchTerm.toLowerCase()
    const matchesTipo = getTipoLabel(sessao.tipo).toLowerCase().includes(searchLower)
    const matchesStatus = getStatusLabel(sessao.status).toLowerCase().includes(searchLower)
    const matchesDescricao = sessao.descricao && sessao.descricao.toLowerCase().includes(searchLower)
    const matchesNumero = sessao.numero.toString().includes(searchTerm)
    
    return matchesTipo || matchesStatus || matchesDescricao || matchesNumero
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              Gerenciar Sessões Legislativas
            </h1>
            <p className="text-gray-600 mt-1">
              Cadastre e gerencie as sessões da Câmara Municipal
            </p>
          </div>
          <Button disabled className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova Sessão
          </Button>
        </div>
        <SessoesListSkeleton count={5} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-8 w-8 text-blue-600" />
            Gerenciar Sessões Legislativas
          </h1>
          <p className="text-gray-600 mt-1">
            Cadastre e gerencie as sessões da Câmara Municipal
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Rapido
          </Button>
          <Button asChild className="flex items-center gap-2">
            <Link href="/admin/sessoes/nova">
              <Plus className="h-4 w-4" />
              Nova Sessao com Pauta
            </Link>
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {sessoes.length}
            </div>
            <p className="text-sm text-gray-600">Total de Sessões</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {sessoes.filter(s => s.status === 'CONCLUIDA').length}
            </div>
            <p className="text-sm text-gray-600">Concluídas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {sessoes.filter(s => s.status === 'AGENDADA').length}
            </div>
            <p className="text-sm text-gray-600">Agendadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {sessoes.reduce((acc, s) => acc + ((s as any).proposicoes?.length || 0), 0)}
            </div>
            <p className="text-sm text-gray-600">Proposições</p>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar sessões..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Formulário */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? 'Editar Sessão' : 'Nova Sessão'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form 
              onSubmit={handleSubmit}
              className="space-y-4"
              noValidate
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero">Número da Sessão</Label>
                  <Input
                    id="numero"
                    name="numero"
                    type="number"
                    min="1"
                    value={formData.numero}
                    onChange={(e) => setFormData({...formData, numero: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Sessão</Label>
                  <select
                    id="tipo"
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value as 'ORDINARIA' | 'EXTRAORDINARIA' | 'SOLENE' | 'ESPECIAL'})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="ORDINARIA">Ordinária</option>
                    <option value="EXTRAORDINARIA">Extraordinária</option>
                    <option value="ESPECIAL">Especial</option>
                    <option value="SOLENE">Solene</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data">Data e Hora</Label>
                  <Input
                    id="data"
                    name="data"
                    type="datetime-local"
                    value={formData.data}
                    onChange={(e) => setFormData({...formData, data: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="local">Local da Sessao</Label>
                  <Input
                    id="local"
                    name="local"
                    value={formData.local}
                    onChange={(e) => setFormData({...formData, local: e.target.value})}
                    placeholder="Ex: Plenario da Camara Municipal"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as 'AGENDADA' | 'EM_ANDAMENTO' | 'SUSPENSA' | 'CONCLUIDA' | 'CANCELADA'})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                  <option value="AGENDADA">Agendada</option>
                  <option value="EM_ANDAMENTO">Em Andamento</option>
                  <option value="CONCLUIDA">Concluída</option>
                  <option value="CANCELADA">Cancelada</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição da Sessão</Label>
                <textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md h-20 resize-none"
                  placeholder="Descreva os principais assuntos tratados na sessão..."
                />
              </div>

              <div className="flex items-center gap-4">
                <Button 
                  type="submit"
                >
                  {editingId ? 'Atualizar' : 'Salvar'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                    setFormData({
                      numero: '',
                      tipo: 'ORDINARIA',
                      data: '',
                      local: '',
                      status: 'AGENDADA',
                      descricao: ''
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

      {/* Lista de Sessões */}
      <div className="space-y-4">
        {filteredSessoes.map((sessao) => (
          <Card key={sessao.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {sessao.numero}ª Sessão {getTipoLabel(sessao.tipo)}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getTipoColor(sessao.tipo)}>
                        {getTipoLabel(sessao.tipo)}
                      </Badge>
                      <Badge className={getStatusColor(sessao.status)}>
                        {getStatusLabel(sessao.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <Link href={`/admin/sessoes/${gerarSlugSessao(sessao.numero, sessao.data)}`}>
                      <Eye className="h-3 w-3" />
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(sessao)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(sessao.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {sessao.descricao && (
                <p className="text-gray-700 mb-4">
                  {sessao.descricao}
                </p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">
                    {new Date(sessao.data).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">
                    {new Date(sessao.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">
                    {sessao.local || 'Local nao informado'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">-</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSessoes.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma sessão encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece cadastrando a primeira sessão.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowForm(true)} className="flex items-center gap-2 mx-auto">
                <Plus className="h-4 w-4" />
                Nova Sessão
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
