'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building, Users, Calendar, FileText, Shield, Heart, Loader2, AlertCircle } from 'lucide-react'

interface MembroMesaDiretora {
  id: string
  nome: string
  apelido: string | null
  cargo: string
  cargoLabel: string
  partido: string | null
  foto: string | null
}

interface ConfiguracaoInstitucional {
  nome: string
  sigla: string | null
  cnpj: string | null
  endereco: {
    logradouro: string | null
    numero: string | null
    bairro: string | null
    cidade: string | null
    estado: string | null
    cep: string | null
  }
  telefone: string | null
  email: string | null
  site: string | null
  logoUrl: string | null
  descricao: string | null
}

interface DadosInstitucionais {
  configuracao: ConfiguracaoInstitucional | null
  mesaDiretora: MembroMesaDiretora[]
  estatisticas: {
    totalParlamentares: number
    totalComissoes: number
  }
  legislatura: {
    numero: number
    periodo: string
  } | null
}

export default function SobrePage() {
  const [dados, setDados] = useState<DadosInstitucionais | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDados = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/institucional')
        const result = await response.json()
        if (result.dados) {
          setDados(result.dados)
        }
      } catch (err) {
        console.error('Erro ao buscar dados institucionais:', err)
        setError('Erro ao carregar dados institucionais')
      } finally {
        setLoading(false)
      }
    }
    fetchDados()
  }, [])

  const getCargoColor = (cargo: string) => {
    switch (cargo) {
      case 'PRESIDENTE':
        return 'bg-camara-gold'
      case 'VICE_PRESIDENTE':
        return 'bg-camara-primary'
      case 'PRIMEIRO_SECRETARIO':
        return 'bg-camara-secondary'
      case 'SEGUNDO_SECRETARIO':
        return 'bg-camara-accent'
      default:
        return 'bg-gray-500'
    }
  }

  const formatEndereco = (endereco: ConfiguracaoInstitucional['endereco']): string[] => {
    const partes: string[] = []
    if (endereco.logradouro) {
      partes.push(endereco.logradouro)
      if (endereco.numero) {
        partes[0] += `, ${endereco.numero}`
      }
    }
    if (endereco.bairro) {
      partes.push(endereco.bairro)
    }
    if (endereco.cep && endereco.cidade && endereco.estado) {
      partes.push(`${endereco.cep} - ${endereco.cidade}/${endereco.estado}`)
    } else if (endereco.cidade && endereco.estado) {
      partes.push(`${endereco.cidade}/${endereco.estado}`)
    }
    return partes
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Sobre a Câmara Municipal
            </h1>
          </div>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Carregando dados...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Sobre a Câmara Municipal
            </h1>
          </div>
          <Card className="border-red-200 bg-red-50 max-w-2xl mx-auto">
            <CardContent className="flex items-center gap-3 py-6">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const config = dados?.configuracao
  const nomeCasa = config?.nome || 'Câmara Municipal'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Sobre a Câmara Municipal
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Conheça a história, missão e valores da {nomeCasa},
            instituição dedicada ao exercício do Poder Legislativo e à representação do povo.
          </p>
        </div>

        {/* História */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary flex items-center">
                <Building className="h-6 w-6 mr-2" />
                Nossa História
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              {config?.descricao ? (
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {config.descricao}
                </p>
              ) : (
                <>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    A {nomeCasa} foi criada com o objetivo de exercer o Poder Legislativo
                    no município, representando os interesses da população e promovendo o desenvolvimento local
                    através da elaboração de leis e do controle da administração municipal.
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Nossa Casa Legislativa tem como missão principal representar
                    o povo de {config?.endereco?.cidade || 'nossa cidade'}, elaborando leis que atendam às necessidades da comunidade e
                    fiscalizando a aplicação dos recursos públicos.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Ao longo dos anos, a Câmara tem se consolidado como uma instituição democrática e transparente,
                    sempre em busca do bem-estar coletivo e do desenvolvimento sustentável do município.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Missão, Visão e Valores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-camara-primary flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Missão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Representar o povo de {config?.endereco?.cidade || 'nossa cidade'}, elaborando leis que promovam o desenvolvimento
                social, econômico e cultural do município, sempre com transparência e responsabilidade.
              </p>
            </CardContent>
          </Card>

          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-camara-primary flex items-center">
                <Heart className="h-5 w-5 mr-2" />
                Visão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Ser reconhecida como uma Casa Legislativa moderna, eficiente e transparente,
                que contribui efetivamente para o desenvolvimento sustentável de {config?.endereco?.cidade || 'nossa cidade'}.
              </p>
            </CardContent>
          </Card>

          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-camara-primary flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Valores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-gray-700 space-y-2">
                <li>• Transparência</li>
                <li>• Democracia</li>
                <li>• Ética</li>
                <li>• Responsabilidade</li>
                <li>• Compromisso com o povo</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Estrutura Organizacional */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary">
                Estrutura Organizacional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Mesa Diretora</h3>
                  <div className="space-y-3">
                    {dados?.mesaDiretora && dados.mesaDiretora.length > 0 ? (
                      dados.mesaDiretora.map((membro) => (
                        <div key={membro.id} className="flex items-center space-x-3">
                          <div className={`w-3 h-3 ${getCargoColor(membro.cargo)} rounded-full`}></div>
                          <span className="text-gray-700">
                            {membro.cargoLabel}: {membro.apelido || membro.nome}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">Informação não disponível</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Composição</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-camara-primary" />
                      <span className="text-gray-700">
                        {dados?.estatisticas?.totalParlamentares || 0} Vereadores eleitos
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-camara-primary" />
                      <span className="text-gray-700">
                        Legislatura {dados?.legislatura?.periodo || '2025/2028'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-camara-primary" />
                      <span className="text-gray-700">
                        {dados?.estatisticas?.totalComissoes || 0} Comissões ativas
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Atribuições */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary">
                Principais Atribuições
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Função Legislativa</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Elaborar e aprovar leis municipais</li>
                    <li>• Aprovar o orçamento anual</li>
                    <li>• Criar, alterar e extinguir tributos</li>
                    <li>• Autorizar empréstimos e operações de crédito</li>
                    <li>• Dispor sobre organização administrativa</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Função Fiscalizadora</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Fiscalizar a administração municipal</li>
                    <li>• Controlar a execução orçamentária</li>
                    <li>• Apreciar as contas do Prefeito</li>
                    <li>• Realizar audiências públicas</li>
                    <li>• Solicitar informações e documentos</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informações de Contato */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary">
                Informações de Contato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Endereço</h3>
                  {config?.endereco ? (
                    <p className="text-gray-700">
                      {formatEndereco(config.endereco).map((linha, i) => (
                        <span key={i}>
                          {linha}
                          {i < formatEndereco(config.endereco).length - 1 && <br />}
                        </span>
                      ))}
                    </p>
                  ) : (
                    <p className="text-gray-500 italic">Endereço não disponível</p>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contato</h3>
                  <div className="space-y-2 text-gray-700">
                    {config?.telefone && (
                      <p><strong>Telefone:</strong> {config.telefone}</p>
                    )}
                    {config?.email && (
                      <p><strong>Email:</strong> {config.email}</p>
                    )}
                    {config?.site && (
                      <p><strong>Site:</strong> {config.site}</p>
                    )}
                    <p><strong>Horário:</strong> De 08:00h às 14:00h, Segunda à Sexta</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CNPJ e Dados Legais */}
        <div className="text-center">
          <Card className="camara-card max-w-2xl mx-auto">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados Legais</h3>
              <div className="space-y-2 text-gray-700">
                {config?.cnpj && (
                  <p><strong>CNPJ:</strong> {config.cnpj}</p>
                )}
                {dados?.legislatura && (
                  <p><strong>Legislatura:</strong> {dados.legislatura.periodo}</p>
                )}
                {dados?.mesaDiretora && dados.mesaDiretora.length > 0 && (
                  <p>
                    <strong>Presidente:</strong>{' '}
                    {dados.mesaDiretora.find(m => m.cargo === 'PRESIDENTE')?.apelido ||
                      dados.mesaDiretora.find(m => m.cargo === 'PRESIDENTE')?.nome ||
                      'Não definido'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
