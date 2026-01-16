'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileSignature, 
  Download, 
  Calendar,
  FileText,
  Eye,
  Building2,
  DollarSign,
  Users,
  CheckCircle2,
  XCircle,
  ExternalLink
} from 'lucide-react';

interface Contrato {
  id: string;
  numero: string;
  modalidade: 'CONTRATO ORIGINAL' | 'ADITIVO';
  data: string;
  exercicio: string;
  nomeContratado: string;
  cpfCnpj: string;
  secretaria: string;
  objeto: string;
  vigenciaInicio: string;
  vigenciaFim: string;
  situacao: 'VIGENTE' | 'ENCERRADO' | 'RESCINDIDO';
  dataSituacao?: string;
  valor: number;
  fiscalContrato?: string;
  terceirizado?: 'Sim' | 'Não';
}

interface Declaracao {
  id: string;
  data: string;
  exercicio: string;
  descricao: string;
  mes: string;
}

const contratosMock: Contrato[] = [
  {
    id: '1',
    numero: '013/2025',
    modalidade: 'CONTRATO ORIGINAL',
    data: '15/07/2025',
    exercicio: '2025',
    nomeContratado: 'JAMILSON DIAS FROTA LTDA',
    cpfCnpj: '12.345.678/0001-90',
    secretaria: 'Câmara Municipal de Mojuí dos Campos',
    objeto: 'AQUISIÇÃO DE COMBUSTÍVEIS (GASOLINA ADITIVADA E ÓLEO DIESEL S10) E GÁS DE COZINHA GLP P-13KG PARA ATENDER AS NECESSIDADES DA CÂMARA MUNICIPAL DE MOJUÍ DOS CAMPOS-PA',
    vigenciaInicio: '15/07/2025',
    vigenciaFim: '15/07/2026',
    situacao: 'VIGENTE',
    valor: 62354.90,
    fiscalContrato: 'JOÃO BATISTA FREITAS DA SILVA',
    terceirizado: 'Não'
  },
  {
    id: '2',
    numero: '008/2025-CMMC/2025',
    modalidade: 'CONTRATO ORIGINAL',
    data: '22/03/2025',
    exercicio: '2025',
    nomeContratado: 'BRASIL LOCADORA DE VEÍCULOS EIRELI',
    cpfCnpj: '98.765.432/0001-10',
    secretaria: 'Câmara Municipal de Mojuí dos Campos',
    objeto: 'CONTRATAÇÃO DE EMPRESA ESPECIALIZADA EM LOCAÇÃO DE VEÍCULOS, PARA ATENDER AS NECESSIDADES DA CÂMARA MUNICIPAL DE MOJUÍ DOS CAMPOS-PA',
    vigenciaInicio: '22/03/2025',
    vigenciaFim: '21/03/2026',
    situacao: 'VIGENTE',
    valor: 96000.00,
    fiscalContrato: 'RAIMUNDO EDMILSON SANTOS FILHO',
    terceirizado: 'Não'
  },
  {
    id: '3',
    numero: '012/2024',
    modalidade: 'CONTRATO ORIGINAL',
    data: '15/12/2024',
    exercicio: '2024',
    nomeContratado: 'TECH SOLUTIONS LTDA',
    cpfCnpj: '11.222.333/0001-44',
    secretaria: 'Câmara Municipal de Mojuí dos Campos',
    objeto: 'CONTRATAÇÃO DE EMPRESA PARA MANUTENÇÃO PREVENTIVA E CORRETIVA DOS SISTEMAS DE INFORMÁTICA',
    vigenciaInicio: '15/12/2024',
    vigenciaFim: '14/12/2025',
    situacao: 'VIGENTE',
    valor: 84000.00,
    fiscalContrato: 'FRANCISCO DE ASSIS ARRUDA OLIVEIRA',
    terceirizado: 'Não'
  }
];

const declaracoesMock: Declaracao[] = [
  {
    id: '1',
    data: '01/08/2025',
    exercicio: '2025',
    descricao: 'A Câmara Municipal de Mojuí dos Campos - PA, informa que NÃO HOUVE CELEBRAÇÃO DE CONTRATO no mês de JULHO de 2025.',
    mes: 'JULHO'
  },
  {
    id: '2',
    data: '06/03/2025',
    exercicio: '2025',
    descricao: 'A Câmara Municipal de Mojuí dos Campos - PA, informa que NÃO HOUVE CELEBRAÇÃO DE CONTRATO no mês de FEVEREIRO de 2025.',
    mes: 'FEVEREIRO'
  },
  {
    id: '3',
    data: '03/02/2025',
    exercicio: '2025',
    descricao: 'A Câmara Municipal de Mojuí dos Campos - PA, informa que NÃO HOUVE CELEBRAÇÃO DE CONTRATO no mês de JANEIRO de 2025.',
    mes: 'JANEIRO'
  },
  {
    id: '4',
    data: '01/10/2024',
    exercicio: '2024',
    descricao: 'A Câmara Municipal de Mojuí dos Campos - PA, informa que NÃO HOUVE CELEBRAÇÃO DE CONTRATO no mês de SETEMBRO de 2024.',
    mes: 'SETEMBRO'
  },
  {
    id: '5',
    data: '01/07/2024',
    exercicio: '2024',
    descricao: 'A Câmara Municipal de Mojuí dos Campos - PA, informa que NÃO HOUVE CELEBRAÇÃO DE CONTRATO no mês de JUNHO de 2024.',
    mes: 'JUNHO'
  },
  {
    id: '6',
    data: '04/03/2024',
    exercicio: '2024',
    descricao: 'A Câmara Municipal de Mojuí dos Campos - PA, informa que NÃO HOUVE CELEBRAÇÃO DE CONTRATO no mês de FEVEREIRO de 2024.',
    mes: 'FEVEREIRO'
  },
  {
    id: '7',
    data: '03/10/2023',
    exercicio: '2023',
    descricao: 'A Câmara Municipal de Mojuí dos Campos - PA, informa que NÃO HOUVE CELEBRAÇÃO DE CONTRATO no mês de SETEMBRO de 2023.',
    mes: 'SETEMBRO'
  },
  {
    id: '8',
    data: '01/09/2023',
    exercicio: '2023',
    descricao: 'A Câmara Municipal de Mojuí dos Campos - PA, informa que NÃO HOUVE CELEBRAÇÃO DE CONTRATO no mês de AGOSTO de 2023.',
    mes: 'AGOSTO'
  },
  {
    id: '9',
    data: '03/08/2023',
    exercicio: '2023',
    descricao: 'A Câmara Municipal de Mojuí dos Campos - PA, informa que NÃO HOUVE CELEBRAÇÃO DE CONTRATO no mês de JULHO de 2023.',
    mes: 'JULHO'
  },
  {
    id: '10',
    data: '13/07/2023',
    exercicio: '2023',
    descricao: 'A Câmara Municipal de Mojuí dos Campos - PA, informa que NÃO HOUVE CELEBRAÇÃO DE CONTRATO no mês de JUNHO de 2023.',
    mes: 'JUNHO'
  },
  {
    id: '11',
    data: '13/07/2023',
    exercicio: '2023',
    descricao: 'A Câmara Municipal de Mojuí dos Campos - PA, informa que NÃO HOUVE CELEBRAÇÃO DE CONTRATO no mês de MAIO de 2023.',
    mes: 'MAIO'
  },
  {
    id: '12',
    data: '13/07/2023',
    exercicio: '2023',
    descricao: 'A Câmara Municipal de Mojuí dos Campos - PA, informa que NÃO HOUVE CELEBRAÇÃO DE CONTRATO no mês de ABRIL de 2023.',
    mes: 'ABRIL'
  }
];

// Lista completa de contratados conforme o site oficial
const contratadosOptions = [
  'A.R. DA SILVA COMÉRCIO E SERVIÇOS',
  'AC EQUIPAMENTOS E ELETRONICOS LTDA',
  'ALAICICLEIA VICTOR MIRANDA',
  'ALEXANDRE AUGUSTO VIANTE',
  'ANTÔNIA RAIMUNDA ALVES',
  'ASP - AUTOMAÇÃO, SERVIÇOS E PRODUTOS DE INFORMÁTICA LTDA.',
  'BRASIL LOCADORA DE VEÍCULOS EIRELI',
  'COSTA PAES LTDA',
  'E.MENDONÇA DA SILVA LTDA',
  'EDINHO SILVA DE AGUIAR-ME',
  'EDMAR JUNIOR DE O. IMBELONI',
  'EMPRESA ANTÔNIO PORTELA DE SOUSA',
  'EMPRESA E. DA SILVA REIS',
  'EMPRESA IVO HENRIQUE DA SILVA',
  'EMPRESA LINDA COMÉRCIO E SERVIÇOS LTDA',
  'EMPRESA RAIANA TAVARES RIBEIRO',
  'ESIO TADEU F. PINTO',
  'GWC INDUSTRIA, IMPORTACAO E DISTRIBUICAO DE ELETRONICOS LTDA',
  'H. D. S. DE CASTRO COMÉRCIO E SERVIÇOS DE PEÇAS AUTOMOTORES LTDA',
  'IMPERIO SOLUCOES PUBLICAS LTDA',
  'INOVA TECH INFORMATICA LTDA',
  'J. R. LACERDA DA SILVA',
  'J.S. VIEIRA ASSESSORIA E SISTEMAS',
  'JAMILSON DIAS FROTA LTDA',
  'LAY OUT INFORMÁTICA PROCESSAMENTO DE DADOS S/S LTDA ME',
  'LIMA, BRITO, FERREIRA & PIAZZA ADVOGADOS',
  'M B SOLUCOES E SERVIÇOS LTDA',
  'M DE J.M. SOUSA LTDA',
  'MALU DISTRIBUIDORA E REPRESENTACOES LTDA',
  'MIRIAM DA SILVA PEDRO',
  'N. S DISTRIBUIDORA DE GENEROS',
  'OLIVEIRA E SANTOS ADVOGADOS ASSOCIADOS',
  'RAIMUNDO FRANCISCO DE LIMA MOURA',
  'RENOVAR ENGENHARIA E SERVIÇOS LTDA',
  'RODA BRASIL COMÉRCIO REPRESENTAÇÕES E SERVIÇOS LTDA',
  'S.O. CORDEIRO DE SOUZA LTDA',
  'U F AGUIAR LTDA',
  'VALE COMÉRCIO DE MOTOS LTDA',
  'WSP SERVIÇOS DE INTERNET LTDA'
];

const fiscaisOptions = [
  'ANTÔNIO RONALDO DA SILVA',
  'CRISTIANO NOGUEIRA DE SOUZA',
  'FRANCISCO DE ASSIS ARRUDA OLIVEIRA',
  'JACILENE DA SILVA REIS',
  'JOÃO BATISTA FREITAS DA SILVA',
  'LUCÍDIO ARAUJO DE SOUZA',
  'MARIA RITA BARROS RIBEIRO',
  'PAULA DE QUEIROZ LIMA',
  'RAIMUNDO EDMILSON SANTOS FILHO',
  'REGINALDO LIMA DOS REIS',
  'VITORIA EVERLIN DE CASTRO SOUSA FROTA'
];

export default function ContratosPage() {
  const [periodo, setPeriodo] = useState('');
  const [modalidadeSelecionada, setModalidadeSelecionada] = useState('all');
  const [contratadoSelecionado, setContratadoSelecionado] = useState('all');
  const [objeto, setObjeto] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [numeroContrato, setNumeroContrato] = useState('');
  const [exercicioSelecionado, setExercicioSelecionado] = useState('all');
  const [vigenciaSelecionada, setVigenciaSelecionada] = useState('all');
  const [terceirizadoSelecionado, setTerceirizadoSelecionado] = useState('all');
  const [fiscalSelecionado, setFiscalSelecionado] = useState('all');
  const [abaSelecionada, setAbaSelecionada] = useState<'lista' | 'declaracoes'>('lista');
  const [declaracaoSelecionada, setDeclaracaoSelecionada] = useState<Declaracao | null>(null);

  const exercicios = useMemo(() => {
    const exerciciosSet = new Set([...contratosMock.map(c => c.exercicio), ...declaracoesMock.map(d => d.exercicio)]);
    return Array.from(exerciciosSet).sort((a, b) => parseInt(b) - parseInt(a));
  }, []);

  const contratosFiltrados = useMemo(() => {
    return contratosMock.filter(contrato => {
      const matchesPeriodo = periodo === '' || contrato.data.includes(periodo);
      const matchesModalidade = modalidadeSelecionada === 'all' || contrato.modalidade === modalidadeSelecionada;
      const matchesContratado = contratadoSelecionado === 'all' || contrato.nomeContratado === contratadoSelecionado;
      const matchesObjeto = objeto === '' || contrato.objeto.toLowerCase().includes(objeto.toLowerCase());
      const matchesCnpj = cnpj === '' || contrato.cpfCnpj.includes(cnpj);
      const matchesNumero = numeroContrato === '' || contrato.numero.includes(numeroContrato);
      const matchesExercicio = exercicioSelecionado === 'all' || contrato.exercicio === exercicioSelecionado;
      const matchesVigencia = vigenciaSelecionada === 'all' || 
        (vigenciaSelecionada === 'Sim' && contrato.situacao === 'VIGENTE') ||
        (vigenciaSelecionada === 'Não' && contrato.situacao !== 'VIGENTE');
      const matchesTerceirizado = terceirizadoSelecionado === 'all' || contrato.terceirizado === terceirizadoSelecionado;
      const matchesFiscal = fiscalSelecionado === 'all' || contrato.fiscalContrato === fiscalSelecionado;
      
      return matchesPeriodo && matchesModalidade && matchesContratado && matchesObjeto && 
             matchesCnpj && matchesNumero && matchesExercicio && matchesVigencia && 
             matchesTerceirizado && matchesFiscal;
    });
  }, [periodo, modalidadeSelecionada, contratadoSelecionado, objeto, cnpj, numeroContrato, 
      exercicioSelecionado, vigenciaSelecionada, terceirizadoSelecionado, fiscalSelecionado]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleLimpar = () => {
    setPeriodo('');
    setModalidadeSelecionada('all');
    setContratadoSelecionado('all');
    setObjeto('');
    setCnpj('');
    setNumeroContrato('');
    setExercicioSelecionado('all');
    setVigenciaSelecionada('all');
    setTerceirizadoSelecionado('all');
    setFiscalSelecionado('all');
  };

  const getSituacaoIcon = (situacao: string) => {
    if (situacao === 'VIGENTE') {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getSituacaoBadge = (situacao: string) => {
    const badges = {
      'VIGENTE': 'bg-green-100 text-green-800',
      'ENCERRADO': 'bg-gray-100 text-gray-800',
      'RESCINDIDO': 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[situacao as keyof typeof badges]}`}>
        {situacao}
      </span>
    );
  };

  const handleVerDeclaracao = (declaracao: Declaracao) => {
    setDeclaracaoSelecionada(declaracao);
  };

  const handleFecharDeclaracao = () => {
    setDeclaracaoSelecionada(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Contratos
          </h1>
          <p className="text-gray-600">
            Consulta de contratos firmados pela Câmara Municipal
          </p>
        </div>

        {/* Abas */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setAbaSelecionada('lista')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  abaSelecionada === 'lista'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Lista de contratos
              </button>
              <button
                onClick={() => setAbaSelecionada('declaracoes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  abaSelecionada === 'declaracoes'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                DECLARAÇÕES
              </button>
            </nav>
          </div>
        </div>

        {abaSelecionada === 'lista' ? (
          <>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modalidade do contrato
                    </label>
                    <Select value={modalidadeSelecionada} onValueChange={setModalidadeSelecionada}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma modalidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as modalidades</SelectItem>
                        <SelectItem value="CONTRATO ORIGINAL">CONTRATO ORIGINAL</SelectItem>
                        <SelectItem value="ADITIVO">ADITIVO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do contratado
                    </label>
                    <Select value={contratadoSelecionado} onValueChange={setContratadoSelecionado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um contratado" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        <SelectItem value="all">Todos os contratados</SelectItem>
                        {contratadosOptions.map(contratado => (
                          <SelectItem key={contratado} value={contratado}>{contratado}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Objeto do contrato
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
                      CNPJ
                    </label>
                    <Input
                      type="text"
                      placeholder="Digite o CNPJ"
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número do contrato
                    </label>
                    <Input
                      type="text"
                      placeholder="Digite o número"
                      value={numeroContrato}
                      onChange={(e) => setNumeroContrato(e.target.value)}
                      className="w-full"
                    />
                  </div>

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
                      Vigência
                    </label>
                    <Select value={vigenciaSelecionada} onValueChange={setVigenciaSelecionada}>
                      <SelectTrigger>
                        <SelectValue placeholder="Vigência do contrato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="Sim">Sim</SelectItem>
                        <SelectItem value="Não">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Terceirizados
                    </label>
                    <Select value={terceirizadoSelecionado} onValueChange={setTerceirizadoSelecionado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Terceirizado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="Sim">Sim</SelectItem>
                        <SelectItem value="Não">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fiscal de contrato
                    </label>
                    <Select value={fiscalSelecionado} onValueChange={setFiscalSelecionado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o fiscal de contrato" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        <SelectItem value="all">Todos os fiscais</SelectItem>
                        {fiscaisOptions.map(fiscal => (
                          <SelectItem key={fiscal} value={fiscal}>{fiscal}</SelectItem>
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

            <div className="mb-4">
              <p className="text-lg font-semibold text-gray-900">
                Foram encontradas {contratosFiltrados.length} registros
              </p>
              <p className="text-sm text-gray-500 italic">
                Informações atualizadas em: {new Date().toLocaleString('pt-BR')}
              </p>
            </div>

            {/* Tabela de Contratos */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Número<br/>Modalidade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data<br/>Exercício
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome do contratado<br/>CPF/CNPJ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Secretaria<br/>Objeto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vigência
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Situação<br/>Data situação
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contratosFiltrados.map((contrato) => (
                      <tr key={contrato.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{contrato.numero}</div>
                          <div className="text-sm text-gray-500">{contrato.modalidade}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{contrato.data}</div>
                          <div className="text-sm text-gray-500">{contrato.exercicio}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{contrato.nomeContratado}</div>
                          <div className="text-sm text-gray-500">{contrato.cpfCnpj}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 mb-1">{contrato.secretaria}</div>
                          <div className="text-sm text-gray-700 max-w-md">{contrato.objeto}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{contrato.vigenciaInicio}</div>
                          <div className="text-sm text-gray-900">{contrato.vigenciaFim}</div>
                          <div className="mt-1">
                            {getSituacaoBadge(contrato.situacao)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getSituacaoIcon(contrato.situacao)}
                            <span className="text-sm text-gray-900">{contrato.situacao}</span>
                          </div>
                          {contrato.dataSituacao && (
                            <div className="text-sm text-gray-500 mt-1">{contrato.dataSituacao}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-purple-600">
                            {formatCurrency(contrato.valor)}
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
          </>
        ) : (
          <div className="space-y-4">
            {declaracoesMock.map((declaracao) => (
              <Card key={declaracao.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          DECLARAÇÃO: {declaracao.exercicio}
                        </h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">
                            Data: {declaracao.data}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {declaracao.descricao}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Exercício: {declaracao.exercicio}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                            Mês: {declaracao.mes}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleVerDeclaracao(declaracao)}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visualizar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de Declaração */}
        {declaracaoSelecionada && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl">
              <CardHeader className="bg-gray-100 border-b">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  Dados da declaração
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data:
                    </label>
                    <p className="text-gray-900 font-semibold">{declaracaoSelecionada.data}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição:
                    </label>
                    <p className="text-gray-700 leading-relaxed">
                      {declaracaoSelecionada.descricao}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Exercício:
                    </label>
                    <p className="text-gray-900 font-semibold">{declaracaoSelecionada.exercicio}</p>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <Button 
                      variant="outline" 
                      onClick={handleFecharDeclaracao}
                    >
                      Voltar
                    </Button>
                    <Button>
                      <Download className="h-4 w-4 mr-2" />
                      Clique aqui para visualizar o documento
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