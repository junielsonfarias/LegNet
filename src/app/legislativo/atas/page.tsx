'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Calendar, Eye } from 'lucide-react';

interface Ata {
  id: string;
  numero: string;
  tipo: string;
  data: string;
  descricao: string;
  presidente: string;
  secretario: string;
  status: 'publicada' | 'pendente' | 'revisao';
  arquivo?: string;
}

const atasMock: Ata[] = [
  {
    id: '1',
    numero: 'Ata nº 001/2024',
    tipo: 'Ordinária',
    data: '05/02/2024',
    descricao: 'Ata da 1ª Sessão Ordinária da 1ª Sessão Legislativa - Ano 2024',
    presidente: 'Francisco Pereira Pantoja',
    secretario: 'Mickael Christyan Alves de Aguiar',
    status: 'publicada',
    arquivo: '/documentos/ata-001-2024.pdf'
  },
  {
    id: '2',
    numero: 'Ata nº 002/2024',
    tipo: 'Ordinária',
    data: '12/02/2024',
    descricao: 'Ata da 2ª Sessão Ordinária da 1ª Sessão Legislativa - Ano 2024',
    presidente: 'Francisco Pereira Pantoja',
    secretario: 'Mickael Christyan Alves de Aguiar',
    status: 'publicada',
    arquivo: '/documentos/ata-002-2024.pdf'
  },
  {
    id: '3',
    numero: 'Ata nº 003/2024',
    tipo: 'Extraordinária',
    data: '19/02/2024',
    descricao: 'Ata da 1ª Sessão Extraordinária da 1ª Sessão Legislativa - Ano 2024',
    presidente: 'Francisco Pereira Pantoja',
    secretario: 'Mickael Christyan Alves de Aguiar',
    status: 'publicada',
    arquivo: '/documentos/ata-003-2024.pdf'
  }
];

export default function AtasPage() {
  const [numeroFiltro, setNumeroFiltro] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [tipoSelecionado, setTipoSelecionado] = useState('all');
  const [statusSelecionado, setStatusSelecionado] = useState('all');

  const tipos = ['Ordinária', 'Extraordinária', 'Solene', 'Especial'];
  const statusOptions = [
    { value: 'publicada', label: 'Publicada' },
    { value: 'pendente', label: 'Pendente' },
    { value: 'revisao', label: 'Em Revisão' }
  ];

  const atasFiltradas = useMemo(() => {
    return atasMock.filter(ata => {
      const matchesNumero = numeroFiltro === '' || ata.numero.toLowerCase().includes(numeroFiltro.toLowerCase());
      const matchesDescricao = descricao === '' || ata.descricao.toLowerCase().includes(descricao.toLowerCase());
      const matchesTipo = tipoSelecionado === 'all' || ata.tipo === tipoSelecionado;
      const matchesStatus = statusSelecionado === 'all' || ata.status === statusSelecionado;
      
      return matchesNumero && matchesDescricao && matchesTipo && matchesStatus;
    });
  }, [numeroFiltro, descricao, tipoSelecionado, statusSelecionado]);

  const handleLimpar = () => {
    setNumeroFiltro('');
    setDescricao('');
    setDataInicio('');
    setDataFim('');
    setTipoSelecionado('all');
    setStatusSelecionado('all');
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      publicada: 'bg-green-100 text-green-800',
      pendente: 'bg-yellow-100 text-yellow-800',
      revisao: 'bg-blue-100 text-blue-800'
    };
    const labels = {
      publicada: 'Publicada',
      pendente: 'Pendente',
      revisao: 'Em Revisão'
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
            Atas das Sessões Legislativas
          </h1>
          <p className="text-gray-600">
            Consulta de atas das sessões realizadas pela Câmara Municipal
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
                  Número da Ata
                </label>
                <Input
                  type="text"
                  placeholder="Ex: 001/2024"
                  value={numeroFiltro}
                  onChange={(e) => setNumeroFiltro(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <Input
                  type="text"
                  placeholder="Digite palavras-chave para buscar na descrição"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
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
            Foram encontradas {atasFiltradas.length} atas
          </p>
        </div>

        <div className="space-y-4">
          {atasFiltradas.length > 0 ? (
            atasFiltradas.map((ata) => (
              <Card key={ata.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-600">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-bold text-gray-900">
                          {ata.numero}
                        </h3>
                        {getStatusBadge(ata.status)}
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {ata.tipo}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-gray-700 leading-relaxed">
                          {ata.descricao}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span className="font-semibold">Data:</span>
                            <span>{ata.data}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Presidente:</span>
                            <span>{ata.presidente}</span>
                          </div>
                          <div className="flex items-center gap-2 md:col-span-2">
                            <span className="font-semibold">Secretário:</span>
                            <span>{ata.secretario}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Ata
                      </Button>
                      {ata.arquivo && (
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Baixar PDF
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  Nenhuma ata encontrada com os filtros aplicados.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
