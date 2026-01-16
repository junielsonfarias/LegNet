'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Settings, 
  Edit, 
  Save, 
  X,
  Eye,
  EyeOff,
  Building,
  Users,
  Calendar,
  FileText,
  Shield,
  Newspaper,
  DollarSign,
  Gavel
} from 'lucide-react'

// Dados mock dos módulos
const mockModulos = [
  {
    id: 'institucional',
    nome: 'Institucional',
    descricao: 'Páginas institucionais da Câmara',
    icone: Building,
    ativo: true,
    paginas: [
      { nome: 'Sobre a Câmara', url: '/institucional/sobre', ativo: true },
      { nome: 'Código de Ética', url: '/institucional/codigo-etica', ativo: true },
      { nome: 'Dicionário Legislativo', url: '/institucional/dicionario', ativo: true },
      { nome: 'E-SIC', url: '/institucional/e-sic', ativo: true },
      { nome: 'Lei Orgânica', url: '/institucional/lei-organica', ativo: true },
      { nome: 'Ouvidoria', url: '/institucional/ouvidoria', ativo: true },
      { nome: 'Papel do Vereador', url: '/institucional/papel-vereador', ativo: true },
      { nome: 'Papel da Câmara', url: '/institucional/papel-camara', ativo: true },
      { nome: 'Regimento Interno', url: '/institucional/regimento', ativo: true }
    ]
  },
  {
    id: 'parlamentares',
    nome: 'Parlamentares',
    descricao: 'Informações sobre vereadores e mesa diretora',
    icone: Users,
    ativo: true,
    paginas: [
      { nome: 'Vereadores', url: '/parlamentares', ativo: true },
      { nome: 'Galeria de Vereadores', url: '/parlamentares/galeria', ativo: true },
      { nome: 'Mesa Diretora', url: '/parlamentares/mesa-diretora', ativo: true }
    ]
  },
  {
    id: 'legislativo',
    nome: 'Legislativo',
    descricao: 'Atividades legislativas e sessões',
    icone: Calendar,
    ativo: true,
    paginas: [
      { nome: 'Sessões', url: '/legislativo/sessoes', ativo: true },
      { nome: 'Proposições e Matérias', url: '/legislativo/proposicoes', ativo: true },
      { nome: 'Comissões', url: '/legislativo/comissoes', ativo: true },
      { nome: 'Atas de Sessões', url: '/legislativo/atas', ativo: true },
      { nome: 'Legislatura', url: '/legislativo/legislatura', ativo: true }
    ]
  },
  {
    id: 'transparencia',
    nome: 'Transparência',
    descricao: 'Portal da transparência e gestão fiscal',
    icone: Shield,
    ativo: true,
    paginas: [
      { nome: 'Portal da Transparência', url: '/transparencia', ativo: true },
      { nome: 'Gestão Fiscal', url: '/transparencia/gestao-fiscal', ativo: true },
      { nome: 'Licitações', url: '/transparencia/licitacoes', ativo: true },
      { nome: 'Publicações', url: '/transparencia/publicacoes', ativo: true },
      { nome: 'Leis', url: '/transparencia/leis', ativo: true },
      { nome: 'Decretos', url: '/transparencia/decretos', ativo: true },
      { nome: 'Portarias', url: '/transparencia/portarias', ativo: true }
    ]
  },
  {
    id: 'noticias',
    nome: 'Notícias',
    descricao: 'Sistema de notícias e comunicação',
    icone: Newspaper,
    ativo: true,
    paginas: [
      { nome: 'Notícias', url: '/noticias', ativo: true }
    ]
  },
  {
    id: 'servicos',
    nome: 'Serviços',
    descricao: 'Serviços online e informativos',
    icone: Gavel,
    ativo: false,
    paginas: [
      { nome: 'Contra Cheque Online', url: '/servicos/contra-cheque', ativo: false },
      { nome: 'Vídeos', url: '/videos', ativo: false }
    ]
  }
]

export default function ModulosAdminPage() {
  const [modulos, setModulos] = useState(mockModulos)
  const [editingModulo, setEditingModulo] = useState<string | null>(null)
  const [editingPagina, setEditingPagina] = useState<{moduloId: string, paginaIndex: number} | null>(null)

  const toggleModulo = (moduloId: string) => {
    setModulos(prev => prev.map(modulo => 
      modulo.id === moduloId 
        ? { ...modulo, ativo: !modulo.ativo }
        : modulo
    ))
  }

  const togglePagina = (moduloId: string, paginaIndex: number) => {
    setModulos(prev => prev.map(modulo => 
      modulo.id === moduloId 
        ? {
            ...modulo,
            paginas: modulo.paginas.map((pagina, index) => 
              index === paginaIndex 
                ? { ...pagina, ativo: !pagina.ativo }
                : pagina
            )
          }
        : modulo
    ))
  }

  const updatePagina = (moduloId: string, paginaIndex: number, field: string, value: string) => {
    setModulos(prev => prev.map(modulo => 
      modulo.id === moduloId 
        ? {
            ...modulo,
            paginas: modulo.paginas.map((pagina, index) => 
              index === paginaIndex 
                ? { ...pagina, [field]: value }
                : pagina
            )
          }
        : modulo
    ))
  }

  const getStatusColor = (ativo: boolean) => {
    return ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const getStatusLabel = (ativo: boolean) => {
    return ativo ? 'Ativo' : 'Inativo'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-8 w-8 text-blue-600" />
            Gerenciar Módulos
          </h1>
          <p className="text-gray-600 mt-1">
            Ative/desative módulos e configure páginas do portal
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Salvar Configurações
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {modulos.length}
            </div>
            <p className="text-sm text-gray-600">Total de Módulos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {modulos.filter(m => m.ativo).length}
            </div>
            <p className="text-sm text-gray-600">Módulos Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {modulos.reduce((acc, m) => acc + m.paginas.length, 0)}
            </div>
            <p className="text-sm text-gray-600">Total de Páginas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {modulos.reduce((acc, m) => acc + m.paginas.filter(p => p.ativo).length, 0)}
            </div>
            <p className="text-sm text-gray-600">Páginas Ativas</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Módulos */}
      <div className="space-y-6">
        {modulos.map((modulo) => {
          const Icon = modulo.icone
          return (
            <Card key={modulo.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{modulo.nome}</CardTitle>
                      <p className="text-gray-600 mt-1">{modulo.descricao}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusColor(modulo.ativo)}>
                      {getStatusLabel(modulo.ativo)}
                    </Badge>
                    <Switch
                      checked={modulo.ativo}
                      onCheckedChange={() => toggleModulo(modulo.id)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingModulo(
                        editingModulo === modulo.id ? null : modulo.id
                      )}
                    >
                      {editingModulo === modulo.id ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">
                    Páginas do Módulo ({modulo.paginas.filter(p => p.ativo).length}/{modulo.paginas.length} ativas)
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {modulo.paginas.map((pagina, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{pagina.nome}</span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getStatusColor(pagina.ativo)}`}
                            >
                              {getStatusLabel(pagina.ativo)}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{pagina.url}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={pagina.ativo}
                            onCheckedChange={() => togglePagina(modulo.id, index)}
                            disabled={!modulo.ativo}
                          />
                          {editingModulo === modulo.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingPagina(
                                editingPagina?.moduloId === modulo.id && editingPagina?.paginaIndex === index 
                                  ? null 
                                  : { moduloId: modulo.id, paginaIndex: index }
                              )}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Formulário de Edição de Página */}
                  {editingPagina?.moduloId === modulo.id && (
                    <Card className="mt-4 bg-gray-50">
                      <CardContent className="p-4">
                        <h5 className="font-semibold mb-3">Editar Página</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="nome">Nome da Página</Label>
                            <Input
                              id="nome"
                              value={modulo.paginas[editingPagina.paginaIndex].nome}
                              onChange={(e) => updatePagina(modulo.id, editingPagina.paginaIndex, 'nome', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="url">URL</Label>
                            <Input
                              id="url"
                              value={modulo.paginas[editingPagina.paginaIndex].url}
                              onChange={(e) => updatePagina(modulo.id, editingPagina.paginaIndex, 'url', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm">
                            <Save className="h-3 w-3 mr-1" />
                            Salvar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingPagina(null)}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancelar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Informações sobre Módulos */}
      <Card>
        <CardHeader>
          <CardTitle>Sobre o Sistema de Módulos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Ativação de Módulos</h4>
              <p className="text-sm text-gray-700">
                Ative ou desative módulos inteiros. Quando um módulo está inativo, 
                todas as suas páginas ficam inacessíveis no portal público.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Ativação de Páginas</h4>
              <p className="text-sm text-gray-700">
                Controle individual de cada página. Páginas inativas não aparecem 
                no menu de navegação e não são acessíveis.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Edição de Páginas</h4>
              <p className="text-sm text-gray-700">
                Edite o nome e URL de cada página. As alterações são aplicadas 
                imediatamente no portal público.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Configuração</h4>
              <p className="text-sm text-gray-700">
                Use o botão &quot;Salvar Configurações&quot; para persistir todas as 
                alterações no sistema.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
