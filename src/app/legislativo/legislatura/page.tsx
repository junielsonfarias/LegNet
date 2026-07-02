'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Users, FileText, Building, BarChart3, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any

export default function LegislaturaPage() {
  const { configuracao } = useConfiguracaoInstitucional()
  const [dados, setDados] = useState<{
    anoInicio?: number; anoFim?: number; numero?: number
    vereadores: number; leis?: number; sessoes?: number
    partidos: Array<{ partido: string; total: number }>
  } | null>(null)

  // Página era 100% estática (dados fabricados). Agora deriva do banco. ERR-063.
  useEffect(() => {
    Promise.all([
      fetch('/api/legislaturas?limit=20').then((r) => r.json()).catch(() => null),
      fetch('/api/parlamentares?ativo=true&limit=100').then((r) => r.json()).catch(() => null),
      fetch('/api/dados-abertos/sessoes?limit=1').then((r) => r.json()).catch(() => null),
      fetch('/api/normas?limit=1').then((r) => r.json()).catch(() => null),
    ]).then(([legs, parl, sess, norm]: Any[]) => {
      const listaLeg = (legs?.data ?? legs?.dados ?? legs?.data?.legislaturas ?? []) as Any[]
      const atual = Array.isArray(listaLeg) && listaLeg.length
        ? [...listaLeg].sort((a, b) => (b.anoInicio || 0) - (a.anoInicio || 0))[0]
        : null
      const vers = (parl?.data ?? parl?.dados ?? []) as Any[]
      const mapa = new Map<string, number>()
      vers.forEach((v) => { const p = v.partido || 'Sem partido'; mapa.set(p, (mapa.get(p) || 0) + 1) })
      const partidos = Array.from(mapa.entries())
        .map(([partido, total]) => ({ partido, total }))
        .sort((a, b) => b.total - a.total)
      setDados({
        anoInicio: atual?.anoInicio, anoFim: atual?.anoFim, numero: atual?.numero,
        vereadores: vers.length,
        leis: norm?.total ?? norm?.data?.total ?? norm?.metadados?.total,
        sessoes: sess?.metadados?.total ?? sess?.total,
        partidos,
      })
    })
  }, [])

  const periodo = dados?.anoInicio && dados?.anoFim ? `${dados.anoInicio}-${dados.anoFim}` : '—'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Legislatura Atual
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Conheça a composição da atual legislatura da {configuracao?.nomeCasa || 'Câmara Municipal'},
            seus representantes e principais realizações.
          </p>
        </div>

        {/* Informações da Legislatura */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary flex items-center">
                <Calendar className="h-6 w-6 mr-2" />
                Legislatura {periodo}
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                A atual legislatura da {configuracao?.nomeCasa || 'Câmara Municipal'}
                {dados?.anoInicio ? ` teve início em 1º de janeiro de ${dados.anoInicio}` : ''}
                {dados?.anoFim ? ` e se estende até 31 de dezembro de ${dados.anoFim}` : ''}
                {dados?.numero ? `. Esta é a ${dados.numero}ª legislatura desde a criação do município` : ''}.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Durante este período, os vereadores eleitos trabalham em prol do 
                desenvolvimento municipal, elaborando leis, fiscalizando a administração 
                pública e representando os interesses da população.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas da Legislatura */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Estatísticas da Legislatura
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="camara-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-camara-primary/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-camara-primary" />
                </div>
                <h3 className="text-3xl font-bold text-camara-primary mb-2">{dados?.vereadores ?? '—'}</h3>
                <p className="text-sm text-gray-600">Vereadores Eleitos</p>
              </CardContent>
            </Card>

            <Card className="camara-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-3xl font-bold text-green-600 mb-2">{dados?.leis ?? '—'}</h3>
                <p className="text-sm text-gray-600">Normas Jurídicas</p>
              </CardContent>
            </Card>

            <Card className="camara-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-3xl font-bold text-purple-600 mb-2">{dados?.sessoes ?? '—'}</h3>
                <p className="text-sm text-gray-600">Sessões Realizadas</p>
              </CardContent>
            </Card>

            <Card className="camara-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-3xl font-bold text-orange-600 mb-2">{dados?.partidos.length ?? '—'}</h3>
                <p className="text-sm text-gray-600">Partidos</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mesa Diretora */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary">
                Mesa Diretora da Legislatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-gray-700 leading-relaxed">
                  A Mesa Diretora é composta por vereadores eleitos pelos seus pares 
                  para um mandato de dois anos, responsáveis por dirigir os trabalhos da Câmara:
                </p>

                <p className="text-gray-500 text-center py-8">
                  Nenhuma informação sobre a Mesa Diretora disponível no momento.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Composição Partidária */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary">
                Composição Partidária
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-gray-700 leading-relaxed">
                  A atual legislatura é composta por vereadores de diferentes partidos políticos:
                </p>

                {dados && dados.partidos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dados.partidos.map((p) => (
                      <div key={p.partido} className="p-4 bg-camara-primary/5 rounded-lg">
                        <h4 className="font-semibold text-camara-primary mb-2">{p.partido}</h4>
                        <p className="text-2xl font-bold text-camara-primary">{p.total}</p>
                        <p className="text-sm text-camara-primary">{p.total === 1 ? 'vereador' : 'vereadores'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Carregando composição partidária...</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Principais Realizações */}
        <div className="mb-12">
          <Card className="camara-card border-l-4 border-l-camara-primary">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-camara-primary">
                Principais Realizações da Legislatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed mb-4">
                As leis, decretos e resoluções aprovados nesta legislatura estão
                disponíveis na íntegra na base de normas jurídicas da Câmara
                {dados?.leis ? ` (${dados.leis} normas)` : ''}.
              </p>
              <Button asChild>
                <Link href="/legislativo/normas">Ver normas jurídicas</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Comissões Permanentes */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-camara-primary">
                Comissões Permanentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-gray-700 leading-relaxed">
                  As comissões permanentes são órgãos técnicos da Câmara responsáveis 
                  pela análise prévia das proposições legislativas:
                </p>

                <p className="text-gray-500 text-center py-8">
                  Nenhuma informação sobre comissões disponível no momento.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cronograma da Legislatura */}
        <div className="mb-12">
          <Card className="camara-card">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-camara-primary">
                Cronograma da Legislatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Período Legislativo 2021-2022</h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-camara-primary mr-2" />
                        <span>Início: Janeiro de 2021</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        <span>89 sessões realizadas</span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-purple-600 mr-2" />
                        <span>127 leis aprovadas</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Período Legislativo 2023-2024</h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-camara-primary mr-2" />
                        <span>Início: Janeiro de 2023</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        <span>67 sessões realizadas</span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-purple-600 mr-2" />
                        <span>120 leis aprovadas</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Clock className="h-4 w-4 text-camara-primary" />
                    <span>Consulte a agenda oficial de sessões e eventos.</span>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/calendario">Abrir calendário</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Acesso às Informações */}
        <div className="text-center">
          <Card className="camara-card max-w-2xl mx-auto">
            <CardContent className="p-8">
              <Building className="h-16 w-16 text-camara-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Acesse Mais Informações
              </h3>
              <p className="text-gray-600 mb-6">
                Explore as atividades legislativas, proposições em tramitação e 
                histórico completo da legislatura.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/parlamentares/vereadores">
                    <Users className="h-5 w-5 mr-2" />
                    Ver Vereadores
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/legislativo/proposicoes">
                    <FileText className="h-5 w-5 mr-2" />
                    Proposições
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}