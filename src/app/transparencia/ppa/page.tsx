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
  FileBarChart,
  MapPin,
  Users
} from 'lucide-react';

interface PPA {
  id: string;
  periodo: string;
  dataPublicacao: string;
  situacao: 'VIGENTE' | 'RETIFICADO' | 'CANCELADO';
  valorTotalPrevisto: number;
  valorTotalExecutado: number;
  percentualExecucao: number;
  observacoes?: string;
}

interface EixoEstrategico {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  valorPrevisto: number;
  valorExecutado: number;
  percentualExecucao: number;
  status: 'EM_EXECUCAO' | 'CONCLUIDO' | 'SUSPENSO';
}

interface Programa {
  id: string;
  codigo: string;
  nome: string;
  objetivo: string;
  eixoEstrategico: string;
  valorPrevisto: number;
  valorExecutado: number;
  percentualExecucao: number;
  status: 'EM_EXECUCAO' | 'CONCLUIDO' | 'SUSPENSO';
}

interface Acao {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  programa: string;
  valorPrevisto: number;
  valorExecutado: number;
  percentualExecucao: number;
  status: 'EM_EXECUCAO' | 'CONCLUIDO' | 'SUSPENSO';
}

const ppaMock: PPA[] = [
  {
    id: '1',
    periodo: '2024-2027',
    dataPublicacao: '31/12/2023',
    situacao: 'VIGENTE',
    valorTotalPrevisto: 60000000.00,
    valorTotalExecutado: 18000000.00,
    percentualExecucao: 30.0,
    observacoes: 'Plano Plurianual 2024-2027 em execução com foco na modernização e transparência'
  },
  {
    id: '2',
    periodo: '2020-2023',
    dataPublicacao: '31/12/2019',
    situacao: 'VIGENTE',
    valorTotalPrevisto: 48000000.00,
    valorTotalExecutado: 48000000.00,
    percentualExecucao: 100.0,
    observacoes: 'Plano Plurianual 2020-2023 concluído com sucesso'
  }
];

const eixosEstrategicosMock: EixoEstrategico[] = [
  {
    id: '1',
    codigo: '01',
    nome: 'Modernização e Transparência',
    descricao: 'Modernizar os processos legislativos e administrativos, promovendo transparência e controle social',
    valorPrevisto: 25000000.00,
    valorExecutado: 7500000.00,
    percentualExecucao: 30.0,
    status: 'EM_EXECUCAO'
  },
  {
    id: '2',
    codigo: '02',
    nome: 'Desenvolvimento Institucional',
    descricao: 'Fortalecer a capacidade institucional da Câmara Municipal',
    valorPrevisto: 20000000.00,
    valorExecutado: 6000000.00,
    percentualExecucao: 30.0,
    status: 'EM_EXECUCAO'
  },
  {
    id: '3',
    codigo: '03',
    nome: 'Participação Cidadã',
    descricao: 'Ampliar e qualificar a participação da sociedade nas decisões legislativas',
    valorPrevisto: 15000000.00,
    valorExecutado: 4500000.00,
    percentualExecucao: 30.0,
    status: 'EM_EXECUCAO'
  }
];

const programasMock: Programa[] = [
  {
    id: '1',
    codigo: '01.01',
    nome: 'Programa de Modernização Legislativa',
    objetivo: 'Modernizar os processos legislativos e administrativos da Câmara',
    eixoEstrategico: 'Modernização e Transparência',
    valorPrevisto: 15000000.00,
    valorExecutado: 4500000.00,
    percentualExecucao: 30.0,
    status: 'EM_EXECUCAO'
  },
  {
    id: '2',
    codigo: '01.02',
    nome: 'Programa de Transparência e Controle Social',
    objetivo: 'Fortalecer a transparência e o controle social na gestão pública',
    eixoEstrategico: 'Modernização e Transparência',
    valorPrevisto: 10000000.00,
    valorExecutado: 3000000.00,
    percentualExecucao: 30.0,
    status: 'EM_EXECUCAO'
  },
  {
    id: '3',
    codigo: '02.01',
    nome: 'Programa de Capacitação de Servidores',
    objetivo: 'Capacitar servidores para melhorar a qualidade dos serviços',
    eixoEstrategico: 'Desenvolvimento Institucional',
    valorPrevisto: 12000000.00,
    valorExecutado: 3600000.00,
    percentualExecucao: 30.0,
    status: 'EM_EXECUCAO'
  },
  {
    id: '4',
    codigo: '02.02',
    nome: 'Programa de Infraestrutura',
    objetivo: 'Melhorar a infraestrutura física da Câmara Municipal',
    eixoEstrategico: 'Desenvolvimento Institucional',
    valorPrevisto: 8000000.00,
    valorExecutado: 2400000.00,
    percentualExecucao: 30.0,
    status: 'EM_EXECUCAO'
  },
  {
    id: '5',
    codigo: '03.01',
    nome: 'Programa de Participação Cidadã',
    objetivo: 'Ampliar e qualificar a participação da sociedade nas decisões legislativas',
    eixoEstrategico: 'Participação Cidadã',
    valorPrevisto: 15000000.00,
    valorExecutado: 4500000.00,
    percentualExecucao: 30.0,
    status: 'EM_EXECUCAO'
  }
];

const acoesMock: Acao[] = [
  {
    id: '1',
    codigo: '01.01.01',
    nome: 'Modernização do Sistema Legislativo',
    descricao: 'Implementar sistema informatizado para gestão legislativa',
    programa: 'Programa de Modernização Legislativa',
    valorPrevisto: 8000000.00,
    valorExecutado: 2400000.00,
    percentualExecucao: 30.0,
    status: 'EM_EXECUCAO'
  },
  {
    id: '2',
    codigo: '01.01.02',
    nome: 'Digitalização de Processos',
    descricao: 'Digitalizar processos administrativos e legislativos',
    programa: 'Programa de Modernização Legislativa',
    valorPrevisto: 7000000.00,
    valorExecutado: 2100000.00,
    percentualExecucao: 30.0,
    status: 'EM_EXECUCAO'
  },
  {
    id: '3',
    codigo: '01.02.01',
    nome: 'Portal da Transparência',
    descricao: 'Desenvolver e manter portal da transparência',
    programa: 'Programa de Transparência e Controle Social',
    valorPrevisto: 5000000.00,
    valorExecutado: 1500000.00,
    percentualExecucao: 30.0,
    status: 'EM_EXECUCAO'
  },
  {
    id: '4',
    codigo: '01.02.02',
    nome: 'Sistema de Controle Interno',
    descricao: 'Implementar sistema de controle interno',
    programa: 'Programa de Transparência e Controle Social',
    valorPrevisto: 5000000.00,
    valorExecutado: 1500000.00,
    percentualExecucao: 30.0,
    status: 'EM_EXECUCAO'
  },
  {
    id: '5',
    codigo: '02.01.01',
    nome: 'Capacitação em Gestão Pública',
    descricao: 'Capacitar servidores em gestão pública moderna',
    programa: 'Programa de Capacitação de Servidores',
    valorPrevisto: 6000000.00,
    valorExecutado: 1800000.00,
    percentualExecucao: 30.0,
    status: 'EM_EXECUCAO'
  },
  {
    id: '6',
    codigo: '02.01.02',
    nome: 'Capacitação em Tecnologia',
    descricao: 'Capacitar servidores em tecnologias da informação',
    programa: 'Programa de Capacitação de Servidores',
    valorPrevisto: 6000000.00,
    valorExecutado: 1800000.00,
    percentualExecucao: 30.0,
    status: 'EM_EXECUCAO'
  },
  {
    id: '7',
    codigo: '02.02.01',
    nome: 'Reforma da Sede',
    descricao: 'Reformar e modernizar a sede da Câmara Municipal',
    programa: 'Programa de Infraestrutura',
    valorPrevisto: 8000000.00,
    valorExecutado: 2400000.00,
    percentualExecucao: 30.0,
    status: 'EM_EXECUCAO'
  },
  {
    id: '8',
    codigo: '03.01.01',
    nome: 'Audiências Públicas',
    descricao: 'Realizar audiências públicas para participação cidadã',
    programa: 'Programa de Participação Cidadã',
    valorPrevisto: 7500000.00,
    valorExecutado: 2250000.00,
    percentualExecucao: 30.0,
    status: 'EM_EXECUCAO'
  },
  {
    id: '9',
    codigo: '03.01.02',
    nome: 'Consultas Públicas',
    descricao: 'Implementar sistema de consultas públicas online',
    programa: 'Programa de Participação Cidadã',
    valorPrevisto: 7500000.00,
    valorExecutado: 2250000.00,
    percentualExecucao: 30.0,
    status: 'EM_EXECUCAO'
  }
];

export default function PPAPage() {
  const [periodoSelecionado, setPeriodoSelecionado] = useState('2024-2027');
  const [abaSelecionada, setAbaSelecionada] = useState<'resumo' | 'eixos' | 'programas' | 'acoes'>('resumo');
  const [ppaSelecionado, setPpaSelecionado] = useState<PPA | null>(null);

  const periodos = useMemo(() => {
    const periodosSet = new Set(ppaMock.map(p => p.periodo));
    return Array.from(periodosSet).sort();
  }, []);

  const ppaAtual = useMemo(() => {
    return ppaMock.find(p => p.periodo === periodoSelecionado);
  }, [periodoSelecionado]);

  const estatisticas = useMemo(() => {
    if (!ppaAtual) return null;
    
    const totalEixos = eixosEstrategicosMock.length;
    const eixosEmExecucao = eixosEstrategicosMock.filter(e => e.status === 'EM_EXECUCAO').length;
    const totalProgramas = programasMock.length;
    const programasEmExecucao = programasMock.filter(p => p.status === 'EM_EXECUCAO').length;
    const totalAcoes = acoesMock.length;
    const acoesEmExecucao = acoesMock.filter(a => a.status === 'EM_EXECUCAO').length;
    
    return {
      totalEixos,
      eixosEmExecucao,
      totalProgramas,
      programasEmExecucao,
      totalAcoes,
      acoesEmExecucao,
      valorTotalPrevisto: ppaAtual.valorTotalPrevisto,
      valorTotalExecutado: ppaAtual.valorTotalExecutado,
      percentualExecucao: ppaAtual.percentualExecucao
    };
  }, [ppaAtual]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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

  const getStatusBadge = (status: string) => {
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

  const handleVerPPA = (ppa: PPA) => {
    setPpaSelecionado(ppa);
  };

  const handleFecharPPA = () => {
    setPpaSelecionado(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            PPA - Plano Plurianual
          </h1>
          <p className="text-gray-600">
            Consulta do Plano Plurianual da Câmara Municipal
          </p>
        </div>

        {/* Filtro de Período */}
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
                  Período
                </label>
                <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um período" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodos.map(periodo => (
                      <SelectItem key={periodo} value={periodo}>{periodo}</SelectItem>
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
                onClick={() => setAbaSelecionada('eixos')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  abaSelecionada === 'eixos'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Eixos Estratégicos
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
              <button
                onClick={() => setAbaSelecionada('acoes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  abaSelecionada === 'acoes'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Ações
              </button>
            </nav>
          </div>
        </div>

        {abaSelecionada === 'resumo' && ppaAtual && (
          <>
            {/* Estatísticas do Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Target className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total de Eixos</p>
                      <p className="text-2xl font-bold text-gray-900">{estatisticas?.totalEixos || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-green-600" />
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
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <PieChart className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total de Ações</p>
                      <p className="text-2xl font-bold text-gray-900">{estatisticas?.totalAcoes || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">% Execução</p>
                      <p className="text-2xl font-bold text-gray-900">{estatisticas?.percentualExecucao.toFixed(1) || 0}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resumo do PPA */}
            <Card className="mb-6">
              <CardHeader className="bg-gray-100 border-b">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileBarChart className="h-5 w-5" />
                  Resumo do PPA {ppaAtual.periodo}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Período:
                      </label>
                      <p className="text-gray-900 font-semibold">{ppaAtual.periodo}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Publicação:
                      </label>
                      <p className="text-gray-900 font-semibold">{ppaAtual.dataPublicacao}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Situação:
                      </label>
                      {getSituacaoBadge(ppaAtual.situacao)}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor Total Previsto:
                      </label>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(ppaAtual.valorTotalPrevisto)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor Total Executado:
                      </label>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(ppaAtual.valorTotalExecutado)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Percentual de Execução:
                      </label>
                      <p className="text-lg font-bold text-purple-600">
                        {ppaAtual.percentualExecucao.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
                
                {ppaAtual.observacoes && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observações:
                    </label>
                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                      {ppaAtual.observacoes}
                    </p>
                  </div>
                )}
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <Button 
                      variant="outline"
                      onClick={() => handleVerPPA(ppaAtual)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                    <div className="flex gap-3">
                      <Button variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visualizar PPA
                      </Button>
                      <Button>
                        <Download className="h-4 w-4 mr-2" />
                        Baixar PPA
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {abaSelecionada === 'eixos' && (
          <>
            <div className="mb-4">
              <p className="text-lg font-semibold text-gray-900">
                Eixos Estratégicos - Período {periodoSelecionado}
              </p>
              <p className="text-sm text-gray-500 italic">
                Informações atualizadas em: {new Date().toLocaleString('pt-BR')}
              </p>
            </div>

            {/* Tabela de Eixos Estratégicos */}
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
                        Descrição
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
                    {eixosEstrategicosMock.map((eixo) => (
                      <tr key={eixo.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{eixo.codigo}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{eixo.nome}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700 max-w-md">{eixo.descricao}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-blue-600">
                            {formatCurrency(eixo.valorPrevisto)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-green-600">
                            {formatCurrency(eixo.valorExecutado)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPercentualBadge(eixo.percentualExecucao)}`}>
                            {eixo.percentualExecucao.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(eixo.status)}
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
            <div className="mb-4">
              <p className="text-lg font-semibold text-gray-900">
                Programas - Período {periodoSelecionado}
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
                        Eixo Estratégico
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
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700">{programa.eixoEstrategico}</div>
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
                          {getStatusBadge(programa.status)}
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

        {abaSelecionada === 'acoes' && (
          <>
            <div className="mb-4">
              <p className="text-lg font-semibold text-gray-900">
                Ações - Período {periodoSelecionado}
              </p>
              <p className="text-sm text-gray-500 italic">
                Informações atualizadas em: {new Date().toLocaleString('pt-BR')}
              </p>
            </div>

            {/* Tabela de Ações */}
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
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Programa
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
                    {acoesMock.map((acao) => (
                      <tr key={acao.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{acao.codigo}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{acao.nome}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700 max-w-md">{acao.descricao}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700">{acao.programa}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-blue-600">
                            {formatCurrency(acao.valorPrevisto)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-green-600">
                            {formatCurrency(acao.valorExecutado)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPercentualBadge(acao.percentualExecucao)}`}>
                            {acao.percentualExecucao.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(acao.status)}
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

        {/* Modal de PPA */}
        {ppaSelecionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl">
              <CardHeader className="bg-gray-100 border-b">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FileBarChart className="h-6 w-6 text-blue-600" />
                  Detalhes do PPA {ppaSelecionado.periodo}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Período:
                      </label>
                      <p className="text-gray-900 font-semibold">{ppaSelecionado.periodo}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Publicação:
                      </label>
                      <p className="text-gray-900 font-semibold">{ppaSelecionado.dataPublicacao}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Situação:
                      </label>
                      {getSituacaoBadge(ppaSelecionado.situacao)}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor Total Previsto:
                      </label>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(ppaSelecionado.valorTotalPrevisto)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor Total Executado:
                      </label>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(ppaSelecionado.valorTotalExecutado)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Percentual de Execução:
                      </label>
                      <p className="text-lg font-bold text-purple-600">
                        {ppaSelecionado.percentualExecucao.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
                
                {ppaSelecionado.observacoes && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observações:
                    </label>
                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                      {ppaSelecionado.observacoes}
                    </p>
                  </div>
                )}
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <Button 
                      variant="outline" 
                      onClick={handleFecharPPA}
                    >
                      Voltar
                    </Button>
                    <div className="flex gap-3">
                      <Button variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visualizar PPA
                      </Button>
                      <Button>
                        <Download className="h-4 w-4 mr-2" />
                        Baixar PPA
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