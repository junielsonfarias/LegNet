'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Search, Edit, Trash2, CheckCircle, XCircle, Building, Users, Gavel, Settings } from 'lucide-react'
import { unidadesTramitacaoService } from '@/lib/parlamentares-data'
import type { UnidadeTramitacao } from '@/lib/parlamentares-data'

export default function UnidadesTramitacaoPage() {
  const [unidades, setUnidades] = useState<UnidadeTramitacao[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUnidade, setEditingUnidade] = useState<UnidadeTramitacao | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoFilter, setTipoFilter] = useState('TODOS')
  const [formData, setFormData] = useState({
    nome: '',
    sigla: '',
    tipo: 'COMISSAO' as 'COMISSAO' | 'MESA_DIRETORA' | 'PLENARIO' | 'EXECUTIVO' | 'OUTROS',
    descricao: '',
    ativo: true,
    ordem: 1
  })

  useEffect(() => {
    loadUnidades()
  }, [])

  const loadUnidades = () => {
    const data = unidadesTramitacaoService.getAll()
    setUnidades(data.sort((a, b) => a.ordem - b.ordem))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingUnidade) {
      unidadesTramitacaoService.update(editingUnidade.id, formData)
    } else {
      const maxOrdem = Math.max(...unidades.map(u => u.ordem), 0)
      unidadesTramitacaoService.add({
        ...formData,
        ordem: maxOrdem + 1
      })
    }

    loadUnidades()
    handleClose()
  }

  const handleEdit = (unidade: UnidadeTramitacao) => {
    setEditingUnidade(unidade)
    setFormData({
      nome: unidade.nome,
      sigla: unidade.sigla,
      tipo: unidade.tipo,
      descricao: unidade.descricao,
      ativo: unidade.ativo,
      ordem: unidade.ordem
    })
    setIsModalOpen(true)
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setEditingUnidade(null)
    setFormData({
      nome: '',
      sigla: '',
      tipo: 'COMISSAO' as 'COMISSAO' | 'MESA_DIRETORA' | 'PLENARIO' | 'EXECUTIVO' | 'OUTROS',
      descricao: '',
      ativo: true,
      ordem: 1
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta unidade de tramitação?')) {
      unidadesTramitacaoService.remove(id)
      loadUnidades()
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'COMISSAO':
        return <Users className="h-4 w-4 text-blue-500" />
      case 'MESA_DIRETORA':
        return <Gavel className="h-4 w-4 text-purple-500" />
      case 'PLENARIO':
        return <Building className="h-4 w-4 text-green-500" />
      case 'EXECUTIVO':
        return <Settings className="h-4 w-4 text-orange-500" />
      default:
        return <Building className="h-4 w-4 text-gray-500" />
    }
  }

  const getTipoBadge = (tipo: string) => {
    const tipoConfig = {
      COMISSAO: { color: 'bg-blue-100 text-blue-800', label: 'Comissão' },
      MESA_DIRETORA: { color: 'bg-purple-100 text-purple-800', label: 'Mesa Diretora' },
      PLENARIO: { color: 'bg-green-100 text-green-800', label: 'Plenário' },
      EXECUTIVO: { color: 'bg-orange-100 text-orange-800', label: 'Executivo' },
      OUTROS: { color: 'bg-gray-100 text-gray-800', label: 'Outros' }
    }
    
    const config = tipoConfig[tipo as keyof typeof tipoConfig] || tipoConfig.OUTROS
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const filteredUnidades = unidades.filter(unidade => {
    const matchesSearch = unidade.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         unidade.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         unidade.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTipo = tipoFilter === 'TODOS' || unidade.tipo === tipoFilter
    
    return matchesSearch && matchesTipo
  })

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Unidades de Tramitação</h1>
          <p className="text-gray-600">Configure as unidades responsáveis pela tramitação das proposições</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Unidade
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar por nome, sigla ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="COMISSAO">Comissão</SelectItem>
                  <SelectItem value="MESA_DIRETORA">Mesa Diretora</SelectItem>
                  <SelectItem value="PLENARIO">Plenário</SelectItem>
                  <SelectItem value="EXECUTIVO">Executivo</SelectItem>
                  <SelectItem value="OUTROS">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setTipoFilter('TODOS')
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Unidades */}
      <div className="grid gap-4">
        {filteredUnidades.map((unidade) => (
          <Card key={unidade.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2">
                    {getTipoIcon(unidade.tipo)}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{unidade.nome}</h3>
                      <Badge variant="outline">{unidade.sigla}</Badge>
                      {getTipoBadge(unidade.tipo)}
                      <span className="text-sm text-gray-500">Ordem: {unidade.ordem}</span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{unidade.descricao}</p>
                    
                    <div className="flex items-center gap-4">
                      {unidade.ativo ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inativo
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(unidade)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(unidade.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUnidades.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Nenhuma unidade de tramitação encontrada</p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingUnidade ? 'Editar Unidade de Tramitação' : 'Nova Unidade de Tramitação'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Comissão de Constituição e Justiça"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="sigla">Sigla</Label>
                    <Input
                      id="sigla"
                      value={formData.sigla}
                      onChange={(e) => setFormData({ ...formData, sigla: e.target.value.toUpperCase() })}
                      placeholder="Ex: CCJ"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select value={formData.tipo} onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COMISSAO">Comissão</SelectItem>
                        <SelectItem value="MESA_DIRETORA">Mesa Diretora</SelectItem>
                        <SelectItem value="PLENARIO">Plenário</SelectItem>
                        <SelectItem value="EXECUTIVO">Executivo</SelectItem>
                        <SelectItem value="OUTROS">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="ordem">Ordem</Label>
                    <Input
                      id="ordem"
                      type="number"
                      min="1"
                      value={formData.ordem}
                      onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição da unidade e suas responsabilidades"
                    rows={3}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="ativo">Unidade ativa</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingUnidade ? 'Atualizar' : 'Criar'} Unidade
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
