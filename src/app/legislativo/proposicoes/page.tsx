import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FileText, Search, Calendar, User, Eye, Download, Filter } from 'lucide-react'
import Link from 'next/link'

export default function ProposicoesPage() {
  const proposicoes = [
    {
      id: 1,
      numero: '001',
      ano: 2025,
      tipo: 'PROJETO_LEI',
      titulo: 'Dispõe sobre o Plano Diretor Municipal de Mojuí dos Campos',
      ementa: 'Institui o Plano Diretor Municipal, estabelecendo diretrizes para o desenvolvimento urbano e territorial do município.',
      status: 'APROVADA',
      dataApresentacao: '2025-01-15',
      dataVotacao: '2025-03-20',
      autor: 'Pantoja do Cartório',
      sessao: '15ª Sessão Ordinária',
      resultado: 'APROVADA',
      votosSim: 9,
      votosNao: 2,
      abstencao: 0
    },
    {
      id: 2,
      numero: '002',
      ano: 2025,
      tipo: 'PROJETO_LEI',
      titulo: 'Institui o Programa de Apoio à Agricultura Familiar',
      ementa: 'Cria programa municipal de apoio técnico e financeiro aos agricultores familiares do município.',
      status: 'EM_TRAMITACAO',
      dataApresentacao: '2025-02-10',
      dataVotacao: null,
      autor: 'Joilson da Santa Júlia',
      sessao: null,
      resultado: null,
      votosSim: 0,
      votosNao: 0,
      abstencao: 0
    },
    {
      id: 3,
      numero: '003',
      ano: 2025,
      tipo: 'PROJETO_DECRETO',
      titulo: 'Regulamenta a Lei de Zoneamento Urbano',
      ementa: 'Estabelece normas e critérios para o zoneamento urbano do município.',
      status: 'APROVADA',
      dataApresentacao: '2025-01-20',
      dataVotacao: '2025-04-15',
      autor: 'Diego do Zé Neto',
      sessao: '18ª Sessão Ordinária',
      resultado: 'APROVADA',
      votosSim: 10,
      votosNao: 1,
      abstencao: 0
    },
    {
      id: 4,
      numero: '004',
      ano: 2025,
      tipo: 'INDICACAO',
      titulo: 'Indica ao Prefeito a construção de uma creche no bairro Centro',
      ementa: 'Solicita a construção de uma unidade de educação infantil no bairro Centro.',
      status: 'APRESENTADA',
      dataApresentacao: '2025-03-05',
      dataVotacao: null,
      autor: 'Jesa do Palhalzinho',
      sessao: null,
      resultado: null,
      votosSim: 0,
      votosNao: 0,
      abstencao: 0
    },
    {
      id: 5,
      numero: '005',
      ano: 2025,
      tipo: 'REQUERIMENTO',
      titulo: 'Requer informações sobre obras de pavimentação',
      ementa: 'Solicita informações sobre o cronograma de pavimentação das vias municipais.',
      status: 'APROVADA',
      dataApresentacao: '2025-02-28',
      dataVotacao: '2025-03-10',
      autor: 'Arnaldo Galvão',
      sessao: '12ª Sessão Ordinária',
      resultado: 'APROVADA',
      votosSim: 11,
      votosNao: 0,
      abstencao: 0
    },
    {
      id: 6,
      numero: '006',
      ano: 2025,
      tipo: 'PROJETO_LEI',
      titulo: 'Institui o Fundo Municipal de Cultura',
      ementa: 'Cria fundo específico para financiamento de projetos culturais no município.',
      status: 'REJEITADA',
      dataApresentacao: '2025-01-30',
      dataVotacao: '2025-05-20',
      autor: 'Wallace Lalá',
      sessao: '22ª Sessão Ordinária',
      resultado: 'REJEITADA',
      votosSim: 4,
      votosNao: 7,
      abstencao: 0
    }
  ]

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'PROJETO_LEI':
        return <Badge className="bg-camara-primary text-white">Projeto de Lei</Badge>
      case 'PROJETO_DECRETO':
        return <Badge className="bg-camara-secondary text-white">Projeto de Decreto</Badge>
      case 'PROJETO_RESOLUCAO':
        return <Badge className="bg-camara-accent text-white">Projeto de Resolução</Badge>
      case 'INDICACAO':
        return <Badge className="bg-camara-gold text-white">Indicação</Badge>
      case 'REQUERIMENTO':
        return <Badge className="bg-purple-600 text-white">Requerimento</Badge>
      case 'MOCAO':
        return <Badge className="bg-blue-600 text-white">Moção</Badge>
      case 'VOTO_PESAR':
        return <Badge className="bg-gray-600 text-white">Voto de Pesar</Badge>
      case 'VOTO_APLAUSO':
        return <Badge className="bg-green-600 text-white">Voto de Aplauso</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{tipo}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APROVADA':
        return <Badge className="bg-green-100 text-green-800">Aprovada</Badge>
      case 'REJEITADA':
        return <Badge className="bg-red-100 text-red-800">Rejeitada</Badge>
      case 'EM_TRAMITACAO':
        return <Badge className="bg-yellow-100 text-yellow-800">Em Tramitação</Badge>
      case 'APRESENTADA':
        return <Badge className="bg-blue-100 text-blue-800">Apresentada</Badge>
      case 'ARQUIVADA':
        return <Badge className="bg-gray-100 text-gray-800">Arquivada</Badge>
      case 'VETADA':
        return <Badge className="bg-orange-100 text-orange-800">Vetada</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Proposições e Matérias
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Acompanhe todas as proposições legislativas apresentadas pelos vereadores 
            da Câmara Municipal de Mojuí dos Campos.
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="camara-card text-center">
            <CardContent className="p-6">
              <FileText className="h-12 w-12 text-camara-primary mx-auto mb-3" />
              <div className="text-3xl font-bold text-camara-primary mb-2">156</div>
              <div className="text-sm text-gray-600">Total de Proposições</div>
            </CardContent>
          </Card>
          
          <Card className="camara-card text-center">
            <CardContent className="p-6">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✓</span>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">89</div>
              <div className="text-sm text-gray-600">Aprovadas</div>
            </CardContent>
          </Card>
          
          <Card className="camara-card text-center">
            <CardContent className="p-6">
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">⏳</span>
              </div>
              <div className="text-3xl font-bold text-yellow-600 mb-2">45</div>
              <div className="text-sm text-gray-600">Em Tramitação</div>
            </CardContent>
          </Card>
          
          <Card className="camara-card text-center">
            <CardContent className="p-6">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✗</span>
              </div>
              <div className="text-3xl font-bold text-red-600 mb-2">22</div>
              <div className="text-sm text-gray-600">Rejeitadas</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <div className="mb-8">
          <Card className="camara-card">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar proposições..."
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Todas
                  </Button>
                  <Button variant="outline" size="sm">Projetos de Lei</Button>
                  <Button variant="outline" size="sm">Indicações</Button>
                  <Button variant="outline" size="sm">Requerimentos</Button>
                  <Button variant="outline" size="sm">Aprovadas</Button>
                  <Button variant="outline" size="sm">Em Tramitação</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Proposições */}
        <div className="space-y-6">
          {proposicoes.map((proposicao) => (
            <Card key={proposicao.id} className="camara-card hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {proposicao.tipo === 'PROJETO_LEI' ? 'PL' : 
                         proposicao.tipo === 'PROJETO_DECRETO' ? 'PD' :
                         proposicao.tipo === 'INDICACAO' ? 'IND' :
                         proposicao.tipo === 'REQUERIMENTO' ? 'REQ' : 'MAT'} 
                        {proposicao.numero}/{proposicao.ano}
                      </CardTitle>
                      {getTipoBadge(proposicao.tipo)}
                      {getStatusBadge(proposicao.status)}
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {proposicao.titulo}
                    </h2>
                    <p className="text-gray-700 mb-4">
                      {proposicao.ementa}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Informações</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">Autor:</span>
                          <span className="font-medium">{proposicao.autor}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">Apresentação:</span>
                          <span className="font-medium">
                            {new Date(proposicao.dataApresentacao).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        {proposicao.dataVotacao && (
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">Votação:</span>
                            <span className="font-medium">
                              {new Date(proposicao.dataVotacao).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}
                        {proposicao.sessao && (
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">Sessão:</span>
                            <span className="font-medium">{proposicao.sessao}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {proposicao.status === 'APROVADA' || proposicao.status === 'REJEITADA' ? (
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Resultado da Votação</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Votos Sim:</span>
                            <span className="font-semibold text-green-600">{proposicao.votosSim}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Votos Não:</span>
                            <span className="font-semibold text-red-600">{proposicao.votosNao}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Abstenções:</span>
                            <span className="font-semibold text-gray-600">{proposicao.abstencao}</span>
                          </div>
                          <div className="pt-2 border-t">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Resultado:</span>
                              <span className={`font-semibold ${
                                proposicao.resultado === 'APROVADA' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {proposicao.resultado === 'APROVADA' ? 'Aprovada' : 'Rejeitada'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-sm text-yellow-800">
                            {proposicao.status === 'EM_TRAMITACAO' 
                              ? 'Esta proposição está em tramitação nas comissões competentes.'
                              : 'Esta proposição foi apresentada e aguarda tramitação.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Ações</h3>
                      <div className="space-y-2">
                        <Button asChild variant="outline" size="sm" className="w-full">
                          <Link href={`/legislativo/proposicoes/${proposicao.numero}-${proposicao.ano}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Link>
                        </Button>
                        
                        <Button asChild variant="outline" size="sm" className="w-full">
                          <Link href={`/legislativo/proposicoes/${proposicao.numero}-${proposicao.ano}/texto`}>
                            <FileText className="h-4 w-4 mr-2" />
                            Ver Texto
                          </Link>
                        </Button>
                        
                        <Button asChild variant="outline" size="sm" className="w-full">
                          <Link href={`/legislativo/proposicoes/${proposicao.numero}-${proposicao.ano}/tramitacao`}>
                            <Calendar className="h-4 w-4 mr-2" />
                            Tramitação
                          </Link>
                        </Button>
                        
                        <Button asChild variant="outline" size="sm" className="w-full">
                          <Link href={`/legislativo/proposicoes/${proposicao.numero}-${proposicao.ano}/download`}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Paginação */}
        <div className="mt-12 text-center">
          <div className="flex justify-center space-x-2">
            <Button variant="outline" size="sm" disabled>Anterior</Button>
            <Button variant="outline" size="sm" className="bg-camara-primary text-white">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline" size="sm">Próximo</Button>
          </div>
        </div>

        {/* Ações */}
        <div className="text-center mt-12 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="camara-button">
              <Link href="/legislativo/sessoes">
                <Calendar className="h-5 w-5 mr-2" />
                Ver Sessões
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-camara-primary text-camara-primary hover:bg-camara-primary hover:text-white">
              <Link href="/legislativo/comissoes">
                <FileText className="h-5 w-5 mr-2" />
                Ver Comissões
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
