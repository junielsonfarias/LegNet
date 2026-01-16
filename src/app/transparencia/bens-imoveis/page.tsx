'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, Download, MapPin, DollarSign, FileText } from 'lucide-react';

interface BemImovel {
  id: string;
  registro: string;
  descricao: string;
  tipo: 'terreno' | 'edificacao' | 'sala' | 'galpao';
  endereco: string;
  area: number;
  valorAvaliado: number;
  utilizacao: string;
  documentacao: string;
}

const bensImoveisMock: BemImovel[] = [
  {
    id: '1',
    registro: 'IM-001/2024',
    descricao: 'Prédio da Câmara Municipal',
    tipo: 'edificacao',
    endereco: 'Av. Principal, 123 - Centro',
    area: 850.50,
    valorAvaliado: 1500000.00,
    utilizacao: 'Sede Administrativa',
    documentacao: 'Matrícula nº 12345 - Cartório de Registro de Imóveis'
  },
  {
    id: '2',
    registro: 'IM-002/2024',
    descricao: 'Terreno Anexo à Câmara',
    tipo: 'terreno',
    endereco: 'Rua Lateral, s/n - Centro',
    area: 500.00,
    valorAvaliado: 350000.00,
    utilizacao: 'Estacionamento',
    documentacao: 'Matrícula nº 12346 - Cartório de Registro de Imóveis'
  },
  {
    id: '3',
    registro: 'IM-003/2024',
    descricao: 'Galpão de Almoxarifado',
    tipo: 'galpao',
    endereco: 'Rua dos Fundos, 50 - Distrito Industrial',
    area: 300.00,
    valorAvaliado: 180000.00,
    utilizacao: 'Armazenamento de Materiais',
    documentacao: 'Matrícula nº 12347 - Cartório de Registro de Imóveis'
  }
];

export default function BensImoveisPage() {
  const [descricao, setDescricao] = useState('');
  const [registro, setRegistro] = useState('');
  const [tipoSelecionado, setTipoSelecionado] = useState('all');
  const [endereco, setEndereco] = useState('');

  const tiposOptions = [
    { value: 'terreno', label: 'Terreno' },
    { value: 'edificacao', label: 'Edificação' },
    { value: 'sala', label: 'Sala' },
    { value: 'galpao', label: 'Galpão' }
  ];

  const bensFiltrados = useMemo(() => {
    return bensImoveisMock.filter(bem => {
      const matchesDescricao = descricao === '' || bem.descricao.toLowerCase().includes(descricao.toLowerCase());
      const matchesRegistro = registro === '' || bem.registro.toLowerCase().includes(registro.toLowerCase());
      const matchesTipo = tipoSelecionado === 'all' || bem.tipo === tipoSelecionado;
      const matchesEndereco = endereco === '' || bem.endereco.toLowerCase().includes(endereco.toLowerCase());
      
      return matchesDescricao && matchesRegistro && matchesTipo && matchesEndereco;
    });
  }, [descricao, registro, tipoSelecionado, endereco]);

  const handleLimpar = () => {
    setDescricao('');
    setRegistro('');
    setTipoSelecionado('all');
    setEndereco('');
  };

  const getTipoBadge = (tipo: string) => {
    const badges = {
      terreno: 'bg-amber-100 text-amber-800',
      edificacao: 'bg-blue-100 text-blue-800',
      sala: 'bg-purple-100 text-purple-800',
      galpao: 'bg-gray-100 text-gray-800'
    };
    const labels = {
      terreno: 'Terreno',
      edificacao: 'Edificação',
      sala: 'Sala',
      galpao: 'Galpão'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[tipo as keyof typeof badges]}`}>
        {labels[tipo as keyof typeof labels]}
      </span>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatArea = (area: number) => {
    return `${area.toFixed(2)} m²`;
  };

  const valorTotal = useMemo(() => {
    return bensFiltrados.reduce((sum, bem) => sum + bem.valorAvaliado, 0);
  }, [bensFiltrados]);

  const areaTotal = useMemo(() => {
    return bensFiltrados.reduce((sum, bem) => sum + bem.area, 0);
  }, [bensFiltrados]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bens Imóveis
          </h1>
          <p className="text-gray-600">
            Inventário de bens imóveis da Câmara Municipal
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader className="bg-gray-100 border-b">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Campos para pesquisa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Imóvel
                </label>
                <Select value={tipoSelecionado} onValueChange={setTipoSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {tiposOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número do Registro
                </label>
                <Input
                  type="text"
                  placeholder="Ex: IM-001/2024"
                  value={registro}
                  onChange={(e) => setRegistro(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <Input
                  type="text"
                  placeholder="Digite palavras-chave"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço
                </label>
                <Input
                  type="text"
                  placeholder="Digite o endereço"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total de Imóveis</p>
                  <p className="text-3xl font-bold text-gray-900">{bensFiltrados.length}</p>
                </div>
                <Home className="h-12 w-12 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Área Total</p>
                  <p className="text-3xl font-bold text-gray-900">{formatArea(areaTotal)}</p>
                </div>
                <MapPin className="h-12 w-12 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Valor Total</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(valorTotal)}</p>
                </div>
                <DollarSign className="h-12 w-12 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {bensFiltrados.length > 0 ? (
            bensFiltrados.map((bem) => (
              <Card key={bem.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-600">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Home className="h-5 w-5 text-orange-600" />
                          <h3 className="text-lg font-bold text-gray-900">
                            Registro: {bem.registro}
                          </h3>
                          {getTipoBadge(bem.tipo)}
                        </div>
                        
                        <p className="text-gray-700 mb-4 font-medium">{bem.descricao}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span className="font-semibold">Endereço:</span>
                            <span>{bem.endereco}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="font-semibold">Área:</span>
                            <span>{formatArea(bem.area)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-semibold">Valor Avaliado:</span>
                            <span>{formatCurrency(bem.valorAvaliado)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="font-semibold">Utilização:</span>
                            <span>{bem.utilizacao}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 md:col-span-2">
                            <FileText className="h-4 w-4" />
                            <span className="font-semibold">Documentação:</span>
                            <span>{bem.documentacao}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Home className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  Nenhum bem imóvel encontrado com os filtros aplicados.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

