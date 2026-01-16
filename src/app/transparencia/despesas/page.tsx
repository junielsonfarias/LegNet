'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard, 
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
  Minus
} from 'lucide-react';

interface Despesa {
  id: string;
  numeroEmpenho: string;
  dataEmpenho: string;
  credor: string;
  cpfCnpj: string;
  valorEmpenho: number;
  valorLiquidado: number;
  valorPago: number;
  saldo: number;
  unidadeOrcamentaria: string;
  elementoDespesa: string;
  subelementoDespesa: string;
  funcao: string;
  subfuncao: string;
  programa: string;
  acao: string;
  fonteRecurso: string;
  licitacao?: string;
  numeroContrato?: string;
  numeroConvenio?: string;
  situacao: 'EMITIDO' | 'LIQUIDADO' | 'PAGO' | 'CANCELADO';
  observacoes?: string;
}

const despesasMock: Despesa[] = [
  {
    id: '1',
    numeroEmpenho: '2025NE000001',
    dataEmpenho: '15/07/2025',
    credor: 'JAMILSON DIAS FROTA LTDA',
    cpfCnpj: '12.345.678/0001-90',
    valorEmpenho: 62354.90,
    valorLiquidado: 62354.90,
    valorPago: 62354.90,
    saldo: 0,
    unidadeOrcamentaria: 'Câmara Municipal de Mojuí dos Campos',
    elementoDespesa: 'Material de Consumo',
    subelementoDespesa: 'Combustíveis e Lubrificantes',
    funcao: 'Legislativa',
    subfuncao: 'Ação Legislativa',
    programa: 'Funcionamento da Câmara',
    acao: 'Aquisição de combustíveis',
    fonteRecurso: 'Recursos Próprios',
    licitacao: '001/2025',
    situacao: 'PAGO',
    observacoes: 'Aquisição de combustíveis para veículos da Câmara'
  },
  {
    id: '2',
    numeroEmpenho: '2025NE000002',
    dataEmpenho: '22/03/2025',
    credor: 'BRASIL LOCADORA DE VEÍCULOS EIRELI',
    cpfCnpj: '98.765.432/0001-10',
    valorEmpenho: 96000.00,
    valorLiquidado: 96000.00,
    valorPago: 96000.00,
    saldo: 0,
    unidadeOrcamentaria: 'Câmara Municipal de Mojuí dos Campos',
    elementoDespesa: 'Serviços de Terceiros',
    subelementoDespesa: 'Locação de Mão de Obra',
    funcao: 'Legislativa',
    subfuncao: 'Ação Legislativa',
    programa: 'Funcionamento da Câmara',
    acao: 'Locação de veículos',
    fonteRecurso: 'Recursos Próprios',
    licitacao: '002/2025',
    situacao: 'PAGO',
    observacoes: 'Locação de veículos para serviços da Câmara'
  },
  {
    id: '3',
    numeroEmpenho: '2024NE000003',
    dataEmpenho: '15/12/2024',
    credor: 'TECH SOLUTIONS LTDA',
    cpfCnpj: '11.222.333/0001-44',
    valorEmpenho: 84000.00,
    valorLiquidado: 84000.00,
    valorPago: 84000.00,
    saldo: 0,
    unidadeOrcamentaria: 'Câmara Municipal de Mojuí dos Campos',
    elementoDespesa: 'Serviços de Terceiros',
    subelementoDespesa: 'Manutenção de Equipamentos',
    funcao: 'Legislativa',
    subfuncao: 'Ação Legislativa',
    programa: 'Funcionamento da Câmara',
    acao: 'Manutenção de sistemas',
    fonteRecurso: 'Recursos Próprios',
    licitacao: '001/2024',
    situacao: 'PAGO',
    observacoes: 'Manutenção preventiva e corretiva dos sistemas de informática'
  }
];

export default function DespesasPage() {
  const [periodo, setPeriodo] = useState('');
  const [credor, setCredor] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [numeroEmpenho, setNumeroEmpenho] = useState('');
  const [unidadeOrcamentaria, setUnidadeOrcamentaria] = useState('');
  const [elementoDespesa, setElementoDespesa] = useState('');
  const [funcao, setFuncao] = useState('');
  const [programa, setPrograma] = useState('');
  const [acao, setAcao] = useState('');
  const [fonteRecurso, setFonteRecurso] = useState('');
  const [licitacao, setLicitacao] = useState('');
  const [numeroContrato, setNumeroContrato] = useState('');
  const [numeroConvenio, setNumeroConvenio] = useState('');
  const [situacaoSelecionada, setSituacaoSelecionada] = useState('all');
  const [valorMinimo, setValorMinimo] = useState('');
  const [valorMaximo, setValorMaximo] = useState('');
  const [anoSelecionado, setAnoSelecionado] = useState('all');

  const anos = useMemo(() => {
    const anosSet = new Set(despesasMock.map(d => d.dataEmpenho.split('/')[2]));
    return Array.from(anosSet).sort((a, b) => parseInt(b) - parseInt(a));
  }, []);

  const despesasFiltradas = useMemo(() => {
    return despesasMock.filter(despesa => {
      const matchesPeriodo = periodo === '' || despesa.dataEmpenho.includes(periodo);
      const matchesCredor = credor === '' || despesa.credor.toLowerCase().includes(credor.toLowerCase());
      const matchesCpfCnpj = cpfCnpj === '' || despesa.cpfCnpj.includes(cpfCnpj);
      const matchesNumeroEmpenho = numeroEmpenho === '' || despesa.numeroEmpenho.includes(numeroEmpenho);
      const matchesUnidade = unidadeOrcamentaria === '' || despesa.unidadeOrcamentaria.toLowerCase().includes(unidadeOrcamentaria.toLowerCase());
      const matchesElemento = elementoDespesa === '' || despesa.elementoDespesa.toLowerCase().includes(elementoDespesa.toLowerCase());
      const matchesFuncao = funcao === '' || despesa.funcao.toLowerCase().includes(funcao.toLowerCase());
      const matchesPrograma = programa === '' || despesa.programa.toLowerCase().includes(programa.toLowerCase());
      const matchesAcao = acao === '' || despesa.acao.toLowerCase().includes(acao.toLowerCase());
      const matchesFonte = fonteRecurso === '' || despesa.fonteRecurso.toLowerCase().includes(fonteRecurso.toLowerCase());
      const matchesLicitacao = licitacao === '' || despesa.licitacao?.includes(licitacao);
      const matchesContrato = numeroContrato === '' || despesa.numeroContrato?.includes(numeroContrato);
      const matchesConvenio = numeroConvenio === '' || despesa.numeroConvenio?.includes(numeroConvenio);
      const matchesSituacao = situacaoSelecionada === 'all' || despesa.situacao === situacaoSelecionada;
      const matchesValorMinimo = valorMinimo === '' || despesa.valorEmpenho >= parseFloat(valorMinimo);
      const matchesValorMaximo = valorMaximo === '' || despesa.valorEmpenho <= parseFloat(valorMaximo);
      const matchesAno = anoSelecionado === 'all' || despesa.dataEmpenho.split('/')[2] === anoSelecionado;
      
      return matchesPeriodo && matchesCredor && matchesCpfCnpj && matchesNumeroEmpenho && 
             matchesUnidade && matchesElemento && matchesFuncao && matchesPrograma && 
             matchesAcao && matchesFonte && matchesLicitacao && matchesContrato && 
             matchesConvenio && matchesSituacao && matchesValorMinimo && matchesValorMaximo && matchesAno;
    });
  }, [periodo, credor, cpfCnpj, numeroEmpenho, unidadeOrcamentaria, elementoDespesa, 
      funcao, programa, acao, fonteRecurso, licitacao, numeroContrato, numeroConvenio, 
      situacaoSelecionada, valorMinimo, valorMaximo, anoSelecionado]);

  const estatisticas = useMemo(() => {
    const totalEmpenho = despesasFiltradas.reduce((sum, d) => sum + d.valorEmpenho, 0);
    const totalLiquidado = despesasFiltradas.reduce((sum, d) => sum + d.valorLiquidado, 0);
    const totalPago = despesasFiltradas.reduce((sum, d) => sum + d.valorPago, 0);
    const totalSaldo = despesasFiltradas.reduce((sum, d) => sum + d.saldo, 0);
    
    return {
      totalEmpenho,
      totalLiquidado,
      totalPago,
      totalSaldo,
      percentualLiquidado: totalEmpenho > 0 ? (totalLiquidado / totalEmpenho) * 100 : 0,
      percentualPago: totalEmpenho > 0 ? (totalPago / totalEmpenho) * 100 : 0
    };
  }, [despesasFiltradas]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleLimpar = () => {
    setPeriodo('');
    setCredor('');
    setCpfCnpj('');
    setNumeroEmpenho('');
    setUnidadeOrcamentaria('');
    setElementoDespesa('');
    setFuncao('');
    setPrograma('');
    setAcao('');
    setFonteRecurso('');
    setLicitacao('');
    setNumeroContrato('');
    setNumeroConvenio('');
    setSituacaoSelecionada('all');
    setValorMinimo('');
    setValorMaximo('');
    setAnoSelecionado('all');
  };

  const getSituacaoBadge = (situacao: string) => {
    const badges = {
      'EMITIDO': 'bg-blue-100 text-blue-800',
      'LIQUIDADO': 'bg-yellow-100 text-yellow-800',
      'PAGO': 'bg-green-100 text-green-800',
      'CANCELADO': 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[situacao as keyof typeof badges]}`}>
        {situacao}
      </span>
    );
  };

  const getSaldoIcon = (saldo: number) => {
    if (saldo > 0) {
      return <TrendingUp className="h-4 w-4 text-red-600" />;
    } else if (saldo < 0) {
      return <TrendingDown className="h-4 w-4 text-green-600" />;
    }
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Despesas
          </h1>
          <p className="text-gray-600">
            Consulta de despesas da Câmara Municipal
          </p>
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
                  Credor
                </label>
                <Input
                  type="text"
                  placeholder="Digite o nome do credor"
                  value={credor}
                  onChange={(e) => setCredor(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPF/CNPJ
                </label>
                <Input
                  type="text"
                  placeholder="Digite o CPF/CNPJ"
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número do empenho
                </label>
                <Input
                  type="text"
                  placeholder="Digite o número do empenho"
                  value={numeroEmpenho}
                  onChange={(e) => setNumeroEmpenho(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unidade orçamentária
                </label>
                <Input
                  type="text"
                  placeholder="Digite a unidade orçamentária"
                  value={unidadeOrcamentaria}
                  onChange={(e) => setUnidadeOrcamentaria(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Elemento de despesa
                </label>
                <Input
                  type="text"
                  placeholder="Digite o elemento de despesa"
                  value={elementoDespesa}
                  onChange={(e) => setElementoDespesa(e.target.value)}
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
                  Programa
                </label>
                <Input
                  type="text"
                  placeholder="Digite o programa"
                  value={programa}
                  onChange={(e) => setPrograma(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ação
                </label>
                <Input
                  type="text"
                  placeholder="Digite a ação"
                  value={acao}
                  onChange={(e) => setAcao(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fonte de recurso
                </label>
                <Input
                  type="text"
                  placeholder="Digite a fonte de recurso"
                  value={fonteRecurso}
                  onChange={(e) => setFonteRecurso(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Licitação
                </label>
                <Input
                  type="text"
                  placeholder="Digite o número da licitação"
                  value={licitacao}
                  onChange={(e) => setLicitacao(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número do contrato
                </label>
                <Input
                  type="text"
                  placeholder="Digite o número do contrato"
                  value={numeroContrato}
                  onChange={(e) => setNumeroContrato(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número do convênio
                </label>
                <Input
                  type="text"
                  placeholder="Digite o número do convênio"
                  value={numeroConvenio}
                  onChange={(e) => setNumeroConvenio(e.target.value)}
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
                    <SelectItem value="EMITIDO">EMITIDO</SelectItem>
                    <SelectItem value="LIQUIDADO">LIQUIDADO</SelectItem>
                    <SelectItem value="PAGO">PAGO</SelectItem>
                    <SelectItem value="CANCELADO">CANCELADO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor mínimo
                </label>
                <Input
                  type="number"
                  placeholder="Digite o valor mínimo"
                  value={valorMinimo}
                  onChange={(e) => setValorMinimo(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor máximo
                </label>
                <Input
                  type="number"
                  placeholder="Digite o valor máximo"
                  value={valorMaximo}
                  onChange={(e) => setValorMaximo(e.target.value)}
                  className="w-full"
                />
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

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Empenhado</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(estatisticas.totalEmpenho)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Liquidado</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(estatisticas.totalLiquidado)}</p>
                  <p className="text-xs text-gray-500">{estatisticas.percentualLiquidado.toFixed(1)}% do empenhado</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Pago</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(estatisticas.totalPago)}</p>
                  <p className="text-xs text-gray-500">{estatisticas.percentualPago.toFixed(1)}% do empenhado</p>
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
                  <p className="text-sm font-medium text-gray-600">Saldo</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(estatisticas.totalSaldo)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-4">
          <p className="text-lg font-semibold text-gray-900">
            Foram encontradas {despesasFiltradas.length} despesas
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
                    Empenho<br/>Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credor<br/>CPF/CNPJ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Empenhado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Liquidado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Pago
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo
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
                {despesasFiltradas.map((despesa) => (
                  <tr key={despesa.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{despesa.numeroEmpenho}</div>
                      <div className="text-sm text-gray-500">{despesa.dataEmpenho}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{despesa.credor}</div>
                      <div className="text-sm text-gray-500">{despesa.cpfCnpj}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-blue-600">
                        {formatCurrency(despesa.valorEmpenho)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-yellow-600">
                        {formatCurrency(despesa.valorLiquidado)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-600">
                        {formatCurrency(despesa.valorPago)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getSaldoIcon(despesa.saldo)}
                        <span className={`text-sm font-bold ${despesa.saldo > 0 ? 'text-red-600' : despesa.saldo < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                          {formatCurrency(despesa.saldo)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getSituacaoBadge(despesa.situacao)}
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
      </div>
    </div>
  );
}