'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building, Users, Calendar, FileText, Shield, Heart, Loader2, AlertCircle, Landmark, Scale } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('institucional/sobre')

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
        log.error('Erro ao buscar dados institucionais', err)
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
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Sobre a Câmara Municipal
            </h1>
          </div>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-camara-primary" />
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
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
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

  const presidente = dados?.mesaDiretora?.find(m => m.cargo === 'PRESIDENTE')
  const outrosMembros = dados?.mesaDiretora?.filter(m => m.cargo !== 'PRESIDENTE') || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section com gradiente */}
      <section
        className="relative overflow-hidden py-16 md:py-20"
        style={{
          background: `linear-gradient(135deg, var(--municipal-primary, #1e3a5f) 0%, color-mix(in srgb, var(--municipal-primary, #1e3a5f) 70%, #000) 100%)`,
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.15) 0%, transparent 50%)',
          }} />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <Breadcrumb
            items={[
              { label: 'Institucional', href: '/institucional' },
              { label: 'Sobre', current: true },
            ]}
            className="mb-6 [&_ol]:text-white/70 [&_a]:text-white/70 [&_a:hover]:text-white [&_svg]:text-white/50 [&_span.font-medium]:text-white"
          />
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/15 backdrop-blur-sm mb-6">
              <Landmark className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Sobre a Câmara Municipal
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-white/80 max-w-3xl mx-auto">
              Conheça a história, missão e valores da {nomeCasa},
              instituição dedicada ao exercício do Poder Legislativo e à representação do povo.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
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

        {/* Estrutura Organizacional - Organograma Visual */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary flex items-center">
                <Scale className="h-6 w-6 mr-2" />
                Estrutura Organizacional
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">Mesa Diretora da {dados?.legislatura ? `${dados.legislatura.numero}a Legislatura` : 'Legislatura Atual'}</p>
            </CardHeader>
            <CardContent>
              {dados?.mesaDiretora && dados.mesaDiretora.length > 0 ? (
                <div className="flex flex-col items-center">
                  {/* Presidente no topo */}
                  {presidente && (
                    <div className="flex flex-col items-center mb-2">
                      <div className="relative rounded-xl border-2 border-camara-gold bg-gradient-to-br from-amber-50 to-yellow-50 shadow-lg px-6 py-4 text-center min-w-[200px] max-w-[280px]">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="inline-block bg-camara-gold text-white text-xs font-bold px-3 py-0.5 rounded-full shadow">
                            {presidente.cargoLabel}
                          </span>
                        </div>
                        {presidente.foto ? (
                          <Image
                            src={presidente.foto}
                            alt={`Foto de ${presidente.apelido || presidente.nome}`}
                            width={64}
                            height={64}
                            className="w-16 h-16 rounded-full mx-auto mt-2 mb-2 object-cover border-2 border-camara-gold/30"
                            unoptimized
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full mx-auto mt-2 mb-2 bg-camara-gold/10 flex items-center justify-center">
                            <Users className="h-7 w-7 text-camara-gold" />
                          </div>
                        )}
                        <p className="font-semibold text-gray-900 text-sm">{presidente.apelido || presidente.nome}</p>
                        {presidente.partido && (
                          <p className="text-xs text-gray-500">{presidente.partido}</p>
                        )}
                      </div>
                      {/* Linha vertical conectora */}
                      {outrosMembros.length > 0 && (
                        <div className="w-0.5 h-8 bg-gray-300" />
                      )}
                    </div>
                  )}

                  {/* Linha horizontal conectora */}
                  {outrosMembros.length > 0 && (
                    <div className="relative w-full max-w-3xl mb-2">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 bg-gray-300" style={{
                        width: outrosMembros.length > 1 ? `${Math.min(100, outrosMembros.length * 33)}%` : '0%',
                      }} />
                    </div>
                  )}

                  {/* Demais membros abaixo */}
                  <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-2">
                    {outrosMembros.map((membro) => {
                      const cargoColorMap: Record<string, { border: string; badge: string; bg: string; icon: string }> = {
                        VICE_PRESIDENTE: { border: 'border-blue-400', badge: 'bg-blue-500', bg: 'from-blue-50 to-sky-50', icon: 'text-blue-500' },
                        PRIMEIRO_SECRETARIO: { border: 'border-emerald-400', badge: 'bg-emerald-500', bg: 'from-emerald-50 to-green-50', icon: 'text-emerald-500' },
                        SEGUNDO_SECRETARIO: { border: 'border-purple-400', badge: 'bg-purple-500', bg: 'from-purple-50 to-violet-50', icon: 'text-purple-500' },
                      }
                      const colors = cargoColorMap[membro.cargo] || { border: 'border-gray-300', badge: 'bg-gray-500', bg: 'from-gray-50 to-slate-50', icon: 'text-gray-500' }

                      return (
                        <div key={membro.id} className="flex flex-col items-center">
                          {/* Linha vertical de cima */}
                          <div className="w-0.5 h-4 bg-gray-300" />
                          <div className={`relative rounded-xl border-2 ${colors.border} bg-gradient-to-br ${colors.bg} shadow-md px-5 py-3 text-center min-w-[170px] max-w-[220px]`}>
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                              <span className={`inline-block ${colors.badge} text-white text-xs font-bold px-3 py-0.5 rounded-full shadow`}>
                                {membro.cargoLabel}
                              </span>
                            </div>
                            {membro.foto ? (
                              <Image
                                src={membro.foto}
                                alt={`Foto de ${membro.apelido || membro.nome}`}
                                width={48}
                                height={48}
                                className={`w-12 h-12 rounded-full mx-auto mt-2 mb-2 object-cover border-2 ${colors.border} opacity-80`}
                                unoptimized
                              />
                            ) : (
                              <div className={`w-12 h-12 rounded-full mx-auto mt-2 mb-2 bg-white/60 flex items-center justify-center`}>
                                <Users className={`h-5 w-5 ${colors.icon}`} />
                              </div>
                            )}
                            <p className="font-semibold text-gray-900 text-sm">{membro.apelido || membro.nome}</p>
                            {membro.partido && (
                              <p className="text-xs text-gray-500">{membro.partido}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic text-center py-8">Informação da Mesa Diretora não disponível</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Números / Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
          {[
            {
              label: 'Vereadores',
              value: dados?.estatisticas?.totalParlamentares || 0,
              icon: Users,
            },
            {
              label: 'Comissões',
              value: dados?.estatisticas?.totalComissoes || 0,
              icon: FileText,
            },
            {
              label: 'Legislatura',
              value: dados?.legislatura ? `${dados.legislatura.numero}a` : '-',
              icon: Calendar,
            },
            {
              label: 'Mesa Diretora',
              value: dados?.mesaDiretora?.length || 0,
              icon: Landmark,
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="relative rounded-2xl p-6 text-white overflow-hidden shadow-lg group hover:scale-[1.03] transition-transform duration-200"
              style={{
                background: `linear-gradient(135deg, var(--municipal-primary, #1e3a5f) 0%, color-mix(in srgb, var(--municipal-primary, #1e3a5f) 60%, #000) 100%)`,
              }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
                <stat.icon className="w-full h-full" />
              </div>
              <stat.icon className="h-6 w-6 text-white/70 mb-2" />
              <p className="text-3xl md:text-4xl font-bold">{stat.value}</p>
              <p className="text-sm text-white/70 mt-1">{stat.label}</p>
            </div>
          ))}
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
                    <p><strong>Atendimento:</strong> Segunda a Sexta</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CNPJ e Dados Legais */}
        <div className="text-center">
          <Card className="camara-card max-w-2xl mx-auto">
            <CardContent className="p-4 sm:p-6">
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
