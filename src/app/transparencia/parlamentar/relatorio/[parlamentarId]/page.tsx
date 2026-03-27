'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  User, Loader2, CheckCircle, ClipboardCheck, Vote, FileText,
  Users, ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

interface RelatorioData {
  parlamentar: {
    id: string
    nome: string
    partido: string | null
    email: string | null
    foto: string | null
    mandato: { dataInicio: string; dataFim: string } | null
  }
  ano: number
  presenca: {
    totalSessoes: number
    presentes: number
    percentual: number
  }
  votacoes: {
    total: number
    sim: number
    nao: number
    abstencao: number
  }
  proposicoes: {
    total: number
    lista: Array<{
      id: string
      tipo: string
      numero: number
      ano: number
      ementa: string
      status: string
    }>
  }
  comissoes: Array<{
    comissao: { id: string; nome: string; sigla: string | null; tipo: string }
    cargo: string
  }>
}

export default function RelatorioParlamentarPage() {
  const params = useParams()
  const parlamentarId = params.parlamentarId as string
  const [data, setData] = useState<RelatorioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [ano, setAno] = useState(new Date().getFullYear().toString())

  const currentYear = new Date().getFullYear()
  const anos = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString())

  useEffect(() => {
    setLoading(true)
    fetch(`/api/publico/relatorio-parlamentar/${parlamentarId}?ano=${ano}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [parlamentarId, ano])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-camara-primary" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Parlamentar nao encontrado.</p>
      </div>
    )
  }

  const { parlamentar, presenca, votacoes, proposicoes, comissoes } = data

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <Link href="/transparencia/parlamentar/relatorio">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <div className="flex flex-col md:flex-row gap-6 items-start mb-8">
          <Card className="w-full md:w-80">
            <CardContent className="p-6 text-center">
              {parlamentar.foto ? (
                <img
                  src={parlamentar.foto}
                  alt={parlamentar.nome}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-camara-primary/10 flex items-center justify-center mx-auto mb-4">
                  <User className="h-12 w-12 text-camara-primary" />
                </div>
              )}
              <h2 className="text-xl font-bold text-gray-900 mb-1">{parlamentar.nome}</h2>
              {parlamentar.partido && <Badge className="mb-2">{parlamentar.partido}</Badge>}
              {parlamentar.email && (
                <p className="text-sm text-gray-500 mt-2">{parlamentar.email}</p>
              )}
              {parlamentar.mandato && (
                <p className="text-xs text-gray-400 mt-1">
                  Mandato: {new Date(parlamentar.mandato.dataInicio).getFullYear()} - {new Date(parlamentar.mandato.dataFim).getFullYear()}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex-1">
            <div className="flex items-center gap-4 mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Relatorio de Atuacao</h1>
              <Select value={ano} onValueChange={setAno}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anos.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ClipboardCheck className="h-5 w-5 text-green-600" />
                    Presenca
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{presenca.presentes} de {presenca.totalSessoes} sessoes</span>
                    <span className="font-bold">{presenca.percentual}%</span>
                  </div>
                  <Progress value={presenca.percentual} className="h-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Vote className="h-5 w-5 text-blue-600" />
                    Votacoes ({votacoes.total})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">SIM: {votacoes.sim}</Badge>
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">NAO: {votacoes.nao}</Badge>
                    <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">ABS: {votacoes.abstencao}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-5 w-5 text-camara-primary" />
                    Proposicoes ({proposicoes.total})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {proposicoes.lista.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhuma proposicao neste periodo.</p>
                  ) : (
                    <ul className="space-y-1 text-sm max-h-40 overflow-y-auto">
                      {proposicoes.lista.map((p) => (
                        <li key={p.id} className="flex justify-between">
                          <span className="truncate mr-2">{p.tipo} {p.numero}/{p.ano}</span>
                          <Badge variant="outline" className="text-xs flex-shrink-0">{p.status}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-5 w-5 text-purple-600" />
                    Comissoes ({comissoes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {comissoes.length === 0 ? (
                    <p className="text-sm text-gray-500">Nao participa de comissoes.</p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {comissoes.map((c, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span>{c.comissao.sigla || c.comissao.nome}</span>
                          <Badge variant="outline" className="text-xs">{c.cargo}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
