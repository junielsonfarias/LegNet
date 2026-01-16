'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Download, 
  Calendar,
  FileText,
  Eye,
  Building2,
  DollarSign,
  Search,
  Filter,
  UserCheck,
  UserX,
  TrendingUp,
  PieChart,
  BarChart3
} from 'lucide-react';

interface Servidor {
  id: string;
  nome: string;
  cpf: string;
  matricula: string;
  cargo: string;
  funcao: string;
  unidade: string;
  nivelEscolaridade: string;
  dataAdmissao: string;
  dataAposentadoria?: string;
  situacao: 'ATIVO' | 'APOSENTADO' | 'DEMITIDO' | 'LICENCIADO';
  salarioBase: number;
  gratificacao: number;
  outrasVantagens: number;
  totalBruto: number;
  inss: number;
  irrf: number;
  outrasDeducoes: number;
  totalDeducoes: number;
  totalLiquido: number;
}

interface FolhaPagamento {
  id: string;
  competencia: string;
  mes: string;
  ano: string;
  totalServidores: number;
  totalBruto: number;
  totalDeducoes: number;
  totalLiquido: number;
  dataProcessamento: string;
  situacao: 'PROCESSADA' | 'PENDENTE' | 'CANCELADA';
}

const servidoresMock: Servidor[] = [
  {
    id: '1',
    nome: 'JOÃO SILVA SANTOS',
    cpf: '123.456.789-00',
    matricula: '001',
    cargo: 'Vereador',
    funcao: 'Legislativa',
    unidade: 'Câmara Municipal',
    nivelEscolaridade: 'Superior Completo',
    dataAdmissao: '01/01/2021',
    situacao: 'ATIVO',
    salarioBase: 15000.00,
    gratificacao: 3000.00,
    outrasVantagens: 500.00,
    totalBruto: 18500.00,
    inss: 1480.00,
    irrf: 2775.00,
    outrasDeducoes: 245.00,
    totalDeducoes: 4500.00,
    totalLiquido: 14000.00
  },
  {
    id: '2',
    nome: 'MARIA SANTOS OLIVEIRA',
    cpf: '987.654.321-00',
    matricula: '002',
    cargo: 'Vereadora',
    funcao: 'Legislativa',
    unidade: 'Câmara Municipal',
    nivelEscolaridade: 'Superior Completo',
    dataAdmissao: '01/01/2021',
    situacao: 'ATIVO',
    salarioBase: 15000.00,
    gratificacao: 3000.00,
    outrasVantagens: 500.00,
    totalBruto: 18500.00,
    inss: 1480.00,
    irrf: 2775.00,
    outrasDeducoes: 245.00,
    totalDeducoes: 4500.00,
    totalLiquido: 14000.00
  },
  {
    id: '3',
    nome: 'PEDRO COSTA LIMA',
    cpf: '456.789.123-00',
    matricula: '003',
    cargo: 'Secretário da Mesa',
    funcao: 'Administrativa',
    unidade: 'Câmara Municipal',
    nivelEscolaridade: 'Superior Completo',
    dataAdmissao: '15/03/2020',
    situacao: 'ATIVO',
    salarioBase: 8000.00,
    gratificacao: 1600.00,
    outrasVantagens: 200.00,
    totalBruto: 9800.00,
    inss: 784.00,
    irrf: 1470.00,
    outrasDeducoes: 154.00,
    totalDeducoes: 2408.00,
    totalLiquido: 7392.00
  },
  {
    id: '4',
    nome: 'ANA LIMA RODRIGUES',
    cpf: '789.123.456-00',
    matricula: '004',
    cargo: 'Assessor Legislativo',
    funcao: 'Assessoria',
    unidade: 'Câmara Municipal',
    nivelEscolaridade: 'Superior Completo',
    dataAdmissao: '10/06/2019',
    situacao: 'ATIVO',
    salarioBase: 6000.00,
    gratificacao: 1200.00,
    outrasVantagens: 150.00,
    totalBruto: 7350.00,
    inss: 588.00,
    irrf: 1102.50,
    outrasDeducoes: 103.50,
    totalDeducoes: 1794.00,
    totalLiquido: 5556.00
  },
  {
    id: '5',
    nome: 'CARLOS FERREIRA SOUZA',
    cpf: '321.654.987-00',
    matricula: '005',
    cargo: 'Auxiliar Administrativo',
    funcao: 'Administrativa',
    unidade: 'Câmara Municipal',
    nivelEscolaridade: 'Ensino Médio Completo',
    dataAdmissao: '05/09/2018',
    situacao: 'ATIVO',
    salarioBase: 3000.00,
    gratificacao: 600.00,
    outrasVantagens: 100.00,
    totalBruto: 3700.00,
    inss: 296.00,
    irrf: 555.00,
    outrasDeducoes: 49.00,
    totalDeducoes: 900.00,
    totalLiquido: 2800.00
  }
];

const folhasMock: FolhaPagamento[] = [
  {
    id: '1',
    competencia: '07/2025',
    mes: 'Julho',
    ano: '2025',
    totalServidores: 5,
    totalBruto: 57450.00,
    totalDeducoes: 13902.00,
    totalLiquido: 43548.00,
    dataProcessamento: '31/07/2025',
    situacao: 'PROCESSADA'
  },
  {
    id: '2',
    competencia: '06/2025',
    mes: 'Junho',
    ano: '2025',
    totalServidores: 5,
    totalBruto: 57450.00,
    totalDeducoes: 13902.00,
    totalLiquido: 43548.00,
    dataProcessamento: '30/06/2025',
    situacao: 'PROCESSADA'
  },
  {
    id: '3',
    competencia: '05/2025',
    mes: 'Maio',
    ano: '2025',
    totalServidores: 5,
    totalBruto: 57450.00,
    totalDeducoes: 13902.00,
    totalLiquido: 43548.00,
    dataProcessamento: '31/05/2025',
    situacao: 'PROCESSADA'
  }
];

export default function FolhaPagamentoPage() {
  const [periodo, setPeriodo] = useState('');
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [matricula, setMatricula] = useState('');
  const [cargo, setCargo] = useState('');
  const [funcao, setFuncao] = useState('');
  const [unidade, setUnidade] = useState('');
  const [situacaoSelecionada, setSituacaoSelecionada] = useState('all');
  const [competencia, setCompetencia] = useState('');
  const [mesSelecionado, setMesSelecionado] = useState('all');
  const [anoSelecionado, setAnoSelecionado] = useState('all');
  const [abaSelecionada, setAbaSelecionada] = useState<'servidores' | 'folhas'>('servidores');
  const [servidorSelecionado, setServidorSelecionado] = useState<Servidor | null>(null);

  const anos = useMemo(() => {
    const anosSet = new Set(folhasMock.map(f => f.ano));
    return Array.from(anosSet).sort((a, b) => parseInt(b) - parseInt(a));
  }, []);

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const servidoresFiltrados = useMemo(() => {
    return servidoresMock.filter(servidor => {
      const matchesPeriodo = periodo === '' || servidor.dataAdmissao.includes(periodo);
      const matchesNome = nome === '' || servidor.nome.toLowerCase().includes(nome.toLowerCase());
      const matchesCpf = cpf === '' || servidor.cpf.includes(cpf);
      const matchesMatricula = matricula === '' || servidor.matricula.includes(matricula);
      const matchesCargo = cargo === '' || servidor.cargo.toLowerCase().includes(cargo.toLowerCase());
      const matchesFuncao = funcao === '' || servidor.funcao.toLowerCase().includes(funcao.toLowerCase());
      const matchesUnidade = unidade === '' || servidor.unidade.toLowerCase().includes(unidade.toLowerCase());
      const matchesSituacao = situacaoSelecionada === 'all' || servidor.situacao === situacaoSelecionada;
      
      return matchesPeriodo && matchesNome && matchesCpf && matchesMatricula && 
             matchesCargo && matchesFuncao && matchesUnidade && matchesSituacao;
    });
  }, [periodo, nome, cpf, matricula, cargo, funcao, unidade, situacaoSelecionada]);

  const folhasFiltradas = useMemo(() => {
    return folhasMock.filter(folha => {
      const matchesCompetencia = competencia === '' || folha.competencia.includes(competencia);
      const matchesMes = mesSelecionado === 'all' || folha.mes === mesSelecionado;
      const matchesAno = anoSelecionado === 'all' || folha.ano === anoSelecionado;
      
      return matchesCompetencia && matchesMes && matchesAno;
    });
  }, [competencia, mesSelecionado, anoSelecionado]);

  const estatisticas = useMemo(() => {
    const totalServidores = servidoresFiltrados.length;
    const ativos = servidoresFiltrados.filter(s => s.situacao === 'ATIVO').length;
    const aposentados = servidoresFiltrados.filter(s => s.situacao === 'APOSENTADO').length;
    const totalBruto = servidoresFiltrados.reduce((sum, s) => sum + s.totalBruto, 0);
    const totalLiquido = servidoresFiltrados.reduce((sum, s) => sum + s.totalLiquido, 0);
    const totalDeducoes = servidoresFiltrados.reduce((sum, s) => sum + s.totalDeducoes, 0);
    
    return {
      totalServidores,
      ativos,
      aposentados,
      totalBruto,
      totalLiquido,
      totalDeducoes,
      mediaSalarial: totalServidores > 0 ? totalBruto / totalServidores : 0
    };
  }, [servidoresFiltrados]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleLimpar = () => {
    setPeriodo('');
    setNome('');
    setCpf('');
    setMatricula('');
    setCargo('');
    setFuncao('');
    setUnidade('');
    setSituacaoSelecionada('all');
    setCompetencia('');
    setMesSelecionado('all');
    setAnoSelecionado('all');
  };

  const getSituacaoBadge = (situacao: string) => {
    const badges = {
      'ATIVO': 'bg-green-100 text-green-800',
      'APOSENTADO': 'bg-blue-100 text-blue-800',
      'DEMITIDO': 'bg-red-100 text-red-800',
      'LICENCIADO': 'bg-yellow-100 text-yellow-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[situacao as keyof typeof badges]}`}>
        {situacao}
      </span>
    );
  };

  const getSituacaoIcon = (situacao: string) => {
    const icons = {
      'ATIVO': <UserCheck className="h-4 w-4 text-green-600" />,
      'APOSENTADO': <UserCheck className="h-4 w-4 text-blue-600" />,
      'DEMITIDO': <UserX className="h-4 w-4 text-red-600" />,
      'LICENCIADO': <UserX className="h-4 w-4 text-yellow-600" />
    };
    return icons[situacao as keyof typeof icons] || <UserCheck className="h-4 w-4 text-gray-600" />;
  };

  const handleVerServidor = (servidor: Servidor) => {
    setServidorSelecionado(servidor);
  };

  const handleFecharServidor = () => {
    setServidorSelecionado(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Folha de Pagamento
          </h1>
          <p className="text-gray-600">
            Consulta de servidores e folhas de pagamento da Câmara Municipal
          </p>
        </div>

        {/* Abas */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setAbaSelecionada('servidores')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  abaSelecionada === 'servidores'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Servidores
              </button>
              <button
                onClick={() => setAbaSelecionada('folhas')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  abaSelecionada === 'folhas'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Folhas de Pagamento
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
              {abaSelecionada === 'servidores' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Período
                    </label>
                    <Input
                      type="text"
                      placeholder="Digite o período"
                      value={periodo}
                      onChange={(e) => setPeriodo(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome
                    </label>
                    <Input
                      type="text"
                      placeholder="Digite o nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CPF
                    </label>
                    <Input
                      type="text"
                      placeholder="Digite o CPF"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Matrícula
                    </label>
                    <Input
                      type="text"
                      placeholder="Digite a matrícula"
                      value={matricula}
                      onChange={(e) => setMatricula(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cargo
                    </label>
                    <Input
                      type="text"
                      placeholder="Digite o cargo"
                      value={cargo}
                      onChange={(e) => setCargo(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Função
                    </label>
                    <Input
                      type="text"
                      placeholder="Digite a função"
                      value={funcao}
                      onChange={(e) => setFuncao(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unidade
                    </label>
                    <Input
                      type="text"
                      placeholder="Digite a unidade"
                      value={unidade}
                      onChange={(e) => setUnidade(e.target.value)}
                      className="w-full"
                    />
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
                        <SelectItem value="ATIVO">ATIVO</SelectItem>
                        <SelectItem value="APOSENTADO">APOSENTADO</SelectItem>
                        <SelectItem value="DEMITIDO">DEMITIDO</SelectItem>
                        <SelectItem value="LICENCIADO">LICENCIADO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Competência
                    </label>
                    <Input
                      type="text"
                      placeholder="Digite a competência"
                      value={competencia}
                      onChange={(e) => setCompetencia(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mês
                    </label>
                    <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um mês" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os meses</SelectItem>
                        {meses.map(mes => (
                          <SelectItem key={mes} value={mes}>{mes}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ano
                    </label>
                    <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um ano" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os anos</SelectItem>
                        {anos.map(ano => (
                          <SelectItem key={ano} value={ano}>{ano}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
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

        {abaSelecionada === 'servidores' ? (
          <>
            {/* Estatísticas dos Servidores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total de Servidores</p>
                      <p className="text-2xl font-bold text-gray-900">{estatisticas.totalServidores}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <UserCheck className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Ativos</p>
                      <p className="text-2xl font-bold text-gray-900">{estatisticas.ativos}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Bruto</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(estatisticas.totalBruto)}</p>
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
                      <p className="text-sm font-medium text-gray-600">Média Salarial</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(estatisticas.mediaSalarial)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mb-4">
              <p className="text-lg font-semibold text-gray-900">
                Foram encontrados {servidoresFiltrados.length} servidores
              </p>
              <p className="text-sm text-gray-500 italic">
                Informações atualizadas em: {new Date().toLocaleString('pt-BR')}
              </p>
            </div>

            {/* Tabela de Servidores */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome<br/>CPF
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Matrícula<br/>Cargo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Função<br/>Unidade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data Admissão
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Salário Bruto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Salário Líquido
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
                    {servidoresFiltrados.map((servidor) => (
                      <tr key={servidor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{servidor.nome}</div>
                          <div className="text-sm text-gray-500">{servidor.cpf}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{servidor.matricula}</div>
                          <div className="text-sm text-gray-500">{servidor.cargo}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{servidor.funcao}</div>
                          <div className="text-sm text-gray-500">{servidor.unidade}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{servidor.dataAdmissao}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-blue-600">
                            {formatCurrency(servidor.totalBruto)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-green-600">
                            {formatCurrency(servidor.totalLiquido)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getSituacaoIcon(servidor.situacao)}
                            {getSituacaoBadge(servidor.situacao)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleVerServidor(servidor)}
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
                Foram encontradas {folhasFiltradas.length} folhas de pagamento
              </p>
              <p className="text-sm text-gray-500 italic">
                Informações atualizadas em: {new Date().toLocaleString('pt-BR')}
              </p>
            </div>

            {/* Tabela de Folhas */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Competência<br/>Mês/Ano
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total de Servidores
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Bruto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Deduções
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Líquido
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data Processamento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {folhasFiltradas.map((folha) => (
                      <tr key={folha.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{folha.competencia}</div>
                          <div className="text-sm text-gray-500">{folha.mes} {folha.ano}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-blue-600">{folha.totalServidores}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-purple-600">
                            {formatCurrency(folha.totalBruto)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-red-600">
                            {formatCurrency(folha.totalDeducoes)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-green-600">
                            {formatCurrency(folha.totalLiquido)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{folha.dataProcessamento}</div>
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

        {/* Modal de Servidor */}
        {servidorSelecionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl">
              <CardHeader className="bg-gray-100 border-b">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="h-6 w-6 text-blue-600" />
                  Dados do servidor
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome:
                      </label>
                      <p className="text-gray-900 font-semibold">{servidorSelecionado.nome}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CPF:
                      </label>
                      <p className="text-gray-900 font-semibold">{servidorSelecionado.cpf}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Matrícula:
                      </label>
                      <p className="text-gray-900 font-semibold">{servidorSelecionado.matricula}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cargo:
                      </label>
                      <p className="text-gray-900 font-semibold">{servidorSelecionado.cargo}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Função:
                      </label>
                      <p className="text-gray-900 font-semibold">{servidorSelecionado.funcao}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unidade:
                      </label>
                      <p className="text-gray-900 font-semibold">{servidorSelecionado.unidade}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Situação:
                      </label>
                      <div className="flex items-center gap-2">
                        {getSituacaoIcon(servidorSelecionado.situacao)}
                        {getSituacaoBadge(servidorSelecionado.situacao)}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Admissão:
                      </label>
                      <p className="text-gray-900 font-semibold">{servidorSelecionado.dataAdmissao}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nível de Escolaridade:
                      </label>
                      <p className="text-gray-900 font-semibold">{servidorSelecionado.nivelEscolaridade}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Salário Base:
                      </label>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(servidorSelecionado.salarioBase)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Bruto:
                      </label>
                      <p className="text-lg font-bold text-purple-600">
                        {formatCurrency(servidorSelecionado.totalBruto)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Líquido:
                      </label>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(servidorSelecionado.totalLiquido)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <Button 
                      variant="outline" 
                      onClick={handleFecharServidor}
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