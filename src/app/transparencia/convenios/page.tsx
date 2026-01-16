'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Handshake, 
  Download, 
  Calendar,
  FileText,
  Eye,
  Building2,
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface Convenio {
  id: string;
  numeroConvenio: string;
  dataCelebracao: string;
  dataVigenciaInicio: string;
  dataVigenciaFim: string;
  convenente: string;
  cpfCnpj: string;
  objeto: string;
  valorTotal: number;
  valorRepasse: number;
  valorContrapartida: number;
  situacao: 'ATIVO' | 'SUSPENSO' | 'ENCERRADO' | 'CANCELADO' | 'EM_EXECUCAO';
  orgaoConcedente: string;
  programa: string;
  acao: string;
  fonteRecurso: string;
  unidadeGestora: string;
  responsavelTecnico?: string;
  observacoes?: string;
}

const conveniosMock: Convenio[] = [
  {
    id: '1',
    numeroConvenio: 'CONV001/2025',
    dataCelebracao: '15/01/2025',
    dataVigenciaInicio: '15/01/2025',
    dataVigenciaFim: '15/01/2026',
    convenente: 'ASSOCIAÇÃO COMUNITÁRIA ABC',
    cpfCnpj: '12.345.678/0001-90',
    objeto: 'Execução de programa de capacitação profissional para jovens da comunidade',
    valorTotal: 150000.00,
    valorRepasse: 120000.00,
    valorContrapartida: 30000.00,
    situacao: 'EM_EXECUCAO',
    orgaoConcedente: 'Ministério do Desenvolvimento Social',
    programa: 'Programa de Inclusão Social',
    acao: 'Capacitação Profissional',
    fonteRecurso: 'Recursos Federais',
    unidadeGestora: 'Câmara Municipal de Mojuí dos Campos',
    responsavelTecnico: 'JOÃO SILVA',
    observacoes: 'Convênio para capacitação de 100 jovens'
  },
  {
    id: '2',
    numeroConvenio: 'CONV002/2024',
    dataCelebracao: '10/06/2024',
    dataVigenciaInicio: '10/06/2024',
    dataVigenciaFim: '10/06/2025',
    convenente: 'FUNDAÇÃO EDUCACIONAL XYZ',
    cpfCnpj: '98.765.432/0001-10',
    objeto: 'Implementação de programa de educação ambiental nas escolas municipais',
    valorTotal: 80000.00,
    valorRepasse: 64000.00,
    valorContrapartida: 16000.00,
    situacao: 'ATIVO',
    orgaoConcedente: 'Ministério do Meio Ambiente',
    programa: 'Programa Nacional de Educação Ambiental',
    acao: 'Educação Ambiental Escolar',
    fonteRecurso: 'Recursos Federais',
    unidadeGestora: 'Câmara Municipal de Mojuí dos Campos',
    responsavelTecnico: 'MARIA SANTOS',
    observacoes: 'Convênio para educação ambiental em 20 escolas'
  },
  {
    id: '3',
    numeroConvenio: 'CONV003/2024',
    dataCelebracao: '20/03/2024',
    dataVigenciaInicio: '20/03/2024',
    dataVigenciaFim: '20/03/2025',
    convenente: 'COOPERATIVA AGRICOLA DEF',
    cpfCnpj: '11.222.333/0001-44',
    objeto: 'Desenvolvimento de programa de agricultura familiar sustentável',
    valorTotal: 200000.00,
    valorRepasse: 160000.00,
    valorContrapartida: 40000.00,
    situacao: 'ENCERRADO',
    orgaoConcedente: 'Ministério da Agricultura',
    programa: 'Programa de Agricultura Familiar',
    acao: 'Desenvolvimento Rural Sustentável',
    fonteRecurso: 'Recursos Federais',
    unidadeGestora: 'Câmara Municipal de Mojuí dos Campos',
    responsavelTecnico: 'PEDRO OLIVEIRA',
    observacoes: 'Convênio encerrado com sucesso - 50 famílias beneficiadas'
  }
];

export default function ConveniosPage() {
  const [periodo, setPeriodo] = useState('');
  const [convenente, setConvenente] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [numeroConvenio, setNumeroConvenio] = useState('');
  const [objeto, setObjeto] = useState('');
  const [orgaoConcedente, setOrgaoConcedente] = useState('');
  const [programa, setPrograma] = useState('');
  const [acao, setAcao] = useState('');
  const [fonteRecurso, setFonteRecurso] = useState('');
  const [unidadeGestora, setUnidadeGestora] = useState('');
  const [situacaoSelecionada, setSituacaoSelecionada] = useState('all');
  const [valorMinimo, setValorMinimo] = useState('');
  const [valorMaximo, setValorMaximo] = useState('');
  const [anoSelecionado, setAnoSelecionado] = useState('all');
  const [convenioSelecionado, setConvenioSelecionado] = useState<Convenio | null>(null);

  const anos = useMemo(() => {
    const anosSet = new Set(conveniosMock.map(c => c.dataCelebracao.split('/')[2]));
    return Array.from(anosSet).sort((a, b) => parseInt(b) - parseInt(a));
  }, []);

  const conveniosFiltrados = useMemo(() => {
    return conveniosMock.filter(convenio => {
      const matchesPeriodo = periodo === '' || convenio.dataCelebracao.includes(periodo);
      const matchesConvenente = convenente === '' || convenio.convenente.toLowerCase().includes(convenente.toLowerCase());
      const matchesCpfCnpj = cpfCnpj === '' || convenio.cpfCnpj.includes(cpfCnpj);
      const matchesNumeroConvenio = numeroConvenio === '' || convenio.numeroConvenio.includes(numeroConvenio);
      const matchesObjeto = objeto === '' || convenio.objeto.toLowerCase().includes(objeto.toLowerCase());
      const matchesOrgao = orgaoConcedente === '' || convenio.orgaoConcedente.toLowerCase().includes(orgaoConcedente.toLowerCase());
      const matchesPrograma = programa === '' || convenio.programa.toLowerCase().includes(programa.toLowerCase());
      const matchesAcao = acao === '' || convenio.acao.toLowerCase().includes(acao.toLowerCase());
      const matchesFonte = fonteRecurso === '' || convenio.fonteRecurso.toLowerCase().includes(fonteRecurso.toLowerCase());
      const matchesUnidade = unidadeGestora === '' || convenio.unidadeGestora.toLowerCase().includes(unidadeGestora.toLowerCase());
      const matchesSituacao = situacaoSelecionada === 'all' || convenio.situacao === situacaoSelecionada;
      const matchesValorMinimo = valorMinimo === '' || convenio.valorTotal >= parseFloat(valorMinimo);
      const matchesValorMaximo = valorMaximo === '' || convenio.valorTotal <= parseFloat(valorMaximo);
      const matchesAno = anoSelecionado === 'all' || convenio.dataCelebracao.split('/')[2] === anoSelecionado;
      
      return matchesPeriodo && matchesConvenente && matchesCpfCnpj && matchesNumeroConvenio && 
             matchesObjeto && matchesOrgao && matchesPrograma && matchesAcao && 
             matchesFonte && matchesUnidade && matchesSituacao && matchesValorMinimo && 
             matchesValorMaximo && matchesAno;
    });
  }, [periodo, convenente, cpfCnpj, numeroConvenio, objeto, orgaoConcedente, programa, 
      acao, fonteRecurso, unidadeGestora, situacaoSelecionada, valorMinimo, valorMaximo, anoSelecionado]);

  const estatisticas = useMemo(() => {
    const totalValor = conveniosFiltrados.reduce((sum, c) => sum + c.valorTotal, 0);
    const totalRepasse = conveniosFiltrados.reduce((sum, c) => sum + c.valorRepasse, 0);
    const totalContrapartida = conveniosFiltrados.reduce((sum, c) => sum + c.valorContrapartida, 0);
    const ativos = conveniosFiltrados.filter(c => c.situacao === 'ATIVO' || c.situacao === 'EM_EXECUCAO').length;
    const encerrados = conveniosFiltrados.filter(c => c.situacao === 'ENCERRADO').length;
    
    return {
      totalValor,
      totalRepasse,
      totalContrapartida,
      ativos,
      encerrados,
      total: conveniosFiltrados.length
    };
  }, [conveniosFiltrados]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleLimpar = () => {
    setPeriodo('');
    setConvenente('');
    setCpfCnpj('');
    setNumeroConvenio('');
    setObjeto('');
    setOrgaoConcedente('');
    setPrograma('');
    setAcao('');
    setFonteRecurso('');
    setUnidadeGestora('');
    setSituacaoSelecionada('all');
    setValorMinimo('');
    setValorMaximo('');
    setAnoSelecionado('all');
  };

  const getSituacaoIcon = (situacao: string) => {
    const icons = {
      'ATIVO': <CheckCircle2 className="h-5 w-5 text-green-600" />,
      'SUSPENSO': <AlertCircle className="h-5 w-5 text-yellow-600" />,
      'ENCERRADO': <XCircle className="h-5 w-5 text-gray-600" />,
      'CANCELADO': <XCircle className="h-5 w-5 text-red-600" />,
      'EM_EXECUCAO': <Clock className="h-5 w-5 text-blue-600" />
    };
    return icons[situacao as keyof typeof icons] || <AlertCircle className="h-5 w-5 text-gray-600" />;
  };

  const getSituacaoBadge = (situacao: string) => {
    const badges = {
      'ATIVO': 'bg-green-100 text-green-800',
      'SUSPENSO': 'bg-yellow-100 text-yellow-800',
      'ENCERRADO': 'bg-gray-100 text-gray-800',
      'CANCELADO': 'bg-red-100 text-red-800',
      'EM_EXECUCAO': 'bg-blue-100 text-blue-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[situacao as keyof typeof badges]}`}>
        {situacao}
      </span>
    );
  };

  const handleVerConvenio = (convenio: Convenio) => {
    setConvenioSelecionado(convenio);
  };

  const handleFecharConvenio = () => {
    setConvenioSelecionado(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Convênios
          </h1>
          <p className="text-gray-600">
            Consulta de convênios firmados pela Câmara Municipal
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
                  Convenente
                </label>
                <Input
                  type="text"
                  placeholder="Digite o nome do convenente"
                  value={convenente}
                  onChange={(e) => setConvenente(e.target.value)}
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
                  Objeto
                </label>
                <Input
                  type="text"
                  placeholder="Digite o objeto"
                  value={objeto}
                  onChange={(e) => setObjeto(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Órgão concedente
                </label>
                <Input
                  type="text"
                  placeholder="Digite o órgão concedente"
                  value={orgaoConcedente}
                  onChange={(e) => setOrgaoConcedente(e.target.value)}
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
                  Situação
                </label>
                <Select value={situacaoSelecionada} onValueChange={setSituacaoSelecionada}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma situação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as situações</SelectItem>
                    <SelectItem value="ATIVO">ATIVO</SelectItem>
                    <SelectItem value="SUSPENSO">SUSPENSO</SelectItem>
                    <SelectItem value="ENCERRADO">ENCERRADO</SelectItem>
                    <SelectItem value="CANCELADO">CANCELADO</SelectItem>
                    <SelectItem value="EM_EXECUCAO">EM EXECUÇÃO</SelectItem>
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
                  <Handshake className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Convênios</p>
                  <p className="text-2xl font-bold text-gray-900">{estatisticas.total}</p>
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
                  <p className="text-sm font-medium text-gray-600">Ativos</p>
                  <p className="text-2xl font-bold text-gray-900">{estatisticas.ativos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <XCircle className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Encerrados</p>
                  <p className="text-2xl font-bold text-gray-900">{estatisticas.encerrados}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(estatisticas.totalValor)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Valor Repasse</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(estatisticas.totalRepasse)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-4">
          <p className="text-lg font-semibold text-gray-900">
            Foram encontrados {conveniosFiltrados.length} convênios
          </p>
          <p className="text-sm text-gray-500 italic">
            Informações atualizadas em: {new Date().toLocaleString('pt-BR')}
          </p>
        </div>

        {/* Tabela de Convênios */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Convênio<br/>Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Convenente<br/>CPF/CNPJ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Órgão Concedente<br/>Programa/Ação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vigência
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Repasse
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
                {conveniosFiltrados.map((convenio) => (
                  <tr key={convenio.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{convenio.numeroConvenio}</div>
                      <div className="text-sm text-gray-500">{convenio.dataCelebracao}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{convenio.convenente}</div>
                      <div className="text-sm text-gray-500">{convenio.cpfCnpj}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{convenio.orgaoConcedente}</div>
                      <div className="text-sm text-gray-500">{convenio.programa}</div>
                      <div className="text-sm text-gray-500">{convenio.acao}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{convenio.dataVigenciaInicio}</div>
                      <div className="text-sm text-gray-500">{convenio.dataVigenciaFim}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-purple-600">
                        {formatCurrency(convenio.valorTotal)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-600">
                        {formatCurrency(convenio.valorRepasse)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getSituacaoIcon(convenio.situacao)}
                        {getSituacaoBadge(convenio.situacao)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleVerConvenio(convenio)}
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

        {/* Modal de Convênio */}
        {convenioSelecionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl">
              <CardHeader className="bg-gray-100 border-b">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Handshake className="h-6 w-6 text-blue-600" />
                  Dados do convênio
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número do Convênio:
                      </label>
                      <p className="text-gray-900 font-semibold">{convenioSelecionado.numeroConvenio}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Celebração:
                      </label>
                      <p className="text-gray-900 font-semibold">{convenioSelecionado.dataCelebracao}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Convenente:
                      </label>
                      <p className="text-gray-900 font-semibold">{convenioSelecionado.convenente}</p>
                      <p className="text-sm text-gray-500">{convenioSelecionado.cpfCnpj}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Órgão Concedente:
                      </label>
                      <p className="text-gray-900 font-semibold">{convenioSelecionado.orgaoConcedente}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Situação:
                      </label>
                      <div className="flex items-center gap-2">
                        {getSituacaoIcon(convenioSelecionado.situacao)}
                        {getSituacaoBadge(convenioSelecionado.situacao)}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor Total:
                      </label>
                      <p className="text-lg font-bold text-purple-600">
                        {formatCurrency(convenioSelecionado.valorTotal)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor Repasse:
                      </label>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(convenioSelecionado.valorRepasse)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor Contrapartida:
                      </label>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(convenioSelecionado.valorContrapartida)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objeto:
                  </label>
                  <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                    {convenioSelecionado.objeto}
                  </p>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vigência:
                  </label>
                  <p className="text-gray-700">
                    De {convenioSelecionado.dataVigenciaInicio} até {convenioSelecionado.dataVigenciaFim}
                  </p>
                </div>
                
                {convenioSelecionado.responsavelTecnico && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Responsável Técnico:
                    </label>
                    <p className="text-gray-700 font-semibold">{convenioSelecionado.responsavelTecnico}</p>
                  </div>
                )}
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <Button 
                      variant="outline" 
                      onClick={handleFecharConvenio}
                    >
                      Voltar
                    </Button>
                    <div className="flex gap-3">
                      <Button variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visualizar Convênio
                      </Button>
                      <Button>
                        <Download className="h-4 w-4 mr-2" />
                        Baixar Documentos
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