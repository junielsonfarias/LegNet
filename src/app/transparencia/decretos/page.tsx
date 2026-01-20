'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FileText, Search, Calendar, Download, Eye, Filter, BookOpen, Loader2, RefreshCw, X, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { PDFModal } from '@/components/pdf'

// Interface para publicação da API
interface PublicacaoDecreto {
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

export default function DecretosPage() {
  const [decretos, setDecretos] = useState<PublicacaoDecreto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [anoFilter, setAnoFilter] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [pdfModal, setPdfModal] = useState<{ isOpen: boolean; url: string; titulo: string }>({
    isOpen: false,
    url: '',
    titulo: ''
  })

  const isPdf = (arquivo: string | null | undefined) => {
    if (!arquivo) return false
    return arquivo.toLowerCase().endsWith('.pdf')
  }

  const abrirPdf = (url: string, titulo: string) => {
    setPdfModal({ isOpen: true, url, titulo })
  }

  const fecharPdf = () => {
    setPdfModal({ isOpen: false, url: '', titulo: '' })
  }

  // Carregar decretos da API pública
  const fetchDecretos = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dados-abertos/publicacoes?tipo=DECRETO&limit=100')
      const result = await response.json()

      if (result.dados) {
        console.log('Decretos carregados:', result.dados.length)
        setDecretos(result.dados)
      } else {
        console.error('Formato de resposta inesperado:', result)
        setDecretos([])
      }
    } catch (error) {
      console.error('Erro ao carregar decretos:', error)
      toast.error('Erro ao carregar decretos')
      setDecretos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDecretos()
  }, [])

  // Anos únicos
  const anos = useMemo(() =>
    Array.from(new Set(decretos.map(d => d.ano))).sort((a, b) => b - a),
    [decretos]
  )

  // Estatísticas calculadas
  const estatisticas = useMemo(() => ({
    total: decretos.length,
    vigentes: decretos.filter(d => d.publicada).length,
    anoAtual: decretos.filter(d => d.ano === new Date().getFullYear()).length
  }), [decretos])

  // Filtrar decretos
  const filteredDecretos = useMemo(() => {
    return decretos.filter(d => {
      const matchesSearch = !searchTerm ||
        d.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.descricao && d.descricao.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.numero && d.numero.includes(searchTerm))

      const matchesAno = !anoFilter || d.ano === anoFilter

      return matchesSearch && matchesAno
    })
  }, [decretos, searchTerm, anoFilter])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Decretos Legislativos
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Consulte todos os decretos legislativos da Câmara Municipal de Mojuí dos Campos.
            Decretos legislativos são atos normativos de competência exclusiva do Legislativo.
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="camara-card text-center">
            <CardContent className="p-6">
              <FileText className="h-12 w-12 text-camara-primary mx-auto mb-3" />
              <div className="text-3xl font-bold text-camara-primary mb-2">{estatisticas.total}</div>
              <div className="text-sm text-gray-600">Decretos Publicados</div>
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
                      placeholder="Buscar decretos por número, título ou ementa..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={fetchDecretos}
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
                    Todos
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
          Encontrados {filteredDecretos.length} decreto(s)
        </div>

        {/* Lista de Decretos */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Carregando decretos...</span>
          </div>
        ) : filteredDecretos.length === 0 ? (
          <Card className="camara-card">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum decreto encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || anoFilter
                  ? 'Tente ajustar os filtros ou realizar uma nova busca.'
                  : 'Os decretos legislativos ainda não foram cadastrados no sistema.'}
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
            {filteredDecretos.map((decreto) => (
              <Card key={decreto.id} className="camara-card hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CardTitle className="text-xl font-semibold text-gray-900">
                          Decreto Legislativo nº {decreto.numero}/{decreto.ano}
                        </CardTitle>
                        <Badge className="bg-green-100 text-green-800">Vigente</Badge>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">
                        {decreto.titulo}
                      </h2>
                      {decreto.descricao && (
                        <p className="text-gray-700 mb-4 line-clamp-2">
                          {decreto.descricao}
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
                              {new Date(decreto.data).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">Autor:</span>
                            <span className="font-medium">{decreto.autor.nome}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Eye className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">Visualizações:</span>
                            <span className="font-medium">{decreto.visualizacoes}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm text-green-800">
                            Este decreto legislativo está em vigor e deve ser observado
                            conforme sua matéria de competência.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Ações</h3>
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => setExpandedId(expandedId === decreto.id ? null : decreto.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {expandedId === decreto.id ? 'Ocultar Conteúdo' : 'Visualizar Conteúdo'}
                          </Button>
                          {decreto.arquivo && (
                            <>
                              {isPdf(decreto.arquivo) && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => abrirPdf(decreto.arquivo!, `Decreto nº ${decreto.numero}/${decreto.ano}`)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Visualizar PDF
                                </Button>
                              )}
                              <Button asChild variant="outline" size="sm" className="w-full">
                                <a href={decreto.arquivo} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download PDF
                                </a>
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Conteúdo expandido */}
                  {expandedId === decreto.id && decreto.conteudo && (
                    <div className="border-t mt-6 pt-6 bg-gray-50 -mx-6 -mb-6 px-6 pb-6 rounded-b-lg">
                      <h3 className="font-semibold text-gray-900 mb-3">Conteúdo do Decreto</h3>
                      <div className="prose max-w-none text-sm text-gray-700 whitespace-pre-wrap bg-white p-4 rounded-lg border">
                        {decreto.conteudo}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Informações Legais */}
        <div className="mt-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary">
                Sobre os Decretos Legislativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">O que são Decretos Legislativos?</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• São atos normativos de competência exclusiva do Legislativo</li>
                    <li>• Não dependem de sanção do Executivo</li>
                    <li>• Regulam matérias de competência exclusiva da Câmara</li>
                    <li>• Têm força de lei dentro de sua competência</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Matérias de Decreto Legislativo</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Aprovação de contas do Executivo</li>
                    <li>• Concessão de títulos e homenagens</li>
                    <li>• Regimento Interno da Câmara</li>
                    <li>• Autorização de viagens e afastamentos</li>
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
              <Link href="/transparencia/portarias">
                <BookOpen className="h-5 w-5 mr-2" />
                Ver Portarias
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Modal para visualização de PDFs */}
      <PDFModal
        isOpen={pdfModal.isOpen}
        onClose={fecharPdf}
        url={pdfModal.url}
        titulo={pdfModal.titulo}
      />
    </div>
  )
}
