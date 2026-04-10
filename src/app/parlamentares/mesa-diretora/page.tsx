'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Crown, Shield, Award, User, Mail, Phone, Calendar, Filter, BarChart3, Eye } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useParlamentares } from '@/lib/hooks/use-parlamentares';
import { useLegislaturas } from '@/lib/hooks/use-legislaturas';
import { slugify } from '@/lib/utils';
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional';

export default function MesaDiretoraPage() {
  const { configuracao } = useConfiguracaoInstitucional();
  const [legislaturaFiltro, setLegislaturaFiltro] = useState<string>('');

  // Dados usando hooks
  const { parlamentares, loading: loadingParlamentares } = useParlamentares({ ativo: true });
  const { legislaturas, loading: loadingLegislaturas } = useLegislaturas();
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

  // Mesa Diretora - priorizar dados da tabela MesaDiretora, fallback para Parlamentar.cargo
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

  // Dados enriquecidos com estatísticas (ordenados por hierarquia)
  const mesaEnriquecida = useMemo(() => {
    const ordemCargos = ['PRESIDENTE', 'VICE_PRESIDENTE', '1º_VICE-PRESIDENTE', '1_VICE_PRESIDENTE', 'PRIMEIRO_SECRETARIO', '1º_SECRETARIO', '1_SECRETARIO', 'SEGUNDO_SECRETARIO', '2º_SECRETARIO', '2_SECRETARIO', '2º_VICE-PRESIDENTE', '2_VICE_PRESIDENTE']
    const ordenada = [...mesaDiretora].sort((a, b) => {
      const ia = ordemCargos.indexOf(a.cargo || '')
      const ib = ordemCargos.indexOf(b.cargo || '')
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
    })
    return ordenada.map(membro => {
      // TODO: Calcular estatísticas quando API estiver disponível
      const estatisticas = {
        legislaturaAtual: { sessoes: 0, materias: 0, percentualPresenca: 0 }
      };

      // Buscar legislatura ativa
      const legislaturaAtiva = legislaturas.find(l => l.ativa);

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

  // Funções de cargo movidas para getCargoLabel acima

  const getCargoLabel = (cargo: string) => {
    const labels: Record<string, string> = {
      'PRESIDENTE': 'Presidente',
      'VICE_PRESIDENTE': 'Vice-Presidente',
      '1º_VICE-PRESIDENTE': 'Vice-Presidente',
      '1_VICE_PRESIDENTE': 'Vice-Presidente',
      '2º_VICE-PRESIDENTE': '2º Vice-Presidente',
      '2_VICE_PRESIDENTE': '2º Vice-Presidente',
      'PRIMEIRO_SECRETARIO': '1º Secretário',
      '1º_SECRETARIO': '1º Secretário',
      '1_SECRETARIO': '1º Secretário',
      'SEGUNDO_SECRETARIO': '2º Secretário',
      '2º_SECRETARIO': '2º Secretário',
      '2_SECRETARIO': '2º Secretário',
    }
    return labels[cargo] || cargo.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  const getCargoIcon = (cargo: string) => {
    if (cargo.includes('PRESIDENTE') && !cargo.includes('VICE')) return Crown
    if (cargo.includes('VICE')) return Shield
    if (cargo.includes('SECRETARIO') || cargo.includes('SECRETÁRIO')) return Award
    return User
  }

  const getCargoColor = (cargo: string) => {
    if (cargo === 'PRESIDENTE') return 'bg-amber-100 text-amber-800 border-amber-300'
    if (cargo.includes('VICE')) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (cargo.includes('1') && (cargo.includes('SECRETARIO') || cargo.includes('SECRETÁRIO'))) return 'bg-green-100 text-green-800 border-green-200'
    if (cargo.includes('2') && (cargo.includes('SECRETARIO') || cargo.includes('SECRETÁRIO'))) return 'bg-purple-100 text-purple-800 border-purple-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getBorderColor = (cargo: string) => {
    if (cargo === 'PRESIDENTE') return 'border-amber-400 ring-amber-200'
    if (cargo.includes('VICE')) return 'border-blue-400 ring-blue-200'
    if (cargo.includes('1') && (cargo.includes('SECRETARIO') || cargo.includes('SECRETÁRIO'))) return 'border-green-400 ring-green-200'
    if (cargo.includes('2') && (cargo.includes('SECRETARIO') || cargo.includes('SECRETÁRIO'))) return 'border-purple-400 ring-purple-200'
    return 'border-gray-300'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Users className="h-16 w-16 text-camara-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Mesa Diretora
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            Conheça os membros da Mesa Diretora da {configuracao?.nomeCasa || 'Câmara Municipal'},
            eleitos para a legislatura 2025/2028.
          </p>
        </div>

        {/* Filtros */}
        <Card className="mb-8">
          <CardHeader className="bg-gray-100 border-b">
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
          <Card className="camara-card">
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

          <Card className="camara-card">
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

          <Card className="camara-card">
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

          <Card className="camara-card">
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
          <Card className="camara-card bg-gradient-to-r from-camara-primary to-camara-secondary text-white">
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

              {/* Presidente em destaque */}
              {(() => {
                const presidente = mesaEnriquecida.find(m => m.cargo === 'PRESIDENTE' || (m.cargo && !m.cargo.includes('VICE') && m.cargo.includes('PRESIDENTE')))
                const demais = mesaEnriquecida.filter(m => m !== presidente)

                return (
                  <>
                    {presidente && (
                      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-lg mb-8">
                        <CardContent className="p-6 sm:p-8">
                          <div className="flex flex-col sm:flex-row items-center gap-6">
                            <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-amber-400 ring-4 ring-amber-100 flex-shrink-0`}>
                              {presidente.foto ? (
                                <Image src={presidente.foto} alt={presidente.apelido || presidente.nome} className="w-full h-full object-cover" width={112} height={112} unoptimized />
                              ) : (
                                <div className="w-full h-full bg-amber-100 flex items-center justify-center text-amber-600 text-3xl font-bold">
                                  {presidente.nome.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="text-center sm:text-left flex-1">
                              <Badge className="bg-amber-100 text-amber-800 border-amber-300 mb-2">
                                <Crown className="h-3.5 w-3.5 mr-1.5" />
                                Presidente
                              </Badge>
                              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                                {presidente.apelido || presidente.nome}
                              </h3>
                              {presidente.apelido && presidente.nome !== presidente.apelido && (
                                <p className="text-sm text-gray-500 mt-0.5">{presidente.nome}</p>
                              )}
                              <p className="text-camara-primary font-semibold mt-1">{presidente.partido || 'N/A'}</p>
                              <div className="mt-3">
                                <Button asChild variant="outline" size="sm">
                                  <Link href={`/parlamentares/${presidente.apelido ? slugify(presidente.apelido) : presidente.id}`}>
                                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                                    Ver Perfil Completo
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Demais membros */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {demais.map((membro) => {
                        const Icon = getCargoIcon(membro.cargo || '')
                        return (
                          <Card key={membro.id} className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-5 text-center">
                              <div className={`w-18 h-18 sm:w-20 sm:h-20 mx-auto mb-3 rounded-full overflow-hidden border-3 ${getBorderColor(membro.cargo || '')} ring-2`}>
                                {membro.foto ? (
                                  <Image src={membro.foto} alt={membro.apelido || membro.nome} className="w-full h-full object-cover" width={80} height={80} unoptimized />
                                ) : (
                                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-500 text-xl font-bold">
                                    {membro.nome.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <Badge className={`${getCargoColor(membro.cargo || '')} mb-2`}>
                                <Icon className="h-3 w-3 mr-1" />
                                {getCargoLabel(membro.cargo || '')}
                              </Badge>
                              <h3 className="font-semibold text-gray-900 text-sm">
                                {membro.apelido || membro.nome}
                              </h3>
                              {membro.apelido && membro.nome !== membro.apelido && (
                                <p className="text-xs text-gray-400 mt-0.5">{membro.nome}</p>
                              )}
                              <p className="text-xs text-camara-primary font-medium mt-1">{membro.partido || 'N/A'}</p>
                              <div className="mt-3">
                                <Button asChild variant="outline" size="sm" className="w-full text-xs">
                                  <Link href={`/parlamentares/${membro.apelido ? slugify(membro.apelido) : membro.id}`}>
                                    <Eye className="h-3 w-3 mr-1" />
                                    Ver Perfil
                                  </Link>
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </>
                )
              })()}
            </>
          ) : (
            <Card className="camara-card">
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
                <Card key={vereador.id} className="camara-card hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center">
                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full overflow-hidden border-4 border-camara-primary">
                      {vereador.foto ? (
                        <Image src={vereador.foto} alt={vereador.apelido || vereador.nome} className="w-full h-full object-cover" width={64} height={64} unoptimized />
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
                      <Button asChild variant="outline" size="sm" className="w-full text-xs">
                        <Link href={`/parlamentares/${vereador.apelido ? slugify(vereador.apelido) : vereador.id}`}>
                          <Eye className="h-3 w-3 mr-1" />
                          Ver Perfil
                        </Link>
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
          <Card>
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
  )
}
