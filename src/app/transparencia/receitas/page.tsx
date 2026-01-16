'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  Download, 
  Calendar,
  FileText,
  Eye,
  Building2,
  DollarSign,
  Search,
  Filter,
  Target,
  BarChart3,
  PieChart
} from 'lucide-react';

interface Receita {
  id: string;
  numeroReceita: string;
  dataReceita: string;
  dataVencimento: string;
  contribuinte: string;
  cpfCnpj: string;
  valorPrevisto: number;
  valorArrecadado: number;
  valorPendente: number;
  unidadeGestora: string;
  categoriaEconomica: string;
  origem: string;
  especie: string;
  rubrica: string;
  subrubrica: string;
  alinea: string;
  subalinea: string;
  fonteRecurso: string;
  situacao: 'PENDENTE' | 'ARRECADADO' | 'CANCELADO' | 'VENCIDO';
  observacoes?: string;
}

const receitasMock: Receita[] = [
  {
    id: '1',
    numeroReceita: '2025RE000001',
    dataReceita: '15/01/2025',
    dataVencimento: '31/01/2025',
    contribuinte: 'EMPRESA ABC LTDA',
    cpfCnpj: '12.345.678/0001-90',
    valorPrevisto: 15000.00,
    valorArrecadado: 15000.00,
    valorPendente: 0,
    unidadeGestora: 'Câmara Municipal de Mojuí dos Campos',
    categoriaEconomica: 'Receitas Tributárias',
    origem: 'Impostos',
    especie: 'ISS',
    rubrica: 'ISS sobre Serviços',
    subrubrica: 'Prestação de Serviços',
    alinea: 'Serviços de Construção',
    subalinea: 'Construção Civil',
    fonteRecurso: 'Recursos Próprios',
    situacao: 'ARRECADADO',
    observacoes: 'Arrecadação de ISS sobre serviços de construção'
  },
  {
    id: '2',
    numeroReceita: '2025RE000002',
    dataReceita: '10/02/2025',
    dataVencimento: '28/02/2025',
    contribuinte: 'COMERCIO XYZ LTDA',
    cpfCnpj: '98.765.432/0001-10',
    valorPrevisto: 8500.00,
    valorArrecadado: 8500.00,
    valorPendente: 0,
    unidadeGestora: 'Câmara Municipal de Mojuí dos Campos',
    categoriaEconomica: 'Receitas Tributárias',
    origem: 'Impostos',
    especie: 'ISS',
    rubrica: 'ISS sobre Serviços',
    subrubrica: 'Prestação de Serviços',
    alinea: 'Serviços Comerciais',
    subalinea: 'Comércio',
    fonteRecurso: 'Recursos Próprios',
    situacao: 'ARRECADADO',
    observacoes: 'Arrecadação de ISS sobre serviços comerciais'
  },
  {
    id: '3',
    numeroReceita: '2025RE000003',
    dataReceita: '05/03/2025',
    dataVencimento: '31/03/2025',
    contribuinte: 'PESSOA FÍSICA SILVA',
    cpfCnpj: '123.456.789-00',
    valorPrevisto: 2500.00,
    valorArrecadado: 0,
    valorPendente: 2500.00,
    unidadeGestora: 'Câmara Municipal de Mojuí dos Campos',
    categoriaEconomica: 'Receitas Tributárias',
    origem: 'Taxas',
    especie: 'Taxa de Licença',
    rubrica: 'Taxa de Licença de Funcionamento',
    subrubrica: 'Licença Comercial',
    alinea: 'Estabelecimentos Comerciais',
    subalinea: 'Pequeno Comércio',
    fonteRecurso: 'Recursos Próprios',
    situacao: 'PENDENTE',
    observacoes: 'Taxa de licença de funcionamento pendente'
  },
  {
    id: '4',
    numeroReceita: '2025RE000004',
    dataReceita: '20/01/2025',
    dataVencimento: '31/01/2025',
    contribuinte: 'INDÚSTRIA DEF LTDA',
    cpfCnpj: '11.222.333/0001-44',
    valorPrevisto: 25000.00,
    valorArrecadado: 25000.00,
    valorPendente: 0,
    unidadeGestora: 'Câmara Municipal de Mojuí dos Campos',
    categoriaEconomica: 'Receitas Tributárias',
    origem: 'Impostos',
    especie: 'IPTU',
    rubrica: 'IPTU Predial',
    subrubrica: 'Imóveis Urbanos',
    alinea: 'Residências',
    subalinea: 'Residência Unifamiliar',
    fonteRecurso: 'Recursos Próprios',
    situacao: 'ARRECADADO',
    observacoes: 'Arrecadação de IPTU sobre imóvel residencial'
  }
];

export default function ReceitasPage() {
  const [periodo, setPeriodo] = useState('');
  const [contribuinte, setContribuinte] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [numeroReceita, setNumeroReceita] = useState('');
  const [unidadeGestora, setUnidadeGestora] = useState('');
  const [categoriaEconomica, setCategoriaEconomica] = useState('');
  const [origem, setOrigem] = useState('');
  const [especie, setEspecie] = useState('');
  const [rubrica, setRubrica] = useState('');
  const [subrubrica, setSubrubrica] = useState('');
  const [alinea, setAlinea] = useState('');
  const [subalinea, setSubalinea] = useState('');
  const [fonteRecurso, setFonteRecurso] = useState('');
  const [situacaoSelecionada, setSituacaoSelecionada] = useState('all');
  const [valorMinimo, setValorMinimo] = useState('');
  const [valorMaximo, setValorMaximo] = useState('');
  const [anoSelecionado, setAnoSelecionado] = useState('all');

  const anos = useMemo(() => {
    const anosSet = new Set(receitasMock.map(r => r.dataReceita.split('/')[2]));
    return Array.from(anosSet).sort((a, b) => parseInt(b) - parseInt(a));
  }, []);

  const receitasFiltradas = useMemo(() => {
    return receitasMock.filter(receita => {
      const matchesPeriodo = periodo === '' || receita.dataReceita.includes(periodo);
      const matchesContribuinte = contribuinte === '' || receita.contribuinte.toLowerCase().includes(contribuinte.toLowerCase());
      const matchesCpfCnpj = cpfCnpj === '' || receita.cpfCnpj.includes(cpfCnpj);
      const matchesNumeroReceita = numeroReceita === '' || receita.numeroReceita.includes(numeroReceita);
      const matchesUnidade = unidadeGestora === '' || receita.unidadeGestora.toLowerCase().includes(unidadeGestora.toLowerCase());
      const matchesCategoria = categoriaEconomica === '' || receita.categoriaEconomica.toLowerCase().includes(categoriaEconomica.toLowerCase());
      const matchesOrigem = origem === '' || receita.origem.toLowerCase().includes(origem.toLowerCase());
      const matchesEspecie = especie === '' || receita.especie.toLowerCase().includes(especie.toLowerCase());
      const matchesRubrica = rubrica === '' || receita.rubrica.toLowerCase().includes(rubrica.toLowerCase());
      const matchesSubrubrica = subrubrica === '' || receita.subrubrica.toLowerCase().includes(subrubrica.toLowerCase());
      const matchesAlinea = alinea === '' || receita.alinea.toLowerCase().includes(alinea.toLowerCase());
      const matchesSubalinea = subalinea === '' || receita.subalinea.toLowerCase().includes(subalinea.toLowerCase());
      const matchesFonte = fonteRecurso === '' || receita.fonteRecurso.toLowerCase().includes(fonteRecurso.toLowerCase());
      const matchesSituacao = situacaoSelecionada === 'all' || receita.situacao === situacaoSelecionada;
      const matchesValorMinimo = valorMinimo === '' || receita.valorPrevisto >= parseFloat(valorMinimo);
      const matchesValorMaximo = valorMaximo === '' || receita.valorPrevisto <= parseFloat(valorMaximo);
      const matchesAno = anoSelecionado === 'all' || receita.dataReceita.split('/')[2] === anoSelecionado;
      
      return matchesPeriodo && matchesContribuinte && matchesCpfCnpj && matchesNumeroReceita && 
             matchesUnidade && matchesCategoria && matchesOrigem && matchesEspecie && 
             matchesRubrica && matchesSubrubrica && matchesAlinea && matchesSubalinea && 
             matchesFonte && matchesSituacao && matchesValorMinimo && matchesValorMaximo && matchesAno;
    });
  }, [periodo, contribuinte, cpfCnpj, numeroReceita, unidadeGestora, categoriaEconomica, 
      origem, especie, rubrica, subrubrica, alinea, subalinea, fonteRecurso, 
      situacaoSelecionada, valorMinimo, valorMaximo, anoSelecionado]);

  const estatisticas = useMemo(() => {
    const totalPrevisto = receitasFiltradas.reduce((sum, r) => sum + r.valorPrevisto, 0);
    const totalArrecadado = receitasFiltradas.reduce((sum, r) => sum + r.valorArrecadado, 0);
    const totalPendente = receitasFiltradas.reduce((sum, r) => sum + r.valorPendente, 0);
    
    return {
      totalPrevisto,
      totalArrecadado,
      totalPendente,
      percentualArrecadado: totalPrevisto > 0 ? (totalArrecadado / totalPrevisto) * 100 : 0,
      diferenca: totalArrecadado - totalPrevisto
    };
  }, [receitasFiltradas]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleLimpar = () => {
    setPeriodo('');
    setContribuinte('');
    setCpfCnpj('');
    setNumeroReceita('');
    setUnidadeGestora('');
    setCategoriaEconomica('');
    setOrigem('');
    setEspecie('');
    setRubrica('');
    setSubrubrica('');
    setAlinea('');
    setSubalinea('');
    setFonteRecurso('');
    setSituacaoSelecionada('all');
    setValorMinimo('');
    setValorMaximo('');
    setAnoSelecionado('all');
  };

  const getSituacaoBadge = (situacao: string) => {
    const badges = {
      'PENDENTE': 'bg-yellow-100 text-yellow-800',
      'ARRECADADO': 'bg-green-100 text-green-800',
      'CANCELADO': 'bg-red-100 text-red-800',
      'VENCIDO': 'bg-orange-100 text-orange-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[situacao as keyof typeof badges]}`}>
        {situacao}
      </span>
    );
  };

  const getSituacaoIcon = (situacao: string) => {
    const icons = {
      'PENDENTE': <Target className="h-4 w-4 text-yellow-600" />,
      'ARRECADADO': <TrendingUp className="h-4 w-4 text-green-600" />,
      'CANCELADO': <FileText className="h-4 w-4 text-red-600" />,
      'VENCIDO': <Calendar className="h-4 w-4 text-orange-600" />
    };
    return icons[situacao as keyof typeof icons] || <Target className="h-4 w-4 text-gray-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Receitas
          </h1>
          <p className="text-gray-600">
            Consulta de receitas da Câmara Municipal
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
                  Contribuinte
                </label>
                <Input
                  type="text"
                  placeholder="Digite o nome do contribuinte"
                  value={contribuinte}
                  onChange={(e) => setContribuinte(e.target.value)}
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
                  Número da receita
                </label>
                <Input
                  type="text"
                  placeholder="Digite o número da receita"
                  value={numeroReceita}
                  onChange={(e) => setNumeroReceita(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unidade gestora
                </label>
                <Input
                  type="text"
                  placeholder="Digite a unidade gestora"
                  value={unidadeGestora}
                  onChange={(e) => setUnidadeGestora(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria econômica
                </label>
                <Input
                  type="text"
                  placeholder="Digite a categoria econômica"
                  value={categoriaEconomica}
                  onChange={(e) => setCategoriaEconomica(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Origem
                </label>
                <Input
                  type="text"
                  placeholder="Digite a origem"
                  value={origem}
                  onChange={(e) => setOrigem(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Espécie
                </label>
                <Input
                  type="text"
                  placeholder="Digite a espécie"
                  value={especie}
                  onChange={(e) => setEspecie(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rubrica
                </label>
                <Input
                  type="text"
                  placeholder="Digite a rubrica"
                  value={rubrica}
                  onChange={(e) => setRubrica(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sub-rubrica
                </label>
                <Input
                  type="text"
                  placeholder="Digite a sub-rubrica"
                  value={subrubrica}
                  onChange={(e) => setSubrubrica(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alínea
                </label>
                <Input
                  type="text"
                  placeholder="Digite a alínea"
                  value={alinea}
                  onChange={(e) => setAlinea(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sub-alínea
                </label>
                <Input
                  type="text"
                  placeholder="Digite a sub-alínea"
                  value={subalinea}
                  onChange={(e) => setSubalinea(e.target.value)}
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
                  Situação
                </label>
                <Select value={situacaoSelecionada} onValueChange={setSituacaoSelecionada}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma situação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as situações</SelectItem>
                    <SelectItem value="PENDENTE">PENDENTE</SelectItem>
                    <SelectItem value="ARRECADADO">ARRECADADO</SelectItem>
                    <SelectItem value="CANCELADO">CANCELADO</SelectItem>
                    <SelectItem value="VENCIDO">VENCIDO</SelectItem>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Previsto</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(estatisticas.totalPrevisto)}</p>
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
                  <p className="text-sm font-medium text-gray-600">Total Arrecadado</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(estatisticas.totalArrecadado)}</p>
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
                  <p className="text-sm font-medium text-gray-600">% Arrecadado</p>
                  <p className="text-2xl font-bold text-gray-900">{estatisticas.percentualArrecadado.toFixed(1)}%</p>
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
                  <p className="text-sm font-medium text-gray-600">Total Pendente</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(estatisticas.totalPendente)}</p>
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
                  <p className="text-sm font-medium text-gray-600">Diferença</p>
                  <p className={`text-2xl font-bold ${estatisticas.diferenca >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(estatisticas.diferenca)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-4">
          <p className="text-lg font-semibold text-gray-900">
            Foram encontradas {receitasFiltradas.length} receitas
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
                    Receita<br/>Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contribuinte<br/>CPF/CNPJ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria<br/>Origem/Espécie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Previsto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Arrecadado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Pendente
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
                {receitasFiltradas.map((receita) => (
                  <tr key={receita.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{receita.numeroReceita}</div>
                      <div className="text-sm text-gray-500">{receita.dataReceita}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{receita.contribuinte}</div>
                      <div className="text-sm text-gray-500">{receita.cpfCnpj}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{receita.categoriaEconomica}</div>
                      <div className="text-sm text-gray-500">{receita.origem} - {receita.especie}</div>
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
                      <div className="text-sm font-bold text-yellow-600">
                        {formatCurrency(receita.valorPendente)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getSituacaoIcon(receita.situacao)}
                        {getSituacaoBadge(receita.situacao)}
                      </div>
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