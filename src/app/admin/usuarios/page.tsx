'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  UserPlus,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Key
} from 'lucide-react'
import { toast } from 'sonner'
import { usuariosApi } from '@/lib/api/usuarios-api'
import { useParlamentares } from '@/lib/hooks/use-parlamentares'

interface Usuario {
  id: string
  name: string | null
  email: string
  role: 'ADMIN' | 'EDITOR' | 'USER' | 'PARLAMENTAR' | 'OPERADOR'
  ativo: boolean
  parlamentarId: string | null
  parlamentar?: {
    id: string
    nome: string
  }
  createdAt: string
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('TODOS')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  const { parlamentares } = useParlamentares()
  
  const [formData, setFormData] = useState<{
    name: string
    email: string
    password: string
    role: 'ADMIN' | 'EDITOR' | 'USER' | 'PARLAMENTAR' | 'OPERADOR'
    parlamentarId: string
    ativo: boolean
  }>({
    name: '',
    email: '',
    password: '',
    role: 'USER',
    parlamentarId: '',
    ativo: true
  })

  useEffect(() => {
    carregarUsuarios()
  }, [])

  const carregarUsuarios = async () => {
    try {
      setLoading(true)
      const usuarios = await usuariosApi.getAll()
      setUsuarios(Array.isArray(usuarios) ? usuarios : [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      toast.error('Erro ao carregar usuários')
      setUsuarios([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email) {
      toast.error('Email é obrigatório')
      return
    }

    if (!editingUsuario && !formData.password) {
      toast.error('Senha é obrigatória para novos usuários')
      return
    }

    try {
      if (editingUsuario) {
        const atualizado = await usuariosApi.update(editingUsuario.id, {
          name: formData.name || undefined,
          email: formData.email,
          password: formData.password || undefined,
          role: formData.role,
          parlamentarId: formData.parlamentarId || undefined,
          ativo: formData.ativo
        })

        if (atualizado) {
          toast.success('Usuário atualizado com sucesso!')
          carregarUsuarios()
          handleClose()
        }
      } else {
        const novo = await usuariosApi.create({
          name: formData.name || undefined,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          parlamentarId: formData.parlamentarId || undefined,
          ativo: formData.ativo
        })

        if (novo) {
          toast.success('Usuário criado com sucesso!')
          carregarUsuarios()
          handleClose()
        }
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error)
      toast.error('Erro ao salvar usuário')
    }
  }

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario)
    setFormData({
      name: usuario.name || '',
      email: usuario.email,
      password: '',
      role: usuario.role,
      parlamentarId: usuario.parlamentarId || '',
      ativo: usuario.ativo
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) {
      return
    }

    try {
      await usuariosApi.delete(id)
      toast.success('Usuário excluído com sucesso!')
      carregarUsuarios()
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
      toast.error('Erro ao excluir usuário')
    }
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setEditingUsuario(null)
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'USER',
      parlamentarId: '',
      ativo: true
    })
  }

  const toggleAtivo = async (usuario: Usuario) => {
    try {
      await usuariosApi.update(usuario.id, {
        ativo: !usuario.ativo
      })
      toast.success(`Usuário ${!usuario.ativo ? 'ativado' : 'desativado'} com sucesso!`)
      carregarUsuarios()
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast.error('Erro ao alterar status do usuário')
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800'
      case 'EDITOR': return 'bg-blue-100 text-blue-800'
      case 'PARLAMENTAR': return 'bg-green-100 text-green-800'
      case 'OPERADOR': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrador'
      case 'EDITOR': return 'Editor'
      case 'PARLAMENTAR': return 'Parlamentar'
      case 'OPERADOR': return 'Operador'
      default: return 'Usuário'
    }
  }

  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = searchTerm === '' || 
      usuario.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'TODOS' || usuario.role === roleFilter
    return matchesSearch && matchesRole
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando usuários...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-blue-600" />
            Gerenciamento de Usuários
          </h1>
          <p className="text-gray-600">Gerencie usuários e suas permissões</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="role">Função</Label>
              <select
                id="role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TODOS">Todos</option>
                <option value="ADMIN">Administrador</option>
                <option value="EDITOR">Editor</option>
                <option value="PARLAMENTAR">Parlamentar</option>
                <option value="OPERADOR">Operador</option>
                <option value="USER">Usuário</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Usuários */}
      <div className="grid gap-4">
        {filteredUsuarios.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum usuário encontrado</p>
            </CardContent>
          </Card>
        ) : (
          filteredUsuarios.map((usuario) => (
            <Card key={usuario.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">
                          {usuario.name || 'Sem nome'}
                        </h3>
                        <Badge className={getRoleColor(usuario.role)}>
                          {getRoleLabel(usuario.role)}
                        </Badge>
                        {usuario.ativo ? (
                          <Badge className="bg-green-100 text-green-800">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            <UserX className="h-3 w-3 mr-1" />
                            Inativo
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {usuario.email}
                        </span>
                        {usuario.parlamentar && (
                          <span className="text-blue-600">
                            Parlamentar: {usuario.parlamentar.nome}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAtivo(usuario)}
                    >
                      {usuario.ativo ? (
                        <>
                          <UserX className="h-4 w-4 mr-1" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-1" />
                          Ativar
                        </>
                      )}
                    </Button>
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
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Criação/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingUsuario ? 'Editar Usuário' : 'Novo Usuário'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">
                    Senha {editingUsuario ? '(deixe em branco para manter)' : '*'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    required={!editingUsuario}
                  />
                </div>

                <div>
                  <Label htmlFor="role">Função *</Label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="USER">Usuário</option>
                    <option value="ADMIN">Administrador</option>
                    <option value="EDITOR">Editor</option>
                    <option value="PARLAMENTAR">Parlamentar</option>
                    <option value="OPERADOR">Operador</option>
                  </select>
                </div>

                {formData.role === 'PARLAMENTAR' && (
                  <div>
                    <Label htmlFor="parlamentarId">Vincular a Parlamentar</Label>
                    <select
                      id="parlamentarId"
                      value={formData.parlamentarId}
                      onChange={(e) => setFormData({ ...formData, parlamentarId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione um parlamentar</option>
                      {parlamentares.map((parlamentar) => (
                        <option key={parlamentar.id} value={parlamentar.id}>
                          {parlamentar.nome}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Ao vincular a um parlamentar, o usuário poderá votar nas sessões
                    </p>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="ativo">Usuário ativo</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingUsuario ? 'Atualizar' : 'Criar'}
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

