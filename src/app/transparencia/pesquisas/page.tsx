'use client'

import { useState } from 'react'
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
  Calendar,
  X,
  RefreshCw,
  FileDown
} from 'lucide-react'

// Dados mock baseados no site oficial
const mockDocumentos = [
  {
    id: 1,
    descricao: 'RGF - RELATÓRIO DE GESTÃO FISCAL',
    competencia: '1° QUADRIMESTRE/2025',
    exercicio: '2025',
    data: '2025-04-30',
    tipo: 'RGF',
    arquivo: 'rgf-1q-2025.pdf',
    tamanho: '2.5 MB',
    url: '/docs/rgf-1q-2025.pdf'
  },
  {
    id: 2,
    descricao: 'RGF - RELATÓRIO DE GESTÃO FISCAL',
    competencia: '3° QUADRIMESTRE/2024',
    exercicio: '2024',
    data: '2024-12-31',
    tipo: 'RGF',
    arquivo: 'rgf-3q-2024.pdf',
    tamanho: '2.8 MB',
    url: '/docs/rgf-3q-2024.pdf'
  },
  {
    id: 3,
    descricao: 'LOA - LEI ORÇAMENTÁRIA ANUAL',
    competencia: 'ANUAL/2024',
    exercicio: '2024',
    data: '2024-12-09',
    tipo: 'LOA',
    arquivo: 'loa-2024.pdf',
    tamanho: '1.9 MB',
    url: '/docs/loa-2024.pdf'
  },
  {
    id: 4,
    descricao: 'RGF - RELATÓRIO DE GESTÃO FISCAL',
    competencia: '2° QUADRIMESTRE/2024',
    exercicio: '2024',
    data: '2024-09-30',
    tipo: 'RGF',
    arquivo: 'rgf-2q-2024.pdf',
    tamanho: '2.3 MB',
    url: '/docs/rgf-2q-2024.pdf'
  },
  {
    id: 5,
    descricao: 'LDO - LEI DE DIRETRIZES ORÇAMENTÁRIAS',
    competencia: 'ANUAL/2023',
    exercicio: '2023',
    data: '2023-07-17',
    tipo: 'LDO',
    arquivo: 'ldo-2023.pdf',
    tamanho: '1.7 MB',
    url: '/docs/ldo-2023.pdf'
  },
  {
    id: 6,
    descricao: 'RGF - RELATÓRIO DE GESTÃO FISCAL',
    competencia: '1° QUADRIMESTRE/2024',
    exercicio: '2024',
    data: '2024-06-07',
    tipo: 'RGF',
    arquivo: 'rgf-1q-2024.pdf',
    tamanho: '2.1 MB',
    url: '/docs/rgf-1q-2024.pdf'
  },
  {
    id: 7,
    descricao: 'RGF - RELATÓRIO DE GESTÃO FISCAL',
    competencia: '3° QUADRIMESTRE/2023',
    exercicio: '2023',
    data: '2024-01-30',
    tipo: 'RGF',
    arquivo: 'rgf-3q-2023.pdf',
    tamanho: '2.4 MB',
    url: '/docs/rgf-3q-2023.pdf'
  },
  {
    id: 8,
    descricao: 'RGF - RELATÓRIO DE GESTÃO FISCAL',
    competencia: '2° QUADRIMESTRE/2023',
    exercicio: '2023',
    data: '2023-09-29',
    tipo: 'RGF',
    arquivo: 'rgf-2q-2023.pdf',
    tamanho: '2.2 MB',
    url: '/docs/rgf-2q-2023.pdf'
  }
]

const tiposDocumento = [
  'LDO - LEI DE DIRETRIZES ORÇAMENTÁRIAS',
  'LOA - LEI ORÇAMENTÁRIA ANUAL',
  'PPA - PLANO PLURIANUAL',
  'RGF - RELATÓRIO DE GESTÃO FISCAL'
]

const competencias = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO',
  '1º BIMESTRE', '2º BIMESTRE', '3º BIMESTRE', '4º BIMESTRE',
  '5º BIMESTRE', '6º BIMESTRE', '1° QUADRIMESTRE', '2° QUADRIMESTRE',
  '3° QUADRIMESTRE', '1° SEMESTRE', '2° SEMESTRE', 'ANUAL',
  'CONSOLIDADO', 'QUADRIANUAL', 'BIENAL', '1º TRIMESTRE',
  '2º TRIMESTRE', '3º TRIMESTRE', '4º TRIMESTRE', 'TRIENAL',
  'QUINQUENAL', 'SEXENAL', 'DECENAL'
]

export default function PesquisasPublicasPage() {
  const [documentos] = useState(mockDocumentos)
  const [filtros, setFiltros] = useState({
    tipo: '',
    competencia: '',
    exercicio: '',
    descricao: '',
    dataInicio: '',
    dataFim: ''
  })
  const [resultados, setResultados] = useState(mockDocumentos)
  const [pesquisando, setPesquisando] = useState(false)
  const [paginaAtual, setPaginaAtual] = useState(1)
  const itensPorPagina = 10

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

      if (filtros.competencia) {
        resultadosFiltrados = resultadosFiltrados.filter(doc => 
          doc.competencia.includes(filtros.competencia)
        )
      }

      if (filtros.exercicio) {
        resultadosFiltrados = resultadosFiltrados.filter(doc => 
          doc.exercicio === filtros.exercicio
        )
      }

      if (filtros.descricao) {
        resultadosFiltrados = resultadosFiltrados.filter(doc => 
          doc.descricao.toLowerCase().includes(filtros.descricao.toLowerCase())
        )
      }

      if (filtros.dataInicio) {
        resultadosFiltrados = resultadosFiltrados.filter(doc => 
          new Date(doc.data) >= new Date(filtros.dataInicio)
        )
      }

      if (filtros.dataFim) {
        resultadosFiltrados = resultadosFiltrados.filter(doc => 
          new Date(doc.data) <= new Date(filtros.dataFim)
        )
      }

      setResultados(resultadosFiltrados)
      setPaginaAtual(1)
      setPesquisando(false)
    }, 1000)
  }

  const limparFiltros = () => {
    setFiltros({
      tipo: '',
      competencia: '',
      exercicio: '',
      descricao: '',
      dataInicio: '',
      dataFim: ''
    })
    setResultados(documentos)
    setPaginaAtual(1)
  }

  const exportar = () => {
    // Simular exportação
    alert('Exportação iniciada! Os dados serão baixados em breve.')
  }

  const getTipoColor = (tipo: string) => {
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

  // Paginação
  const totalPaginas = Math.ceil(resultados.length / itensPorPagina)
  const inicio = (paginaAtual - 1) * itensPorPagina
  const fim = inicio + itensPorPagina
  const resultadosPagina = resultados.slice(inicio, fim)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-camara-primary mb-4">
          Lei de Responsabilidade Fiscal
        </h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Início</span>
          <span>›</span>
          <span>Acesso a informação</span>
          <span>›</span>
          <span className="font-semibold">Lei de responsabilidade fiscal</span>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Opções de filtro
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
              <Label htmlFor="competencia">Competência</Label>
              <select
                id="competencia"
                value={filtros.competencia}
                onChange={(e) => handleFiltroChange('competencia', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-camara-primary focus:border-transparent"
              >
                <option value="">Selecione uma Competência</option>
                {competencias.map((competencia) => (
                  <option key={competencia} value={competencia}>{competencia}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exercicio">Exercício</Label>
              <Input
                id="exercicio"
                type="number"
                placeholder="Ex: 2025"
                value={filtros.exercicio}
                onChange={(e) => handleFiltroChange('exercicio', e.target.value)}
              />
            </div>
          </div>

          {/* Segunda linha */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                placeholder="Digite a descrição..."
                value={filtros.descricao}
                onChange={(e) => handleFiltroChange('descricao', e.target.value)}
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
            <CardTitle>Lista LRF</CardTitle>
            <Badge variant="outline">
              Foram encontrados {resultados.length} registros
            </Badge>
          </div>
          <p className="text-sm text-gray-600">
            Informações atualizadas em: {new Date().toLocaleDateString('pt-BR')} - {new Date().toLocaleTimeString('pt-BR')}
          </p>
        </CardHeader>
        <CardContent>
          {resultados.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum documento encontrado com os filtros aplicados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Descrição</th>
                    <th className="text-left p-3 font-semibold">Competência/Exercício</th>
                    <th className="text-left p-3 font-semibold">Data</th>
                    <th className="text-left p-3 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {resultadosPagina.map((documento) => (
                    <tr key={documento.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium text-gray-900">
                          {documento.descricao}
                        </div>
                        <div className="text-sm text-gray-500">
                          {documento.arquivo} • {documento.tamanho}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {documento.competencia}
                        </div>
                        <Badge className={`mt-1 ${getTipoColor(documento.tipo)}`}>
                          {documento.tipo}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {new Date(documento.data).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="p-3">
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
      {resultados.length > 0 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={paginaAtual === 1}
            onClick={() => setPaginaAtual(paginaAtual - 1)}
          >
            Anterior
          </Button>
          
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
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
    </div>
  )
}
