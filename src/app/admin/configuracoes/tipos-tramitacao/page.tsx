'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Plus, Edit, Trash2, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface TipoTramitacao {
  id: string
  nome: string
  descricao: string | null
  prazoRegimental: number
  prazoLegal: number | null
  ativo: boolean
  ordem: number
  unidadeResponsavelId: string | null
  unidadeResponsavel?: {
    id: string
    nome: string
    sigla: string | null
  } | null
  createdAt: string
  updatedAt: string
}

interface FormData {
  nome: string
  descricao: string
  prazoRegimental: number
  prazoLegal: number
  ativo: boolean
  ordem: number
}

export default function TiposTramitacaoPage() {
  const [tipos, setTipos] = useState<TipoTramitacao[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTipo, setEditingTipo] = useState<TipoTramitacao | null>(null)
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    descricao: '',
    prazoRegimental: 15,
    prazoLegal: 0,
    ativo: true,
    ordem: 0
  })

  const loadTipos = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/configuracoes/tipos-tramitacao')
      const data = await response.json()

      if (data.success) {
        setTipos(data.data || [])
      } else {
        toast.error(data.error || 'Erro ao carregar tipos de tramitação')
      }
    } catch (error) {
      console.error('Erro ao carregar tipos:', error)
      toast.error('Erro ao carregar tipos de tramitação')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTipos()
  }, [loadTipos])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    try {
      setSaving(true)

      const url = editingTipo
        ? `/api/configuracoes/tipos-tramitacao/${editingTipo.id}`
        : '/api/configuracoes/tipos-tramitacao'

      const method = editingTipo ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome.trim(),
          descricao: formData.descricao.trim() || undefined,
          prazoRegimental: formData.prazoRegimental,
          prazoLegal: formData.prazoLegal || undefined,
          ativo: formData.ativo,
          ordem: formData.ordem
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(editingTipo
          ? 'Tipo de tramitação atualizado com sucesso!'
          : 'Tipo de tramitação criado com sucesso!'
        )
        loadTipos()
        handleClose()
      } else {
        toast.error(data.error || 'Erro ao salvar tipo de tramitação')
      }
    } catch (error) {
      console.error('Erro ao salvar tipo de tramitação:', error)
      toast.error('Erro ao salvar tipo de tramitação')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (tipo: TipoTramitacao) => {
    setEditingTipo(tipo)
    setFormData({
      nome: tipo.nome,
      descricao: tipo.descricao || '',
      prazoRegimental: tipo.prazoRegimental,
      prazoLegal: tipo.prazoLegal || 0,
      ativo: tipo.ativo,
      ordem: tipo.ordem
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este tipo de tramitação?')) {
      return
    }

    try {
      const response = await fetch(`/api/configuracoes/tipos-tramitacao/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Tipo de tramitação excluído com sucesso!')
        loadTipos()
      } else {
        toast.error(data.error || 'Erro ao excluir tipo de tramitação')
      }
    } catch (error) {
      console.error('Erro ao excluir tipo de tramitação:', error)
      toast.error('Erro ao excluir tipo de tramitação')
    }
  }

  const handleToggleAtivo = async (tipo: TipoTramitacao) => {
    try {
      const response = await fetch(`/api/configuracoes/tipos-tramitacao/${tipo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !tipo.ativo })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(tipo.ativo ? 'Tipo desativado' : 'Tipo ativado')
        loadTipos()
      } else {
        toast.error(data.error || 'Erro ao atualizar status')
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setEditingTipo(null)
    setFormData({
      nome: '',
      descricao: '',
      prazoRegimental: 15,
      prazoLegal: 0,
      ativo: true,
      ordem: 0
    })
  }

  const formatPrazo = (dias: number) => {
    if (!dias || dias === 0) return 'Sem prazo'
    return `${dias} dia${dias > 1 ? 's' : ''}`
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Carregando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tipos de Tramitação</h1>
          <p className="text-gray-600">
            Gerencie os tipos de tramitação legislativa com seus respectivos prazos regimentais
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Tipo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Tipos de Tramitação Cadastrados ({tipos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tipos.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Nenhum tipo de tramitação cadastrado.
              </p>
            ) : (
              tipos.map((tipo) => (
                <div
                  key={tipo.id}
                  className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 ${
                    !tipo.ativo ? 'opacity-60 bg-gray-50' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{tipo.nome}</h3>
                      <Badge variant="outline" className="text-xs">
                        {formatPrazo(tipo.prazoRegimental)}
                      </Badge>
                      {!tipo.ativo && (
                        <Badge variant="secondary" className="text-xs">
                          Inativo
                        </Badge>
                      )}
                    </div>
                    {tipo.descricao && (
                      <p className="text-sm text-gray-600">{tipo.descricao}</p>
                    )}
                    {tipo.unidadeResponsavel && (
                      <p className="text-xs text-gray-500 mt-1">
                        Unidade responsável: {tipo.unidadeResponsavel.nome}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={tipo.ativo}
                      onCheckedChange={() => handleToggleAtivo(tipo)}
                      title={tipo.ativo ? 'Desativar' : 'Ativar'}
                    />
                    <Button variant="outline" size="sm" onClick={() => handleEdit(tipo)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(tipo.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>
                {editingTipo ? 'Editar Tipo de Tramitação' : 'Novo Tipo de Tramitação'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Encaminhada à Comissão"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descreva o processo de tramitação..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prazoRegimental">Prazo Regimental (dias)</Label>
                    <Input
                      id="prazoRegimental"
                      type="number"
                      min="0"
                      value={formData.prazoRegimental}
                      onChange={(e) => setFormData({
                        ...formData,
                        prazoRegimental: parseInt(e.target.value) || 0
                      })}
                      placeholder="15"
                    />
                  </div>
                  <div>
                    <Label htmlFor="prazoLegal">Prazo Legal (dias)</Label>
                    <Input
                      id="prazoLegal"
                      type="number"
                      min="0"
                      value={formData.prazoLegal}
                      onChange={(e) => setFormData({
                        ...formData,
                        prazoLegal: parseInt(e.target.value) || 0
                      })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ordem">Ordem de Exibição</Label>
                    <Input
                      id="ordem"
                      type="number"
                      min="0"
                      value={formData.ordem}
                      onChange={(e) => setFormData({
                        ...formData,
                        ordem: parseInt(e.target.value) || 0
                      })}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="ativo"
                      checked={formData.ativo}
                      onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                    />
                    <Label htmlFor="ativo">Ativo</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingTipo ? 'Atualizar' : 'Criar'}
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
