'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Download, 
  Calendar,
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
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface LOA {
  id: string;
  exercicio: string;
  dataPublicacao: string;
  situacao: 'VIGENTE' | 'RETIFICADA' | 'CANCELADA';
  receitasPrevistas: number;
  despesasPrevistas: number;
  saldoOrcamentario: number;
  observacoes?: string;
}

interface CategoriaReceita {
  id: string;
  codigo: string;
  descricao: string;
  valorPrevisto: number;
  valorArrecadado: number;
  percentualExecucao: number;
}

interface CategoriaDespesa {
  id: string;
  codigo: string;
  descricao: string;
  valorPrevisto: number;
  valorEmpenhado: number;
  valorLiquidado: number;
  valorPago: number;
  percentualExecucao: number;
}

const loaMock: LOA[] = [
  {
    id: '1',
    exercicio: '2025',
    dataPublicacao: '31/12/2024',
    situacao: 'VIGENTE',
    receitasPrevistas: 15000000.00,
    despesasPrevistas: 14500000.00,
    saldoOrcamentario: 500000.00,
    observacoes: 'Lei Orçamentária Anual de 2025 aprovada pela Câmara Municipal'
  },
  {
    id: '2',
    exercicio: '2024',
    dataPublicacao: '31/12/2023',
    situacao: 'VIGENTE',
    receitasPrevistas: 14000000.00,
    despesasPrevistas: 13500000.00,
    saldoOrcamentario: 500000.00,
    observacoes: 'Lei Orçamentária Anual de 2024 executada com sucesso'
  }
];

const categoriasReceitaMock: CategoriaReceita[] = [
  {
    id: '1',
    codigo: '1.1.1.01.01',
    descricao: 'Impostos sobre o Patrimônio e a Renda',
    valorPrevisto: 2000000.00,
    valorArrecadado: 1800000.00,
    percentualExecucao: 90.0
  },
  {
    id: '2',
    codigo: '1.1.2.01.01',
    descricao: 'Impostos sobre a Produção e Circulação',
    valorPrevisto: 3000000.00,
    valorArrecadado: 2850000.00,
    percentualExecucao: 95.0
  },
  {
    id: '3',
    codigo: '1.2.1.01.01',
    descricao: 'Taxas pelo Poder de Polícia',
    valorPrevisto: 500000.00,
    valorArrecadado: 480000.00,
    percentualExecucao: 96.0
  },
  {
    id: '4',
    codigo: '1.2.2.01.01',
    descricao: 'Taxas pela Prestação de Serviços',
    valorPrevisto: 800000.00,
    valorArrecadado: 750000.00,
    percentualExecucao: 93.8
  },
  {
    id: '5',
    codigo: '1.3.1.01.01',
    descricao: 'Contribuições de Melhoria',
    valorPrevisto: 200000.00,
    valorArrecadado: 150000.00,
    percentualExecucao: 75.0
  }
];

const categoriasDespesaMock: CategoriaDespesa[] = [
  {
    id: '1',
    codigo: '3.1.1.01.01',
    descricao: 'Pessoal e Encargos Sociais',
    valorPrevisto: 8000000.00,
    valorEmpenhado: 7800000.00,
    valorLiquidado: 7600000.00,
    valorPago: 7500000.00,
    percentualExecucao: 93.8
  },
  {
    id: '2',
    codigo: '3.1.2.01.01',
    descricao: 'Juros e Encargos da Dívida',
    valorPrevisto: 500000.00,
    valorEmpenhado: 480000.00,
    valorLiquidado: 470000.00,
    valorPago: 460000.00,
    percentualExecucao: 92.0
  },
  {
    id: '3',
    codigo: '3.2.1.01.01',
    descricao: 'Material de Consumo',
    valorPrevisto: 1000000.00,
    valorEmpenhado: 950000.00,
    valorLiquidado: 900000.00,
    valorPago: 850000.00,
    percentualExecucao: 85.0
  },
  {
    id: '4',
    codigo: '3.2.2.01.01',
    descricao: 'Serviços de Terceiros',
    valorPrevisto: 2000000.00,
    valorEmpenhado: 1800000.00,
    valorLiquidado: 1700000.00,
    valorPago: 1600000.00,
    percentualExecucao: 80.0
  },
  {
    id: '5',
    codigo: '3.2.3.01.01',
    descricao: 'Obras e Instalações',
    valorPrevisto: 3000000.00,
    valorEmpenhado: 2500000.00,
    valorLiquidado: 2000000.00,
    valorPago: 1800000.00,
    percentualExecucao: 60.0
  }
];

export default function LOAPage() {
  const [exercicioSelecionado, setExercicioSelecionado] = useState('2025');
  const [abaSelecionada, setAbaSelecionada] = useState<'resumo' | 'receitas' | 'despesas'>('resumo');
  const [loaSelecionada, setLoaSelecionada] = useState<LOA | null>(null);

  const exercicios = useMemo(() => {
    const exerciciosSet = new Set(loaMock.map(l => l.exercicio));
    return Array.from(exerciciosSet).sort((a, b) => parseInt(b) - parseInt(a));
  }, []);

  const loaAtual = useMemo(() => {
    return loaMock.find(l => l.exercicio === exercicioSelecionado);
  }, [exercicioSelecionado]);

  const estatisticas = useMemo(() => {
    if (!loaAtual) return null;
    
    const totalReceitasPrevistas = categoriasReceitaMock.reduce((sum, r) => sum + r.valorPrevisto, 0);
    const totalReceitasArrecadadas = categoriasReceitaMock.reduce((sum, r) => sum + r.valorArrecadado, 0);
    const totalDespesasPrevistas = categoriasDespesaMock.reduce((sum, d) => sum + d.valorPrevisto, 0);
    const totalDespesasPagas = categoriasDespesaMock.reduce((sum, d) => sum + d.valorPago, 0);
    
    return {
      totalReceitasPrevistas,
      totalReceitasArrecadadas,
      totalDespesasPrevistas,
      totalDespesasPagas,
      percentualReceitas: totalReceitasPrevistas > 0 ? (totalReceitasArrecadadas / totalReceitasPrevistas) * 100 : 0,
      percentualDespesas: totalDespesasPrevistas > 0 ? (totalDespesasPagas / totalDespesasPrevistas) * 100 : 0,
      saldoOrcamentario: loaAtual.saldoOrcamentario
    };
  }, [loaAtual]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getSituacaoBadge = (situacao: string) => {
    const badges = {
      'VIGENTE': 'bg-green-100 text-green-800',
      'RETIFICADA': 'bg-yellow-100 text-yellow-800',
      'CANCELADA': 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[situacao as keyof typeof badges]}`}>
        {situacao}
      </span>
    );
  };

  const getPercentualBadge = (percentual: number) => {
    if (percentual >= 90) {
      return 'bg-green-100 text-green-800';
    } else if (percentual >= 70) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-red-100 text-red-800';
    }
  };

  const handleVerLOA = (loa: LOA) => {
    setLoaSelecionada(loa);
  };

  const handleFecharLOA = () => {
    setLoaSelecionada(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            LOA - Lei Orçamentária Anual
          </h1>
          <p className="text-gray-600">
            Consulta da Lei Orçamentária Anual da Câmara Municipal
          </p>
        </div>

        {/* Filtro de Exercício */}
        <Card className="mb-6">
          <CardHeader className="bg-gray-100 border-b">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exercício
                </label>
                <Select value={exercicioSelecionado} onValueChange={setExercicioSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um exercício" />
                  </SelectTrigger>
                  <SelectContent>
                    {exercicios.map(exercicio => (
                      <SelectItem key={exercicio} value={exercicio}>{exercicio}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Abas */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setAbaSelecionada('resumo')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  abaSelecionada === 'resumo'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Resumo Executivo
              </button>
              <button
                onClick={() => setAbaSelecionada('receitas')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  abaSelecionada === 'receitas'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Receitas
              </button>
              <button
                onClick={() => setAbaSelecionada('despesas')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  abaSelecionada === 'despesas'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Despesas
              </button>
            </nav>
          </div>
        </div>

        {abaSelecionada === 'resumo' && loaAtual && (
          <>
            {/* Estatísticas do Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Receitas Previstas</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(estatisticas?.totalReceitasPrevistas || 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Receitas Arrecadadas</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(estatisticas?.totalReceitasArrecadadas || 0)}</p>
                      <p className="text-xs text-gray-500">{estatisticas?.percentualReceitas.toFixed(1)}% do previsto</p>
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
                      <p className="text-sm font-medium text-gray-600">Despesas Previstas</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(estatisticas?.totalDespesasPrevistas || 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <PieChart className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Despesas Pagas</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(estatisticas?.totalDespesasPagas || 0)}</p>
                      <p className="text-xs text-gray-500">{estatisticas?.percentualDespesas.toFixed(1)}% do previsto</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resumo da LOA */}
            <Card className="mb-6">
              <CardHeader className="bg-gray-100 border-b">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resumo da LOA {loaAtual.exercicio}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Exercício:
                      </label>
                      <p className="text-gray-900 font-semibold">{loaAtual.exercicio}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Publicação:
                      </label>
                      <p className="text-gray-900 font-semibold">{loaAtual.dataPublicacao}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Situação:
                      </label>
                      {getSituacaoBadge(loaAtual.situacao)}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Receitas Previstas:
                      </label>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(loaAtual.receitasPrevistas)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Despesas Previstas:
                      </label>
                      <p className="text-lg font-bold text-red-600">
                        {formatCurrency(loaAtual.despesasPrevistas)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Saldo Orçamentário:
                      </label>
                      <p className="text-lg font-bold text-purple-600">
                        {formatCurrency(loaAtual.saldoOrcamentario)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {loaAtual.observacoes && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observações:
                    </label>
                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                      {loaAtual.observacoes}
                    </p>
                  </div>
                )}
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <Button 
                      variant="outline"
                      onClick={() => handleVerLOA(loaAtual)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                    <div className="flex gap-3">
                      <Button variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visualizar LOA
                      </Button>
                      <Button>
                        <Download className="h-4 w-4 mr-2" />
                        Baixar LOA
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {abaSelecionada === 'receitas' && (
          <>
            <div className="mb-4">
              <p className="text-lg font-semibold text-gray-900">
                Categorias de Receitas - Exercício {exercicioSelecionado}
              </p>
              <p className="text-sm text-gray-500 italic">
                Informações atualizadas em: {new Date().toLocaleString('pt-BR')}
              </p>
            </div>

            {/* Tabela de Receitas */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor Previsto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor Arrecadado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        % Execução
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categoriasReceitaMock.map((receita) => (
                      <tr key={receita.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{receita.codigo}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{receita.descricao}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-blue-600">
                            {formatCurrency(receita.valorPrevisto)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-green-600">
                            {formatCurrency(receita.valorArrecadado)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPercentualBadge(receita.percentualExecucao)}`}>
                            {receita.percentualExecucao.toFixed(1)}%
                          </span>
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

        {abaSelecionada === 'despesas' && (
          <>
            <div className="mb-4">
              <p className="text-lg font-semibold text-gray-900">
                Categorias de Despesas - Exercício {exercicioSelecionado}
              </p>
              <p className="text-sm text-gray-500 italic">
                Informações atualizadas em: {new Date().toLocaleString('pt-BR')}
              </p>
            </div>

            {/* Tabela de Despesas */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor Previsto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor Empenhado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor Pago
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        % Execução
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categoriasDespesaMock.map((despesa) => (
                      <tr key={despesa.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{despesa.codigo}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{despesa.descricao}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-blue-600">
                            {formatCurrency(despesa.valorPrevisto)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-orange-600">
                            {formatCurrency(despesa.valorEmpenhado)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-green-600">
                            {formatCurrency(despesa.valorPago)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPercentualBadge(despesa.percentualExecucao)}`}>
                            {despesa.percentualExecucao.toFixed(1)}%
                          </span>
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

        {/* Modal de LOA */}
        {loaSelecionada && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl">
              <CardHeader className="bg-gray-100 border-b">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  Detalhes da LOA {loaSelecionada.exercicio}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Exercício:
                      </label>
                      <p className="text-gray-900 font-semibold">{loaSelecionada.exercicio}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Publicação:
                      </label>
                      <p className="text-gray-900 font-semibold">{loaSelecionada.dataPublicacao}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Situação:
                      </label>
                      {getSituacaoBadge(loaSelecionada.situacao)}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Receitas Previstas:
                      </label>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(loaSelecionada.receitasPrevistas)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Despesas Previstas:
                      </label>
                      <p className="text-lg font-bold text-red-600">
                        {formatCurrency(loaSelecionada.despesasPrevistas)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Saldo Orçamentário:
                      </label>
                      <p className="text-lg font-bold text-purple-600">
                        {formatCurrency(loaSelecionada.saldoOrcamentario)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {loaSelecionada.observacoes && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observações:
                    </label>
                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                      {loaSelecionada.observacoes}
                    </p>
                  </div>
                )}
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <Button 
                      variant="outline" 
                      onClick={handleFecharLOA}
                    >
                      Voltar
                    </Button>
                    <div className="flex gap-3">
                      <Button variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visualizar LOA
                      </Button>
                      <Button>
                        <Download className="h-4 w-4 mr-2" />
                        Baixar LOA
                      </Button>
                    </div>
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