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
  ExternalLink,
  FileBarChart
} from 'lucide-react';

interface LDO {
  id: string;
  exercicio: string;
  dataPublicacao: string;
  situacao: 'VIGENTE' | 'RETIFICADA' | 'CANCELADA';
  receitasPrevistas: number;
  despesasPrevistas: number;
  saldoOrcamentario: number;
  observacoes?: string;
}

interface MetaFiscal {
  id: string;
  descricao: string;
  valor: number;
  percentual: number;
  situacao: 'ATENDIDA' | 'PARCIALMENTE_ATENDIDA' | 'NAO_ATENDIDA';
  observacoes?: string;
}

interface Programa {
  id: string;
  codigo: string;
  nome: string;
  objetivo: string;
  valorPrevisto: number;
  valorExecutado: number;
  percentualExecucao: number;
  status: 'EM_EXECUCAO' | 'CONCLUIDO' | 'SUSPENSO';
}

const ldoMock: LDO[] = [
  {
    id: '1',
    exercicio: '2025',
    dataPublicacao: '31/12/2023',
    situacao: 'VIGENTE',
    receitasPrevistas: 15000000.00,
    despesasPrevistas: 14500000.00,
    saldoOrcamentario: 500000.00,
    observacoes: 'Lei de Diretrizes Orçamentárias de 2025 aprovada pela Câmara Municipal'
  },
  {
    id: '2',
    exercicio: '2024',
    dataPublicacao: '31/12/2022',
    situacao: 'VIGENTE',
    receitasPrevistas: 14000000.00,
    despesasPrevistas: 13500000.00,
    saldoOrcamentario: 500000.00,
    observacoes: 'Lei de Diretrizes Orçamentárias de 2024 executada com sucesso'
  }
];

const metasFiscaisMock: MetaFiscal[] = [
  {
    id: '1',
    descricao: 'Limite de Despesa com Pessoal',
    valor: 48.5,
    percentual: 54.0,
    situacao: 'ATENDIDA',
    observacoes: 'Percentual da Receita Corrente Líquida comprometida com despesas de pessoal'
  },
  {
    id: '2',
    descricao: 'Limite de Dívida Consolidada',
    valor: 85.2,
    percentual: 120.0,
    situacao: 'ATENDIDA',
    observacoes: 'Percentual da Receita Corrente Líquida comprometida com dívida consolidada'
  },
  {
    id: '3',
    descricao: 'Resultado Primário',
    valor: 2.8,
    percentual: 0.0,
    situacao: 'ATENDIDA',
    observacoes: 'Resultado primário em percentual da Receita Corrente Líquida'
  },
  {
    id: '4',
    descricao: 'Resultado Nominal',
    valor: 1.5,
    percentual: 0.0,
    situacao: 'ATENDIDA',
    observacoes: 'Resultado nominal em percentual da Receita Corrente Líquida'
  }
];

const programasMock: Programa[] = [
  {
    id: '1',
    codigo: '001',
    nome: 'Programa de Modernização Legislativa',
    objetivo: 'Modernizar os processos legislativos e administrativos da Câmara',
    valorPrevisto: 500000.00,
    valorExecutado: 450000.00,
    percentualExecucao: 90.0,
    status: 'EM_EXECUCAO'
  },
  {
    id: '2',
    codigo: '002',
    nome: 'Programa de Transparência e Controle Social',
    objetivo: 'Fortalecer a transparência e o controle social na gestão pública',
    valorPrevisto: 300000.00,
    valorExecutado: 300000.00,
    percentualExecucao: 100.0,
    status: 'CONCLUIDO'
  },
  {
    id: '3',
    codigo: '003',
    nome: 'Programa de Capacitação de Servidores',
    objetivo: 'Capacitar servidores para melhorar a qualidade dos serviços',
    valorPrevisto: 200000.00,
    valorExecutado: 150000.00,
    percentualExecucao: 75.0,
    status: 'EM_EXECUCAO'
  },
  {
    id: '4',
    codigo: '004',
    nome: 'Programa de Infraestrutura',
    objetivo: 'Melhorar a infraestrutura física da Câmara Municipal',
    valorPrevisto: 800000.00,
    valorExecutado: 600000.00,
    percentualExecucao: 75.0,
    status: 'EM_EXECUCAO'
  }
];

export default function LDOPage() {
  const [exercicioSelecionado, setExercicioSelecionado] = useState('2025');
  const [abaSelecionada, setAbaSelecionada] = useState<'resumo' | 'metas' | 'programas'>('resumo');
  const [ldoSelecionada, setLdoSelecionada] = useState<LDO | null>(null);

  const exercicios = useMemo(() => {
    const exerciciosSet = new Set(ldoMock.map(l => l.exercicio));
    return Array.from(exerciciosSet).sort((a, b) => parseInt(b) - parseInt(a));
  }, []);

  const ldoAtual = useMemo(() => {
    return ldoMock.find(l => l.exercicio === exercicioSelecionado);
  }, [exercicioSelecionado]);

  const estatisticas = useMemo(() => {
    if (!ldoAtual) return null;
    
    const totalProgramas = programasMock.length;
    const programasEmExecucao = programasMock.filter(p => p.status === 'EM_EXECUCAO').length;
    const programasConcluidos = programasMock.filter(p => p.status === 'CONCLUIDO').length;
    const totalValorPrevisto = programasMock.reduce((sum, p) => sum + p.valorPrevisto, 0);
    const totalValorExecutado = programasMock.reduce((sum, p) => sum + p.valorExecutado, 0);
    const mediaExecucao = totalProgramas > 0 ? 
      programasMock.reduce((sum, p) => sum + p.percentualExecucao, 0) / totalProgramas : 0;
    
    return {
      totalProgramas,
      programasEmExecucao,
      programasConcluidos,
      totalValorPrevisto,
      totalValorExecutado,
      mediaExecucao,
      percentualExecucaoGeral: totalValorPrevisto > 0 ? (totalValorExecutado / totalValorPrevisto) * 100 : 0
    };
  }, [ldoAtual]);

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

  const getSituacaoMetaBadge = (situacao: string) => {
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

  const getStatusProgramaBadge = (status: string) => {
    const badges = {
      'EM_EXECUCAO': 'bg-blue-100 text-blue-800',
      'CONCLUIDO': 'bg-green-100 text-green-800',
      'SUSPENSO': 'bg-yellow-100 text-yellow-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[status as keyof typeof badges]}`}>
        {status.replace('_', ' ')}
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

  const handleVerLDO = (ldo: LDO) => {
    setLdoSelecionada(ldo);
  };

  const handleFecharLDO = () => {
    setLdoSelecionada(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            LDO - Lei de Diretrizes Orçamentárias
          </h1>
          <p className="text-gray-600">
            Consulta da Lei de Diretrizes Orçamentárias da Câmara Municipal
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
                onClick={() => setAbaSelecionada('metas')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  abaSelecionada === 'metas'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Metas Fiscais
              </button>
              <button
                onClick={() => setAbaSelecionada('programas')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  abaSelecionada === 'programas'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Programas
              </button>
            </nav>
          </div>
        </div>

        {abaSelecionada === 'resumo' && ldoAtual && (
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
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(ldoAtual.receitasPrevistas)}</p>
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
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(ldoAtual.despesasPrevistas)}</p>
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
                      <p className="text-sm font-medium text-gray-600">Saldo Orçamentário</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(ldoAtual.saldoOrcamentario)}</p>
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
                      <p className="text-sm font-medium text-gray-600">Total de Programas</p>
                      <p className="text-2xl font-bold text-gray-900">{estatisticas?.totalProgramas || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resumo da LDO */}
            <Card className="mb-6">
              <CardHeader className="bg-gray-100 border-b">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileBarChart className="h-5 w-5" />
                  Resumo da LDO {ldoAtual.exercicio}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Exercício:
                      </label>
                      <p className="text-gray-900 font-semibold">{ldoAtual.exercicio}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Publicação:
                      </label>
                      <p className="text-gray-900 font-semibold">{ldoAtual.dataPublicacao}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Situação:
                      </label>
                      {getSituacaoBadge(ldoAtual.situacao)}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Receitas Previstas:
                      </label>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(ldoAtual.receitasPrevistas)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Despesas Previstas:
                      </label>
                      <p className="text-lg font-bold text-red-600">
                        {formatCurrency(ldoAtual.despesasPrevistas)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Saldo Orçamentário:
                      </label>
                      <p className="text-lg font-bold text-purple-600">
                        {formatCurrency(ldoAtual.saldoOrcamentario)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {ldoAtual.observacoes && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observações:
                    </label>
                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                      {ldoAtual.observacoes}
                    </p>
                  </div>
                )}
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <Button 
                      variant="outline"
                      onClick={() => handleVerLDO(ldoAtual)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                    <div className="flex gap-3">
                      <Button variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visualizar LDO
                      </Button>
                      <Button>
                        <Download className="h-4 w-4 mr-2" />
                        Baixar LDO
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {abaSelecionada === 'metas' && (
          <>
            <div className="mb-4">
              <p className="text-lg font-semibold text-gray-900">
                Metas Fiscais - Exercício {exercicioSelecionado}
              </p>
              <p className="text-sm text-gray-500 italic">
                Informações atualizadas em: {new Date().toLocaleString('pt-BR')}
              </p>
            </div>

            {/* Tabela de Metas Fiscais */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descrição
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
                        Observações
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {metasFiscaisMock.map((meta) => (
                      <tr key={meta.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{meta.descricao}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-blue-600">
                            {meta.valor}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-600">
                            {meta.percentual}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getSituacaoMetaBadge(meta.situacao)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700 max-w-md">{meta.observacoes}</div>
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

        {abaSelecionada === 'programas' && (
          <>
            {/* Estatísticas dos Programas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Target className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total de Programas</p>
                      <p className="text-2xl font-bold text-gray-900">{estatisticas?.totalProgramas || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Programas Concluídos</p>
                      <p className="text-2xl font-bold text-gray-900">{estatisticas?.programasConcluidos || 0}</p>
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
                      <p className="text-sm font-medium text-gray-600">Valor Previsto</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(estatisticas?.totalValorPrevisto || 0)}</p>
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
                      <p className="text-sm font-medium text-gray-600">% Execução Geral</p>
                      <p className="text-2xl font-bold text-gray-900">{estatisticas?.percentualExecucaoGeral.toFixed(1) || 0}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mb-4">
              <p className="text-lg font-semibold text-gray-900">
                Programas - Exercício {exercicioSelecionado}
              </p>
              <p className="text-sm text-gray-500 italic">
                Informações atualizadas em: {new Date().toLocaleString('pt-BR')}
              </p>
            </div>

            {/* Tabela de Programas */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Objetivo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor Previsto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor Executado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        % Execução
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {programasMock.map((programa) => (
                      <tr key={programa.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{programa.codigo}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{programa.nome}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700 max-w-md">{programa.objetivo}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-blue-600">
                            {formatCurrency(programa.valorPrevisto)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-green-600">
                            {formatCurrency(programa.valorExecutado)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPercentualBadge(programa.percentualExecucao)}`}>
                            {programa.percentualExecucao.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusProgramaBadge(programa.status)}
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

        {/* Modal de LDO */}
        {ldoSelecionada && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl">
              <CardHeader className="bg-gray-100 border-b">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FileBarChart className="h-6 w-6 text-blue-600" />
                  Detalhes da LDO {ldoSelecionada.exercicio}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Exercício:
                      </label>
                      <p className="text-gray-900 font-semibold">{ldoSelecionada.exercicio}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Publicação:
                      </label>
                      <p className="text-gray-900 font-semibold">{ldoSelecionada.dataPublicacao}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Situação:
                      </label>
                      {getSituacaoBadge(ldoSelecionada.situacao)}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Receitas Previstas:
                      </label>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(ldoSelecionada.receitasPrevistas)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Despesas Previstas:
                      </label>
                      <p className="text-lg font-bold text-red-600">
                        {formatCurrency(ldoSelecionada.despesasPrevistas)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Saldo Orçamentário:
                      </label>
                      <p className="text-lg font-bold text-purple-600">
                        {formatCurrency(ldoSelecionada.saldoOrcamentario)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {ldoSelecionada.observacoes && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observações:
                    </label>
                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                      {ldoSelecionada.observacoes}
                    </p>
                  </div>
                )}
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <Button 
                      variant="outline" 
                      onClick={handleFecharLDO}
                    >
                      Voltar
                    </Button>
                    <div className="flex gap-3">
                      <Button variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visualizar LDO
                      </Button>
                      <Button>
                        <Download className="h-4 w-4 mr-2" />
                        Baixar LDO
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