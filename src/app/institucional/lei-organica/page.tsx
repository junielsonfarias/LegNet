'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, Download, Calendar, Loader2, AlertCircle, RefreshCw, X } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

// Interface para documentos da API
interface DocumentoLeiOrganica {
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

export default function LeiOrganicaPage() {
  const [documentos, setDocumentos] = useState<DocumentoLeiOrganica[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [numero, setNumero] = useState('')

  // Carregar documentos da API pública
  const fetchDocumentos = async () => {
    try {
      setLoading(true)
      // Buscar documentos do tipo CODIGO (Lei Orgânica é o código fundamental)
      const response = await fetch('/api/dados-abertos/publicacoes?tipo=CODIGO&limit=100')
      const result = await response.json()

      if (result.dados) {
        console.log('Lei Orgânica carregada:', result.dados.length)
        setDocumentos(result.dados)
      } else {
        setDocumentos([])
      }
    } catch (error) {
      console.error('Erro ao carregar Lei Orgânica:', error)
      toast.error('Erro ao carregar documentos')
      setDocumentos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocumentos()
  }, [])

  // Filtrar documentos
  const documentosFiltrados = useMemo(() => {
    return documentos.filter(doc => {
      const matchesPeriodo = !periodo || doc.ano.toString().includes(periodo)
      const matchesDescricao = !descricao ||
        doc.titulo.toLowerCase().includes(descricao.toLowerCase()) ||
        (doc.descricao && doc.descricao.toLowerCase().includes(descricao.toLowerCase()))
      const matchesNumero = !numero || (doc.numero && doc.numero.includes(numero))

      return matchesPeriodo && matchesDescricao && matchesNumero
    })
  }, [documentos, periodo, descricao, numero])

  const handleLimpar = () => {
    setPeriodo('')
    setDescricao('')
    setNumero('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Lei Orgânica Municipal
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-camara-primary">Início</Link>
            <span>›</span>
            <Link href="/institucional" className="hover:text-camara-primary">Institucional</Link>
            <span>›</span>
            <span className="font-semibold">Lei Orgânica</span>
          </div>
        </div>

        {/* Campos para pesquisa */}
        <Card className="mb-6">
          <CardHeader className="bg-gray-100 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Campos para pesquisa
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDocumentos}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Período/Ano
                </label>
                <Input
                  type="text"
                  placeholder="Ex: 2022"
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <Input
                  type="text"
                  placeholder="Digite a descrição"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número
                </label>
                <Input
                  type="text"
                  placeholder="Digite o número"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {(periodo || descricao || numero) && (
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleLimpar}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Limpar Filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contador de registros */}
        <div className="mb-4">
          <p className="text-lg font-semibold text-gray-900">
            {loading ? 'Carregando...' : `Foram encontrados ${documentosFiltrados.length} registro(s)`}
          </p>
        </div>

        {/* Resultados */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Carregando documentos...</span>
          </div>
        ) : documentosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum documento encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                {periodo || descricao || numero
                  ? 'Tente ajustar os filtros ou realizar uma nova busca.'
                  : 'A Lei Orgânica Municipal ainda não foi cadastrada no sistema.'}
              </p>
              <p className="text-sm text-gray-500">
                A Lei Orgânica é a constituição do município e será exibida aqui quando cadastrada.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {documentosFiltrados.map((doc) => (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-bold text-gray-900">
                          {doc.titulo}
                        </h3>
                      </div>

                      <div className="space-y-2">
                        {doc.numero && (
                          <p className="text-gray-900">
                            <span className="font-semibold">Número: {doc.numero}/{doc.ano}</span>
                          </p>
                        )}
                        {doc.descricao && (
                          <p className="text-gray-700 leading-relaxed">
                            {doc.descricao}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(doc.data).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {doc.arquivo && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="whitespace-nowrap"
                        >
                          <a href={doc.arquivo} target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2 h-4 w-4" />
                            Baixar PDF
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Informações sobre Lei Orgânica */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-xl text-camara-primary">
              Sobre a Lei Orgânica Municipal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">O que é a Lei Orgânica?</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• É a "Constituição" do município</li>
                  <li>• Define a organização política e administrativa</li>
                  <li>• Estabelece as competências dos Poderes</li>
                  <li>• Fixa os direitos e deveres dos cidadãos</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Características</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Elaborada pela Câmara Municipal</li>
                  <li>• Aprovada em dois turnos de votação</li>
                  <li>• Requer maioria de 2/3 dos vereadores</li>
                  <li>• Não depende de sanção do Prefeito</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
