'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  FileText, 
  Clock, 
  Vote,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { tiposProposicoesService } from '@/lib/tramitacao-service'
import { TipoProposicao } from '@/lib/types/tramitacao'
import { toast } from 'sonner'

export default function TiposProposicoesPage() {
  const [tipos, setTipos] = useState<TipoProposicao[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTipo, setEditingTipo] = useState<TipoProposicao | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    sigla: '',
    descricao: '',
    prazoLimite: 0,
    requerVotacao: false,
    requerSanacao: false,
    ativo: true,
    ordem: 0
  })

  useEffect(() => {
    loadTipos()
  }, [])

  const loadTipos = () => {
    const data = tiposProposicoesService.getAll()
    setTipos(data.sort((a, b) => a.ordem - b.ordem))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingTipo) {
        tiposProposicoesService.update({
          ...editingTipo,
          ...formData
        })
        toast.success('Tipo de proposição atualizado com sucesso!')
      } else {
        tiposProposicoesService.create(formData)
        toast.success('Tipo de proposição criado com sucesso!')
      }
      
      loadTipos()
      handleClose()
    } catch (error) {
      toast.error('Erro ao salvar tipo de proposição')
    }
  }

  const handleEdit = (tipo: TipoProposicao) => {
    setEditingTipo(tipo)
    setFormData({
      nome: tipo.nome,
      sigla: tipo.sigla,
      descricao: tipo.descricao,
      prazoLimite: tipo.prazoLimite || 0,
      requerVotacao: tipo.requerVotacao,
      requerSanacao: tipo.requerSanacao,
      ativo: tipo.ativo,
      ordem: tipo.ordem
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este tipo de proposição?')) {
      try {
        tiposProposicoesService.delete(id)
        loadTipos()
        toast.success('Tipo de proposição excluído com sucesso!')
      } catch (error) {
        toast.error('Erro ao excluir tipo de proposição')
      }
    }
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setEditingTipo(null)
    setFormData({
      nome: '',
      sigla: '',
      descricao: '',
      prazoLimite: 0,
      requerVotacao: false,
      requerSanacao: false,
      ativo: true,
      ordem: 0
    })
  }

  const getStatusBadge = (ativo: boolean) => {
    return ativo ? (
      <Badge className="bg-green-100 text-green-800">Ativo</Badge>
    ) : (
      <Badge variant="secondary">Inativo</Badge>
    )
  }

  const getRequerimentoBadge = (requer: boolean) => {
    return requer ? (
      <Badge className="bg-blue-100 text-blue-800">Sim</Badge>
    ) : (
      <Badge variant="outline">Não</Badge>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tipos de Proposições</h1>
          <p className="text-gray-600">Configure os tipos de proposições legislativas</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Tipo
        </Button>
      </div>

      {/* Lista de Tipos */}
      <div className="grid gap-4">
        {tipos.map((tipo) => (
          <Card key={tipo.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {tipo.nome} ({tipo.sigla})
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{tipo.descricao}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(tipo.ativo)}
                  <Button variant="outline" size="sm" onClick={() => handleEdit(tipo)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(tipo.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    <strong>Prazo:</strong> {tipo.prazoLimite || 'N/A'} dias
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Vote className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    <strong>Votação:</strong> {getRequerimentoBadge(tipo.requerVotacao)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    <strong>Sanação:</strong> {getRequerimentoBadge(tipo.requerSanacao)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    <strong>Ordem:</strong> {tipo.ordem}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tipos.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum tipo de proposição cadastrado</p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {editingTipo ? 'Editar Tipo de Proposição' : 'Novo Tipo de Proposição'}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
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
                      placeholder="Ex: Projeto de Lei"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="sigla">Sigla</Label>
                    <Input
                      id="sigla"
                      value={formData.sigla}
                      onChange={(e) => setFormData({ ...formData, sigla: e.target.value.toUpperCase() })}
                      placeholder="Ex: PL"
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
                    placeholder="Descrição do tipo de proposição"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prazoLimite">Prazo Limite (dias)</Label>
                    <Input
                      id="prazoLimite"
                      type="number"
                      value={formData.prazoLimite}
                      onChange={(e) => setFormData({ ...formData, prazoLimite: parseInt(e.target.value) || 0 })}
                      placeholder="0 para sem prazo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ordem">Ordem</Label>
                    <Input
                      id="ordem"
                      type="number"
                      value={formData.ordem}
                      onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
                      placeholder="Ordem de exibição"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requerVotacao"
                      checked={formData.requerVotacao}
                      onCheckedChange={(checked) => setFormData({ ...formData, requerVotacao: checked })}
                    />
                    <Label htmlFor="requerVotacao">Requer Votação</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requerSanacao"
                      checked={formData.requerSanacao}
                      onCheckedChange={(checked) => setFormData({ ...formData, requerSanacao: checked })}
                    />
                    <Label htmlFor="requerSanacao">Requer Sanação</Label>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                  />
                  <Label htmlFor="ativo">Ativo</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    <Save className="h-4 w-4 mr-2" />
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
