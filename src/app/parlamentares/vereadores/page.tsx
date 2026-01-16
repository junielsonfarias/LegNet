'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Search, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Building,
  BarChart3,
  Eye,
  ExternalLink,
  Filter,
  UserCheck,
  Award,
  Clock
} from 'lucide-react';
import { useParlamentares } from '@/lib/hooks/use-parlamentares';
import { useLegislaturas } from '@/lib/hooks/use-legislaturas';

export default function VereadoresPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [legislaturaFiltro, setLegislaturaFiltro] = useState('2025-2028');
  const [statusFiltro, setStatusFiltro] = useState('ativo');
  const [partidoFiltro, setPartidoFiltro] = useState('todos');

  // Dados usando hooks
  const { parlamentares, loading: loadingParlamentares } = useParlamentares({ ativo: true });
  const { legislaturas, loading: loadingLegislaturas } = useLegislaturas();

  // Dados dos vereadores (apenas vereadores, excluindo mesa diretora)
  const vereadores = parlamentares.filter(p => p.cargo === 'VEREADOR');

  // Partidos únicos
  const partidos = useMemo((): string[] => {
    const partidosSet = new Set(vereadores.map(v => v.partido).filter((p): p is string => Boolean(p)));
    return Array.from(partidosSet).sort();
  }, [vereadores]);

  // Dados enriquecidos com estatísticas
  const vereadoresEnriquecidos = useMemo((): any[] => {
    const legislaturaAtiva = legislaturas.find(l => l.ativa);

    return vereadores.map(vereador => {
      // TODO: Calcular estatísticas quando API estiver disponível
      const estatisticas = {
        legislaturaAtual: { sessoes: 0, materias: 0, percentualPresenca: 0 }
      };

      return {
        ...vereador,
        estatisticas,
        legislaturaAtiva: legislaturaAtiva ? `${legislaturaAtiva.anoInicio}-${legislaturaAtiva.anoFim}` : vereador.legislatura,
        numeroVotos: 0, // TODO: Buscar quando API estiver disponível
        dataInicio: new Date('2025-01-01'),
        ativo: vereador.ativo
      };
    });
  }, [vereadores, legislaturas]);

  // Aplicar filtros
  const vereadoresFiltrados = useMemo(() => {
    return vereadoresEnriquecidos.filter(vereador => {
      // Filtro de busca por nome, apelido ou partido
      const matchSearch = !searchTerm ||
        vereador.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (vereador.apelido?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (vereador.partido?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

      // Filtro de legislatura
      const matchLegislatura = legislaturaFiltro === 'todos' || vereador.legislaturaAtiva === legislaturaFiltro;

      // Filtro de status
      const matchStatus = statusFiltro === 'todos' || 
        (statusFiltro === 'ativo' && vereador.ativo) ||
        (statusFiltro === 'inativo' && !vereador.ativo);

      // Filtro de partido
      const matchPartido = partidoFiltro === 'todos' || vereador.partido === partidoFiltro;

      return matchSearch && matchLegislatura && matchStatus && matchPartido;
    });
  }, [vereadoresEnriquecidos, searchTerm, legislaturaFiltro, statusFiltro, partidoFiltro]);

  // Estatísticas gerais
  const estatisticas = useMemo(() => {
    const total = vereadoresEnriquecidos.length;
    const ativos = vereadoresEnriquecidos.filter(v => v.ativo).length;
    const inativos = total - ativos;
    const totalMaterias = vereadoresEnriquecidos.reduce((acc, v) => acc + (v.estatisticas.legislaturaAtual?.materias || 0), 0);
    const mediaPresenca = vereadoresEnriquecidos.length > 0 
      ? vereadoresEnriquecidos.reduce((acc, v) => acc + (v.estatisticas.legislaturaAtual?.percentualPresenca || 0), 0) / vereadoresEnriquecidos.length
      : 0;

    return {
      total,
      ativos,
      inativos,
      totalMaterias,
      mediaPresenca: Math.round(mediaPresenca)
    };
  }, [vereadoresEnriquecidos]);

  const getStatusBadge = (ativo: boolean) => {
    if (ativo) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <UserCheck className="h-3 w-3 mr-1" />
          Ativo
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-800 border-gray-200">
        <Clock className="h-3 w-3 mr-1" />
        Inativo
      </Badge>
    );
  };

  const getPresencaColor = (percentual: number) => {
    if (percentual >= 90) return 'text-green-600';
    if (percentual >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPresencaBadge = (percentual: number) => {
    if (percentual >= 90) return 'bg-green-100 text-green-800';
    if (percentual >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Users className="h-10 w-10 text-blue-600" />
            Vereadores
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Conheça todos os vereadores da Câmara Municipal de Mojuí dos Campos
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="camara-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {estatisticas.total}
                  </div>
                  <p className="text-sm text-gray-600">Total de Vereadores</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="camara-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {estatisticas.ativos}
                  </div>
                  <p className="text-sm text-gray-600">Vereadores Ativos</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="camara-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {estatisticas.totalMaterias}
                  </div>
                  <p className="text-sm text-gray-600">Total de Matérias</p>
                </div>
                <Award className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="camara-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {estatisticas.mediaPresenca}%
                  </div>
                  <p className="text-sm text-gray-600">Média de Presença</p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-8">
          <CardHeader className="bg-gray-100 border-b">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Busca
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Busca por texto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar Vereador
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Nome, apelido ou partido..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filtro de Legislatura */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Legislatura
                </label>
                <Select value={legislaturaFiltro} onValueChange={setLegislaturaFiltro}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma legislatura" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as Legislaturas</SelectItem>
                    {legislaturas.map(legislatura => (
                      <SelectItem key={legislatura.id} value={String(legislatura.numero)}>
                        {legislatura.numero}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="ativo">Apenas Ativos</SelectItem>
                    <SelectItem value="inativo">Apenas Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Partido */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Partido
                </label>
                <Select value={partidoFiltro} onValueChange={setPartidoFiltro}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um partido" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Partidos</SelectItem>
                    {partidos.map(partido => (
                      <SelectItem key={partido} value={partido}>
                        {partido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Contador de resultados */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Mostrando <span className="font-semibold">{vereadoresFiltrados.length}</span> de{' '}
                <span className="font-semibold">{vereadoresEnriquecidos.length}</span> vereadores
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Vereadores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vereadoresFiltrados.map((vereador) => (
            <Card key={vereador.id} className="camara-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {vereador.nome}
                      </h3>
                      <p className="text-sm text-gray-600">
                        ({vereador.apelido})
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {getStatusBadge(vereador.ativo)}
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      Vereador
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building className="h-4 w-4" />
                    {vereador.partido}
                  </div>
                  
                  {vereador.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      {vereador.email}
                    </div>
                  )}
                  
                  {vereador.telefone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      {vereador.telefone}
                    </div>
                  )}
                  
                  {vereador.gabinete && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {vereador.gabinete}
                    </div>
                  )}

                  {/* Informações da Legislatura */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    Legislatura {vereador.legislaturaAtiva}
                  </div>

                  {/* Estatísticas */}
                  <div className="border-t pt-3 mt-3">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold text-blue-600">
                          {vereador.estatisticas.legislaturaAtual?.sessoes || 0}
                        </div>
                        <div className="text-xs text-gray-500">Sessões</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-green-600">
                          {vereador.estatisticas.legislaturaAtual?.materias || 0}
                        </div>
                        <div className="text-xs text-gray-500">Matérias</div>
                      </div>
                      <div>
                        <div className={`text-lg font-semibold ${getPresencaColor(vereador.estatisticas.legislaturaAtual?.percentualPresenca || 0)}`}>
                          {vereador.estatisticas.legislaturaAtual?.percentualPresenca || 0}%
                        </div>
                        <div className="text-xs text-gray-500">Presença</div>
                      </div>
                    </div>
                  </div>

                  {/* Badge de Presença */}
                  <div className="flex justify-center">
                    <Badge className={getPresencaBadge(vereador.estatisticas.legislaturaAtual?.percentualPresenca || 0)}>
                      {vereador.estatisticas.legislaturaAtual?.percentualPresenca || 0}% de Presença
                    </Badge>
                  </div>

                  {/* Legislatura */}
                  {vereador.legislatura && (
                    <div className="border-t pt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-4 w-4" />
                        <span className="font-medium text-sm">Legislatura:</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {vereador.legislatura}
                        {vereador.ativo && <span className="text-green-600 ml-1">• Ativo</span>}
                      </div>
                    </div>
                  )}

                  {/* Botões de Ação */}
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => window.open(`/parlamentares/${vereador.apelido.toLowerCase().replace(/\s+/g, '-')}`, '_blank')}
                    >
                      <User className="h-4 w-4 mr-1" />
                      Perfil
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => window.open(`/parlamentares/${vereador.apelido.toLowerCase().replace(/\s+/g, '-')}/perfil-completo`, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Completo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mensagem quando não há resultados */}
        {vereadoresFiltrados.length === 0 && (
          <Card className="camara-card">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum vereador encontrado</h3>
              <p className="text-gray-600">
                {searchTerm || legislaturaFiltro !== 'todos' || statusFiltro !== 'ativo' || partidoFiltro !== 'todos' 
                  ? 'Tente ajustar os filtros de busca.' 
                  : 'Não há vereadores cadastrados.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
