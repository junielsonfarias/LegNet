'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Calendar, Eye, Clock } from 'lucide-react';

interface PautaItem {
  id: string;
  numeroMateria: string;
  tipo: string;
  ementa: string;
}

interface Pauta {
  id: string;
  numero: string;
  tipo: string;
  data: string;
  horario: string;
  local: string;
  status: 'agendada' | 'realizada' | 'cancelada';
  itens: PautaItem[];
  observacoes?: string;
}

const pautasMock: Pauta[] = [
  {
    id: '1',
    numero: 'Pauta nº 001/2024',
    tipo: 'Ordinária',
    data: '05/02/2024',
    horario: '09:00',
    local: 'Plenário da Câmara Municipal',
    status: 'realizada',
    itens: [
      {
        id: '1',
        numeroMateria: 'Projeto de Lei nº 001/2024',
        tipo: 'Projeto de Lei',
        ementa: 'Dispõe sobre a criação de programa de incentivo ao esporte nas escolas municipais.'
      },
      {
        id: '2',
        numeroMateria: 'Requerimento nº 001/2024',
        tipo: 'Requerimento',
        ementa: 'Requer informações sobre a execução orçamentária do primeiro trimestre de 2024.'
      }
    ],
    observacoes: 'Sessão realizada com a presença de 9 vereadores.'
  },
  {
    id: '2',
    numero: 'Pauta nº 002/2024',
    tipo: 'Ordinária',
    data: '12/02/2024',
    horario: '09:00',
    local: 'Plenário da Câmara Municipal',
    status: 'realizada',
    itens: [
      {
        id: '3',
        numeroMateria: 'Projeto de Lei nº 002/2024',
        tipo: 'Projeto de Lei',
        ementa: 'Institui o programa municipal de coleta seletiva e reciclagem de resíduos sólidos.'
      }
    ]
  },
  {
    id: '3',
    numero: 'Pauta nº 003/2024',
    tipo: 'Extraordinária',
    data: '19/02/2024',
    horario: '14:00',
    local: 'Plenário da Câmara Municipal',
    status: 'agendada',
    itens: [
      {
        id: '4',
        numeroMateria: 'Projeto de Lei nº 003/2024',
        tipo: 'Projeto de Lei',
        ementa: 'Autoriza a abertura de crédito adicional especial para obras de pavimentação.'
      }
    ]
  }
];

export default function PautasPage() {
  const [numeroFiltro, setNumeroFiltro] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [tipoSelecionado, setTipoSelecionado] = useState('all');
  const [statusSelecionado, setStatusSelecionado] = useState('all');

  const tipos = ['Ordinária', 'Extraordinária', 'Solene', 'Especial'];
  const statusOptions = [
    { value: 'agendada', label: 'Agendada' },
    { value: 'realizada', label: 'Realizada' },
    { value: 'cancelada', label: 'Cancelada' }
  ];

  const pautasFiltradas = useMemo(() => {
    return pautasMock.filter(pauta => {
      const matchesNumero = numeroFiltro === '' || pauta.numero.toLowerCase().includes(numeroFiltro.toLowerCase());
      const matchesTipo = tipoSelecionado === 'all' || pauta.tipo === tipoSelecionado;
      const matchesStatus = statusSelecionado === 'all' || pauta.status === statusSelecionado;
      
      return matchesNumero && matchesTipo && matchesStatus;
    });
  }, [numeroFiltro, tipoSelecionado, statusSelecionado]);

  const handleLimpar = () => {
    setNumeroFiltro('');
    setDataInicio('');
    setDataFim('');
    setTipoSelecionado('all');
    setStatusSelecionado('all');
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      agendada: 'bg-blue-100 text-blue-800',
      realizada: 'bg-green-100 text-green-800',
      cancelada: 'bg-red-100 text-red-800'
    };
    const labels = {
      agendada: 'Agendada',
      realizada: 'Realizada',
      cancelada: 'Cancelada'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pautas das Sessões Legislativas
          </h1>
          <p className="text-gray-600">
            Consulta de pautas e matérias das sessões da Câmara Municipal
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader className="bg-gray-100 border-b">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Campos para pesquisa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Sessão
                </label>
                <Select value={tipoSelecionado} onValueChange={setTipoSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {tipos.map(tipo => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <Select value={statusSelecionado} onValueChange={setStatusSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número da Pauta
                </label>
                <Input
                  type="text"
                  placeholder="Ex: 001/2024"
                  value={numeroFiltro}
                  onChange={(e) => setNumeroFiltro(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <p className="text-sm text-gray-600 italic mb-4">
              Para usar as opções de filtro, escolha o campo para a pesquisa e clique no botão pesquisar
            </p>

            <div className="flex flex-wrap gap-3">
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
            Foram encontradas {pautasFiltradas.length} pautas
          </p>
        </div>

        <div className="space-y-4">
          {pautasFiltradas.length > 0 ? (
            pautasFiltradas.map((pauta) => (
              <Card key={pauta.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-600">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <FileText className="h-5 w-5 text-purple-600" />
                          <h3 className="text-lg font-bold text-gray-900">
                            {pauta.numero}
                          </h3>
                          {getStatusBadge(pauta.status)}
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            {pauta.tipo}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span className="font-semibold">Data:</span>
                            <span>{pauta.data}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span className="font-semibold">Horário:</span>
                            <span>{pauta.horario}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Local:</span>
                            <span>{pauta.local}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Pauta
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Baixar PDF
                        </Button>
                      </div>
                    </div>

                    {/* Itens da Pauta */}
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Matérias da Pauta ({pauta.itens.length})
                      </h4>
                      <div className="space-y-3">
                        {pauta.itens.map((item, index) => (
                          <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-start gap-3">
                              <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </span>
                              <div className="flex-1">
                                <h5 className="font-semibold text-gray-900 mb-1">
                                  {item.numeroMateria}
                                </h5>
                                <p className="text-sm text-gray-600 mb-1">
                                  <span className="font-medium">Tipo:</span> {item.tipo}
                                </p>
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">Ementa:</span> {item.ementa}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {pauta.observacoes && (
                      <div className="border-t pt-4">
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Observações:</span> {pauta.observacoes}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  Nenhuma pauta encontrada com os filtros aplicados.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

