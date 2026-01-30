'use client'

import { useState, useEffect, useCallback } from 'react'
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
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

type TipoUnidade = 'COMISSAO' | 'MESA_DIRETORA' | 'PLENARIO' | 'PREFEITURA' | 'SECRETARIA' | 'GABINETE' | 'ARQUIVO' | 'PROTOCOLO' | 'ASSESSORIA' | 'OUTROS'

interface Unidade {
  id: string
  nome: string
  sigla: string | null
  descricao: string | null
  tipo: TipoUnidade
  ativo: boolean
  ordem: number
}

const TIPOS_LABELS: Record<TipoUnidade, string> = {
  COMISSAO: 'Comissão',
  MESA_DIRETORA: 'Mesa Diretora',
  PLENARIO: 'Plenário',
  PREFEITURA: 'Prefeitura',
  SECRETARIA: 'Secretaria',
  GABINETE: 'Gabinete',
  ARQUIVO: 'Arquivo',
  PROTOCOLO: 'Protocolo',
  ASSESSORIA: 'Assessoria',
  OUTROS: 'Outros'
}

export default function TiposOrgaosPage() {
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUnidade, setEditingUnidade] = useState<Unidade | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    sigla: '',
    descricao: '',
    tipo: 'COMISSAO' as TipoUnidade,
    ativo: true
  })

  const loadUnidades = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/configuracoes/unidades-tramitacao')
      if (res.ok) {
        const data = await res.json()
        setUnidades(data.data ?? [])
      } else {
        toast.error('Erro ao carregar unidades')
      }
    } catch (error) {
      console.error('Erro ao carregar unidades', error)
      toast.error('Erro ao carregar unidades')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUnidades()
  }, [loadUnidades])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const payload = {
        nome: formData.nome,
        sigla: formData.sigla || null,
        descricao: formData.descricao || null,
        tipo: formData.tipo,
        ativo: formData.ativo
      }

      let res: Response
      if (editingUnidade) {
        res = await fetch(`/api/configuracoes/unidades-tramitacao/${editingUnidade.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        res = await fetch('/api/configuracoes/unidades-tramitacao', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      if (res.ok) {
        toast.success(editingUnidade ? 'Unidade atualizada com sucesso!' : 'Unidade criada com sucesso!')
        loadUnidades()
        handleClose()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erro ao salvar unidade')
      }
    } catch (error) {
      toast.error('Erro ao salvar unidade')
    }
  }

  const handleEdit = (unidade: Unidade) => {
    setEditingUnidade(unidade)
    setFormData({
      nome: unidade.nome,
      sigla: unidade.sigla ?? '',
      descricao: unidade.descricao ?? '',
      tipo: unidade.tipo,
      ativo: unidade.ativo
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta unidade?')) return

    try {
      const res = await fetch(`/api/configuracoes/unidades-tramitacao/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Unidade excluída com sucesso!')
        loadUnidades()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erro ao excluir unidade')
      }
    } catch (error) {
      toast.error('Erro ao excluir unidade')
    }
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setEditingUnidade(null)
    setFormData({
      nome: '',
      sigla: '',
      descricao: '',
      tipo: 'COMISSAO',
      ativo: true
    })
  }

  const getStatusBadge = (ativo: boolean) => {
    return ativo ? (
      <Badge className="bg-green-100 text-green-800">Ativo</Badge>
    ) : (
      <Badge variant="secondary">Inativo</Badge>
    )
  }

  const getTipoBadge = (tipo: TipoUnidade) => {
    const tipoConfig: Record<TipoUnidade, { color: string; icon: typeof Users }> = {
      COMISSAO: { color: 'bg-blue-100 text-blue-800', icon: Users },
      MESA_DIRETORA: { color: 'bg-purple-100 text-purple-800', icon: Gavel },
      PLENARIO: { color: 'bg-green-100 text-green-800', icon: Building2 },
      PREFEITURA: { color: 'bg-orange-100 text-orange-800', icon: Building2 },
      SECRETARIA: { color: 'bg-teal-100 text-teal-800', icon: Building2 },
      GABINETE: { color: 'bg-indigo-100 text-indigo-800', icon: Users },
      ARQUIVO: { color: 'bg-amber-100 text-amber-800', icon: Building2 },
      PROTOCOLO: { color: 'bg-cyan-100 text-cyan-800', icon: Building2 },
      ASSESSORIA: { color: 'bg-pink-100 text-pink-800', icon: Users },
      OUTROS: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
    }

    const config = tipoConfig[tipo] || tipoConfig.OUTROS
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {TIPOS_LABELS[tipo]}
      </Badge>
    )
  }

  const getTipoIcon = (tipo: TipoUnidade) => {
    switch (tipo) {
      case 'COMISSAO':
        return <Users className="h-5 w-5 text-blue-600" />
      case 'MESA_DIRETORA':
        return <Gavel className="h-5 w-5 text-purple-600" />
      case 'PLENARIO':
        return <Building2 className="h-5 w-5 text-green-600" />
      case 'PREFEITURA':
        return <Building2 className="h-5 w-5 text-orange-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Unidades de Tramitação</h1>
          <p className="text-gray-600">Configure as unidades responsáveis pela tramitação</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadUnidades} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova Unidade
          </Button>
        </div>
      </div>

      {/* Lista de Unidades */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse h-24 bg-gray-100 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {unidades.map((unidade) => (
            <Card key={unidade.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getTipoIcon(unidade.tipo)}
                      {unidade.nome} {unidade.sigla && `(${unidade.sigla})`}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{unidade.descricao}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(unidade.ativo)}
                    <Button variant="outline" size="sm" onClick={() => handleEdit(unidade)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(unidade.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      <strong>Tipo:</strong> {getTipoBadge(unidade.tipo)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Ordem:</strong> {unidade.ordem}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Status:</strong> {unidade.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && unidades.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma unidade cadastrada</p>
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
                  {editingUnidade ? 'Editar Unidade' : 'Nova Unidade'}
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
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição da unidade"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value: TipoUnidade) => setFormData({ ...formData, tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TIPOS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    <Save className="h-4 w-4 mr-2" />
                    {editingUnidade ? 'Atualizar' : 'Criar'}
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
