'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Scale,
  Calendar,
  FileText,
  History,
  Download,
  Printer,
  Share2,
  BookOpen,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface NormaJuridica {
  id: string
  tipo: string
  numero: string
  ano: number
  ementa: string
  texto: string
  textoCompilado?: string
  situacao: string
  data: string
  dataPublicacao?: string
  dataVigencia?: string
  assunto?: string
  observacao?: string
  artigos: Array<{
    id: string
    numero: string
    caput: string
    vigente: boolean
  }>
  alteracoesRecebidas: Array<{
    id: string
    tipoAlteracao: string
    descricao: string
    normaAlteradora: {
      tipo: string
      numero: string
      ano: number
    }
  }>
  versoes: Array<{
    id: string
    versao: number
    dataVersao: string
    motivoAlteracao?: string
  }>
}

const TIPO_LABELS: Record<string, string> = {
  'LEI_ORDINARIA': 'Lei Ordinaria',
  'LEI_COMPLEMENTAR': 'Lei Complementar',
  'DECRETO_LEGISLATIVO': 'Decreto Legislativo',
  'RESOLUCAO': 'Resolucao',
  'EMENDA_LEI_ORGANICA': 'Emenda a Lei Organica',
  'LEI_ORGANICA': 'Lei Organica',
  'REGIMENTO_INTERNO': 'Regimento Interno'
}

const SITUACAO_LABELS: Record<string, string> = {
  'VIGENTE': 'Vigente',
  'REVOGADA': 'Revogada',
  'REVOGADA_PARCIALMENTE': 'Revogada Parcialmente',
  'COM_ALTERACOES': 'Com Alteracoes',
  'SUSPENSA': 'Suspensa'
}

const SITUACAO_COLORS: Record<string, string> = {
  'VIGENTE': 'bg-green-100 text-green-700',
  'REVOGADA': 'bg-red-100 text-red-700',
  'REVOGADA_PARCIALMENTE': 'bg-orange-100 text-orange-700',
  'COM_ALTERACOES': 'bg-yellow-100 text-yellow-700',
  'SUSPENSA': 'bg-gray-100 text-gray-700'
}

export default function NormaPublicaPage() {
  const params = useParams()
  const normaId = params.id as string

  const [norma, setNorma] = useState<NormaJuridica | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('texto')

  useEffect(() => {
    carregarNorma()
  }, [normaId])

  async function carregarNorma() {
    try {
      const response = await fetch(`/api/normas/${normaId}`)
      const data = await response.json()

      if (data.success) {
        setNorma(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar norma:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!norma) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Norma nao encontrada</h2>
            <p className="text-gray-600 mb-4">
              A norma juridica solicitada nao foi encontrada.
            </p>
            <Button asChild>
              <Link href="/legislativo/normas">
                Voltar para busca
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const titulo = `${TIPO_LABELS[norma.tipo] || norma.tipo} n. ${norma.numero}/${norma.ano}`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-8">
        <div className="container mx-auto px-4">
          <Link
            href="/legislativo/normas"
            className="inline-flex items-center text-blue-200 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para busca
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Scale className="h-8 w-8" />
                <Badge className={SITUACAO_COLORS[norma.situacao]}>
                  {SITUACAO_LABELS[norma.situacao] || norma.situacao}
                </Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">{titulo}</h1>
              <p className="mt-2 text-blue-200 max-w-3xl">{norma.ementa}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-4 text-blue-200 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Data: {format(new Date(norma.data), 'dd/MM/yyyy', { locale: ptBR })}</span>
            </div>
            {norma.dataPublicacao && (
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>Publicacao: {format(new Date(norma.dataPublicacao), 'dd/MM/yyyy', { locale: ptBR })}</span>
              </div>
            )}
            {norma.versoes?.length > 0 && (
              <div className="flex items-center gap-1">
                <History className="h-4 w-4" />
                <span>{norma.versoes.length} versoes</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Conteudo Principal */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="border-b">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="texto">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Texto Original
                    </TabsTrigger>
                    {norma.textoCompilado && (
                      <TabsTrigger value="compilado">
                        <FileText className="h-4 w-4 mr-2" />
                        Texto Compilado
                      </TabsTrigger>
                    )}
                    {norma.artigos?.length > 0 && (
                      <TabsTrigger value="artigos">
                        Artigos ({norma.artigos.length})
                      </TabsTrigger>
                    )}
                    {norma.alteracoesRecebidas?.length > 0 && (
                      <TabsTrigger value="alteracoes">
                        Alteracoes ({norma.alteracoesRecebidas.length})
                      </TabsTrigger>
                    )}
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="p-6">
                <TabsContent value="texto" className="mt-0">
                  <div className="prose max-w-none">
                    <div
                      className="whitespace-pre-wrap text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: norma.texto || 'Texto nao disponivel' }}
                    />
                  </div>
                </TabsContent>

                {norma.textoCompilado && (
                  <TabsContent value="compilado" className="mt-0">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-yellow-700">
                        Este e o texto compilado com todas as alteracoes incorporadas.
                        Trechos alterados ou revogados estao destacados.
                      </p>
                    </div>
                    <div className="prose max-w-none">
                      <div
                        className="whitespace-pre-wrap text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: norma.textoCompilado }}
                      />
                    </div>
                  </TabsContent>
                )}

                {norma.artigos?.length > 0 && (
                  <TabsContent value="artigos" className="mt-0">
                    <div className="space-y-4">
                      {norma.artigos.map(artigo => (
                        <div
                          key={artigo.id}
                          className={`p-4 rounded-lg border ${
                            artigo.vigente ? 'bg-white' : 'bg-gray-100 border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold">Art. {artigo.numero}</span>
                            {!artigo.vigente && (
                              <Badge variant="secondary">Revogado</Badge>
                            )}
                          </div>
                          <p className={artigo.vigente ? '' : 'line-through text-gray-500'}>
                            {artigo.caput}
                          </p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                )}

                {norma.alteracoesRecebidas?.length > 0 && (
                  <TabsContent value="alteracoes" className="mt-0">
                    <div className="space-y-4">
                      {norma.alteracoesRecebidas.map(alteracao => (
                        <div
                          key={alteracao.id}
                          className="p-4 rounded-lg border bg-white"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{alteracao.tipoAlteracao}</Badge>
                            <span className="text-sm text-gray-500">
                              por {TIPO_LABELS[alteracao.normaAlteradora.tipo]} n.{' '}
                              {alteracao.normaAlteradora.numero}/{alteracao.normaAlteradora.ano}
                            </span>
                          </div>
                          <p className="text-gray-700">{alteracao.descricao}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Acoes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Acoes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
              </CardContent>
            </Card>

            {/* Informacoes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informacoes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Tipo:</span>
                  <p className="font-medium">{TIPO_LABELS[norma.tipo] || norma.tipo}</p>
                </div>
                <div>
                  <span className="text-gray-500">Numero/Ano:</span>
                  <p className="font-medium">{norma.numero}/{norma.ano}</p>
                </div>
                <div>
                  <span className="text-gray-500">Situacao:</span>
                  <p className="font-medium">{SITUACAO_LABELS[norma.situacao] || norma.situacao}</p>
                </div>
                {norma.assunto && (
                  <div>
                    <span className="text-gray-500">Assunto:</span>
                    <p className="font-medium">{norma.assunto}</p>
                  </div>
                )}
                {norma.observacao && (
                  <div>
                    <span className="text-gray-500">Observacao:</span>
                    <p className="font-medium">{norma.observacao}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Versoes */}
            {norma.versoes?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Historico de Versoes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {norma.versoes.map(versao => (
                      <div
                        key={versao.id}
                        className="p-2 rounded border text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Versao {versao.versao}</span>
                          <span className="text-gray-500">
                            {format(new Date(versao.dataVersao), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                        {versao.motivoAlteracao && (
                          <p className="text-gray-600 mt-1">{versao.motivoAlteracao}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
