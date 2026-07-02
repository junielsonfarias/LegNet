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
import { ExportarDadosButton } from '@/components/transparencia/exportar-dados-button'
import { UltimaAtualizacao } from '@/components/transparencia/ultima-atualizacao'

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

// Votação SEM roll-call nominal: apenas o resultado agregado da proposição
// (a fonte CR2 só tem "situacaoMateria"; nomes/contagens não existem).
interface DemaisVotacao {
  id: string
  titulo: string
  ano: number
  tipo: string
  resultado: string
  data: string | null
  ementa: string
  autor: string | null
}

const votoConfig: Record<string, { label: string; className: string }> = {
  SIM: { label: 'Sim', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  NAO: { label: 'Nao', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
  ABSTENCAO: { label: 'Abstencao', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
}

export default function VotacoesNominaisPage() {
  const [todasVotacoes, setTodasVotacoes] = useState<Votacao[]>([])
  const [demais, setDemais] = useState<DemaisVotacao[]>([])
  const [loading, setLoading] = useState(true)
  const [ano, setAno] = useState<string>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    ;(async () => {
      try {
        // 1) Votações NOMINAIS: /api/dados-abertos/votacoes devolve { dados } com
        // UMA linha por voto individual → agregamos por proposição (votos[] +
        // totais + resultado), que é o formato que a tela renderiza.
        const jVotos = await fetch('/api/dados-abertos/votacoes?limit=1000').then((r) => r.json())
        const votos: Array<{
          id: string
          voto: string
          parlamentar?: { nome?: string }
          proposicao?: { id: string; tipo: string; numero: number; ano: number; ementa: string }
          sessao?: { numero?: number; data?: string }
        }> = Array.isArray(jVotos?.dados) ? jVotos.dados : []

        const mapa = new Map<string, Votacao>()
        for (const v of votos) {
          const chave = v.proposicao?.id ?? v.id
          if (!mapa.has(chave)) {
            mapa.set(chave, {
              id: chave,
              proposicao: v.proposicao,
              sessao: v.sessao
                ? { titulo: `Sessão ${v.sessao.numero ?? ''}`.trim(), dataInicio: v.sessao.data ?? '' }
                : undefined,
              votos: [],
              totalSim: 0,
              totalNao: 0,
              totalAbstencao: 0,
            })
          }
          const grupo = mapa.get(chave)!
          grupo.votos!.push({ parlamentarNome: v.parlamentar?.nome, voto: v.voto })
          if (v.voto === 'SIM') grupo.totalSim!++
          else if (v.voto === 'NAO') grupo.totalNao!++
          else grupo.totalAbstencao!++
        }
        setTodasVotacoes(
          Array.from(mapa.values()).map((g) => ({
            ...g,
            resultado: (g.totalSim ?? 0) > (g.totalNao ?? 0) ? 'APROVADA' : 'REJEITADA',
          }))
        )

        // 2) DEMAIS votações: proposições COM resultado e SEM voto nominal (a
        // fonte só tem o resultado agregado). A API pagina em 100 → varremos tudo.
        const props: Array<Record<string, unknown>> = []
        let page = 1
        let paginas = 1
        do {
          const jp = await fetch(`/api/dados-abertos/proposicoes?limit=100&page=${page}`).then((r) => r.json())
          if (Array.isArray(jp?.dados)) props.push(...jp.dados)
          paginas = jp?.metadados?.paginas ?? 1
          page++
        } while (page <= paginas)

        const demaisList: DemaisVotacao[] = props
          .filter((p) => p.resultado && ((p.total_votacoes as number) ?? 0) === 0)
          .map((p) => ({
            id: p.id as string,
            titulo: `${p.tipo} ${p.numero}/${p.ano}`,
            ano: p.ano as number,
            tipo: p.tipo as string,
            resultado: p.resultado as string,
            data: (p.data_votacao as string) ?? null,
            ementa: (p.ementa as string) ?? '',
            autor: ((p.autor as { apelido?: string; nome?: string })?.apelido
              ?? (p.autor as { nome?: string })?.nome) ?? null,
          }))
          .sort((a, b) => (b.data ?? '').localeCompare(a.data ?? ''))
        setDemais(demaisList)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Anos com dados (desc) das DUAS fontes; padrão = mais recente com dados.
  const anos = Array.from(
    new Set(
      [
        ...todasVotacoes.map((v) => v.proposicao?.ano),
        ...demais.map((d) => d.ano),
      ].filter((a): a is number => !!a)
    )
  )
    .sort((a, b) => b - a)
    .map(String)

  useEffect(() => {
    if (!ano && anos.length > 0) setAno(anos[0])
  }, [anos, ano])

  const votacoes = ano
    ? todasVotacoes.filter((v) => String(v.proposicao?.ano) === ano)
    : todasVotacoes
  const demaisFiltradas = ano
    ? demais.filter((d) => String(d.ano) === ano)
    : demais

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Votacoes Nominais</h1>
          <p className="text-gray-600">Registro de votacoes nominais nas sessoes legislativas</p>
          <div className="mt-3 flex justify-center">
            <UltimaAtualizacao />
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4 flex items-center gap-3 flex-wrap">
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
            <ExportarDadosButton
              data={votacoes.map((v) => ({
                id: v.id,
                tipo: v.tipo || '',
                resultado: v.resultado || '',
                sessao: v.sessao?.titulo || v.sessaoTitulo || '',
                data_sessao: v.sessao?.dataInicio || '',
                proposicao: v.proposicao ? `${v.proposicao.tipo} ${v.proposicao.numero}/${v.proposicao.ano}` : '',
                ementa: v.proposicao?.ementa || '',
                total_sim: v.totalSim ?? 0,
                total_nao: v.totalNao ?? 0,
                total_abstencao: v.totalAbstencao ?? 0,
              }))}
              filename={`votacoes-nominais-${ano}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5" />
              Votações Nominais ({votacoes.length})
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Votações com o registro de voto de cada parlamentar.
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-camara-primary" />
              </div>
            ) : votacoes.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhuma votação nominal registrada neste ano.</p>
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
                        <div className="overflow-x-auto">
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
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Demais votações: resultado agregado (a fonte CR2 não tem voto nominal
            individual nem contagem — só a situação aprovado/rejeitado). */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5" />
              Demais Votações ({demaisFiltradas.length})
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Proposições votadas cujo resultado foi registrado, sem detalhamento do voto individual na fonte.
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-camara-primary" />
              </div>
            ) : demaisFiltradas.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhuma votação neste ano.</p>
            ) : (
              <div className="space-y-2">
                {demaisFiltradas.map((d) => (
                  <div key={d.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-gray-900">{d.titulo}</span>
                      <Badge className={d.resultado === 'APROVADA' || d.resultado === 'APROVADO'
                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                        : 'bg-red-100 text-red-800 hover:bg-red-100'
                      }>
                        {d.resultado}
                      </Badge>
                      {d.data && (
                        <span className="text-sm text-gray-500">
                          {new Date(d.data).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                    {d.ementa && (
                      <p className="text-sm text-gray-500 truncate max-w-3xl">{d.ementa}</p>
                    )}
                    {d.autor && (
                      <p className="text-xs text-gray-400 mt-1">Autor: {d.autor}</p>
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
