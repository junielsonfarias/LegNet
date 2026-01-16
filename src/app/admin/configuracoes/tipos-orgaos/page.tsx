'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Building2, 
  Users,
  Gavel,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { tiposOrgaosService } from '@/lib/tramitacao-service'
import { TipoOrgao, TipoOrgaoTramitacao } from '@/lib/types/tramitacao'
import { toast } from 'sonner'

export default function TiposOrgaosPage() {
  const [orgaos, setOrgaos] = useState<TipoOrgao[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingOrgao, setEditingOrgao] = useState<TipoOrgao | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    sigla: '',
    descricao: '',
    tipo: 'comissao' as TipoOrgaoTramitacao,
    ativo: true,
    ordem: 0
  })

  useEffect(() => {
    loadOrgaos()
  }, [])

  const loadOrgaos = () => {
    const data = tiposOrgaosService.getAll()
    setOrgaos(data.sort((a, b) => a.ordem - b.ordem))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingOrgao) {
        tiposOrgaosService.update({
          ...editingOrgao,
          ...formData
        })
        toast.success('Tipo de órgão atualizado com sucesso!')
      } else {
        tiposOrgaosService.create(formData)
        toast.success('Tipo de órgão criado com sucesso!')
      }
      
      loadOrgaos()
      handleClose()
    } catch (error) {
      toast.error('Erro ao salvar tipo de órgão')
    }
  }

  const handleEdit = (orgao: TipoOrgao) => {
    setEditingOrgao(orgao)
    setFormData({
      nome: orgao.nome,
      sigla: orgao.sigla,
      descricao: orgao.descricao,
      tipo: orgao.tipo as any,
      ativo: orgao.ativo,
      ordem: orgao.ordem
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este tipo de órgão?')) {
      try {
        tiposOrgaosService.delete(id)
        loadOrgaos()
        toast.success('Tipo de órgão excluído com sucesso!')
      } catch (error) {
        toast.error('Erro ao excluir tipo de órgão')
      }
    }
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setEditingOrgao(null)
    setFormData({
      nome: '',
      sigla: '',
      descricao: '',
      tipo: 'comissao' as any,
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

  const getTipoBadge = (tipo: TipoOrgaoTramitacao) => {
    const tipoConfig = {
      comissao: { color: 'bg-blue-100 text-blue-800', label: 'Comissão', icon: Users },
      mesa_diretora: { color: 'bg-purple-100 text-purple-800', label: 'Mesa Diretora', icon: Gavel },
      plenario: { color: 'bg-green-100 text-green-800', label: 'Plenário', icon: Building2 },
      prefeitura: { color: 'bg-orange-100 text-orange-800', label: 'Prefeitura', icon: Building2 },
      outros: { color: 'bg-gray-100 text-gray-800', label: 'Outros', icon: AlertCircle }
    }
    
    const config = tipoConfig[tipo] || tipoConfig.outros
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getTipoIcon = (tipo: any) => {
    switch (tipo) {
      case 'comissao':
        return <Users className="h-5 w-5 text-blue-600" />
      case 'mesa_diretora':
        return <Gavel className="h-5 w-5 text-purple-600" />
      case 'plenario':
        return <Building2 className="h-5 w-5 text-green-600" />
      case 'prefeitura':
        return <Building2 className="h-5 w-5 text-orange-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tipos de Órgãos</h1>
          <p className="text-gray-600">Configure os tipos de órgãos para tramitação</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Órgão
        </Button>
      </div>

      {/* Lista de Órgãos */}
      <div className="grid gap-4">
        {orgaos.map((orgao) => (
          <Card key={orgao.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {getTipoIcon(orgao.tipo)}
                    {orgao.nome} ({orgao.sigla})
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{orgao.descricao}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(orgao.ativo)}
                  <Button variant="outline" size="sm" onClick={() => handleEdit(orgao)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(orgao.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    <strong>Tipo:</strong> {getTipoBadge(orgao.tipo as any)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    <strong>Ordem:</strong> {orgao.ordem}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    <strong>Status:</strong> {orgao.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {orgaos.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum tipo de órgão cadastrado</p>
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
                  {editingOrgao ? 'Editar Tipo de Órgão' : 'Novo Tipo de Órgão'}
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

                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição do órgão"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select 
                      value={formData.tipo} 
                      onValueChange={(value: TipoOrgaoTramitacao) => setFormData({ ...formData, tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comissao">Comissão</SelectItem>
                        <SelectItem value="mesa_diretora">Mesa Diretora</SelectItem>
                        <SelectItem value="plenario">Plenário</SelectItem>
                        <SelectItem value="prefeitura">Prefeitura</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
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
                    {editingOrgao ? 'Atualizar' : 'Criar'}
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
