'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Shield, CheckCircle, AlertTriangle, XCircle, Diamond, Award, Medal,
  Loader2, Building2, Scale, Users, DollarSign, UserCheck, Database, Eye
} from 'lucide-react'

interface ItemConformidade {
  nome: string
  obrigatorio: boolean
  atendido: boolean
  recomendacao?: string
}

interface CategoriaConformidade {
  nome: string
  pontuacao: number
  pontuacaoMaxima: number
  percentual: number
  status: 'CONFORME' | 'ALERTA' | 'NAO_CONFORME'
  itens: ItemConformidade[]
}

interface DadosConformidade {
  nivel: string
  pontuacaoTotal: number
  pontuacaoMaxima: number
  percentualGeral: number
  categorias: CategoriaConformidade[]
  dataGeracao: string
}

const nivelConfig: Record<string, { color: string; bg: string; icon: React.ElementType; border: string }> = {
  DIAMANTE: { color: 'text-purple-700', bg: 'bg-purple-100', icon: Diamond, border: 'border-purple-500' },
  OURO: { color: 'text-amber-700', bg: 'bg-amber-100', icon: Award, border: 'border-amber-500' },
  PRATA: { color: 'text-gray-600', bg: 'bg-gray-100', icon: Medal, border: 'border-gray-400' },
  BRONZE: { color: 'text-orange-700', bg: 'bg-orange-100', icon: Medal, border: 'border-orange-500' },
}

const categoriaIcons: Record<string, React.ElementType> = {
  Institucional: Building2,
  Legislativo: Scale,
  Parlamentar: Users,
  Financeiro: DollarSign,
  Pessoal: UserCheck,
  'Dados Abertos': Database,
  Acessibilidade: Eye,
}

export default function ConformidadePage() {
  const [dados, setDados] = useState<DadosConformidade | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/publico/conformidade')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setDados(json.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-camara-primary" />
      </div>
    )
  }

  if (!dados) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Nao foi possivel carregar os dados de conformidade.</p>
      </div>
    )
  }

  const config = nivelConfig[dados.nivel] || nivelConfig.BRONZE
  const NivelIcon = config.icon

  const statusBadge = (status: string) => {
    switch (status) {
      case 'CONFORME':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Conforme</Badge>
      case 'ALERTA':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><AlertTriangle className="h-3 w-3 mr-1" />Alerta</Badge>
      case 'NAO_CONFORME':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="h-3 w-3 mr-1" />Nao Conforme</Badge>
      default:
        return null
    }
  }

  const itensNaoConformes = dados.categorias.flatMap((c) =>
    c.itens.filter((i) => !i.atendido && i.recomendacao).map((i) => ({
      categoria: c.nome,
      ...i,
    }))
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-camara-primary" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Conformidade PNTP
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Painel de conformidade com o Programa Nacional de Transparencia Publica
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <Card className={`w-full max-w-md border-2 ${config.border}`}>
            <CardContent className="p-8 text-center">
              <div className={`w-24 h-24 ${config.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <NivelIcon className={`h-12 w-12 ${config.color}`} />
              </div>
              <h2 className={`text-3xl font-bold ${config.color} mb-2`}>
                Nivel {dados.nivel}
              </h2>
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Conformidade Geral</span>
                  <span>{dados.percentualGeral}%</span>
                </div>
                <Progress value={dados.percentualGeral} className="h-3" />
              </div>
              <p className="text-gray-600 mt-3">
                {dados.pontuacaoTotal} / {dados.pontuacaoMaxima} pontos
              </p>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Categorias</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {dados.categorias.map((cat) => {
            const CatIcon = categoriaIcons[cat.nome] || Shield
            return (
              <Card key={cat.nome} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CatIcon className="h-5 w-5 text-camara-primary" />
                      <span className="text-lg">{cat.nome}</span>
                    </div>
                    {statusBadge(cat.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{cat.pontuacao} / {cat.pontuacaoMaxima}</span>
                    <span>{cat.percentual}%</span>
                  </div>
                  <Progress
                    value={cat.percentual}
                    className={`h-2 ${cat.status === 'CONFORME' ? '[&>div]:bg-green-500' : cat.status === 'ALERTA' ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500'}`}
                  />
                  <div className="mt-3 space-y-1">
                    {cat.itens.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        {item.atendido ? (
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                        )}
                        <span className={item.atendido ? 'text-gray-700' : 'text-gray-500'}>{item.nome}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {itensNaoConformes.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recomendacoes de Melhoria</h2>
            <div className="space-y-3">
              {itensNaoConformes.map((item, idx) => (
                <Card key={idx} className="border-l-4 border-l-yellow-500">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{item.nome}</p>
                        <p className="text-sm text-gray-500">Categoria: {item.categoria}</p>
                        <p className="text-sm text-gray-700 mt-1">{item.recomendacao}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <p className="text-sm text-gray-500 text-center">
          Dados gerados em: {new Date(dados.dataGeracao).toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  )
}
