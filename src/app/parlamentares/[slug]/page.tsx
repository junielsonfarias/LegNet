'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Crown, Mail, Phone, MapPin, Calendar, FileText, Users, 
  TrendingUp, Award, Download, Eye, ArrowLeft, Facebook, 
  Instagram, Twitter, Linkedin, Clock, CheckCircle, AlertCircle
} from 'lucide-react'
import { useParlamentares } from '@/lib/hooks/use-parlamentares'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'

export default function ParlamentarPerfilPage() {
  const params = useParams()
  const slug = params.slug as string
  const [activeTab, setActiveTab] = useState('producao')

  // Buscar parlamentar usando hook
  const { parlamentares, loading } = useParlamentares()
  
  const vereadorFinal = useMemo(() => {
    if (!slug) return null
    // Buscar por slug (apelido convertido para slug)
    return parlamentares.find(p => {
      const apelidoSlug = p.apelido?.toLowerCase().replace(/\s+/g, '-') || ''
      return apelidoSlug === slug || p.id === slug
    }) as any
  }, [parlamentares, slug])

  // Dados mock antigos (remover após integração completa)
  const parlamentaresDataOld = {
    'pantoja-do-cartorio': {
      id: 1,
      name: 'Francisco Pereira Pantoja',
      apelido: 'Pantoja do Cartório',
      cargo: 'PRESIDENTE',
      partido: 'MDB',
      email: 'cartoriopantoja@gmail.com',
      phone: '(98) 8038-898',
      gabinete: 'Sala 101 - 1º Andar',
      telefoneGabinete: '(93) 3333-1001',
      legislatura: '2025/2028',
      biografia: 'Francisco Pereira Pantoja, popularmente conhecido como "Pantoja do Cartório", nascido em 19 de novembro de 1945, filho de Nery da Costa Pantoja e Tertuliana Dias Pereira; casado, pai e avô; residente no município de Mojuí dos Campos há 48 anos. Tem como formação acadêmica o Bacharelado em Administração de Empresas e Bacharelado em Direito, pela FIT (Faculdades Integradas do Tapajós), hoje UNAMA (Universidade da Amazônia). É oficial Titular do Cartório de Registro Civil das Pessoas Naturais e Notas, de Mojuí dos Campos; e Vereador (2021 -2024). Seu entusiasmo pela carreira política começou quando, o mesmo, fez parte da comissão de Emancipação de Mojuí dos Campos, como Vice-presidente, onde logrou êxito. Disputou, como candidato a vereadorFinal, as eleições de 2021 e conseguiu eleger-se com mais de 452 votos; hoje eleito, vem potencializando os trabalhos voltados ao bem-estar da população, além de compartilhar com todos o conhecimento que conquistou ao longo de toda vida trabalhando na área jurídica.',
      redesSociais: {
        facebook: 'https://facebook.com/pantoja',
        instagram: 'https://instagram.com/pantoja',
        twitter: 'https://twitter.com/pantoja'
      },
      estatisticas: {
        legislaturaAtual: {
          materias: 14,
          percentualMaterias: 4.23,
          sessoes: 24,
          percentualPresenca: 88.89,
          dataAtualizacao: '10/09/2025'
        },
        exercicioAtual: {
          materias: 14,
          percentualMaterias: 4.23,
          sessoes: 24,
          percentualPresenca: 88.89
        }
      },
      ultimasMaterias: [
        {
          id: 1,
          numero: '200/2025',
          tipo: 'REQUERIMENTO - PARA O EXECUTIVO',
          titulo: 'SOLICITA A CONSTRUÇÃO DE UMA ESCOLA DE ENSINO FUNDAMENTAL NA COMUNIDADE BICA 1, HAJA VISTA QUE AS CRIANÇAS DAQUELA COMUNIDADE E ADJACENTES SE RESSENTEM DA FALTA DE UMA ESCOLA QUE AS ABRIGUEM',
          data: '11/06/2025',
          status: 'Cadastrado',
          autor: 'VEREADOR FRANCISCO PEREIRA PANTOJA'
        },
        {
          id: 2,
          numero: '199/2025',
          tipo: 'REQUERIMENTO - PARA O EXECUTIVO',
          titulo: 'SOLICITA RECUPERAÇÃO DA ESTRADA QUE LIGA A COMUNIDADE PRAIA GRANDE À BELA VISTA DO RIO MOJU, POR ENCONTRA-SE EM CONDIÇÕES PRECÁRIAS DE TRAFEGABILIDADE TANTO PARA PEDESTRE, COMO PARA VEÍCULOS',
          data: '11/06/2025',
          status: 'Cadastrado',
          autor: 'VEREADOR FRANCISCO PEREIRA PANTOJA'
        },
        {
          id: 3,
          numero: '6/2025',
          tipo: 'MOÇÃO DE APLAUSOS',
          titulo: 'VOTOS DE APLAUSOS A SRA. ADRIANA ALMEIDA PELA REALIZAÇÃO DA CARRETA FORÇA DO BEM NO MUNICÍPIO DE MOJUÍ DOS CAMPOS, NOS DIAS 05 E 06 DE ABRIL DE 2025',
          data: '14/05/2025',
          status: 'Cadastrado',
          autor: 'VEREADORES FRANCISO PEREIRA PANTOJA, DIEGO OLIVEIRA DA SILVA, WALLACE PESSOA OLIVEIRA, REGINALDO EMANUEL RABELO DA SILVA, FRANKLIN BENJAMIN PORTELA MACHADO, JOSÉ JOSICLEI DA SILVA OLIVEIRA, JOILSON NOGUEIRA XAVIER'
        }
      ],
      comissoes: [
        {
          id: 1,
          nome: 'COMISSÃO DE CONSTITUIÇÃO, JUSTIÇA E REDAÇÃO FINAL',
          cargo: 'RELATOR',
          dataInicio: '08/02/2023',
          dataFim: '31/12/2024'
        },
        {
          id: 2,
          nome: 'COMISSÃO DE EDUCAÇÃO, SAÚDE, ASSISTÊNCIA, ESPORTE E CULTURA',
          cargo: 'MEMBRO',
          dataInicio: '08/02/2023',
          dataFim: '31/12/2024'
        }
      ],
      mandatos: [
        {
          cargo: 'PRESIDENTE',
          vinculo: 'MESA DIRETORA',
          legislatura: '4ª (Quarta) Legislatura (2025 - 2028)',
          periodo: '01/01/2025'
        },
        {
          cargo: 'VEREADOR(A)',
          vinculo: 'VEREADOR EM EXERCÍCIO',
          legislatura: '3ª (TERCEIRA) LEGISLATURA (2021 - 2024)',
          periodo: '01/01/2021 à 31/12/2024'
        }
      ],
      filiacaoPartidaria: [
        {
          periodo: '26/11/2006',
          sigla: 'MDB',
          partido: 'MOVIMENTO DEMOCRÁTICO BRASILEIRO'
        }
      ],
      ultimasAgendas: [
        {
          id: 1,
          titulo: 'VISITA EM ESCOLA',
          data: '14/03/2025',
          horario: '09:00',
          local: 'ESCOLA FRANCISCO CHAGAS, DA CIDADE ALTA II DE MOJUÍ DOS CAMPOS',
          tipo: 'REUNIÃO'
        },
        {
          id: 2,
          titulo: 'VISITA À COMUNIDADE',
          data: '13/03/2025',
          horario: '11:00',
          local: 'COMUNIDADE CANAÃ',
          tipo: 'REUNIÃO'
        }
      ],
      estatisticasMaterias: {
        total: 132,
        distribuicao: [
          { tipo: 'Indicação', quantidade: 30, percentual: 22.7 },
          { tipo: 'Requerimento - Para O Executivo', quantidade: 81, percentual: 61.4 },
          { tipo: 'Projeto de Decreto Legislativo', quantidade: 8, percentual: 6.1 },
          { tipo: 'Requerimento Legislativo', quantidade: 8, percentual: 6.1 },
          { tipo: 'Moção de Aplausos', quantidade: 3, percentual: 2.3 },
          { tipo: 'Projeto de Lei - Legislativo', quantidade: 1, percentual: 0.8 },
          { tipo: 'Requerimento - Para O Governador', quantidade: 1, percentual: 0.8 }
        ]
      }
    },
    'diego-do-ze-neto': {
      id: 2,
      name: 'Diego Oliveira da Silva',
      apelido: 'Diego do Zé Neto',
      cargo: 'VICE_PRESIDENTE',
      partido: 'Partido B',
      email: 'diego@camaramojui.com',
      phone: '(93) 99999-0002',
      gabinete: 'Sala 102 - 1º Andar',
      telefoneGabinete: '(93) 3333-1002',
      legislatura: '2025/2028',
      biografia: 'Vice-presidente da Câmara Municipal, dedicado ao trabalho legislativo e à representação popular. Com vasta experiência na área pública, tem como prioridade a transparência e o desenvolvimento do município.',
      redesSociais: {
        facebook: 'https://facebook.com/diego',
        instagram: 'https://instagram.com/diego'
      },
      estatisticas: {
        legislaturaAtual: {
          materias: 35,
          percentualMaterias: 6.8,
          sessoes: 27,
          percentualPresenca: 92.0,
          dataAtualizacao: '10/09/2025'
        },
        exercicioAtual: {
          materias: 35,
          percentualMaterias: 6.8,
          sessoes: 27,
          percentualPresenca: 92.0
        }
      },
      ultimasMaterias: [
        {
          id: 1,
          numero: '198/2025',
          tipo: 'REQUERIMENTO - PARA O EXECUTIVO',
          titulo: 'SOLICITA MELHORIAS NA INFRAESTRUTURA DA COMUNIDADE RURAL',
          data: '10/06/2025',
          status: 'Cadastrado',
          autor: 'VEREADOR DIEGO OLIVEIRA DA SILVA'
        },
        {
          id: 2,
          numero: '197/2025',
          tipo: 'INDICAÇÃO',
          titulo: 'INDICA A CONSTRUÇÃO DE POSTO DE SAÚDE NA COMUNIDADE CENTRO',
          data: '08/06/2025',
          status: 'Tramitando',
          autor: 'VEREADOR DIEGO OLIVEIRA DA SILVA'
        }
      ],
      comissoes: [
        {
          id: 1,
          nome: 'COMISSÃO DE SAÚDE',
          cargo: 'PRESIDENTE',
          dataInicio: '01/01/2025',
          dataFim: '31/12/2028'
        },
        {
          id: 2,
          nome: 'COMISSÃO DE EDUCAÇÃO',
          cargo: 'MEMBRO',
          dataInicio: '01/01/2025',
          dataFim: '31/12/2028'
        }
      ],
      mandatos: [
        {
          cargo: 'VICE-PRESIDENTE',
          vinculo: 'MESA DIRETORA',
          legislatura: '4ª (Quarta) Legislatura (2025 - 2028)',
          periodo: '01/01/2025'
        },
        {
          cargo: 'VEREADOR(A)',
          vinculo: 'VEREADOR EM EXERCÍCIO',
          legislatura: '3ª (TERCEIRA) LEGISLATURA (2021 - 2024)',
          periodo: '01/01/2021 à 31/12/2024'
        }
      ],
      filiacaoPartidaria: [
        {
          periodo: '01/01/2021',
          sigla: 'Partido B',
          partido: 'Partido B'
        }
      ],
      ultimasAgendas: [],
      estatisticasMaterias: {
        total: 35,
        distribuicao: [
          { tipo: 'Requerimento - Para O Executivo', quantidade: 20, percentual: 57.1 },
          { tipo: 'Indicação', quantidade: 10, percentual: 28.6 },
          { tipo: 'Moção de Aplausos', quantidade: 3, percentual: 8.6 },
          { tipo: 'Projeto de Lei', quantidade: 2, percentual: 5.7 }
        ]
      }
    }
  }

  // Buscar dados do parlamentar
  // Se não encontrou, usar dados mock como fallback temporário
  const vereadorFinalFallback = parlamentaresDataOld[slug as keyof typeof parlamentaresDataOld]
  const vereadorFinalFinal = vereadorFinal || vereadorFinalFallback

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-camara-primary"></div>
      </div>
    )
  }

  // Se não encontrar o parlamentar, mostrar erro
  if (!vereadorFinalFinal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Parlamentar não encontrado
            </h1>
            <p className="text-gray-600 mb-6">
              O parlamentar solicitado não foi encontrado.
            </p>
            <Button asChild>
              <Link href="/parlamentares">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Parlamentares
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Cadastrado':
        return 'bg-blue-100 text-blue-800'
      case 'Tramitando':
        return 'bg-yellow-100 text-yellow-800'
      case 'Aprovada':
        return 'bg-green-100 text-green-800'
      case 'Rejeitada':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTipoColor = (tipo: string) => {
    if (tipo.includes('REQUERIMENTO')) return 'bg-purple-100 text-purple-800'
    if (tipo.includes('MOÇÃO')) return 'bg-green-100 text-green-800'
    if (tipo.includes('INDICAÇÃO')) return 'bg-blue-100 text-blue-800'
    if (tipo.includes('PROJETO')) return 'bg-orange-100 text-orange-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getCargoColor = (cargo: string) => {
    switch (cargo) {
      case 'PRESIDENTE':
        return 'bg-red-100 text-red-800'
      case 'VICE_PRESIDENTE':
        return 'bg-orange-100 text-orange-800'
      case 'PRIMEIRO_SECRETARIO':
      case 'SEGUNDO_SECRETARIO':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
        return 'Vereador'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link href="/parlamentares" className="hover:text-camara-primary">
            Parlamentares
          </Link>
          <span>/</span>
          <span className="text-gray-900">Detalhe</span>
        </div>

        {/* Botão Voltar */}
        <div className="mb-6">
          <Button asChild variant="outline" size="sm">
            <Link href="/parlamentares">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Parlamentares
            </Link>
          </Button>
        </div>

        {/* Header do Vereador */}
        <Card className="mb-8 shadow-lg">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
              {/* Foto */}
              <div className="relative">
                <div className={`w-32 h-32 ${vereadorFinal?.cargo === 'PRESIDENTE' ? 'bg-camara-gold' : 'bg-camara-primary'} rounded-full flex items-center justify-center text-white`}>
                  {vereadorFinal?.cargo === 'PRESIDENTE' ? (
                    <Crown className="h-16 w-16" />
                  ) : (
                    <Users className="h-16 w-16" />
                  )}
                </div>
                <Badge className={`absolute -top-2 -right-2 ${getCargoColor(vereadorFinal?.cargo || 'VEREADOR')} border`}>
                  {getCargoLabel(vereadorFinal?.cargo || 'VEREADOR')}
                </Badge>
              </div>

              {/* Informações Principais */}
              <div className="flex-1">
                 <h1 className="text-3xl font-bold text-gray-900 mb-2">
                   {vereadorFinal?.nome || 'Nome não disponível'}
                 </h1>
                 <h2 className="text-xl text-camara-primary font-semibold mb-4">
                   {vereadorFinal?.apelido || 'Apelido não disponível'}
                </h2>
                <div className="flex items-center space-x-4 mb-4">
                  {vereadorFinal?.cargo !== 'VEREADOR' && (
                    <Badge className={`${getCargoColor(vereadorFinal?.cargo || 'VEREADOR')} border`}>
                      {getCargoLabel(vereadorFinal?.cargo || 'VEREADOR')} - Mesa Diretora
                    </Badge>
                  )}
                  <Badge variant="outline">
                    Partido: {vereadorFinal?.partido || 'N/A'}
                  </Badge>
                </div>

                {/* Contato */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                     <span>{vereadorFinal?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{vereadorFinal?.telefone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{vereadorFinal?.gabinete || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{vereadorFinal?.telefoneGabinete || 'N/A'}</span>
                  </div>
                </div>

                {/* Redes Sociais */}
                {vereadorFinal?.redesSociais && (
                  <div className="flex space-x-2 mt-4">
                    {vereadorFinal?.redesSociais.facebook && (
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                        <Facebook className="h-4 w-4" />
                      </Button>
                    )}
                    {vereadorFinal?.redesSociais.instagram && (
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                        <Instagram className="h-4 w-4" />
                      </Button>
                    )}
                    {vereadorFinal?.redesSociais.twitter && (
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                        <Twitter className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas da Legislatura */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg text-camara-primary">
                LEGISLATURA ATUAL - 2025/2028
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">
                     Quantidade de {vereadorFinal?.estatisticas?.legislaturaAtual?.materias || 0} matérias, representando {vereadorFinal?.estatisticas?.legislaturaAtual?.percentualMaterias || 0}% do total das matérias
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    Presente em {vereadorFinal?.estatisticas?.legislaturaAtual?.sessoes || 0} sessões, representando {vereadorFinal?.estatisticas?.legislaturaAtual?.percentualPresenca || 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg text-camara-primary">
                EXERCÍCIO ATUAL - 2025
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">
                    Quantidade de {vereadorFinal?.estatisticas?.exercicioAtual?.materias || 0} matérias, representando {vereadorFinal?.estatisticas?.exercicioAtual?.percentualMaterias || 0}% do total das matérias
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    Presente em {vereadorFinal?.estatisticas?.exercicioAtual?.sessoes || 0} sessões, representando {vereadorFinal?.estatisticas?.exercicioAtual?.percentualPresenca || 0}%
                  </p>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500">
                    Dados atualizados em: {vereadorFinal?.estatisticas?.legislaturaAtual?.dataAtualizacao || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Informações */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="producao">Produção Legislativa</TabsTrigger>
            <TabsTrigger value="sessoes">Sessões</TabsTrigger>
            <TabsTrigger value="comissoes">Comissões</TabsTrigger>
            <TabsTrigger value="mandatos">Mandatos</TabsTrigger>
            <TabsTrigger value="filiacao">Filiação Partidária</TabsTrigger>
            <TabsTrigger value="biografia">Biografia</TabsTrigger>
          </TabsList>

          {/* Produção Legislativa */}
          <TabsContent value="producao" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-camara-primary">
                  <FileText className="mr-2 h-6 w-6" />
                  Últimas matérias vinculadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vereadorFinal?.ultimasMaterias?.map((materia) => (
                    <div key={materia.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={getTipoColor(materia.tipo)}>
                              {materia.tipo}
                            </Badge>
                            <span className="text-sm font-medium text-gray-900">
                              {materia.numero}
                            </span>
                            <span className="text-sm text-gray-500">
                              {materia.data}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {materia.titulo}
                          </h3>
                          <p className="text-sm text-gray-600">
                            De iniciativa do {materia.autor}
                          </p>
                        </div>
                        <div className="ml-4">
                          <Badge className={getStatusColor(materia.status)}>
                            {materia.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Acessar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas de Matérias */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-camara-primary">
                  Matérias (Quantidade)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Produzimos no total de {vereadorFinal?.estatisticasMaterias?.total || 0} proposições e matérias, sendo:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Projetos de Lei</span>
                    <div className="text-right">
                      <span className="font-bold text-camara-primary">{vereadorFinal?.estatisticasMaterias?.aprovadas || 0}</span>
                      <span className="text-xs text-gray-500 ml-2">Aprovadas</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Em Tramitação</span>
                    <div className="text-right">
                      <span className="font-bold text-camara-primary">{vereadorFinal?.estatisticasMaterias?.emTramitacao || 0}</span>
                      <span className="text-xs text-gray-500 ml-2">Em análise</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comissões */}
          <TabsContent value="comissoes" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-camara-primary">
                  <Users className="mr-2 h-6 w-6" />
                  Últimas comissões vinculadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vereadorFinal?.comissoes?.map((comissao) => (
                    <div key={comissao.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className="bg-green-100 text-green-800">
                              {comissao.cargo}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {comissao.nome}
                          </h3>
                          <div className="text-sm text-gray-600">
                            <p><strong>Data início:</strong> {comissao.dataInicio}</p>
                            <p><strong>Data fim:</strong> {comissao.dataFim}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Acessar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mandatos */}
          <TabsContent value="mandatos" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-camara-primary">
                  Informações dos mandatos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Cargo</th>
                        <th className="text-left p-3 font-semibold">Vínculo</th>
                        <th className="text-left p-3 font-semibold">Legislatura</th>
                        <th className="text-left p-3 font-semibold">Período</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vereadorFinal && (
                        <tr className="border-b">
                          <td className="p-3">{getCargoLabel(vereadorFinal.cargo)}</td>
                          <td className="p-3">{vereadorFinal.partido || 'N/A'}</td>
                          <td className="p-3">{vereadorFinal.legislatura}</td>
                          <td className="p-3">Atual</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Filiação Partidária */}
          <TabsContent value="filiacao" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-camara-primary">
                  Filiação partidária
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Período</th>
                        <th className="text-left p-3 font-semibold">Sigla</th>
                        <th className="text-left p-3 font-semibold">Partido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vereadorFinal?.filiacaoPartidaria?.map((filiacao, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-3">{filiacao.dataInicio} - {filiacao.dataFim || 'Atual'}</td>
                          <td className="p-3">
                            <Badge variant="outline">{filiacao.partido}</Badge>
                          </td>
                          <td className="p-3">{filiacao.partido}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Biografia */}
          <TabsContent value="biografia" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-camara-primary">
                  Biografia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {vereadorFinal?.biografia}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Últimas Agendas */}
            {vereadorFinal?.ultimasAgendas && vereadorFinal?.ultimasAgendas.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-camara-primary">
                    <Clock className="mr-2 h-6 w-6" />
                    Últimas agendas vinculadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                     {vereadorFinal?.ultimasAgendas?.map((agenda, index) => (
                       <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge className="bg-purple-100 text-purple-800">
                                Agenda
                              </Badge>
                              <span className="text-sm font-medium text-gray-900">
                                {agenda.atividade}
                              </span>
                              <span className="text-sm text-gray-500">
                                {agenda.data}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {agenda.atividade}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            Acessar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
