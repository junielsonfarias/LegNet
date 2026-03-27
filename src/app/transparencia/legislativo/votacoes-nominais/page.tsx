'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from '@/components/ui/table'
import { Vote, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

interface Voto {
  parlamentar?: { nome: string }
  parlamentarNome?: string
  voto: string
}

interface Votacao {
  id: string
  tipo?: string
  resultado?: string
  sessao?: { titulo: string; dataInicio: string }
  sessaoTitulo?: string
  proposicao?: { tipo: string; numero: number; ano: number; ementa: string }
  votos?: Voto[]
  totalSim?: number
  totalNao?: number
  totalAbstencao?: number
}

const votoConfig: Record<string, { label: string; className: string }> = {
  SIM: { label: 'Sim', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  NAO: { label: 'Nao', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
  ABSTENCAO: { label: 'Abstencao', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
}

export default function VotacoesNominaisPage() {
  const [votacoes, setVotacoes] = useState<Votacao[]>([])
  const [loading, setLoading] = useState(true)
  const [ano, setAno] = useState(new Date().getFullYear().toString())
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/dados-abertos/votacoes?ano=${ano}`)
      .then((res) => res.json())
      .then((json) => {
        const data = json.success ? json.data : (Array.isArray(json) ? json : [])
        setVotacoes(data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [ano])

  const currentYear = new Date().getFullYear()
  const anos = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString())

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Votacoes Nominais</h1>
          <p className="text-gray-600">Registro de votacoes nominais nas sessoes legislativas</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <Select value={ano} onValueChange={setAno}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {anos.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5" />
              Votacoes ({votacoes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-camara-primary" />
              </div>
            ) : votacoes.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhuma votacao encontrada.</p>
            ) : (
              <div className="space-y-3">
                {votacoes.map((v) => (
                  <div key={v.id} className="border rounded-lg overflow-hidden">
                    <div
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {v.proposicao ? `${v.proposicao.tipo} ${v.proposicao.numero}/${v.proposicao.ano}` : 'Votacao'}
                          </span>
                          {v.resultado && (
                            <Badge className={v.resultado === 'APROVADO' || v.resultado === 'APROVADA'
                              ? 'bg-green-100 text-green-800 hover:bg-green-100'
                              : 'bg-red-100 text-red-800 hover:bg-red-100'
                            }>
                              {v.resultado}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {v.sessao?.titulo || v.sessaoTitulo || ''} -
                          {v.sessao?.dataInicio ? new Date(v.sessao.dataInicio).toLocaleDateString('pt-BR') : ''}
                        </p>
                        {v.proposicao?.ementa && (
                          <p className="text-sm text-gray-500 mt-1 truncate max-w-2xl">{v.proposicao.ementa}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        {expandedId === v.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>

                    {expandedId === v.id && v.votos && v.votos.length > 0 && (
                      <div className="border-t p-4 bg-gray-50">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Parlamentar</TableHead>
                              <TableHead>Voto</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {v.votos.map((voto, idx) => {
                              const cfg = votoConfig[voto.voto] || votoConfig.ABSTENCAO
                              return (
                                <TableRow key={idx}>
                                  <TableCell>{voto.parlamentar?.nome || voto.parlamentarNome || '-'}</TableCell>
                                  <TableCell>
                                    <Badge className={cfg.className}>{cfg.label}</Badge>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
