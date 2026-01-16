'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, ArrowRight } from 'lucide-react'
import { tiposTramitacaoService } from '@/lib/tramitacao-service'
import type { TipoTramitacao } from '@/lib/types/tramitacao'
import { toast } from 'sonner'

export default function TiposTramitacaoPage() {
  const [tipos, setTipos] = useState<TipoTramitacao[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTipo, setEditingTipo] = useState<TipoTramitacao | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    prazoRegimental: {
      unidade: 'dias' as 'dias' | 'horas' | 'minutos',
      quantidade: 0
    }
  })

  useEffect(() => {
    loadTipos()
  }, [])

  const loadTipos = () => {
    setTipos(tiposTramitacaoService.getAll())
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingTipo) {
        tiposTramitacaoService.update({ ...editingTipo, ...formData } as any)
        toast.success('Tipo de tramitação atualizado com sucesso!')
      } else {
        tiposTramitacaoService.create(formData as any)
        toast.success('Tipo de tramitação criado com sucesso!')
      }
      loadTipos()
      handleClose()
    } catch (error) {
      console.error('Erro ao salvar tipo de tramitação:', error)
      toast.error('Erro ao salvar tipo de tramitação')
    }
  }

  const handleEdit = (tipo: TipoTramitacao) => {
    setEditingTipo(tipo)
    setFormData({
      nome: tipo.nome,
      descricao: tipo.descricao || '',
      prazoRegimental: (tipo.prazoRegimental as any) || { unidade: 'dias', quantidade: 0 }
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este tipo de tramitação?')) {
      try {
        tiposTramitacaoService.delete(id)
        loadTipos()
        toast.success('Tipo de tramitação excluído com sucesso!')
      } catch (error) {
        console.error('Erro ao excluir tipo de tramitação:', error)
        toast.error('Erro ao excluir tipo de tramitação')
      }
    }
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setEditingTipo(null)
    setFormData({
      nome: '',
      descricao: '',
      prazoRegimental: {
        unidade: 'dias',
        quantidade: 0
      }
    })
  }

  const formatPrazo = (prazo?: { unidade: string; quantidade: number }) => {
    if (!prazo || prazo.quantidade === 0) return 'Sem prazo'
    return `${prazo.quantidade} ${prazo.unidade}`
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Configuração de Tipos de Tramitação</h1>
          <p className="text-gray-600">Gerencie os tipos de tramitação legislativa com seus respectivos prazos regimentais</p>
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
            Tipos de Tramitação Cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tipos.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhum tipo de tramitação cadastrado.</p>
            ) : (
              tipos.map((tipo) => (
                <div key={tipo.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{tipo.nome}</h3>
                      <Badge variant="outline" className="text-xs">
                        {formatPrazo(tipo.prazoRegimental as any)}
                      </Badge>
                    </div>
                    {tipo.descricao && (
                      <p className="text-sm text-gray-600">{tipo.descricao}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(tipo)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(tipo.id)}>
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
                  <Label htmlFor="nome">Nome</Label>
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
                    <Label htmlFor="quantidade">Prazo Regimental</Label>
                    <Input
                      id="quantidade"
                      type="number"
                      min="0"
                      value={formData.prazoRegimental.quantidade}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        prazoRegimental: { 
                          ...formData.prazoRegimental, 
                          quantidade: parseInt(e.target.value) || 0 
                        } 
                      })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unidade">Unidade</Label>
                    <select
                      id="unidade"
                      value={formData.prazoRegimental.unidade}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        prazoRegimental: { 
                          ...formData.prazoRegimental, 
                          unidade: e.target.value as 'dias' | 'horas' | 'minutos' 
                        } 
                      })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="dias">Dias</option>
                      <option value="horas">Horas</option>
                      <option value="minutos">Minutos</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingTipo ? 'Atualizar' : 'Criar'} Tipo
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