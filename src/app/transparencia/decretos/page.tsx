'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FileText, Search, Calendar, Download, Eye, Filter, BookOpen, X } from 'lucide-react'
import Link from 'next/link'

export default function DecretosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [anoFilter, setAnoFilter] = useState<number | null>(null)

  const decretos = [
    {
      id: 1,
      numero: '245',
      ano: 2025,
      titulo: 'Regulamenta o Sistema Municipal de Trânsito',
      ementa: 'Dispõe sobre a organização e funcionamento do Sistema Municipal de Trânsito, estabelecendo normas para fiscalização e controle de tráfego.',
      data: '2025-01-15',
      status: 'VIGENTE',
      tipo: 'REGULAMENTAR',
      prefeito: 'João Silva',
      arquivo: 'decreto-245-2025.pdf'
    },
    {
      id: 2,
      numero: '244',
      ano: 2025,
      titulo: 'Declara ponto facultativo nas repartições públicas municipais',
      ementa: 'Declara ponto facultativo nas repartições públicas municipais no dia 24 de janeiro de 2025.',
      data: '2025-01-10',
      status: 'VIGENTE',
      tipo: 'ADMINISTRATIVO',
      prefeito: 'João Silva',
      arquivo: 'decreto-244-2025.pdf'
    },
    {
      id: 3,
      numero: '243',
      ano: 2024,
      titulo: 'Regulamenta a Lei Municipal nº 156/2024',
      ementa: 'Regulamenta a Lei Municipal nº 156/2024, que dispõe sobre o Plano Diretor Municipal.',
      data: '2024-12-20',
      status: 'VIGENTE',
      tipo: 'REGULAMENTAR',
      prefeito: 'João Silva',
      arquivo: 'decreto-243-2024.pdf'
    },
    {
      id: 4,
      numero: '242',
      ano: 2024,
      titulo: 'Nomeia Comissão de Licitação',
      ementa: 'Nomeia os membros da Comissão Permanente de Licitação para o exercício de 2025.',
      data: '2024-12-15',
      status: 'VIGENTE',
      tipo: 'NOMEACAO',
      prefeito: 'João Silva',
      arquivo: 'decreto-242-2024.pdf'
    },
    {
      id: 5,
      numero: '241',
      ano: 2024,
      titulo: 'Institui Grupo de Trabalho para Plano Municipal de Saneamento',
      ementa: 'Institui Grupo de Trabalho para elaboração do Plano Municipal de Saneamento Básico.',
      data: '2024-12-10',
      status: 'VIGENTE',
      tipo: 'ORGANIZACIONAL',
      prefeito: 'João Silva',
      arquivo: 'decreto-241-2024.pdf'
    },
    {
      id: 6,
      numero: '240',
      ano: 2024,
      titulo: 'Regulamenta o uso de espaços públicos para eventos',
      ementa: 'Estabelece normas para utilização de praças, parques e outros espaços públicos para realização de eventos.',
      data: '2024-12-05',
      status: 'VIGENTE',
      tipo: 'REGULAMENTAR',
      prefeito: 'João Silva',
      arquivo: 'decreto-240-2024.pdf'
    },
    {
      id: 7,
      numero: '239',
      ano: 2024,
      titulo: 'Decreta luto oficial de 3 dias',
      ementa: 'Decreta luto oficial de 3 dias pelo falecimento de cidadão ilustre do município.',
      data: '2024-11-28',
      status: 'CUMPRIDO',
      tipo: 'PROTOCOLAR',
      prefeito: 'João Silva',
      arquivo: 'decreto-239-2024.pdf'
    },
    {
      id: 8,
      numero: '238',
      ano: 2024,
      titulo: 'Abre crédito adicional suplementar',
      ementa: 'Abre crédito adicional suplementar no valor de R$ 500.000,00 para atender despesas com saúde.',
      data: '2024-11-20',
      status: 'VIGENTE',
      tipo: 'FINANCEIRO',
      prefeito: 'João Silva',
      arquivo: 'decreto-238-2024.pdf'
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VIGENTE':
        return <Badge className="bg-green-100 text-green-800">Vigente</Badge>
      case 'REVOGADO':
        return <Badge className="bg-red-100 text-red-800">Revogado</Badge>
      case 'CUMPRIDO':
        return <Badge className="bg-blue-100 text-blue-800">Cumprido</Badge>
      case 'SUSPENSO':
        return <Badge className="bg-yellow-100 text-yellow-800">Suspenso</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const getTipoBadge = (tipo: string) => {
    const tipoColors: Record<string, string> = {
      REGULAMENTAR: 'bg-blue-100 text-blue-800',
      ADMINISTRATIVO: 'bg-purple-100 text-purple-800',
      NOMEACAO: 'bg-indigo-100 text-indigo-800',
      ORGANIZACIONAL: 'bg-pink-100 text-pink-800',
      PROTOCOLAR: 'bg-gray-100 text-gray-800',
      FINANCEIRO: 'bg-green-100 text-green-800'
    }
    return <Badge className={tipoColors[tipo] || 'bg-gray-100 text-gray-800'}>{tipo}</Badge>
  }

  const filteredDecretos = decretos.filter(decreto => {
    const matchesSearch = decreto.numero.includes(searchTerm) || 
                         decreto.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         decreto.ementa.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !statusFilter || decreto.status === statusFilter
    const matchesAno = !anoFilter || decreto.ano === anoFilter

    return matchesSearch && matchesStatus && matchesAno
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Decretos Municipais
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Consulte todos os decretos expedidos pelo Poder Executivo Municipal. 
            Decretos regulamentam leis e organizam a administração pública.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="camara-card text-center">
            <CardContent className="p-6">
              <FileText className="h-12 w-12 text-camara-primary mx-auto mb-3" />
              <div className="text-3xl font-bold text-camara-primary mb-2">245</div>
              <div className="text-sm text-gray-600">Decretos Expedidos</div>
            </CardContent>
          </Card>
          
          <Card className="camara-card text-center">
            <CardContent className="p-6">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✓</span>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">220</div>
              <div className="text-sm text-gray-600">Vigentes</div>
            </CardContent>
          </Card>
          
          <Card className="camara-card text-center">
            <CardContent className="p-6">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✗</span>
              </div>
              <div className="text-3xl font-bold text-red-600 mb-2">25</div>
              <div className="text-sm text-gray-600">Revogados</div>
            </CardContent>
          </Card>
          
          <Card className="camara-card text-center">
            <CardContent className="p-6">
              <Calendar className="h-12 w-12 text-camara-accent mx-auto mb-3" />
              <div className="text-3xl font-bold text-camara-accent mb-2">2</div>
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
                      placeholder="Buscar decretos por número, título ou ementa..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={statusFilter === null ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setStatusFilter(null)}
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
                    variant={statusFilter === 'REVOGADO' ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setStatusFilter(statusFilter === 'REVOGADO' ? null : 'REVOGADO')}
                  >
                    Revogados
                  </Button>
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
                  
                  {(statusFilter || anoFilter || searchTerm) && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setStatusFilter(null)
                        setAnoFilter(null)
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
          Encontrados {filteredDecretos.length} decreto(s)
        </div>

        <div className="space-y-6">
          {filteredDecretos.map((decreto) => (
            <Card key={decreto.id} className="camara-card hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <CardTitle className="text-xl font-semibold text-gray-900">
                        Decreto nº {decreto.numero}/{decreto.ano}
                      </CardTitle>
                      {getStatusBadge(decreto.status)}
                      {getTipoBadge(decreto.tipo)}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      {decreto.titulo}
                    </h2>
                    <p className="text-gray-700 mb-4">
                      {decreto.ementa}
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
                            {new Date(decreto.data).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">Prefeito:</span>
                          <span className="font-medium">{decreto.prefeito}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <BookOpen className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">Tipo:</span>
                          <span className="font-medium">{decreto.tipo}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                      <div className={`border rounded-lg p-3 ${
                        decreto.status === 'VIGENTE' ? 'bg-green-50 border-green-200' :
                        decreto.status === 'CUMPRIDO' ? 'bg-blue-50 border-blue-200' :
                        'bg-gray-50 border-gray-200'
                      }`}>
                        <p className={`text-sm ${
                          decreto.status === 'VIGENTE' ? 'text-green-800' :
                          decreto.status === 'CUMPRIDO' ? 'text-blue-800' :
                          'text-gray-800'
                        }`}>
                          {decreto.status === 'VIGENTE' && 'Este decreto está em vigor e deve ser cumprido.'}
                          {decreto.status === 'CUMPRIDO' && 'Este decreto teve seu objetivo cumprido.'}
                          {decreto.status === 'REVOGADO' && 'Este decreto foi revogado e não está mais em vigor.'}
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

        {filteredDecretos.length === 0 && (
          <Card className="camara-card">
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum decreto encontrado
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
                Sobre os Decretos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">O que são Decretos?</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• São atos administrativos expedidos pelo Prefeito</li>
                    <li>• Regulamentam leis ou organizam a administração</li>
                    <li>• Não podem criar obrigações ou direitos novos</li>
                    <li>• Têm força normativa dentro de sua competência</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Tipos de Decretos</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• <strong>Regulamentar:</strong> Regulamenta leis municipais</li>
                    <li>• <strong>Administrativo:</strong> Organiza a administração</li>
                    <li>• <strong>Nomeação:</strong> Nomeia servidores e comissões</li>
                    <li>• <strong>Financeiro:</strong> Trata de questões orçamentárias</li>
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
              <Link href="/transparencia/portarias">
                <BookOpen className="h-5 w-5 mr-2" />
                Ver Portarias
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
