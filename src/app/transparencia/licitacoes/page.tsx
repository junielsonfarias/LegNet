'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Gavel, 
  Download, 
  Calendar,
  FileText,
  Eye,
  Building2,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface Licitacao {
  id: string;
  numero: string;
  ano: string;
  modalidade: 'PREGÃO PRESENCIAL' | 'PREGÃO ELETRÔNICO' | 'TOMADA DE PREÇOS' | 'CONCORRÊNCIA' | 'CONVITE' | 'RDC';
  tipo: 'NACIONAL' | 'INTERNACIONAL';
  dataAbertura: string;
  horaAbertura: string;
  dataEntregaPropostas?: string;
  horaEntregaPropostas?: string;
  objeto: string;
  valorEstimado: number;
  situacao: 'ABERTA' | 'SUSPENSA' | 'CANCELADA' | 'FRAUDADA' | 'HOMOLOGADA' | 'DESERTA' | 'EM HOMOLOGAÇÃO' | 'EM RECURSOS';
  unidadeGestora: string;
  dataSituacao?: string;
  linkEdital?: string;
  linkAta?: string;
}

interface Edital {
  id: string;
  numero: string;
  ano: string;
  data: string;
  objeto: string;
  situacao: 'VIGENTE' | 'REVOGADO' | 'SUSPENSO';
}

const licitacoesMock: Licitacao[] = [
  {
    id: '1',
    numero: '001/2025',
    ano: '2025',
    modalidade: 'PREGÃO ELETRÔNICO',
    tipo: 'NACIONAL',
    dataAbertura: '31/07/2025',
    horaAbertura: '09:00',
    objeto: 'AQUISIÇÃO DE COMBUSTÍVEIS (GASOLINA ADITIVADA E ÓLEO DIESEL S10) E GÁS DE COZINHA GLP P-13KG PARA ATENDER AS NECESSIDADES DA CÂMARA MUNICIPAL DE MOJUÍ DOS CAMPOS-PA',
    valorEstimado: 62354.90,
    situacao: 'ABERTA',
    unidadeGestora: 'Câmara Municipal de Mojuí dos Campos',
    linkEdital: '#',
    linkAta: '#'
  },
  {
    id: '2',
    numero: '002/2025',
    ano: '2025',
    modalidade: 'PREGÃO ELETRÔNICO',
    tipo: 'NACIONAL',
    dataAbertura: '04/03/2025',
    horaAbertura: '09:00',
    objeto: 'CONTRATAÇÃO DE EMPRESA ESPECIALIZADA EM LOCAÇÃO DE VEÍCULOS, PARA ATENDER AS NECESSIDADES DA CÂMARA MUNICIPAL DE MOJUÍ DOS CAMPOS-PA',
    valorEstimado: 96000.00,
    situacao: 'HOMOLOGADA',
    unidadeGestora: 'Câmara Municipal de Mojuí dos Campos',
    dataSituacao: '22/03/2025',
    linkEdital: '#',
    linkAta: '#'
  },
  {
    id: '3',
    numero: '001/2024',
    ano: '2024',
    modalidade: 'PREGÃO ELETRÔNICO',
    tipo: 'NACIONAL',
    dataAbertura: '11/12/2024',
    horaAbertura: '09:00',
    objeto: 'CONTRATAÇÃO DE EMPRESA PARA MANUTENÇÃO PREVENTIVA E CORRETIVA DOS SISTEMAS DE INFORMÁTICA DA CÂMARA MUNICIPAL DE MOJUÍ DOS CAMPOS-PA',
    valorEstimado: 84000.00,
    situacao: 'HOMOLOGADA',
    unidadeGestora: 'Câmara Municipal de Mojuí dos Campos',
    dataSituacao: '15/12/2024',
    linkEdital: '#',
    linkAta: '#'
  }
];

const editaisMock: Edital[] = [
  {
    id: '1',
    numero: '001/2025',
    ano: '2025',
    data: '31/07/2025',
    objeto: 'AQUISIÇÃO DE COMBUSTÍVEIS (GASOLINA ADITIVADA E ÓLEO DIESEL S10) E GÁS DE COZINHA GLP P-13KG PARA ATENDER AS NECESSIDADES DA CÂMARA MUNICIPAL DE MOJUÍ DOS CAMPOS-PA',
    situacao: 'VIGENTE'
  },
  {
    id: '2',
    numero: '002/2025',
    ano: '2025',
    data: '04/03/2025',
    objeto: 'CONTRATAÇÃO DE EMPRESA ESPECIALIZADA EM LOCAÇÃO DE VEÍCULOS, PARA ATENDER AS NECESSIDADES DA CÂMARA MUNICIPAL DE MOJUÍ DOS CAMPOS-PA',
    situacao: 'VIGENTE'
  },
  {
    id: '3',
    numero: '001/2024',
    ano: '2024',
    data: '11/12/2024',
    objeto: 'CONTRATAÇÃO DE EMPRESA PARA MANUTENÇÃO PREVENTIVA E CORRETIVA DOS SISTEMAS DE INFORMÁTICA DA CÂMARA MUNICIPAL DE MOJUÍ DOS CAMPOS-PA',
    situacao: 'VIGENTE'
  }
];

export default function LicitacoesPage() {
  const [periodo, setPeriodo] = useState('');
  const [modalidadeSelecionada, setModalidadeSelecionada] = useState('all');
  const [tipoSelecionado, setTipoSelecionado] = useState('all');
  const [situacaoSelecionada, setSituacaoSelecionada] = useState('all');
  const [objeto, setObjeto] = useState('');
  const [numeroLicitacao, setNumeroLicitacao] = useState('');
  const [anoSelecionado, setAnoSelecionado] = useState('all');
  const [unidadeGestora, setUnidadeGestora] = useState('');
  const [abaSelecionada, setAbaSelecionada] = useState<'licitacoes' | 'editais'>('licitacoes');
  const [licitacaoSelecionada, setLicitacaoSelecionada] = useState<Licitacao | null>(null);

  const anos = useMemo(() => {
    const anosSet = new Set([...licitacoesMock.map(l => l.ano), ...editaisMock.map(e => e.ano)]);
    return Array.from(anosSet).sort((a, b) => parseInt(b) - parseInt(a));
  }, []);

  const licitacoesFiltradas = useMemo(() => {
    return licitacoesMock.filter(licitacao => {
      const matchesPeriodo = periodo === '' || licitacao.dataAbertura.includes(periodo);
      const matchesModalidade = modalidadeSelecionada === 'all' || licitacao.modalidade === modalidadeSelecionada;
      const matchesTipo = tipoSelecionado === 'all' || licitacao.tipo === tipoSelecionado;
      const matchesSituacao = situacaoSelecionada === 'all' || licitacao.situacao === situacaoSelecionada;
      const matchesObjeto = objeto === '' || licitacao.objeto.toLowerCase().includes(objeto.toLowerCase());
      const matchesNumero = numeroLicitacao === '' || licitacao.numero.includes(numeroLicitacao);
      const matchesAno = anoSelecionado === 'all' || licitacao.ano === anoSelecionado;
      const matchesUnidade = unidadeGestora === '' || licitacao.unidadeGestora.toLowerCase().includes(unidadeGestora.toLowerCase());
      
      return matchesPeriodo && matchesModalidade && matchesTipo && matchesSituacao && 
             matchesObjeto && matchesNumero && matchesAno && matchesUnidade;
    });
  }, [periodo, modalidadeSelecionada, tipoSelecionado, situacaoSelecionada, objeto, 
      numeroLicitacao, anoSelecionado, unidadeGestora]);

  const editaisFiltrados = useMemo(() => {
    return editaisMock.filter(edital => {
      const matchesPeriodo = periodo === '' || edital.data.includes(periodo);
      const matchesNumero = numeroLicitacao === '' || edital.numero.includes(numeroLicitacao);
      const matchesAno = anoSelecionado === 'all' || edital.ano === anoSelecionado;
      const matchesObjeto = objeto === '' || edital.objeto.toLowerCase().includes(objeto.toLowerCase());
      
      return matchesPeriodo && matchesNumero && matchesAno && matchesObjeto;
    });
  }, [periodo, numeroLicitacao, anoSelecionado, objeto]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleLimpar = () => {
    setPeriodo('');
    setModalidadeSelecionada('all');
    setTipoSelecionado('all');
    setSituacaoSelecionada('all');
    setObjeto('');
    setNumeroLicitacao('');
    setAnoSelecionado('all');
    setUnidadeGestora('');
  };

  const getSituacaoIcon = (situacao: string) => {
    const icons = {
      'ABERTA': <CheckCircle2 className="h-5 w-5 text-green-600" />,
      'SUSPENSA': <AlertCircle className="h-5 w-5 text-yellow-600" />,
      'CANCELADA': <XCircle className="h-5 w-5 text-red-600" />,
      'FRAUDADA': <XCircle className="h-5 w-5 text-red-600" />,
      'HOMOLOGADA': <CheckCircle2 className="h-5 w-5 text-green-600" />,
      'DESERTA': <XCircle className="h-5 w-5 text-gray-600" />,
      'EM HOMOLOGAÇÃO': <Clock className="h-5 w-5 text-blue-600" />,
      'EM RECURSOS': <AlertCircle className="h-5 w-5 text-orange-600" />
    };
    return icons[situacao as keyof typeof icons] || <AlertCircle className="h-5 w-5 text-gray-600" />;
  };

  const getSituacaoBadge = (situacao: string) => {
    const badges = {
      'ABERTA': 'bg-green-100 text-green-800',
      'SUSPENSA': 'bg-yellow-100 text-yellow-800',
      'CANCELADA': 'bg-red-100 text-red-800',
      'FRAUDADA': 'bg-red-100 text-red-800',
      'HOMOLOGADA': 'bg-green-100 text-green-800',
      'DESERTA': 'bg-gray-100 text-gray-800',
      'EM HOMOLOGAÇÃO': 'bg-blue-100 text-blue-800',
      'EM RECURSOS': 'bg-orange-100 text-orange-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[situacao as keyof typeof badges]}`}>
        {situacao}
      </span>
    );
  };

  const handleVerLicitacao = (licitacao: Licitacao) => {
    setLicitacaoSelecionada(licitacao);
  };

  const handleFecharLicitacao = () => {
    setLicitacaoSelecionada(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Licitações
          </h1>
          <p className="text-gray-600">
            Consulta de licitações e editais da Câmara Municipal
          </p>
        </div>

        {/* Abas */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setAbaSelecionada('licitacoes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  abaSelecionada === 'licitacoes'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Licitações
              </button>
              <button
                onClick={() => setAbaSelecionada('editais')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  abaSelecionada === 'editais'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Editais
              </button>
            </nav>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="bg-gray-100 border-b">
            <CardTitle className="text-lg font-semibold text-gray-900">
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

              {abaSelecionada === 'licitacoes' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modalidade de licitação
                    </label>
                    <Select value={modalidadeSelecionada} onValueChange={setModalidadeSelecionada}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma modalidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as modalidades</SelectItem>
                        <SelectItem value="PREGÃO PRESENCIAL">PREGÃO PRESENCIAL</SelectItem>
                        <SelectItem value="PREGÃO ELETRÔNICO">PREGÃO ELETRÔNICO</SelectItem>
                        <SelectItem value="TOMADA DE PREÇOS">TOMADA DE PREÇOS</SelectItem>
                        <SelectItem value="CONCORRÊNCIA">CONCORRÊNCIA</SelectItem>
                        <SelectItem value="CONVITE">CONVITE</SelectItem>
                        <SelectItem value="RDC">RDC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de licitação
                    </label>
                    <Select value={tipoSelecionado} onValueChange={setTipoSelecionado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="NACIONAL">NACIONAL</SelectItem>
                        <SelectItem value="INTERNACIONAL">INTERNACIONAL</SelectItem>
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
                        <SelectItem value="ABERTA">ABERTA</SelectItem>
                        <SelectItem value="SUSPENSA">SUSPENSA</SelectItem>
                        <SelectItem value="CANCELADA">CANCELADA</SelectItem>
                        <SelectItem value="FRAUDADA">FRAUDADA</SelectItem>
                        <SelectItem value="HOMOLOGADA">HOMOLOGADA</SelectItem>
                        <SelectItem value="DESERTA">DESERTA</SelectItem>
                        <SelectItem value="EM HOMOLOGAÇÃO">EM HOMOLOGAÇÃO</SelectItem>
                        <SelectItem value="EM RECURSOS">EM RECURSOS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

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
                  Número da licitação
                </label>
                <Input
                  type="text"
                  placeholder="Digite o número"
                  value={numeroLicitacao}
                  onChange={(e) => setNumeroLicitacao(e.target.value)}
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

              <div className="md:col-span-3">
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
                </div>
                
            <p className="text-sm text-gray-600 italic mb-4">
              Para usar as opções de filtro, escolha o campo para a pesquisa e clique no botão pesquisar
            </p>

            <div className="flex flex-wrap gap-3">
              <Button variant="default">
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

        {abaSelecionada === 'licitacoes' ? (
          <>
            <div className="mb-4">
              <p className="text-lg font-semibold text-gray-900">
                Foram encontradas {licitacoesFiltradas.length} licitações
              </p>
              <p className="text-sm text-gray-500 italic">
                Informações atualizadas em: {new Date().toLocaleString('pt-BR')}
              </p>
            </div>

            {/* Tabela de Licitações */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Número<br/>Ano
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Modalidade<br/>Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data de abertura<br/>Hora
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Objeto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor estimado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Situação<br/>Data situação
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {licitacoesFiltradas.map((licitacao) => (
                      <tr key={licitacao.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{licitacao.numero}</div>
                          <div className="text-sm text-gray-500">{licitacao.ano}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{licitacao.modalidade}</div>
                          <div className="text-sm text-gray-500">{licitacao.tipo}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{licitacao.dataAbertura}</div>
                          <div className="text-sm text-gray-500">{licitacao.horaAbertura}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700 max-w-md">{licitacao.objeto}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-purple-600">
                            {formatCurrency(licitacao.valorEstimado)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 mb-1">
                            {getSituacaoIcon(licitacao.situacao)}
                            {getSituacaoBadge(licitacao.situacao)}
                          </div>
                          {licitacao.dataSituacao && (
                            <div className="text-sm text-gray-500">{licitacao.dataSituacao}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-col gap-2">
                  <Button 
                              variant="outline" 
                    size="sm"
                              onClick={() => handleVerLicitacao(licitacao)}
                  >
                              <Eye className="h-4 w-4" />
                  </Button>
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" className="text-xs">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Edital
                  </Button>
                              <Button variant="outline" size="sm" className="text-xs">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Ata
                  </Button>
                            </div>
                          </div>
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
                Foram encontrados {editaisFiltrados.length} editais
              </p>
              <p className="text-sm text-gray-500 italic">
                Informações atualizadas em: {new Date().toLocaleString('pt-BR')}
              </p>
            </div>

            {/* Tabela de Editais */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Número<br/>Ano
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Objeto
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
                    {editaisFiltrados.map((edital) => (
                      <tr key={edital.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{edital.numero}</div>
                          <div className="text-sm text-gray-500">{edital.ano}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{edital.data}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700 max-w-md">{edital.objeto}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getSituacaoBadge(edital.situacao)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Visualizar
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

        {/* Modal de Licitação */}
        {licitacaoSelecionada && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl">
              <CardHeader className="bg-gray-100 border-b">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Gavel className="h-6 w-6 text-purple-600" />
                  Dados da licitação
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número/Ano:
                      </label>
                      <p className="text-gray-900 font-semibold">
                        {licitacaoSelecionada.numero}/{licitacaoSelecionada.ano}
                      </p>
        </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Modalidade:
                      </label>
                      <p className="text-gray-900 font-semibold">{licitacaoSelecionada.modalidade}</p>
        </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo:
                      </label>
                      <p className="text-gray-900 font-semibold">{licitacaoSelecionada.tipo}</p>
                    </div>
                    
                        <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data/Hora de Abertura:
                      </label>
                      <p className="text-gray-900 font-semibold">
                        {licitacaoSelecionada.dataAbertura} às {licitacaoSelecionada.horaAbertura}
                      </p>
                        </div>
                      </div>
                  
                  <div className="space-y-4">
                        <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Situação:
                      </label>
                      <div className="flex items-center gap-2">
                        {getSituacaoIcon(licitacaoSelecionada.situacao)}
                        {getSituacaoBadge(licitacaoSelecionada.situacao)}
                      </div>
                    </div>
                    
                        <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor Estimado:
                      </label>
                      <p className="text-lg font-bold text-purple-600">
                        {formatCurrency(licitacaoSelecionada.valorEstimado)}
                      </p>
                          </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unidade Gestora:
                      </label>
                      <p className="text-gray-900 font-semibold">{licitacaoSelecionada.unidadeGestora}</p>
                        </div>
                    
                    {licitacaoSelecionada.dataSituacao && (
                        <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Data da Situação:
                        </label>
                        <p className="text-gray-900 font-semibold">{licitacaoSelecionada.dataSituacao}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objeto:
                  </label>
                  <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                    {licitacaoSelecionada.objeto}
                  </p>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <Button 
                      variant="outline" 
                      onClick={handleFecharLicitacao}
                    >
                      Voltar
                    </Button>
                    <div className="flex gap-3">
                      <Button variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visualizar Edital
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