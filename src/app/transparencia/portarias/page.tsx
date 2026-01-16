'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FileText, Search, Calendar, Download, Eye, Filter, BookOpen, X, User } from 'lucide-react'
import Link from 'next/link'

export default function PortariasPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [anoFilter, setAnoFilter] = useState<number | null>(null)
  const [tipoFilter, setTipoFilter] = useState<string | null>(null)

  const portarias = [
    {
      id: 1,
      numero: '089',
      ano: 2025,
      titulo: 'Nomeia Assessor Especial do Gabinete',
      ementa: 'Nomeia o Sr. Carlos Alberto da Silva para o cargo de Assessor Especial do Gabinete do Prefeito.',
      data: '2025-01-18',
      status: 'VIGENTE',
      tipo: 'NOMEACAO',
      secretaria: 'Gabinete do Prefeito',
      arquivo: 'portaria-089-2025.pdf'
    },
    {
      id: 2,
      numero: '088',
      ano: 2025,
      titulo: 'Designa Servidora para Função de Confiança',
      ementa: 'Designa a servidora Maria Santos para exercer a função de Coordenadora de Projetos Especiais.',
      data: '2025-01-15',
      status: 'VIGENTE',
      tipo: 'DESIGNACAO',
      secretaria: 'Secretaria de Planejamento',
      arquivo: 'portaria-088-2025.pdf'
    },
    {
      id: 3,
      numero: '087',
      ano: 2025,
      titulo: 'Institui Comissão de Sindicância',
      ementa: 'Institui comissão de sindicância para apurar irregularidades em processo administrativo.',
      data: '2025-01-12',
      status: 'VIGENTE',
      tipo: 'ORGANIZACIONAL',
      secretaria: 'Controladoria Geral',
      arquivo: 'portaria-087-2025.pdf'
    },
    {
      id: 4,
      numero: '086',
      ano: 2025,
      titulo: 'Concede Férias ao Servidor',
      ementa: 'Concede 30 dias de férias ao servidor João Oliveira, Matrícula 12345.',
      data: '2025-01-10',
      status: 'VIGENTE',
      tipo: 'PESSOAL',
      secretaria: 'Secretaria de Administração',
      arquivo: 'portaria-086-2025.pdf'
    },
    {
      id: 5,
      numero: '085',
      ano: 2025,
      titulo: 'Dispensa Servidora de Função Comissionada',
      ementa: 'Dispensa a servidora Ana Paula Costa do cargo de Diretora de Recursos Humanos.',
      data: '2025-01-08',
      status: 'VIGENTE',
      tipo: 'DISPENSA',
      secretaria: 'Secretaria de Administração',
      arquivo: 'portaria-085-2025.pdf'
    },
    {
      id: 6,
      numero: '084',
      ano: 2024,
      titulo: 'Cria Grupo de Trabalho para Revisão do Plano de Cargos',
      ementa: 'Cria grupo de trabalho para revisão do Plano de Cargos, Carreiras e Salários do município.',
      data: '2024-12-28',
      status: 'VIGENTE',
      tipo: 'ORGANIZACIONAL',
      secretaria: 'Secretaria de Administração',
      arquivo: 'portaria-084-2024.pdf'
    },
    {
      id: 7,
      numero: '083',
      ano: 2024,
      titulo: 'Autoriza Realização de Concurso Público',
      ementa: 'Autoriza a realização de concurso público para provimento de cargos efetivos na administração municipal.',
      data: '2024-12-20',
      status: 'VIGENTE',
      tipo: 'ADMINISTRATIVO',
      secretaria: 'Secretaria de Administração',
      arquivo: 'portaria-083-2024.pdf'
    },
    {
      id: 8,
      numero: '082',
      ano: 2024,
      titulo: 'Estabelece Horário de Funcionamento no Período de Recesso',
      ementa: 'Estabelece horário especial de funcionamento das repartições públicas durante o recesso de final de ano.',
      data: '2024-12-15',
      status: 'CUMPRIDA',
      tipo: 'ADMINISTRATIVO',
      secretaria: 'Gabinete do Prefeito',
      arquivo: 'portaria-082-2024.pdf'
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VIGENTE':
        return <Badge className="bg-green-100 text-green-800">Vigente</Badge>
      case 'REVOGADA':
        return <Badge className="bg-red-100 text-red-800">Revogada</Badge>
      case 'CUMPRIDA':
        return <Badge className="bg-blue-100 text-blue-800">Cumprida</Badge>
      case 'SUSPENSA':
        return <Badge className="bg-yellow-100 text-yellow-800">Suspensa</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const getTipoBadge = (tipo: string) => {
    const tipoColors: Record<string, string> = {
      NOMEACAO: 'bg-indigo-100 text-indigo-800',
      DESIGNACAO: 'bg-purple-100 text-purple-800',
      DISPENSA: 'bg-orange-100 text-orange-800',
      PESSOAL: 'bg-pink-100 text-pink-800',
      ORGANIZACIONAL: 'bg-blue-100 text-blue-800',
      ADMINISTRATIVO: 'bg-cyan-100 text-cyan-800'
    }
    return <Badge className={tipoColors[tipo] || 'bg-gray-100 text-gray-800'}>{tipo}</Badge>
  }

  const filteredPortarias = portarias.filter(portaria => {
    const matchesSearch = portaria.numero.includes(searchTerm) || 
                         portaria.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         portaria.ementa.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !statusFilter || portaria.status === statusFilter
    const matchesAno = !anoFilter || portaria.ano === anoFilter
    const matchesTipo = !tipoFilter || portaria.tipo === tipoFilter

    return matchesSearch && matchesStatus && matchesAno && matchesTipo
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Portarias Municipais
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Consulte todas as portarias expedidas pela administração municipal. 
            Portarias tratam de atos administrativos internos e nomeações.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="camara-card text-center">
            <CardContent className="p-6">
              <User className="h-12 w-12 text-camara-primary mx-auto mb-3" />
              <div className="text-3xl font-bold text-camara-primary mb-2">89</div>
              <div className="text-sm text-gray-600">Portarias Expedidas</div>
            </CardContent>
          </Card>
          
          <Card className="camara-card text-center">
            <CardContent className="p-6">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✓</span>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">82</div>
              <div className="text-sm text-gray-600">Vigentes</div>
            </CardContent>
          </Card>
          
          <Card className="camara-card text-center">
            <CardContent className="p-6">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✓</span>
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">7</div>
              <div className="text-sm text-gray-600">Cumpridas</div>
            </CardContent>
          </Card>
          
          <Card className="camara-card text-center">
            <CardContent className="p-6">
              <Calendar className="h-12 w-12 text-camara-accent mx-auto mb-3" />
              <div className="text-3xl font-bold text-camara-accent mb-2">5</div>
              <div className="text-sm text-gray-600">Este Mês</div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <Card className="camara-card">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar portarias por número, título ou ementa..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={!statusFilter && !anoFilter && !tipoFilter ? "default" : "outline"} 
                    size="sm"
                    onClick={() => {
                      setStatusFilter(null)
                      setAnoFilter(null)
                      setTipoFilter(null)
                    }}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Todos
                  </Button>
                  
                  <Button 
                    variant={statusFilter === 'VIGENTE' ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setStatusFilter(statusFilter === 'VIGENTE' ? null : 'VIGENTE')}
                  >
                    Vigentes
                  </Button>
                  <Button 
                    variant={statusFilter === 'CUMPRIDA' ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setStatusFilter(statusFilter === 'CUMPRIDA' ? null : 'CUMPRIDA')}
                  >
                    Cumpridas
                  </Button>
                  
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  
                  <Button 
                    variant={tipoFilter === 'NOMEACAO' ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setTipoFilter(tipoFilter === 'NOMEACAO' ? null : 'NOMEACAO')}
                  >
                    Nomeações
                  </Button>
                  <Button 
                    variant={tipoFilter === 'DESIGNACAO' ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setTipoFilter(tipoFilter === 'DESIGNACAO' ? null : 'DESIGNACAO')}
                  >
                    Designações
                  </Button>
                  <Button 
                    variant={tipoFilter === 'ORGANIZACIONAL' ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setTipoFilter(tipoFilter === 'ORGANIZACIONAL' ? null : 'ORGANIZACIONAL')}
                  >
                    Organizacional
                  </Button>
                  
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  
                  <Button 
                    variant={anoFilter === 2025 ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setAnoFilter(anoFilter === 2025 ? null : 2025)}
                  >
                    2025
                  </Button>
                  <Button 
                    variant={anoFilter === 2024 ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setAnoFilter(anoFilter === 2024 ? null : 2024)}
                  >
                    2024
                  </Button>
                  
                  {(statusFilter || anoFilter || tipoFilter || searchTerm) && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setStatusFilter(null)
                        setAnoFilter(null)
                        setTipoFilter(null)
                        setSearchTerm('')
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpar Filtros
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-4 text-sm text-gray-600">
          Encontradas {filteredPortarias.length} portaria(s)
        </div>

        <div className="space-y-6">
          {filteredPortarias.map((portaria) => (
            <Card key={portaria.id} className="camara-card hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <CardTitle className="text-xl font-semibold text-gray-900">
                        Portaria nº {portaria.numero}/{portaria.ano}
                      </CardTitle>
                      {getStatusBadge(portaria.status)}
                      {getTipoBadge(portaria.tipo)}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      {portaria.titulo}
                    </h2>
                    <p className="text-gray-700 mb-4">
                      {portaria.ementa}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Informações</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">Data:</span>
                          <span className="font-medium">
                            {new Date(portaria.data).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">Secretaria:</span>
                          <span className="font-medium text-xs">{portaria.secretaria}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <BookOpen className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">Tipo:</span>
                          <span className="font-medium">{portaria.tipo}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                      <div className={`border rounded-lg p-3 ${
                        portaria.status === 'VIGENTE' ? 'bg-green-50 border-green-200' :
                        portaria.status === 'CUMPRIDA' ? 'bg-blue-50 border-blue-200' :
                        'bg-gray-50 border-gray-200'
                      }`}>
                        <p className={`text-sm ${
                          portaria.status === 'VIGENTE' ? 'text-green-800' :
                          portaria.status === 'CUMPRIDA' ? 'text-blue-800' :
                          'text-gray-800'
                        }`}>
                          {portaria.status === 'VIGENTE' && 'Esta portaria está em vigor e produz efeitos.'}
                          {portaria.status === 'CUMPRIDA' && 'Esta portaria teve seu objetivo cumprido.'}
                          {portaria.status === 'REVOGADA' && 'Esta portaria foi revogada e não está mais em vigor.'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Ações</h3>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Texto Completo
                        </Button>
                        
                        <Button variant="outline" size="sm" className="w-full">
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPortarias.length === 0 && (
          <Card className="camara-card">
            <CardContent className="p-12 text-center">
              <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhuma portaria encontrada
              </h3>
              <p className="text-gray-600">
                Tente ajustar os filtros ou realizar uma nova busca
              </p>
            </CardContent>
          </Card>
        )}

        <div className="mt-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary">
                Sobre as Portarias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">O que são Portarias?</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• São atos administrativos internos da administração</li>
                    <li>• Expedidas por autoridades administrativas</li>
                    <li>• Tratam de nomeações, designações e organizações internas</li>
                    <li>• Produzem efeitos no âmbito administrativo</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Tipos de Portarias</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• <strong>Nomeação:</strong> Nomeia servidores para cargos</li>
                    <li>• <strong>Designação:</strong> Designa para funções específicas</li>
                    <li>• <strong>Pessoal:</strong> Trata de questões de pessoal</li>
                    <li>• <strong>Organizacional:</strong> Organiza comissões e grupos</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="camara-button">
              <Link href="/transparencia/leis">
                <FileText className="h-5 w-5 mr-2" />
                Ver Leis
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-camara-primary text-camara-primary hover:bg-camara-primary hover:text-white">
              <Link href="/transparencia/decretos">
                <BookOpen className="h-5 w-5 mr-2" />
                Ver Decretos
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
