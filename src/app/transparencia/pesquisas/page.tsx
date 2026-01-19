'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  X,
  RefreshCw,
  FileDown,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

// Interface para documentos da API
interface DocumentoLRF {
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

const tiposDocumento = [
  { value: '', label: 'Todos os tipos' },
  { value: 'RGF', label: 'RGF - Relatório de Gestão Fiscal' },
  { value: 'LOA', label: 'LOA - Lei Orçamentária Anual' },
  { value: 'LDO', label: 'LDO - Lei de Diretrizes Orçamentárias' },
  { value: 'PPA', label: 'PPA - Plano Plurianual' }
]

export default function PesquisasPublicasPage() {
  const [documentos, setDocumentos] = useState<DocumentoLRF[]>([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({
    tipo: '',
    exercicio: '',
    descricao: ''
  })
  const [paginaAtual, setPaginaAtual] = useState(1)
  const itensPorPagina = 10

  // Carregar documentos da API pública
  const fetchDocumentos = async () => {
    try {
      setLoading(true)
      // Buscar documentos do tipo RELATORIO e PLANEJAMENTO
      const [relatoriosRes, planejamentoRes] = await Promise.all([
        fetch('/api/dados-abertos/publicacoes?tipo=RELATORIO&limit=100'),
        fetch('/api/dados-abertos/publicacoes?tipo=PLANEJAMENTO&limit=100')
      ])

      const relatorios = await relatoriosRes.json()
      const planejamento = await planejamentoRes.json()

      const todosDocumentos = [
        ...(relatorios.dados || []),
        ...(planejamento.dados || [])
      ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

      console.log('Documentos LRF carregados:', todosDocumentos.length)
      setDocumentos(todosDocumentos)
    } catch (error) {
      console.error('Erro ao carregar documentos:', error)
      toast.error('Erro ao carregar documentos')
      setDocumentos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocumentos()
  }, [])

  // Anos únicos para o filtro
  const anosDisponiveis = useMemo(() =>
    Array.from(new Set(documentos.map(d => d.ano))).sort((a, b) => b - a),
    [documentos]
  )

  // Filtrar documentos
  const documentosFiltrados = useMemo(() => {
    return documentos.filter(doc => {
      // Extrair tipo do título (RGF, LOA, LDO, PPA)
      const tipoDoc = doc.titulo.split(' ')[0]?.replace('-', '').toUpperCase()

      const matchesTipo = !filtros.tipo || tipoDoc === filtros.tipo
      const matchesExercicio = !filtros.exercicio || doc.ano.toString() === filtros.exercicio
      const matchesDescricao = !filtros.descricao ||
        doc.titulo.toLowerCase().includes(filtros.descricao.toLowerCase()) ||
        (doc.descricao && doc.descricao.toLowerCase().includes(filtros.descricao.toLowerCase()))

      return matchesTipo && matchesExercicio && matchesDescricao
    })
  }, [documentos, filtros])

  const handleFiltroChange = (campo: string, valor: string) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }))
    setPaginaAtual(1)
  }

  const limparFiltros = () => {
    setFiltros({
      tipo: '',
      exercicio: '',
      descricao: ''
    })
    setPaginaAtual(1)
  }

  const getTipoColor = (titulo: string) => {
    const tipo = titulo.split(' ')[0]?.replace('-', '').toUpperCase()
    switch (tipo) {
      case 'RGF':
        return 'bg-blue-100 text-blue-800'
      case 'LOA':
        return 'bg-green-100 text-green-800'
      case 'LDO':
        return 'bg-purple-100 text-purple-800'
      case 'PPA':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTipoLabel = (titulo: string) => {
    const tipo = titulo.split(' ')[0]?.replace('-', '').toUpperCase()
    return tipo || 'DOC'
  }

  // Paginação
  const totalPaginas = Math.ceil(documentosFiltrados.length / itensPorPagina)
  const inicio = (paginaAtual - 1) * itensPorPagina
  const fim = inicio + itensPorPagina
  const documentosPagina = documentosFiltrados.slice(inicio, fim)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-camara-primary mb-4">
          Lei de Responsabilidade Fiscal
        </h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/" className="hover:text-camara-primary">Início</Link>
          <span>›</span>
          <Link href="/transparencia" className="hover:text-camara-primary">Transparência</Link>
          <span>›</span>
          <span className="font-semibold">Lei de responsabilidade fiscal</span>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Opções de filtro
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
          <p className="text-sm text-gray-600">
            Para usar as opções de filtro, escolha o campo para a pesquisa
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Documento</Label>
              <select
                id="tipo"
                value={filtros.tipo}
                onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-camara-primary focus:border-transparent"
              >
                {tiposDocumento.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exercicio">Exercício/Ano</Label>
              <select
                id="exercicio"
                value={filtros.exercicio}
                onChange={(e) => handleFiltroChange('exercicio', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-camara-primary focus:border-transparent"
              >
                <option value="">Todos os anos</option>
                {anosDisponiveis.map((ano) => (
                  <option key={ano} value={ano.toString()}>{ano}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                placeholder="Digite para buscar..."
                value={filtros.descricao}
                onChange={(e) => handleFiltroChange('descricao', e.target.value)}
              />
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-wrap gap-3 pt-4">
            {(filtros.tipo || filtros.exercicio || filtros.descricao) && (
              <Button
                variant="outline"
                onClick={limparFiltros}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Documentos de LRF</CardTitle>
            <Badge variant="outline">
              {documentosFiltrados.length} documento(s) encontrado(s)
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Carregando documentos...</span>
            </div>
          ) : documentosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum documento encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                {filtros.tipo || filtros.exercicio || filtros.descricao
                  ? 'Tente ajustar os filtros ou realizar uma nova busca.'
                  : 'Os documentos de LRF ainda não foram cadastrados no sistema.'}
              </p>
              <p className="text-sm text-gray-500">
                Documentos como RGF, LOA, LDO e PPA serão exibidos aqui quando cadastrados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-semibold">Descrição</th>
                    <th className="text-left p-3 font-semibold">Tipo/Ano</th>
                    <th className="text-left p-3 font-semibold">Data</th>
                    <th className="text-left p-3 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {documentosPagina.map((documento) => (
                    <tr key={documento.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium text-gray-900">
                          {documento.titulo}
                        </div>
                        {documento.descricao && (
                          <div className="text-sm text-gray-500 line-clamp-2">
                            {documento.descricao}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge className={getTipoColor(documento.titulo)}>
                          {getTipoLabel(documento.titulo)}
                        </Badge>
                        <div className="text-sm text-gray-600 mt-1">
                          {documento.ano}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {new Date(documento.data).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          {documento.arquivo && (
                            <Button asChild size="sm" className="bg-camara-primary hover:bg-camara-secondary">
                              <a href={documento.arquivo} target="_blank" rel="noopener noreferrer">
                                <Download className="h-3 w-3 mr-1" />
                                Baixar
                              </a>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {documentosFiltrados.length > itensPorPagina && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={paginaAtual === 1}
            onClick={() => setPaginaAtual(paginaAtual - 1)}
          >
            Anterior
          </Button>

          {Array.from({ length: Math.min(totalPaginas, 5) }, (_, i) => {
            let pageNum = i + 1
            if (totalPaginas > 5) {
              if (paginaAtual > 3) {
                pageNum = paginaAtual - 2 + i
              }
              if (paginaAtual > totalPaginas - 2) {
                pageNum = totalPaginas - 4 + i
              }
            }
            return pageNum
          }).filter(p => p > 0 && p <= totalPaginas).map((pagina) => (
            <Button
              key={pagina}
              variant={pagina === paginaAtual ? "default" : "outline"}
              size="sm"
              className={pagina === paginaAtual ? "bg-camara-primary hover:bg-camara-secondary" : ""}
              onClick={() => setPaginaAtual(pagina)}
            >
              {pagina}
            </Button>
          ))}

          <Button
            variant="outline"
            size="sm"
            disabled={paginaAtual === totalPaginas}
            onClick={() => setPaginaAtual(paginaAtual + 1)}
          >
            Próximo
          </Button>
        </div>
      )}

      {/* Informações sobre LRF */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-xl text-camara-primary">
            Sobre a Lei de Responsabilidade Fiscal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">O que é a LRF?</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Lei Complementar nº 101/2000</li>
                <li>• Estabelece normas de finanças públicas</li>
                <li>• Voltada para a responsabilidade na gestão fiscal</li>
                <li>• Obrigatória para União, Estados e Municípios</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Documentos Disponíveis</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• <strong>RGF:</strong> Relatório de Gestão Fiscal</li>
                <li>• <strong>LOA:</strong> Lei Orçamentária Anual</li>
                <li>• <strong>LDO:</strong> Lei de Diretrizes Orçamentárias</li>
                <li>• <strong>PPA:</strong> Plano Plurianual</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
