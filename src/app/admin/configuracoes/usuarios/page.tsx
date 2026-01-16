'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff
} from 'lucide-react'
import { configuracoesService } from '@/lib/configuracoes-service'
import { ConfiguracaoUsuario } from '@/lib/types/configuracoes'
import { toast } from 'sonner'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<ConfiguracaoUsuario[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<ConfiguracaoUsuario | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    role: 'publico' as 'administrador' | 'secretario' | 'parlamentar' | 'publico',
    ativo: true,
    permissoes: [] as string[]
  })

  const permissoesDisponiveis = [
    { id: 'parlamentares:read', label: 'Visualizar Parlamentares' },
    { id: 'parlamentares:write', label: 'Gerenciar Parlamentares' },
    { id: 'sessoes:read', label: 'Visualizar Sessões' },
    { id: 'sessoes:write', label: 'Gerenciar Sessões' },
    { id: 'proposicoes:read', label: 'Visualizar Proposições' },
    { id: 'proposicoes:write', label: 'Gerenciar Proposições' },
    { id: 'comissoes:read', label: 'Visualizar Comissões' },
    { id: 'comissoes:write', label: 'Gerenciar Comissões' },
    { id: 'noticias:read', label: 'Visualizar Notícias' },
    { id: 'noticias:write', label: 'Gerenciar Notícias' },
    { id: 'configuracoes:read', label: 'Visualizar Configurações' },
    { id: 'configuracoes:write', label: 'Gerenciar Configurações' },
    { id: 'relatorios:read', label: 'Visualizar Relatórios' },
    { id: 'relatorios:write', label: 'Gerar Relatórios' },
    { id: 'usuarios:read', label: 'Visualizar Usuários' },
    { id: 'usuarios:write', label: 'Gerenciar Usuários' }
  ]

  useEffect(() => {
    carregarUsuarios()
  }, [])

  const carregarUsuarios = async () => {
    try {
      setLoading(true)
      const users = configuracoesService.getUsuarios()
      setUsuarios(users)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingUser) {
        // Atualizar usuário existente
        const usuarioAtualizado = configuracoesService.updateUsuario(editingUser.id, formData)
        if (usuarioAtualizado) {
          setUsuarios(usuarios.map(u => u.id === editingUser.id ? usuarioAtualizado : u))
          toast.success('Usuário atualizado com sucesso!')
        }
      } else {
        // Criar novo usuário
        const novoUsuario = configuracoesService.createUsuario(formData)
        setUsuarios([...usuarios, novoUsuario])
        toast.success('Usuário criado com sucesso!')
      }
      
      resetForm()
    } catch (error) {
      console.error('Erro ao salvar usuário:', error)
      toast.error('Erro ao salvar usuário')
    }
  }

  const handleEdit = (usuario: ConfiguracaoUsuario) => {
    setEditingUser(usuario)
    setFormData({
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      ativo: usuario.ativo,
      permissoes: usuario.permissoes
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        const sucesso = configuracoesService.deleteUsuario(id)
        if (sucesso) {
          setUsuarios(usuarios.filter(u => u.id !== id))
          toast.success('Usuário excluído com sucesso!')
        }
      } catch (error) {
        console.error('Erro ao excluir usuário:', error)
        toast.error('Erro ao excluir usuário')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      role: 'publico',
      ativo: true,
      permissoes: []
    })
    setEditingUser(null)
    setShowForm(false)
  }

  const togglePermissao = (permissaoId: string) => {
    setFormData(prev => ({
      ...prev,
      permissoes: prev.permissoes.includes(permissaoId)
        ? prev.permissoes.filter(p => p !== permissaoId)
        : [...prev.permissoes, permissaoId]
    }))
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'administrador': return 'bg-red-100 text-red-800'
      case 'secretario': return 'bg-blue-100 text-blue-800'
      case 'parlamentar': return 'bg-green-100 text-green-800'
      case 'publico': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'administrador': return 'Administrador'
      case 'secretario': return 'Secretário'
      case 'parlamentar': return 'Parlamentar'
      case 'publico': return 'Público'
      default: return role
    }
  }

  const usuariosFiltrados = usuarios.filter(usuario => {
    const matchSearch = usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchRole = roleFilter === 'all' || usuario.role === roleFilter
    return matchSearch && matchRole
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-camara-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Usuários</h1>
          <p className="text-gray-600">Gerencie usuários, roles e permissões do sistema</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Buscar usuário</Label>
              <Input
                id="search"
                placeholder="Nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="roleFilter">Filtrar por role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="administrador">Administrador</SelectItem>
                  <SelectItem value="secretario">Secretário</SelectItem>
                  <SelectItem value="parlamentar">Parlamentar</SelectItem>
                  <SelectItem value="publico">Público</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Usuários ({usuariosFiltrados.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {usuariosFiltrados.map((usuario) => (
              <div key={usuario.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-camara-primary rounded-full flex items-center justify-center text-white font-semibold">
                    {usuario.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{usuario.nome}</h3>
                    <p className="text-gray-600">{usuario.email}</p>
                    {usuario.ultimoAcesso && (
                      <p className="text-sm text-gray-500">
                        Último acesso: {new Date(usuario.ultimoAcesso).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={getRoleColor(usuario.role)}>
                    {getRoleLabel(usuario.role)}
                  </Badge>
                  <Badge variant={usuario.ativo ? "default" : "secondary"}>
                    {usuario.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(usuario)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(usuario.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
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
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={formData.role}
                    onValueChange={(value: 'administrador' | 'secretario' | 'parlamentar' | 'publico') => 
                      setFormData({...formData, role: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="administrador">Administrador</SelectItem>
                      <SelectItem value="secretario">Secretário</SelectItem>
                      <SelectItem value="parlamentar">Parlamentar</SelectItem>
                      <SelectItem value="publico">Público</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked) => setFormData({...formData, ativo: checked})}
                  />
                  <Label htmlFor="ativo">Usuário ativo</Label>
                </div>

                <div>
                  <Label>Permissões</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                    {permissoesDisponiveis.map((permissao) => (
                      <div key={permissao.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={permissao.id}
                          checked={formData.permissoes.includes(permissao.id)}
                          onChange={() => togglePermissao(permissao.id)}
                          className="rounded"
                        />
                        <Label htmlFor={permissao.id} className="text-sm">
                          {permissao.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingUser ? 'Atualizar' : 'Criar'}
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
