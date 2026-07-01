'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Search,
  Filter,
  X,
  RefreshCw,
  FileDown,
  Eye,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

export default function GestaoFiscalPage() {
  const { configuracao } = useConfiguracaoInstitucional()
  const [dataAtualizacao, setDataAtualizacao] = useState('')
  const [horaAtualizacao, setHoraAtualizacao] = useState('')

  useEffect(() => {
    setDataAtualizacao(new Date().toLocaleDateString('pt-BR'))
    setHoraAtualizacao(new Date().toLocaleTimeString('pt-BR'))
  }, [])

  const anoCorrente = new Date().getFullYear()
  const [filtros, setFiltros] = useState({
    tipo: '',
    ano: String(anoCorrente), // padrão: exercício corrente
    status: '',
    titulo: '',
    dataInicio: '',
    dataFim: ''
  })
  const [pesquisando, setPesquisando] = useState(false)

  const documentos: any[] = []

  const [resultados, setResultados] = useState(documentos)

  const indicadores: any[] = []

  const tiposDocumento = [
    'LDO - Lei de Diretrizes Orçamentárias',
    'LOA - Lei Orçamentária Anual',
    'PPA - Plano Plurianual',
    'RGF - Relatório de Gestão Fiscal'
  ]

  const statusDocumento = [
    'Vigente',
    'Publicado',
    'Em Análise',
    'Arquivado'
  ]

  // Exercícios: ano corrente e os 5 anteriores (dinâmico, não congela em 2025).
  const anos = Array.from({ length: 6 }, (_, i) => anoCorrente - i)

  const handleFiltroChange = (campo: string, valor: string) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }))
  }

  const pesquisar = () => {
    setPesquisando(true)
    
    // Simular pesquisa
    setTimeout(() => {
      let resultadosFiltrados = documentos

      if (filtros.tipo) {
        resultadosFiltrados = resultadosFiltrados.filter(doc => 
          doc.tipo === filtros.tipo.split(' - ')[0]
        )
      }

      if (filtros.ano) {
        resultadosFiltrados = resultadosFiltrados.filter(doc => 
          doc.ano.toString().includes(filtros.ano)
        )
      }

      if (filtros.status) {
        resultadosFiltrados = resultadosFiltrados.filter(doc => 
          doc.status === filtros.status
        )
      }

      if (filtros.titulo) {
        resultadosFiltrados = resultadosFiltrados.filter(doc => 
          doc.titulo.toLowerCase().includes(filtros.titulo.toLowerCase())
        )
      }

      if (filtros.dataInicio) {
        resultadosFiltrados = resultadosFiltrados.filter(doc => 
          new Date(doc.dataPublicacao) >= new Date(filtros.dataInicio)
        )
      }

      if (filtros.dataFim) {
        resultadosFiltrados = resultadosFiltrados.filter(doc => 
          new Date(doc.dataPublicacao) <= new Date(filtros.dataFim)
        )
      }

      setResultados(resultadosFiltrados)
      setPesquisando(false)
    }, 1000)
  }

  const limparFiltros = () => {
    setFiltros({
      tipo: '',
      ano: String(anoCorrente),
      status: '',
      titulo: '',
      dataInicio: '',
      dataFim: ''
    })
    setResultados(documentos)
  }

  const exportar = () => {
    alert('Exportação iniciada! Os dados serão baixados em breve.')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Vigente':
      case 'Positivo':
      case 'Dentro do Limite':
      case 'Controlada':
        return 'bg-green-100 text-green-800'
      case 'Publicado':
        return 'bg-camara-primary/10 text-camara-primary'
      case 'Em Análise':
        return 'bg-yellow-100 text-yellow-800'
      case 'Arquivado':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'LDO':
        return 'bg-purple-100 text-purple-800'
      case 'LOA':
        return 'bg-camara-primary/10 text-camara-primary'
      case 'PPA':
        return 'bg-green-100 text-green-800'
      case 'RGF':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <TransparenciaPageWrapper slug="gestao-fiscal" nome="Gestão Fiscal">
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 pt-6">
        <Link href="/transparencia" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar ao Portal da Transparência
        </Link>
      </div>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-camara-primary mb-4">
            Gestão Fiscal
          </h1>
          <p className="text-lg text-gray-700">
            Acompanhe a gestão fiscal da {configuracao?.nomeCasa || 'Câmara Municipal'}
          </p>
        </div>

        {/* Indicadores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {indicadores.map((indicador, index) => {
            const IconComponent = indicador.icone
            return (
              <Card key={index} className="border-l-4 border-l-camara-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {indicador.titulo}
                    </CardTitle>
                    <IconComponent className="h-6 w-6 text-camara-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-gray-900">
                      {indicador.valor}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {indicador.periodo}
                      </span>
                      <Badge className={getStatusColor(indicador.status)}>
                        {indicador.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filtros de Pesquisa */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Opções de Filtro
            </CardTitle>
            <p className="text-sm text-gray-600">
              Para usar as opções de filtro, escolha o campo para a pesquisa e clique no botão pesquisar
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Primeira linha */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Filtro pelo tipo</Label>
                <select
                  id="tipo"
                  value={filtros.tipo}
                  onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-camara-primary focus:border-transparent"
                >
                  <option value="">Selecione um tipo</option>
                  {tiposDocumento.map((tipo) => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ano">Exercício</Label>
                <select
                  id="ano"
                  value={filtros.ano}
                  onChange={(e) => handleFiltroChange('ano', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-camara-primary focus:border-transparent"
                >
                  <option value="">Selecione um ano</option>
                  {anos.map((ano) => (
                    <option key={ano} value={ano}>{ano}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={filtros.status}
                  onChange={(e) => handleFiltroChange('status', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-camara-primary focus:border-transparent"
                >
                  <option value="">Selecione um status</option>
                  {statusDocumento.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Segunda linha */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título do Documento</Label>
                <Input
                  id="titulo"
                  placeholder="Digite o título..."
                  value={filtros.titulo}
                  onChange={(e) => handleFiltroChange('titulo', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => handleFiltroChange('dataInicio', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataFim">Data Fim</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => handleFiltroChange('dataFim', e.target.value)}
                />
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Button 
                onClick={pesquisar} 
                disabled={pesquisando}
                className="flex items-center gap-2 bg-camara-primary hover:bg-camara-secondary"
              >
                {pesquisando ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {pesquisando ? 'Pesquisando...' : 'PESQUISAR'}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={limparFiltros}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                LIMPAR
              </Button>
              
              <Button 
                variant="outline" 
                onClick={exportar}
                className="flex items-center gap-2"
              >
                <FileDown className="h-4 w-4" />
                EXPORTAÇÃO
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos de Gestão Fiscal
              </CardTitle>
              <Badge variant="outline">
                Foram encontrados {resultados.length} registros
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              Informações atualizadas em: {dataAtualizacao} - {horaAtualizacao}
            </p>
          </CardHeader>
          <CardContent>
            {resultados.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum documento encontrado com os filtros aplicados.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {resultados.map((documento) => (
                  <div
                    key={documento.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-camara-primary/10 rounded-lg">
                        <FileText className="h-5 w-5 text-camara-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {documento.titulo}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getTipoColor(documento.tipo)}>
                            {documento.tipo}
                          </Badge>
                          <Badge className={getStatusColor(documento.status)}>
                            {documento.status}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {documento.tamanho}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          Publicado em
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(documento.dataPublicacao).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          Visualizar
                        </Button>
                        <Button size="sm" className="bg-camara-primary hover:bg-camara-secondary">
                          <Download className="h-3 w-3 mr-1" />
                          Baixar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Informações sobre Gestão Fiscal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="text-gray-700 mb-4">
                A gestão fiscal da {configuracao?.nomeCasa || 'Câmara Municipal'} é realizada 
                de acordo com a Lei de Responsabilidade Fiscal (Lei Complementar nº 101/2000) 
                e demais normas aplicáveis.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Princípios da Gestão Fiscal
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Transparência</li>
                    <li>Responsabilidade</li>
                    <li>Eficiência</li>
                    <li>Controle social</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Documentos Obrigatórios
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Lei de Diretrizes Orçamentárias (LDO)</li>
                    <li>Lei Orçamentária Anual (LOA)</li>
                    <li>Plano Plurianual (PPA)</li>
                    <li>Relatório de Gestão Fiscal (RGF)</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </TransparenciaPageWrapper>
  )
}