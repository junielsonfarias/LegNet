'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Search, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Award,
  Crown,
  Shield,
  FileText,
  Building,
  BarChart3,
  Eye,
  ExternalLink
} from 'lucide-react'
import { useParlamentares } from '@/lib/hooks/use-parlamentares'
import { ParlamentaresListSkeleton } from '@/components/skeletons/parlamentar-skeleton'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'

export default function ParlamentaresPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'todos' | 'mesa' | 'vereadores'>('todos')

  // Dados dos parlamentares usando hook
  const { parlamentares, loading } = useParlamentares({ ativo: true })
  const { configuracao } = useConfiguracaoInstitucional()
  const nomeCasa = configuracao.nomeCasa || 'Câmara Municipal'

  // Mesa Diretora - filtrar por cargo
  const mesaDiretora = useMemo(() => {
    return parlamentares
      .filter(p => p.cargo !== 'VEREADOR')
      .map(p => ({
        ...p,
        name: p.nome,
        role: p.cargo === 'PRESIDENTE' ? 'Presidente' : 
              p.cargo === 'VICE_PRESIDENTE' ? 'Vice-presidente' :
              p.cargo === 'PRIMEIRO_SECRETARIO' ? '1º Secretário' :
              p.cargo === 'SEGUNDO_SECRETARIO' ? '2º Secretário' : 'Vereador',
        icon: p.cargo === 'PRESIDENTE' ? Crown :
              p.cargo === 'VICE_PRESIDENTE' ? Shield :
              p.cargo === 'PRIMEIRO_SECRETARIO' ? FileText :
              p.cargo === 'SEGUNDO_SECRETARIO' ? FileText : User,
        sessions: 0, // TODO: Calcular estatísticas quando API estiver disponível
        matters: 0,
        presenca: 0,
        color: 'bg-gray-100',
        phone: p.telefone,
        email: p.email
      }))
  }, [parlamentares])

  // Vereadores
  const vereadores = useMemo(() => {
    return parlamentares
      .filter(p => p.cargo === 'VEREADOR')
      .map(p => ({
        ...p,
        name: p.nome,
        role: 'Vereador',
        icon: User,
        sessions: 0, // TODO: Calcular estatísticas quando API estiver disponível
        matters: 0,
        presenca: 0,
        color: 'bg-gray-100',
        phone: p.telefone,
        email: p.email
      }))
  }, [parlamentares])

  // Todos os parlamentares
  const todosParlamentares = useMemo((): any[] => {
    return [...mesaDiretora, ...vereadores]
  }, [mesaDiretora, vereadores])

  // Filtrar dados baseado na aba ativa
  const getActiveData = (): any[] => {
    switch (activeTab) {
      case 'mesa':
        return mesaDiretora as any[]
      case 'vereadores':
        return vereadores as any[]
      default:
        return todosParlamentares
    }
  }

  const activeData = getActiveData()

  // Filtrar por termo de busca
  const filteredData = activeData.filter(parlamentar =>
    parlamentar.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (parlamentar.apelido && parlamentar.apelido.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (parlamentar.partido && parlamentar.partido.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getCargoColor = (cargo: string) => {
    switch (cargo) {
      case 'PRESIDENTE':
        return 'bg-red-100 text-red-800'
      case 'VICE_PRESIDENTE':
        return 'bg-orange-100 text-orange-800'
      case 'PRIMEIRO_SECRETARIO':
        return 'bg-blue-100 text-blue-800'
      case 'SEGUNDO_SECRETARIO':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCargoLabel = (cargo: string) => {
    switch (cargo) {
      case 'PRESIDENTE':
        return 'Presidente'
      case 'VICE_PRESIDENTE':
        return 'Vice-Presidente'
      case 'PRIMEIRO_SECRETARIO':
        return '1º Secretário'
      case 'SEGUNDO_SECRETARIO':
        return '2º Secretário'
      case 'VEREADOR':
        return 'Vereador'
      default:
        return cargo
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <ParlamentaresListSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Users className="h-10 w-10 text-blue-600" />
            Parlamentares
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Conheça os vereadores e a Mesa Diretora da {nomeCasa}
          </p>
          <div className="flex justify-center space-x-4">
            <Button asChild variant="outline">
              <a href="/parlamentares/comparativo">
                <BarChart3 className="h-4 w-4 mr-2" />
                Comparativo de Performance
              </a>
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="camara-card">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                {todosParlamentares.length}
              </div>
              <p className="text-sm text-gray-600">Total de Parlamentares</p>
            </CardContent>
          </Card>
          <Card className="camara-card">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600">
                {mesaDiretora.length}
              </div>
              <p className="text-sm text-gray-600">Mesa Diretora</p>
            </CardContent>
          </Card>
          <Card className="camara-card">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {vereadores.length}
              </div>
              <p className="text-sm text-gray-600">Vereadores</p>
            </CardContent>
          </Card>
          <Card className="camara-card">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">
                {todosParlamentares.filter(p => p.partido).length}
              </div>
              <p className="text-sm text-gray-600">Partidos Representados</p>
            </CardContent>
          </Card>
        </div>

        {/* Navegação por Abas */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <Button
            variant={activeTab === 'todos' ? 'default' : 'outline'}
            onClick={() => setActiveTab('todos')}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Todos ({todosParlamentares.length})
          </Button>
          <Button
            variant={activeTab === 'mesa' ? 'default' : 'outline'}
            onClick={() => setActiveTab('mesa')}
            className="flex items-center gap-2"
          >
            <Crown className="h-4 w-4" />
            Mesa Diretora ({mesaDiretora.length})
          </Button>
          <Button
            variant={activeTab === 'vereadores' ? 'default' : 'outline'}
            onClick={() => setActiveTab('vereadores')}
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            Vereadores ({vereadores.length})
          </Button>
        </div>

        {/* Busca */}
        <Card className="camara-card mb-8">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar parlamentares por nome, apelido ou partido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de Parlamentares */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((parlamentar) => (
            <Card key={parlamentar.id} className="camara-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <parlamentar.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {parlamentar.nome}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {parlamentar.apelido}
                      </p>
                    </div>
                  </div>
                  <Badge className={getCargoColor(parlamentar.cargo)}>
                    {getCargoLabel(parlamentar.cargo)}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building className="h-4 w-4" />
                    {parlamentar.partido}
                  </div>
                  
                  {parlamentar.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      {parlamentar.email}
                    </div>
                  )}
                  
                  {parlamentar.telefone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      {parlamentar.telefone}
                    </div>
                  )}
                  
                  {parlamentar.gabinete && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {parlamentar.gabinete}
                    </div>
                  )}

                  {/* Estatísticas */}
                  <div className="border-t pt-3 mt-3">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold text-blue-600">
                          {parlamentar.sessions}
                        </div>
                        <div className="text-xs text-gray-500">Sessões</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-green-600">
                          {parlamentar.matters}
                        </div>
                        <div className="text-xs text-gray-500">Matérias</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-orange-600">
                          {parlamentar.presenca}%
                        </div>
                        <div className="text-xs text-gray-500">Presença</div>
                      </div>
                    </div>
                  </div>

                  {/* Legislatura */}
                  {parlamentar.legislatura && (
                    <div className="border-t pt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium text-sm">Legislatura:</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {parlamentar.legislatura}
                      </div>
                    </div>
                  )}

                  {/* Botões de Ação */}
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      asChild
                    >
                      <a href={`/parlamentares/${parlamentar.apelido?.toLowerCase().replace(/\s+/g, '-') || parlamentar.id}`}>
                        <User className="h-4 w-4 mr-1" />
                        Perfil
                      </a>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      asChild
                    >
                      <a href={`/parlamentares/${parlamentar.apelido?.toLowerCase().replace(/\s+/g, '-') || parlamentar.id}/perfil-completo`}>
                        <Eye className="h-4 w-4 mr-1" />
                        Completo
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredData.length === 0 && (
          <Card className="camara-card">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum parlamentar encontrado</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Não há parlamentares cadastrados.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
