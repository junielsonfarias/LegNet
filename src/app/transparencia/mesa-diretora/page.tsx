'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Crown, Shield, Award, User, Mail, Phone, Calendar, Filter, BarChart3, Eye } from 'lucide-react';
import { useParlamentares } from '@/lib/hooks/use-parlamentares';
import { useLegislaturas } from '@/lib/hooks/use-legislaturas';
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional';

export default function MesaDiretoraTransparenciaPage() {
  const { configuracao } = useConfiguracaoInstitucional();
  const [legislaturaFiltro, setLegislaturaFiltro] = useState<string>('');

  // Dados usando hooks
  const { parlamentares } = useParlamentares({ ativo: true });
  const { legislaturas } = useLegislaturas();

  // Mesa Diretora - filtrar parlamentares que não são vereadores
  const mesaDiretora = parlamentares.filter(p => p.cargo !== 'VEREADOR');

  // Obter composição das mesas por período (simplificado)
  const composicoesMesa = useMemo((): any[] => {
    // TODO: Implementar histórico de composições quando API estiver disponível
    return [];
  }, []);

  // Obter todos os vereadores
  const vereadoresLegislatura = useMemo(() => {
    return parlamentares.filter(p => p.cargo === 'VEREADOR');
  }, [parlamentares]);

  // Dados enriquecidos com estatísticas
  const mesaEnriquecida = useMemo(() => {
    const legislaturaAtiva = legislaturas.find(l => l.ativa);
    
    return mesaDiretora.map(membro => {
      // TODO: Calcular estatísticas quando API estiver disponível
      const estatisticas = {
        legislaturaAtual: { sessoes: 0, materias: 0, percentualPresenca: 0 }
      };

      // Definir cargo e responsabilidades baseado no cargo atual
      const cargo = membro.cargo;
      const responsabilidades = getResponsabilidades(cargo);

      return {
        ...membro,
        cargo,
        legislaturaAtiva: legislaturaAtiva ? `${legislaturaAtiva.anoInicio}/${legislaturaAtiva.anoFim}` : membro.legislatura,
        numeroVotos: 0, // TODO: Buscar quando API estiver disponível
        dataInicio: new Date('2025-01-01'),
        estatisticas,
        responsabilidades
      };
    });
  }, [mesaDiretora, legislaturas]);

  // Filtrar por legislatura
  const mesaFiltrada = useMemo(() => {
    if (legislaturaFiltro === 'todos') {
      return mesaEnriquecida;
    }
    return mesaEnriquecida.filter(membro => membro.legislaturaAtiva === legislaturaFiltro);
  }, [mesaEnriquecida, legislaturaFiltro]);

  // Função para obter responsabilidades baseadas no cargo
  function getResponsabilidades(cargo: string) {
    switch (cargo) {
      case 'PRESIDENTE':
        return [
          'Representar a Câmara Municipal',
          'Presidir as sessões legislativas',
          'Dirigir os trabalhos da Mesa Diretora',
          'Assinar documentos oficiais',
          'Convocar sessões extraordinárias'
        ];
      case 'VICE_PRESIDENTE':
        return [
          'Substituir o Presidente em suas ausências',
          'Auxiliar na condução dos trabalhos',
          'Participar das decisões da Mesa Diretora',
          'Representar a Câmara em eventos oficiais'
        ];
      case 'PRIMEIRO_SECRETARIO':
        return [
          'Secretariar as sessões legislativas',
          'Redigir atas e documentos oficiais',
          'Organizar a documentação da Câmara',
          'Auxiliar na comunicação oficial'
        ];
      case 'SEGUNDO_SECRETARIO':
        return [
          'Auxiliar o Primeiro Secretário',
          'Substituir em suas ausências',
          'Participar da organização documental',
          'Apoiar os trabalhos administrativos'
        ];
      default:
        return [];
    }
  }

  const getCargoIcon = (cargo: string) => {
    switch (cargo) {
      case 'PRESIDENTE':
        return Crown
      case 'VICE_PRESIDENTE':
        return Shield
      case 'PRIMEIRO_SECRETARIO':
        return Award
      case 'SEGUNDO_SECRETARIO':
        return Award
      default:
        return User
    }
  }

  const getCargoColor = (cargo: string) => {
    switch (cargo) {
      case 'PRESIDENTE':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'VICE_PRESIDENTE':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'PRIMEIRO_SECRETARIO':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'SEGUNDO_SECRETARIO':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCargoLabel = (cargo: string) => {
    switch (cargo) {
      case 'PRESIDENTE':
        return 'Presidente'
      case 'VICE_PRESIDENTE':
        return 'Vice-Presidente'
      case 'PRIMEIRO_SECRETARIO':
        return '1º Secretário'
      case 'SEGUNDO_SECRETARIO':
        return '2º Secretário'
      default:
        return cargo
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 text-white overflow-hidden">
        {/* Padrão de fundo decorativo */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-transparent" />
        
        {/* Círculos decorativos */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-700/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-block p-3 bg-white/10 backdrop-blur-sm rounded-full mb-4 animate-bounce">
              <Users className="h-8 w-8 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
              Mesa Diretora
            </h1>
            <p className="text-xl md:text-2xl font-semibold mb-6 text-blue-100 animate-fade-in">
              {configuracao?.nomeCasa || 'Câmara Municipal'}
            </p>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20 shadow-2xl animate-fade-in">
              <p className="text-base text-blue-50">
                Conheça os membros da Mesa Diretora da {configuracao?.nomeCasa || 'Câmara Municipal'}, 
                eleitos para dirigir os trabalhos legislativos e administrativos da Casa.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Filtros */}
        <Card className="mb-8 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-gray-100 to-blue-50 border-b">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Legislatura
                </label>
                <Select value={legislaturaFiltro} onValueChange={setLegislaturaFiltro}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma legislatura" />
                  </SelectTrigger>
                  <SelectContent>
                    {legislaturas.map(legislatura => (
                      <SelectItem key={legislatura.id} value={legislatura.id}>
                        {legislatura.numero} ({legislatura.anoInicio}/{legislatura.anoFim})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas da Mesa Diretora */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {composicoesMesa.length}
                  </div>
                  <p className="text-sm text-gray-600">Períodos de Mesa</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {composicoesMesa.find(c => c.ativa) ? 'Atual' : 'Histórica'}
                  </div>
                  <p className="text-sm text-gray-600">Mesa Atual</p>
                </div>
                <Crown className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {vereadoresLegislatura.length}
                  </div>
                  <p className="text-sm text-gray-600">Total de Vereadores</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {composicoesMesa.length > 0 ? `${composicoesMesa[0].dataInicio.split('-')[0]}-${composicoesMesa[0].dataFim?.split('-')[0] || 'Atual'}` : 'N/A'}
                  </div>
                  <p className="text-sm text-gray-600">Período Legislativo</p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informações da Legislatura */}
        <div className="mb-12">
          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-camara-primary to-camara-secondary text-white">
            <CardContent className="p-8">
              <div className="flex items-center space-x-4">
                <Calendar className="h-16 w-16 text-white" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    Legislatura {legislaturas.find(l => l.id === legislaturaFiltro)?.numero || 'N/A'}
                  </h2>
                  <p className="text-lg opacity-90">
                    A Mesa Diretora é eleita pelos vereadores para um mandato de dois anos, 
                    sendo responsável pela direção dos trabalhos legislativos e administrativos da Câmara.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Composições da Mesa Diretora por Período */}
        <div className="space-y-8">
          {composicoesMesa.length > 0 ? (
            composicoesMesa.map((composicao, index) => (
              <div key={composicao.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Crown className="h-6 w-6 text-camara-primary" />
                    {composicao.ativa ? 'Mesa Diretora Atual' : `Mesa Diretora - ${composicao.periodo}º Período`}
                  </h2>
                  <div className="flex items-center gap-4">
                    <Badge variant={composicao.ativa ? "default" : "secondary"} className="px-3 py-1">
                      {composicao.ativa ? 'Ativa' : 'Histórica'}
                    </Badge>
                    <div className="text-sm text-gray-600">
                      {new Date(composicao.dataInicio).toLocaleDateString('pt-BR')} - {composicao.dataFim ? new Date(composicao.dataFim).toLocaleDateString('pt-BR') : 'Atual'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Presidente */}
                  <Card className="shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="text-center">
                      <div className="relative w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-4 border-yellow-500">
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-bold">
                          {composicao.membrosCompletos.presidente?.nome.charAt(0) || 'P'}
                        </div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                        <Crown className="h-3 w-3 mr-1" />
                        Presidente
                      </Badge>
                    </CardHeader>
                    <CardContent className="text-center space-y-2">
                      <h3 className="font-semibold text-gray-900">
                        {composicao.membrosCompletos.presidente?.nome || 'N/A'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        ({composicao.membrosCompletos.presidente?.apelido || 'N/A'})
                      </p>
                      <p className="text-sm text-camara-primary font-medium">
                        {composicao.membrosCompletos.presidente?.partido || 'N/A'}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Vice-Presidente */}
                  <Card className="shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="text-center">
                      <div className="relative w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-4 border-blue-500">
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-bold">
                          {composicao.membrosCompletos.vicePresidente?.nome.charAt(0) || 'V'}
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                        <Shield className="h-3 w-3 mr-1" />
                        Vice-Presidente
                      </Badge>
                    </CardHeader>
                    <CardContent className="text-center space-y-2">
                      <h3 className="font-semibold text-gray-900">
                        {composicao.membrosCompletos.vicePresidente?.nome || 'N/A'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        ({composicao.membrosCompletos.vicePresidente?.apelido || 'N/A'})
                      </p>
                      <p className="text-sm text-camara-primary font-medium">
                        {composicao.membrosCompletos.vicePresidente?.partido || 'N/A'}
                      </p>
                    </CardContent>
                  </Card>

                  {/* 1º Secretário */}
                  <Card className="shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="text-center">
                      <div className="relative w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-4 border-green-500">
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-bold">
                          {composicao.membrosCompletos.primeiroSecretario?.nome.charAt(0) || '1'}
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        <Award className="h-3 w-3 mr-1" />
                        1º Secretário
                      </Badge>
                    </CardHeader>
                    <CardContent className="text-center space-y-2">
                      <h3 className="font-semibold text-gray-900">
                        {composicao.membrosCompletos.primeiroSecretario?.nome || 'N/A'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        ({composicao.membrosCompletos.primeiroSecretario?.apelido || 'N/A'})
                      </p>
                      <p className="text-sm text-camara-primary font-medium">
                        {composicao.membrosCompletos.primeiroSecretario?.partido || 'N/A'}
                      </p>
                    </CardContent>
                  </Card>

                  {/* 2º Secretário */}
                  <Card className="shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="text-center">
                      <div className="relative w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-4 border-purple-500">
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-bold">
                          {composicao.membrosCompletos.segundoSecretario?.nome.charAt(0) || '2'}
                        </div>
                      </div>
                      <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                        <User className="h-3 w-3 mr-1" />
                        2º Secretário
                      </Badge>
                    </CardHeader>
                    <CardContent className="text-center space-y-2">
                      <h3 className="font-semibold text-gray-900">
                        {composicao.membrosCompletos.segundoSecretario?.nome || 'N/A'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        ({composicao.membrosCompletos.segundoSecretario?.apelido || 'N/A'})
                      </p>
                      <p className="text-sm text-camara-primary font-medium">
                        {composicao.membrosCompletos.segundoSecretario?.partido || 'N/A'}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))
          ) : (
            <Card className="shadow-xl">
              <CardContent className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhuma composição encontrada
                </h3>
                <p className="text-gray-600">
                  Não foram encontradas composições da mesa diretora para a legislatura selecionada.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Todos os Vereadores da Legislatura */}
        {vereadoresLegislatura.length > 0 && (
          <div className="mt-12 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-6 w-6 text-camara-primary" />
                Todos os Vereadores da Legislatura
              </h2>
              <Badge variant="outline" className="px-3 py-1">
                {vereadoresLegislatura.length} vereadores
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {vereadoresLegislatura.map((vereador) => (
                <Card key={vereador.id} className="shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden border-4 border-camara-primary">
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl font-bold">
                        {vereador.nome.charAt(0)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="text-center space-y-2">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {vereador.nome}
                    </h3>
                    <p className="text-xs text-gray-600">
                      ({vereador.apelido})
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {vereador.partido}
                    </Badge>
                    <div className="pt-2">
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        Ver Perfil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Informações sobre a Mesa Diretora */}
        <div className="mt-12">
          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Sobre a Mesa Diretora
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                A Mesa Diretora é o órgão dirigente da Câmara Municipal, composto pelo Presidente, 
                Vice-Presidente e dois Secretários. É responsável pela direção dos trabalhos legislativos 
                e pela administração da Casa.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Competências do Presidente</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• Representar a Câmara Municipal</li>
                    <li>• Presidir as sessões legislativas</li>
                    <li>• Dirigir os trabalhos da Mesa Diretora</li>
                    <li>• Assinar documentos oficiais</li>
                    <li>• Convocar sessões extraordinárias</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Competências dos Secretários</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• Secretariar as sessões legislativas</li>
                    <li>• Redigir atas e documentos oficiais</li>
                    <li>• Organizar a documentação da Câmara</li>
                    <li>• Auxiliar na comunicação oficial</li>
                    <li>• Manter o arquivo da Casa</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
