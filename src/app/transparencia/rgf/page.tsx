'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileBarChart, 
  Download, 
  Calendar,
  FileText,
  Eye,
  Building2,
  DollarSign,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Target,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface RGF {
  id: string;
  exercicio: string;
  bimestre: string;
  dataPublicacao: string;
  situacao: 'VIGENTE' | 'RETIFICADO' | 'CANCELADO';
  receitasArrecadadas: number;
  receitasPrevistas: number;
  despesasEmpenhadas: number;
  despesasLiquidadas: number;
  despesasPagas: number;
  despesasPrevistas: number;
  restosAPagar: number;
  dividaConsolidada: number;
  dividaFlutuante: number;
  disponibilidadeCaixa: number;
  observacoes?: string;
}

interface Indicador {
  id: string;
  nome: string;
  valor: number;
  meta: number;
  situacao: 'ATENDIDA' | 'PARCIALMENTE_ATENDIDA' | 'NAO_ATENDIDA';
  descricao: string;
}

const rgfMock: RGF[] = [
  {
    id: '1',
    exercicio: '2025',
    bimestre: '1º Bimestre',
    dataPublicacao: '30/04/2025',
    situacao: 'VIGENTE',
    receitasArrecadadas: 2500000.00,
    receitasPrevistas: 3000000.00,
    despesasEmpenhadas: 2200000.00,
    despesasLiquidadas: 2000000.00,
    despesasPagas: 1800000.00,
    despesasPrevistas: 2500000.00,
    restosAPagar: 150000.00,
    dividaConsolidada: 500000.00,
    dividaFlutuante: 100000.00,
    disponibilidadeCaixa: 600000.00,
    observacoes: 'Relatório do 1º bimestre de 2025 com execução dentro dos parâmetros estabelecidos'
  },
  {
    id: '2',
    exercicio: '2024',
    bimestre: '6º Bimestre',
    dataPublicacao: '31/12/2024',
    situacao: 'VIGENTE',
    receitasArrecadadas: 14500000.00,
    receitasPrevistas: 15000000.00,
    despesasEmpenhadas: 13000000.00,
    despesasLiquidadas: 12800000.00,
    despesasPagas: 12500000.00,
    despesasPrevistas: 14000000.00,
    restosAPagar: 200000.00,
    dividaConsolidada: 450000.00,
    dividaFlutuante: 80000.00,
    disponibilidadeCaixa: 2000000.00,
    observacoes: 'Relatório anual de 2024 com execução orçamentária equilibrada'
  },
  {
    id: '3',
    exercicio: '2024',
    bimestre: '4º Bimestre',
    dataPublicacao: '31/08/2024',
    situacao: 'RETIFICADO',
    receitasArrecadadas: 9500000.00,
    receitasPrevistas: 10000000.00,
    despesasEmpenhadas: 8500000.00,
    despesasLiquidadas: 8200000.00,
    despesasPagas: 8000000.00,
    despesasPrevistas: 9500000.00,
    restosAPagar: 180000.00,
    dividaConsolidada: 420000.00,
    dividaFlutuante: 75000.00,
    disponibilidadeCaixa: 1500000.00,
    observacoes: 'Relatório retificado devido a correções nos valores de receitas'
  }
];

const indicadoresMock: Indicador[] = [
  {
    id: '1',
    nome: 'Limite de Despesa com Pessoal',
    valor: 48.5,
    meta: 54.0,
    situacao: 'ATENDIDA',
    descricao: 'Percentual da Receita Corrente Líquida comprometida com despesas de pessoal'
  },
  {
    id: '2',
    nome: 'Limite de Dívida Consolidada',
    valor: 85.2,
    meta: 120.0,
    situacao: 'ATENDIDA',
    descricao: 'Percentual da Receita Corrente Líquida comprometida com dívida consolidada'
  },
  {
    id: '3',
    nome: 'Resultado Primário',
    valor: 2.8,
    meta: 0.0,
    situacao: 'ATENDIDA',
    descricao: 'Resultado primário em percentual da Receita Corrente Líquida'
  },
  {
    id: '4',
    nome: 'Resultado Nominal',
    valor: 1.5,
    meta: 0.0,
    situacao: 'ATENDIDA',
    descricao: 'Resultado nominal em percentual da Receita Corrente Líquida'
  },
  {
    id: '5',
    nome: 'Limite de Garantias',
    valor: 15.8,
    meta: 25.0,
    situacao: 'ATENDIDA',
    descricao: 'Percentual da Receita Corrente Líquida comprometida com garantias'
  }
];

export default function RGFPage() {
  const [exercicioSelecionado, setExercicioSelecionado] = useState('all');
  const [bimestreSelecionado, setBimestreSelecionado] = useState('all');
  const [situacaoSelecionada, setSituacaoSelecionada] = useState('all');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [abaSelecionada, setAbaSelecionada] = useState<'relatorios' | 'indicadores'>('relatorios');
  const [rgfSelecionado, setRgfSelecionado] = useState<RGF | null>(null);

  const exercicios = useMemo(() => {
    const exerciciosSet = new Set(rgfMock.map(r => r.exercicio));
    return Array.from(exerciciosSet).sort((a, b) => parseInt(b) - parseInt(a));
  }, []);

  const bimestres = [
    '1º Bimestre', '2º Bimestre', '3º Bimestre', 
    '4º Bimestre', '5º Bimestre', '6º Bimestre'
  ];

  const rgfFiltrados = useMemo(() => {
    return rgfMock.filter(rgf => {
      const matchesExercicio = exercicioSelecionado === 'all' || rgf.exercicio === exercicioSelecionado;
      const matchesBimestre = bimestreSelecionado === 'all' || rgf.bimestre === bimestreSelecionado;
      const matchesSituacao = situacaoSelecionada === 'all' || rgf.situacao === situacaoSelecionada;
      const matchesDataInicio = dataInicio === '' || new Date(rgf.dataPublicacao.split('/').reverse().join('-')) >= new Date(dataInicio);
      const matchesDataFim = dataFim === '' || new Date(rgf.dataPublicacao.split('/').reverse().join('-')) <= new Date(dataFim);
      
      return matchesExercicio && matchesBimestre && matchesSituacao && matchesDataInicio && matchesDataFim;
    });
  }, [exercicioSelecionado, bimestreSelecionado, situacaoSelecionada, dataInicio, dataFim]);

  const indicadoresFiltrados = useMemo(() => {
    return indicadoresMock;
  }, []);

  const estatisticas = useMemo(() => {
    const totalReceitas = rgfFiltrados.reduce((sum, r) => sum + r.receitasArrecadadas, 0);
    const totalDespesas = rgfFiltrados.reduce((sum, r) => sum + r.despesasPagas, 0);
    const totalDivida = rgfFiltrados.reduce((sum, r) => sum + r.dividaConsolidada, 0);
    const totalDisponibilidade = rgfFiltrados.reduce((sum, r) => sum + r.disponibilidadeCaixa, 0);
    const mediaExecucao = rgfFiltrados.length > 0 ? 
      rgfFiltrados.reduce((sum, r) => sum + (r.receitasArrecadadas / r.receitasPrevistas) * 100, 0) / rgfFiltrados.length : 0;
    
    return {
      totalReceitas,
      totalDespesas,
      totalDivida,
      totalDisponibilidade,
      mediaExecucao,
      totalRelatorios: rgfFiltrados.length
    };
  }, [rgfFiltrados]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleLimpar = () => {
    setExercicioSelecionado('all');
    setBimestreSelecionado('all');
    setSituacaoSelecionada('all');
    setDataInicio('');
    setDataFim('');
  };

  const getSituacaoBadge = (situacao: string) => {
    const badges = {
      'VIGENTE': 'bg-green-100 text-green-800',
      'RETIFICADO': 'bg-yellow-100 text-yellow-800',
      'CANCELADO': 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[situacao as keyof typeof badges]}`}>
        {situacao}
      </span>
    );
  };

  const getSituacaoIndicadorBadge = (situacao: string) => {
    const badges = {
      'ATENDIDA': 'bg-green-100 text-green-800',
      'PARCIALMENTE_ATENDIDA': 'bg-yellow-100 text-yellow-800',
      'NAO_ATENDIDA': 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[situacao as keyof typeof badges]}`}>
        {situacao.replace('_', ' ')}
      </span>
    );
  };

  const getSituacaoIndicadorIcon = (situacao: string) => {
    const icons = {
      'ATENDIDA': <CheckCircle2 className="h-4 w-4 text-green-600" />,
      'PARCIALMENTE_ATENDIDA': <AlertCircle className="h-4 w-4 text-yellow-600" />,
      'NAO_ATENDIDA': <AlertCircle className="h-4 w-4 text-red-600" />
    };
    return icons[situacao as keyof typeof icons] || <AlertCircle className="h-4 w-4 text-gray-600" />;
  };

  const handleVerRGF = (rgf: RGF) => {
    setRgfSelecionado(rgf);
  };

  const handleFecharRGF = () => {
    setRgfSelecionado(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            RGF - Relatório de Gestão Fiscal
          </h1>
          <p className="text-gray-600">
            Consulta de relatórios de gestão fiscal e indicadores da Câmara Municipal
          </p>
        </div>

        {/* Abas */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setAbaSelecionada('relatorios')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  abaSelecionada === 'relatorios'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Relatórios RGF
              </button>
              <button
                onClick={() => setAbaSelecionada('indicadores')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  abaSelecionada === 'indicadores'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Indicadores Fiscais
              </button>
            </nav>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="bg-gray-100 border-b">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Opções de filtro
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exercício
                </label>
                <Select value={exercicioSelecionado} onValueChange={setExercicioSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um exercício" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os exercícios</SelectItem>
                    {exercicios.map(exercicio => (
                      <SelectItem key={exercicio} value={exercicio}>{exercicio}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bimestre
                </label>
                <Select value={bimestreSelecionado} onValueChange={setBimestreSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um bimestre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os bimestres</SelectItem>
                    {bimestres.map(bimestre => (
                      <SelectItem key={bimestre} value={bimestre}>{bimestre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Situação
                </label>
                <Select value={situacaoSelecionada} onValueChange={setSituacaoSelecionada}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma situação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as situações</SelectItem>
                    <SelectItem value="VIGENTE">VIGENTE</SelectItem>
                    <SelectItem value="RETIFICADO">RETIFICADO</SelectItem>
                    <SelectItem value="CANCELADO">CANCELADO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de início
                </label>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de fim
                </label>
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <p className="text-sm text-gray-600 italic mb-4">
              Para usar as opções de filtro, escolha o campo para a pesquisa e clique no botão pesquisar
            </p>

            <div className="flex flex-wrap gap-3">
              <Button variant="default">
                <Search className="h-4 w-4 mr-2" />
                PESQUISAR
              </Button>
              <Button onClick={handleLimpar} variant="outline">
                LIMPAR
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                EXPORTAÇÃO
              </Button>
            </div>
          </CardContent>
        </Card>

        {abaSelecionada === 'relatorios' ? (
          <>
            {/* Estatísticas dos Relatórios */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileBarChart className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total de Relatórios</p>
                      <p className="text-2xl font-bold text-gray-900">{estatisticas.totalRelatorios}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Receitas</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(estatisticas.totalReceitas)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <TrendingDown className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Despesas</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(estatisticas.totalDespesas)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Dívida Consolidada</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(estatisticas.totalDivida)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <PieChart className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Disponibilidade</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(estatisticas.totalDisponibilidade)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mb-4">
              <p className="text-lg font-semibold text-gray-900">
                Foram encontrados {rgfFiltrados.length} relatórios RGF
              </p>
              <p className="text-sm text-gray-500 italic">
                Informações atualizadas em: {new Date().toLocaleString('pt-BR')}
              </p>
            </div>

            {/* Tabela de Relatórios RGF */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Exercício<br/>Bimestre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data Publicação
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receitas Arrecadadas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Despesas Pagas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dívida Consolidada
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Situação
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rgfFiltrados.map((rgf) => (
                      <tr key={rgf.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{rgf.exercicio}</div>
                          <div className="text-sm text-gray-500">{rgf.bimestre}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{rgf.dataPublicacao}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-green-600">
                            {formatCurrency(rgf.receitasArrecadadas)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-red-600">
                            {formatCurrency(rgf.despesasPagas)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-purple-600">
                            {formatCurrency(rgf.dividaConsolidada)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getSituacaoBadge(rgf.situacao)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleVerRGF(rgf)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-lg font-semibold text-gray-900">
                Indicadores Fiscais - Exercício 2025
              </p>
              <p className="text-sm text-gray-500 italic">
                Informações atualizadas em: {new Date().toLocaleString('pt-BR')}
              </p>
            </div>

            {/* Tabela de Indicadores */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Indicador
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor Atual
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Meta/Limite
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Situação
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {indicadoresFiltrados.map((indicador) => (
                      <tr key={indicador.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{indicador.nome}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-blue-600">
                            {indicador.valor}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-600">
                            {indicador.meta}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getSituacaoIndicadorIcon(indicador.situacao)}
                            {getSituacaoIndicadorBadge(indicador.situacao)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700 max-w-md">{indicador.descricao}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Modal de RGF */}
        {rgfSelecionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl">
              <CardHeader className="bg-gray-100 border-b">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FileBarChart className="h-6 w-6 text-blue-600" />
                  Dados do RGF
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Exercício:
                      </label>
                      <p className="text-gray-900 font-semibold">{rgfSelecionado.exercicio}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bimestre:
                      </label>
                      <p className="text-gray-900 font-semibold">{rgfSelecionado.bimestre}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Publicação:
                      </label>
                      <p className="text-gray-900 font-semibold">{rgfSelecionado.dataPublicacao}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Situação:
                      </label>
                      {getSituacaoBadge(rgfSelecionado.situacao)}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Receitas Arrecadadas:
                      </label>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(rgfSelecionado.receitasArrecadadas)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Receitas Previstas:
                      </label>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(rgfSelecionado.receitasPrevistas)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Despesas Empenhadas:
                      </label>
                      <p className="text-lg font-bold text-red-600">
                        {formatCurrency(rgfSelecionado.despesasEmpenhadas)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Despesas Liquidadas:
                      </label>
                      <p className="text-lg font-bold text-orange-600">
                        {formatCurrency(rgfSelecionado.despesasLiquidadas)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Despesas Pagas:
                      </label>
                      <p className="text-lg font-bold text-purple-600">
                        {formatCurrency(rgfSelecionado.despesasPagas)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dívida Consolidada:
                      </label>
                      <p className="text-lg font-bold text-red-600">
                        {formatCurrency(rgfSelecionado.dividaConsolidada)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dívida Flutuante:
                      </label>
                      <p className="text-lg font-bold text-yellow-600">
                        {formatCurrency(rgfSelecionado.dividaFlutuante)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Disponibilidade de Caixa:
                      </label>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(rgfSelecionado.disponibilidadeCaixa)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {rgfSelecionado.observacoes && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observações:
                    </label>
                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                      {rgfSelecionado.observacoes}
                    </p>
                  </div>
                )}
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <Button 
                      variant="outline" 
                      onClick={handleFecharRGF}
                    >
                      Voltar
                    </Button>
                    <Button>
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Relatório
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}