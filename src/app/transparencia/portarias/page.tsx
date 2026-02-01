'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FileText, Search, Calendar, Download, Eye, Filter, BookOpen, User, Loader2, RefreshCw, X, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'
import { toast } from 'sonner'

// Interface para publicação da API
interface PublicacaoPortaria {
  id: string
  titulo: string
  descricao: string | null
  tipo: string
  numero: string | null
  ano: number
  data: string
  conteudo: string
  arquivo: string | null
  publicada: boolean
  visualizacoes: number
  categoria: {
    id: string
    nome: string
  } | null
  autor: {
    tipo: string
    nome: string
  }
}

export default function PortariasPage() {
  const { configuracao } = useConfiguracaoInstitucional()
  const [portarias, setPortarias] = useState<PublicacaoPortaria[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [anoFilter, setAnoFilter] = useState<number | null>(null)

  // Carregar portarias da API pública
  const fetchPortarias = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dados-abertos/publicacoes?tipo=PORTARIA&limit=100')
      const result = await response.json()

      if (result.dados) {
        console.log('Portarias carregadas:', result.dados.length)
        setPortarias(result.dados)
      } else {
        console.error('Formato de resposta inesperado:', result)
        setPortarias([])
      }
    } catch (error) {
      console.error('Erro ao carregar portarias:', error)
      toast.error('Erro ao carregar portarias')
      setPortarias([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPortarias()
  }, [])

  // Anos únicos
  const anos = useMemo(() =>
    Array.from(new Set(portarias.map(p => p.ano))).sort((a, b) => b - a),
    [portarias]
  )

  // Estatísticas calculadas
  const estatisticas = useMemo(() => ({
    total: portarias.length,
    vigentes: portarias.filter(p => p.publicada).length,
    anoAtual: portarias.filter(p => p.ano === new Date().getFullYear()).length
  }), [portarias])

  // Filtrar portarias
  const filteredPortarias = useMemo(() => {
    return portarias.filter(p => {
      const matchesSearch = !searchTerm ||
        p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.descricao && p.descricao.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.numero && p.numero.includes(searchTerm))

      const matchesAno = !anoFilter || p.ano === anoFilter

      return matchesSearch && matchesAno
    })
  }, [portarias, searchTerm, anoFilter])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Portarias da Câmara
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Consulte todas as portarias expedidas pela {configuracao?.nomeCasa || 'Câmara Municipal'}.
            Portarias tratam de atos administrativos internos e nomeações.
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="camara-card text-center">
            <CardContent className="p-6">
              <User className="h-12 w-12 text-camara-primary mx-auto mb-3" />
              <div className="text-3xl font-bold text-camara-primary mb-2">{estatisticas.total}</div>
              <div className="text-sm text-gray-600">Portarias Publicadas</div>
            </CardContent>
          </Card>

          <Card className="camara-card text-center">
            <CardContent className="p-6">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✓</span>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">{estatisticas.vigentes}</div>
              <div className="text-sm text-gray-600">Vigentes</div>
            </CardContent>
          </Card>

          <Card className="camara-card text-center">
            <CardContent className="p-6">
              <Calendar className="h-12 w-12 text-camara-accent mx-auto mb-3" />
              <div className="text-3xl font-bold text-camara-accent mb-2">{estatisticas.anoAtual}</div>
              <div className="text-sm text-gray-600">Este Ano</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <div className="mb-8">
          <Card className="camara-card">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar portarias por número, título ou ementa..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={fetchPortarias}
                    disabled={loading}
                    title="Recarregar"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={!anoFilter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAnoFilter(null)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Todas
                  </Button>

                  {anos.map(ano => (
                    <Button
                      key={ano}
                      variant={anoFilter === ano ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAnoFilter(anoFilter === ano ? null : ano)}
                    >
                      {ano}
                    </Button>
                  ))}

                  {(anoFilter || searchTerm) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAnoFilter(null)
                        setSearchTerm('')
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpar
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

        {/* Lista de Portarias */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Carregando portarias...</span>
          </div>
        ) : filteredPortarias.length === 0 ? (
          <Card className="camara-card">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhuma portaria encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || anoFilter
                  ? 'Tente ajustar os filtros ou realizar uma nova busca.'
                  : 'As portarias ainda não foram cadastradas no sistema.'}
              </p>
              <p className="text-sm text-gray-500">
                Você pode consultar as leis municipais em{' '}
                <Link href="/transparencia/leis" className="text-blue-600 hover:underline">
                  Leis
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredPortarias.map((portaria) => (
              <Card key={portaria.id} className="camara-card hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CardTitle className="text-xl font-semibold text-gray-900">
                          Portaria Nº {portaria.numero}/{portaria.ano}
                        </CardTitle>
                        <Badge className="bg-green-100 text-green-800">Vigente</Badge>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">
                        {portaria.titulo}
                      </h2>
                      {portaria.descricao && (
                        <p className="text-gray-700 mb-4 line-clamp-2">
                          {portaria.descricao}
                        </p>
                      )}
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
                            <span className="text-gray-600">Expedida por:</span>
                            <span className="font-medium">{portaria.autor.nome}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Eye className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">Visualizações:</span>
                            <span className="font-medium">{portaria.visualizacoes}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm text-green-800">
                            Esta portaria está em vigor e produz efeitos
                            no âmbito administrativo da Câmara.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Ações</h3>
                        <div className="space-y-2">
                          {portaria.arquivo && (
                            <Button asChild variant="outline" size="sm" className="w-full">
                              <a href={portaria.arquivo} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Informações */}
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

        {/* Ações */}
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
