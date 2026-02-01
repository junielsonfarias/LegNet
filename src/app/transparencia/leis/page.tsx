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
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'

// Interface para publicação da API
interface PublicacaoLei {
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

export default function LeisPage() {
  const { configuracao } = useConfiguracaoInstitucional()
  const [leis, setLeis] = useState<PublicacaoLei[]>([])
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

  // Carregar leis da API pública
  const fetchLeis = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dados-abertos/publicacoes?tipo=LEI&limit=100')
      const result = await response.json()

      if (result.dados) {
        console.log('Leis carregadas:', result.dados.length)
        setLeis(result.dados)
      } else {
        console.error('Formato de resposta inesperado:', result)
        setLeis([])
      }
    } catch (error) {
      console.error('Erro ao carregar leis:', error)
      toast.error('Erro ao carregar leis')
      setLeis([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeis()
  }, [])

  // Anos únicos
  const anos = useMemo(() =>
    Array.from(new Set(leis.map(l => l.ano))).sort((a, b) => b - a),
    [leis]
  )

  // Estatísticas calculadas
  const estatisticas = useMemo(() => ({
    total: leis.length,
    vigentes: leis.filter(l => l.publicada).length,
    anoAtual: leis.filter(l => l.ano === new Date().getFullYear()).length
  }), [leis])

  // Filtrar leis
  const filteredLeis = useMemo(() => {
    return leis.filter(l => {
      const matchesSearch = !searchTerm ||
        l.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.descricao && l.descricao.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (l.numero && l.numero.includes(searchTerm))

      const matchesAno = !anoFilter || l.ano === anoFilter

      return matchesSearch && matchesAno
    })
  }, [leis, searchTerm, anoFilter])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Leis Municipais
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Consulte todas as leis aprovadas pela {configuracao?.nomeCasa || 'Câmara Municipal'}.
            Aqui você encontra o texto completo das leis, suas alterações e histórico legislativo.
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="camara-card text-center">
            <CardContent className="p-6">
              <BookOpen className="h-12 w-12 text-camara-primary mx-auto mb-3" />
              <div className="text-3xl font-bold text-camara-primary mb-2">{estatisticas.total}</div>
              <div className="text-sm text-gray-600">Leis Publicadas</div>
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
                      placeholder="Buscar leis por número, título ou ementa..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={fetchLeis}
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
          Encontradas {filteredLeis.length} lei(s)
        </div>

        {/* Lista de Leis */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Carregando leis...</span>
          </div>
        ) : filteredLeis.length === 0 ? (
          <Card className="camara-card">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhuma lei encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || anoFilter
                  ? 'Tente ajustar os filtros ou realizar uma nova busca.'
                  : 'As leis municipais ainda não foram cadastradas no sistema.'}
              </p>
              <p className="text-sm text-gray-500">
                Você pode consultar as proposições aprovadas que se tornarão leis em{' '}
                <Link href="/legislativo/proposicoes" className="text-blue-600 hover:underline">
                  Proposições
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredLeis.map((lei) => (
              <Card key={lei.id} className="camara-card hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CardTitle className="text-xl font-semibold text-gray-900">
                          Lei Nº {lei.numero}/{lei.ano}
                        </CardTitle>
                        <Badge className="bg-green-100 text-green-800">Vigente</Badge>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">
                        {lei.titulo}
                      </h2>
                      {lei.descricao && (
                        <p className="text-gray-700 mb-4 line-clamp-2">
                          {lei.descricao}
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
                              {new Date(lei.data).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">Autor:</span>
                            <span className="font-medium">{lei.autor.nome}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Eye className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">Visualizações:</span>
                            <span className="font-medium">{lei.visualizacoes}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm text-green-800">
                            Esta lei está em vigor e deve ser cumprida por todos os órgãos
                            e entidades do município.
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
                            onClick={() => setExpandedId(expandedId === lei.id ? null : lei.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {expandedId === lei.id ? 'Ocultar Conteúdo' : 'Visualizar Conteúdo'}
                          </Button>
                          {lei.arquivo && (
                            <>
                              {isPdf(lei.arquivo) && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => abrirPdf(lei.arquivo!, `Lei nº ${lei.numero}/${lei.ano}`)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Visualizar PDF
                                </Button>
                              )}
                              <Button asChild variant="outline" size="sm" className="w-full">
                                <a href={lei.arquivo} target="_blank" rel="noopener noreferrer">
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
                  {expandedId === lei.id && lei.conteudo && (
                    <div className="border-t mt-6 pt-6 bg-gray-50 -mx-6 -mb-6 px-6 pb-6 rounded-b-lg">
                      <h3 className="font-semibold text-gray-900 mb-3">Conteúdo da Lei</h3>
                      <div className="prose max-w-none text-sm text-gray-700 whitespace-pre-wrap bg-white p-4 rounded-lg border">
                        {lei.conteudo}
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
                Informações Importantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Sobre as Leis Municipais</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• As leis municipais são normas jurídicas de caráter geral e abstrato</li>
                    <li>• São aprovadas pela Câmara Municipal e sancionadas pelo Prefeito</li>
                    <li>• Têm força obrigatória em todo o território municipal</li>
                    <li>• Devem ser publicadas no Diário Oficial do Município</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Como Consultar</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Use a busca para encontrar leis específicas</li>
                    <li>• Filtre por ano para facilitar a consulta</li>
                    <li>• Baixe o PDF para consulta offline</li>
                    <li>• Consulte também as proposições aprovadas</li>
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
              <Link href="/transparencia/decretos">
                <FileText className="h-5 w-5 mr-2" />
                Ver Decretos
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-camara-primary text-camara-primary hover:bg-camara-primary hover:text-white">
              <Link href="/legislativo/proposicoes">
                <BookOpen className="h-5 w-5 mr-2" />
                Ver Proposições
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
