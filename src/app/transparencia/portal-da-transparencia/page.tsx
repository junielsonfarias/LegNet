'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  Users,
  Building2,
  MapPin,
  Clock,
  Calendar,
  BarChart3,
  Shield,
  Search,
  ExternalLink,
  TrendingUp,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { TransparenciaItem } from '@/lib/types/transparencia';

const categorias = [
  { id: 'portal-da-transparencia', nome: 'Portal da Transparência', icone: Shield },
  { id: 'lei-de-responsabilidade-fiscal', nome: 'Lei de Responsabilidade Fiscal', icone: BarChart3 },
  { id: 'receitas-despesas-convenios-folhas-licitacoes-contratos', nome: 'Receitas, Despesas, Convênios, Folhas, Licitações e Contratos', icone: TrendingUp },
  { id: 'ouvidoria-e-e-sic', nome: 'Ouvidoria e e-SIC', icone: Users },
  { id: 'publicacoes', nome: 'Publicações', icone: FileText },
  { id: 'boas-praticas-de-transparencia-publica', nome: 'Boas Práticas de Transparência Pública', icone: Eye },
  { id: 'legislacao-vigente', nome: 'Legislação Vigente', icone: Building2 }
];

export default function PortalTransparenciaPage() {
  const [itens, setItens] = useState<TransparenciaItem[]>([]);
  const [todosItens, setTodosItens] = useState<TransparenciaItem[]>([]); // Para opções de filtro
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('portal-da-transparencia');
  const [subcategoriaSelecionada, setSubcategoriaSelecionada] = useState<string>('all');
  const [anoSelecionado, setAnoSelecionado] = useState<string>('all');
  const [tipoSelecionado, setTipoSelecionado] = useState<string>('all');
  const [busca, setBusca] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const carregarDados = useCallback(async () => {
    setLoading(true);

    try {
      // Buscar todos os itens da categoria (sem filtro de subcategoria) para opções de dropdown
      const todosResponse = await fetch(`/api/transparencia/itens?categoria=${categoriaSelecionada}`);
      const todosResult = await todosResponse.json();
      const todosOsItens: TransparenciaItem[] = todosResult.success && todosResult.data?.itens
        ? todosResult.data.itens
        : (todosResult.success && Array.isArray(todosResult.data) ? todosResult.data : []);
      setTodosItens(todosOsItens);

      // Aplicar filtros
      let dadosFiltrados = [...todosOsItens];

      if (subcategoriaSelecionada !== 'all') {
        dadosFiltrados = dadosFiltrados.filter(item => item.subcategoria === subcategoriaSelecionada);
      }

      if (anoSelecionado !== 'all') {
        dadosFiltrados = dadosFiltrados.filter(item => item.ano === parseInt(anoSelecionado));
      }

      if (tipoSelecionado !== 'all') {
        dadosFiltrados = dadosFiltrados.filter(item => item.tipo === tipoSelecionado);
      }

      if (busca) {
        const termoBusca = busca.toLowerCase();
        dadosFiltrados = dadosFiltrados.filter(item =>
          item.titulo.toLowerCase().includes(termoBusca) ||
          item.descricao.toLowerCase().includes(termoBusca) ||
          item.subcategoria.toLowerCase().includes(termoBusca)
        );
      }

      setItens(dadosFiltrados);

      // Carregar estatísticas via API
      const statsResponse = await fetch('/api/transparencia/estatisticas');
      const statsResult = await statsResponse.json();
      if (statsResult.success && statsResult.data?.porCategoria) {
        const categoriaStats = statsResult.data.porCategoria.find(
          (stat: any) => stat.categoria === categoriaSelecionada
        );
        setStats(categoriaStats);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [anoSelecionado, busca, categoriaSelecionada, subcategoriaSelecionada, tipoSelecionado]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const obterSubcategorias = () => {
    return Array.from(new Set(todosItens.map(item => item.subcategoria)));
  };

  const obterAnos = () => {
    return Array.from(new Set(todosItens.map(item => item.ano))).sort((a, b) => b - a);
  };

  const obterTipos = () => {
    return Array.from(new Set(todosItens.map(item => item.tipo)));
  };

  const obterIconePorTipo = (tipo: string) => {
    switch (tipo) {
      case 'documento': return FileText;
      case 'relatorio': return BarChart3;
      case 'informacao': return Eye;
      case 'servico': return Users;
      case 'agenda': return Calendar;
      case 'lista': return TrendingUp;
      default: return FileText;
    }
  };

  const obterCorPorTipo = (tipo: string) => {
    switch (tipo) {
      case 'documento': return 'bg-blue-100 text-blue-800';
      case 'relatorio': return 'bg-green-100 text-green-800';
      case 'informacao': return 'bg-purple-100 text-purple-800';
      case 'servico': return 'bg-orange-100 text-orange-800';
      case 'agenda': return 'bg-pink-100 text-pink-800';
      case 'lista': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const obterCorPorStatus = (status: string) => {
    switch (status) {
      case 'publicado': return 'bg-green-100 text-green-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'arquivado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const categoriaAtual = categorias.find(cat => cat.id === categoriaSelecionada);
  const CategoriaIcon = categoriaAtual?.icone || FileText;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Cabeçalho */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <CategoriaIcon className="h-12 w-12 text-camara-primary mr-4" />
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              {categoriaAtual?.nome || 'Portal da Transparência'}
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Acesso transparente às informações da Câmara Municipal
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-camara-primary">{stats.total}</div>
                <p className="text-sm text-gray-600">Total de Itens</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{stats.publicados}</div>
                <p className="text-sm text-gray-600">Publicados</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-600">{stats.pendentes}</div>
                <p className="text-sm text-gray-600">Pendentes</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-gray-600">{stats.arquivados}</div>
                <p className="text-sm text-gray-600">Arquivados</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Navegação por Categorias */}
      <Tabs value={categoriaSelecionada} onValueChange={setCategoriaSelecionada} className="mb-8">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 mb-6">
          {categorias.map((categoria) => {
            const Icone = categoria.icone;
            return (
              <TabsTrigger 
                key={categoria.id} 
                value={categoria.id}
                className="flex flex-col items-center p-3 text-xs"
              >
                <Icone className="h-4 w-4 mb-1" />
                <span className="hidden md:inline">{categoria.nome}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={categoriaSelecionada}>
          {/* Filtros */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Filtros de Busca
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <Input
                    placeholder="Buscar por título ou descrição..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <Select value={subcategoriaSelecionada} onValueChange={setSubcategoriaSelecionada}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as subcategorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as subcategorias</SelectItem>
                    {obterSubcategorias().map((subcategoria) => (
                      <SelectItem key={subcategoria} value={subcategoria}>
                        {subcategoria.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os anos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os anos</SelectItem>
                    {obterAnos().map((ano) => (
                      <SelectItem key={ano} value={ano.toString()}>
                        {ano}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={tipoSelecionado} onValueChange={setTipoSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {obterTipos().map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button 
                  onClick={() => {
                    setBusca('');
                    setSubcategoriaSelecionada('all');
                    setAnoSelecionado('all');
                    setTipoSelecionado('all');
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Itens */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-camara-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando informações...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {itens.map((item) => {
                const TipoIcon = obterIconePorTipo(item.tipo);
                return (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <TipoIcon className="h-5 w-5 text-camara-primary mr-2" />
                          <CardTitle className="text-lg">{item.titulo}</CardTitle>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge className={obterCorPorTipo(item.tipo)}>
                            {item.tipo}
                          </Badge>
                          <Badge className={obterCorPorStatus(item.status)}>
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4 line-clamp-3">{item.descricao}</p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(item.dataPublicacao).toLocaleDateString('pt-BR')}
                        </span>
                        <span>Ano: {item.ano}</span>
                      </div>

                      {item.url !== '#' ? (
                        <Button asChild className="w-full">
                          <Link href={item.url}>
                            Acessar <ExternalLink className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      ) : (
                        <Button disabled className="w-full">
                          Em breve
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Mensagem quando não há resultados */}
          {!loading && itens.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Nenhum item encontrado
                </h3>
                <p className="text-gray-600 mb-4">
                  Não foram encontrados itens com os filtros aplicados.
                </p>
                <Button 
                  onClick={() => {
                    setBusca('');
                    setSubcategoriaSelecionada('all');
                    setAnoSelecionado('all');
                    setTipoSelecionado('all');
                  }}
                  variant="outline"
                >
                  Limpar Filtros
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Informações Adicionais */}
      <Card className="mt-12">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-camara-primary" />
            Transparência Pública
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Nossa Missão</h4>
              <p className="text-gray-600 text-sm">
                Garantir o acesso público às informações da Câmara Municipal, 
                promovendo transparência, accountability e participação cidadã 
                na gestão pública.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Atualização dos Dados</h4>
              <p className="text-gray-600 text-sm">
                Os dados são atualizados regularmente conforme a legislação 
                vigente. Para informações mais recentes, consulte diretamente 
                os órgãos competentes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}