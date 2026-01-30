'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Users, 
  Building2, 
  Calendar,
  Filter,
  X,
  Loader2
} from 'lucide-react'
import { useParlamentares } from '@/lib/hooks/use-parlamentares'
import { ParlamentarApi } from '@/lib/api/parlamentares-api'
import { toast } from 'sonner'

export default function ParlamentaresPage() {
  const router = useRouter()
  const [filtros, setFiltros] = useState({
    busca: '',
    partido: 'Todos',
    cargo: 'Todos',
    status: 'ativos' as 'ativos' | 'inativos' | 'todos'
  })

  // Usar hook real para buscar parlamentares (filtrar por status)
  const { parlamentares, loading: carregando, remove, create, update, refetch } = useParlamentares(
    filtros.status === 'todos' ? undefined : { ativo: filtros.status === 'ativos' }
  )

  // Aplicar filtros
  const parlamentaresFiltrados = useMemo(() => {
    if (!parlamentares || !Array.isArray(parlamentares)) return []
    return parlamentares.filter(parlamentar => {
      if (!parlamentar) return false
      const matchesBusca = filtros.busca === '' || 
        (parlamentar.nome && typeof parlamentar.nome === 'string' && parlamentar.nome.toLowerCase().includes(filtros.busca.toLowerCase())) ||
        (parlamentar.apelido && typeof parlamentar.apelido === 'string' && parlamentar.apelido.toLowerCase().includes(filtros.busca.toLowerCase()))

      const matchesPartido = filtros.partido === 'Todos' || parlamentar.partido === filtros.partido

      const matchesCargo = filtros.cargo === 'Todos' || parlamentar.cargo === filtros.cargo

      return matchesBusca && matchesPartido && matchesCargo
    })
  }, [parlamentares, filtros])

  // Obter partidos únicos
  const partidos = useMemo(() => {
    if (!parlamentares || !Array.isArray(parlamentares)) return []
    return Array.from(new Set(parlamentares.map(p => p?.partido).filter((p): p is string => Boolean(p))))
  }, [parlamentares])

  // Obter cargos únicos
  const cargos = useMemo(() => {
    if (!parlamentares || !Array.isArray(parlamentares)) return []
    return Array.from(new Set(parlamentares.map(p => p?.cargo).filter(Boolean)))
  }, [parlamentares])

  // Handler para excluir parlamentar
  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este parlamentar?')) {
      const sucesso = await remove(id)
      if (sucesso) {
        toast.success('Parlamentar excluído com sucesso')
        // Refetch é chamado automaticamente pelo hook
      }
    }
  }

  // Handler para reativar parlamentar
  const handleReativar = async (id: string) => {
    if (confirm('Deseja reativar este parlamentar?')) {
      const resultado = await update(id, { ativo: true })
      if (resultado) {
        toast.success('Parlamentar reativado com sucesso')
      }
    }
  }

  // Formatar cargo para exibição
  const formatarCargo = (cargo: string) => {
    const cargos: { [key: string]: string } = {
      'PRESIDENTE': 'Presidente',
      'VICE_PRESIDENTE': 'Vice-Presidente',
      'PRIMEIRO_SECRETARIO': '1º Secretário',
      'SEGUNDO_SECRETARIO': '2º Secretário',
      'VEREADOR': 'Vereador'
    }
    return cargos[cargo] || cargo
  }

  // Obter cor do badge baseada no cargo
  const getCargoBadgeColor = (cargo: string) => {
    const cores: { [key: string]: string } = {
      'PRESIDENTE': 'bg-red-100 text-red-800',
      'VICE_PRESIDENTE': 'bg-blue-100 text-blue-800',
      'PRIMEIRO_SECRETARIO': 'bg-green-100 text-green-800',
      'SEGUNDO_SECRETARIO': 'bg-yellow-100 text-yellow-800',
      'VEREADOR': 'bg-gray-100 text-gray-800'
    }
    return cores[cargo] || 'bg-gray-100 text-gray-800'
  }

  if (carregando) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-camara-primary mx-auto mb-4" />
            <p className="text-gray-600">Carregando parlamentares...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Parlamentares</h1>
          <p className="text-gray-600 mt-2">Gerencie os parlamentares da Câmara Municipal</p>
        </div>
        <Button 
          onClick={() => router.push('/admin/parlamentares/novo')}
          className="bg-camara-primary hover:bg-camara-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Parlamentar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="camara-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Parlamentares</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parlamentares.length}</div>
            <p className="text-xs text-gray-500">
              {filtros.status === 'ativos' ? 'Parlamentares ativos' :
               filtros.status === 'inativos' ? 'Parlamentares inativos' :
               'Todos os parlamentares'}
            </p>
          </CardContent>
        </Card>

        <Card className="camara-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partidos</CardTitle>
            <Building2 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partidos.length}</div>
            <p className="text-xs text-gray-500">Partidos representados</p>
          </CardContent>
        </Card>

        <Card className="camara-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mesa Diretora</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(parlamentares && Array.isArray(parlamentares) ? parlamentares.filter(p => p?.cargo !== 'VEREADOR').length : 0)}
            </div>
            <p className="text-xs text-gray-500">Membros da mesa</p>
          </CardContent>
        </Card>

        <Card className="camara-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Legislatura Atual</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {parlamentares.length > 0 ? parlamentares[0]?.legislatura || 'N/A' : 'N/A'}
            </div>
            <p className="text-xs text-gray-500">Período atual</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="camara-card mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nome ou apelido..."
                  value={filtros.busca}
                  onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Partido</label>
              <select
                value={filtros.partido}
                onChange={(e) => setFiltros(prev => ({ ...prev, partido: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-camara-primary focus:border-transparent"
              >
                <option value="Todos">Todos os Partidos</option>
                {partidos.map(partido => (
                  <option key={partido} value={partido}>{partido}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Cargo</label>
              <select
                value={filtros.cargo}
                onChange={(e) => setFiltros(prev => ({ ...prev, cargo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-camara-primary focus:border-transparent"
              >
                <option value="Todos">Todos os Cargos</option>
                {cargos.map(cargo => (
                  <option key={cargo} value={cargo}>
                    {formatarCargo(cargo)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
              <select
                value={filtros.status}
                onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value as 'ativos' | 'inativos' | 'todos' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-camara-primary focus:border-transparent"
              >
                <option value="ativos">Apenas Ativos</option>
                <option value="inativos">Apenas Inativos</option>
                <option value="todos">Todos</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setFiltros({ busca: '', partido: 'Todos', cargo: 'Todos', status: 'ativos' })}
            >
              <X className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Parlamentares */}
      <Card className="camara-card">
        <CardHeader>
          <CardTitle>Lista de Parlamentares ({parlamentaresFiltrados.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {parlamentaresFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum parlamentar encontrado com os filtros aplicados.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {parlamentaresFiltrados.map(parlamentar => {
                const isInativo = !parlamentar.ativo
                return (
                  <div
                    key={parlamentar.id}
                    className={`flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow ${isInativo ? 'bg-gray-50 opacity-75' : ''}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isInativo ? 'bg-gray-200' : 'bg-camara-primary/10'}`}>
                        <span className={`font-semibold text-lg ${isInativo ? 'text-gray-500' : 'text-camara-primary'}`}>
                          {parlamentar.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`font-semibold text-lg ${isInativo ? 'text-gray-500' : ''}`}>{parlamentar.nome}</h3>
                          {isInativo && (
                            <Badge variant="destructive" className="text-xs">
                              Inativo
                            </Badge>
                          )}
                        </div>
                        {parlamentar.apelido && <p className="text-gray-600">{parlamentar.apelido}</p>}
                        <div className="flex items-center space-x-2 mt-1">
                          {parlamentar.partido && <Badge variant="outline">{parlamentar.partido}</Badge>}
                          <Badge className={getCargoBadgeColor(parlamentar.cargo)}>
                            {formatarCargo(parlamentar.cargo)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/parlamentares/${parlamentar.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/parlamentares/editar/${parlamentar.id}`)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      {isInativo ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleReativar(parlamentar.id)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Reativar
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(parlamentar.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}