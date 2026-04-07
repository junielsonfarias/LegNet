'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Crown, Shield, Award, User, Mail, Phone, Calendar, Filter, BarChart3, Eye, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParlamentares } from '@/lib/hooks/use-parlamentares';
import { useLegislaturas } from '@/lib/hooks/use-legislaturas';
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional';

export default function MesaDiretoraTransparenciaPage() {
  const { configuracao } = useConfiguracaoInstitucional();
  const [legislaturaFiltro, setLegislaturaFiltro] = useState<string>('');

  // Dados usando hooks
  const { parlamentares } = useParlamentares({ ativo: true });
  const { legislaturas } = useLegislaturas();
  const [mesaInstitucional, setMesaInstitucional] = useState<any[]>([]);

  // Buscar mesa diretora da API institucional (fonte correta: tabela MesaDiretora)
  useEffect(() => {
    fetch('/api/institucional')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.dados?.mesaDiretora?.length > 0) {
          setMesaInstitucional(data.dados.mesaDiretora)
        }
      })
      .catch(() => {})
  }, [])

  // Mesa Diretora - priorizar tabela MesaDiretora, fallback para Parlamentar.cargo
  const mesaDiretora = mesaInstitucional.length > 0
    ? mesaInstitucional.map((m: any) => ({
        id: m.id, nome: m.nome, apelido: m.apelido,
        cargo: m.cargo, partido: m.partido, foto: m.foto,
        legislatura: null, email: null, telefone: null, gabinete: null
      }))
    : parlamentares.filter(p => p.cargo !== 'VEREADOR');

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
        return 'bg-camara-primary/10 text-camara-primary border-camara-primary/20'
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-camara-primary/5 to-gray-50">
      <div className="container mx-auto px-4 pt-6">
        <Link href="/transparencia" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar ao Portal da Transparência
        </Link>
      </div>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br gradient-municipal-hero text-white overflow-hidden">
        {/* Padrão de fundo decorativo */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        
        {/* Círculos decorativos */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-camara-primary/50/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-block p-3 bg-white/10 backdrop-blur-sm rounded-full mb-4 animate-bounce">
              <Users className="h-8 w-8 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
              Mesa Diretora
            </h1>
            <p className="text-xl md:text-2xl font-semibold mb-6 text-white/80 animate-fade-in">
              {configuracao?.nomeCasa || 'Câmara Municipal'}
            </p>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20 shadow-2xl animate-fade-in">
              <p className="text-base text-white/90">
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
          <CardHeader className="bg-gradient-to-r from-gray-100 to-camara-primary/5 border-b">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-camara-primary">
                    {mesaEnriquecida.length}
                  </div>
                  <p className="text-sm text-gray-600">Membros da Mesa</p>
                </div>
                <Calendar className="h-8 w-8 text-camara-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {mesaEnriquecida.length > 0 ? 'Atual' : '-'}
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
                    {legislaturas.find(l => l.ativa) ? `${legislaturas.find(l => l.ativa)?.anoInicio}/${legislaturas.find(l => l.ativa)?.anoFim}` : 'N/A'}
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

        {/* Mesa Diretora Atual */}
        <div className="space-y-8">
          {mesaEnriquecida.length > 0 ? (
            <>
              <div className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-camara-primary" />
                <h2 className="text-2xl font-bold text-gray-900">Mesa Diretora Atual</h2>
                <Badge className="ml-2">Ativa</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {mesaEnriquecida.map((membro) => {
                  const Icon = getCargoIcon(membro.cargo || '')
                  const borderColors: Record<string, string> = {
                    'PRESIDENTE': 'border-yellow-500',
                    'VICE_PRESIDENTE': 'border-blue-500',
                    'PRIMEIRO_SECRETARIO': 'border-green-500',
                    'SEGUNDO_SECRETARIO': 'border-purple-500',
                  }
                  return (
                    <Card key={membro.id} className="shadow-xl hover:shadow-2xl transition-all duration-300">
                      <CardHeader className="text-center">
                        <div className={`relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full overflow-hidden border-4 ${borderColors[membro.cargo || ''] || 'border-camara-primary'}`}>
                          {membro.foto ? (
                            <img src={membro.foto} alt={membro.apelido || membro.nome} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-bold">
                              {membro.nome.charAt(0)}
                            </div>
                          )}
                        </div>
                        <Badge className={getCargoColor(membro.cargo || '')}>
                          <Icon className="h-3 w-3 mr-1" />
                          {getCargoLabel(membro.cargo || '')}
                        </Badge>
                      </CardHeader>
                      <CardContent className="text-center space-y-2">
                        <h3 className="font-semibold text-gray-900">{membro.nome}</h3>
                        {membro.apelido && (
                          <p className="text-sm text-gray-600">({membro.apelido})</p>
                        )}
                        <p className="text-sm text-camara-primary font-medium">{membro.partido || 'N/A'}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </>
          ) : (
            <Card className="shadow-xl">
              <CardContent className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum membro da mesa encontrado
                </h3>
                <p className="text-gray-600">
                  Cadastre os cargos dos parlamentares no painel administrativo.
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
                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full overflow-hidden border-4 border-camara-primary">
                      {vereador.foto ? (
                        <img src={vereador.foto} alt={vereador.apelido || vereador.nome} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl font-bold">
                          {vereador.nome.charAt(0)}
                        </div>
                      )}
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
