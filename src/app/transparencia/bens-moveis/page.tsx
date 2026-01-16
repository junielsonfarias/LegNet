'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Download, Calendar, DollarSign } from 'lucide-react';

interface BemMovel {
  id: string;
  tombo: string;
  descricao: string;
  categoria: string;
  estado: 'otimo' | 'bom' | 'regular' | 'ruim';
  valorAquisicao: number;
  dataAquisicao: string;
  localizacao: string;
  responsavel: string;
}

const bensMoveisMock: BemMovel[] = [
  {
    id: '1',
    tombo: '001/2024',
    descricao: 'Computador Desktop Dell Inspiron 3020',
    categoria: 'Equipamento de Informática',
    estado: 'otimo',
    valorAquisicao: 3500.00,
    dataAquisicao: '15/01/2024',
    localizacao: 'Departamento de TI',
    responsavel: 'João Silva'
  },
  {
    id: '2',
    tombo: '002/2024',
    descricao: 'Mesa de Escritório em MDF 1,20m x 0,60m',
    categoria: 'Móveis e Utensílios',
    estado: 'bom',
    valorAquisicao: 450.00,
    dataAquisicao: '20/01/2024',
    localizacao: 'Gabinete do Presidente',
    responsavel: 'Maria Santos'
  },
  {
    id: '3',
    tombo: '003/2024',
    descricao: 'Ar Condicionado Split 12.000 BTUs',
    categoria: 'Equipamentos e Utensílios',
    estado: 'otimo',
    valorAquisicao: 2100.00,
    dataAquisicao: '25/01/2024',
    localizacao: 'Plenário',
    responsavel: 'Pedro Oliveira'
  }
];

export default function BensMoveisPage() {
  const [descricao, setDescricao] = useState('');
  const [tombo, setTombo] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('all');
  const [estadoSelecionado, setEstadoSelecionado] = useState('all');
  const [localizacao, setLocalizacao] = useState('');

  const categorias = Array.from(new Set(bensMoveisMock.map(b => b.categoria)));
  const estadosOptions = [
    { value: 'otimo', label: 'Ótimo' },
    { value: 'bom', label: 'Bom' },
    { value: 'regular', label: 'Regular' },
    { value: 'ruim', label: 'Ruim' }
  ];

  const bensFiltrados = useMemo(() => {
    return bensMoveisMock.filter(bem => {
      const matchesDescricao = descricao === '' || bem.descricao.toLowerCase().includes(descricao.toLowerCase());
      const matchesTombo = tombo === '' || bem.tombo.toLowerCase().includes(tombo.toLowerCase());
      const matchesCategoria = categoriaSelecionada === 'all' || bem.categoria === categoriaSelecionada;
      const matchesEstado = estadoSelecionado === 'all' || bem.estado === estadoSelecionado;
      const matchesLocalizacao = localizacao === '' || bem.localizacao.toLowerCase().includes(localizacao.toLowerCase());
      
      return matchesDescricao && matchesTombo && matchesCategoria && matchesEstado && matchesLocalizacao;
    });
  }, [descricao, tombo, categoriaSelecionada, estadoSelecionado, localizacao]);

  const handleLimpar = () => {
    setDescricao('');
    setTombo('');
    setCategoriaSelecionada('all');
    setEstadoSelecionado('all');
    setLocalizacao('');
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      otimo: 'bg-green-100 text-green-800',
      bom: 'bg-blue-100 text-blue-800',
      regular: 'bg-yellow-100 text-yellow-800',
      ruim: 'bg-red-100 text-red-800'
    };
    const labels = {
      otimo: 'Ótimo',
      bom: 'Bom',
      regular: 'Regular',
      ruim: 'Ruim'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[estado as keyof typeof badges]}`}>
        {labels[estado as keyof typeof labels]}
      </span>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const valorTotal = useMemo(() => {
    return bensFiltrados.reduce((sum, bem) => sum + bem.valorAquisicao, 0);
  }, [bensFiltrados]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bens Móveis
          </h1>
          <p className="text-gray-600">
            Inventário de bens móveis da Câmara Municipal
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
                  Categoria
                </label>
                <Select value={categoriaSelecionada} onValueChange={setCategoriaSelecionada}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categorias.map(categoria => (
                      <SelectItem key={categoria} value={categoria}>{categoria}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado de Conservação
                </label>
                <Select value={estadoSelecionado} onValueChange={setEstadoSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os estados</SelectItem>
                    {estadosOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número do Tombo
                </label>
                <Input
                  type="text"
                  placeholder="Ex: 001/2024"
                  value={tombo}
                  onChange={(e) => setTombo(e.target.value)}
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
                  Localização
                </label>
                <Input
                  type="text"
                  placeholder="Ex: Departamento de TI"
                  value={localizacao}
                  onChange={(e) => setLocalizacao(e.target.value)}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total de Bens</p>
                  <p className="text-3xl font-bold text-gray-900">{bensFiltrados.length}</p>
                </div>
                <Package className="h-12 w-12 text-teal-600" />
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
                <DollarSign className="h-12 w-12 text-teal-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {bensFiltrados.length > 0 ? (
            bensFiltrados.map((bem) => (
              <Card key={bem.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-teal-600">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Package className="h-5 w-5 text-teal-600" />
                          <h3 className="text-lg font-bold text-gray-900">
                            Tombo: {bem.tombo}
                          </h3>
                          {getEstadoBadge(bem.estado)}
                        </div>
                        
                        <p className="text-gray-700 mb-4 font-medium">{bem.descricao}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="font-semibold">Categoria:</span>
                            <span>{bem.categoria}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-semibold">Valor:</span>
                            <span>{formatCurrency(bem.valorAquisicao)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span className="font-semibold">Data de Aquisição:</span>
                            <span>{bem.dataAquisicao}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="font-semibold">Localização:</span>
                            <span>{bem.localizacao}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 md:col-span-2">
                            <span className="font-semibold">Responsável:</span>
                            <span>{bem.responsavel}</span>
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
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  Nenhum bem móvel encontrado com os filtros aplicados.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

