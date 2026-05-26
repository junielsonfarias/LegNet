'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  CheckCircle2, ArrowLeft, Loader2, AlertCircle, Send, BarChart3,
} from 'lucide-react'
import { toast } from 'sonner'

type Tipo = 'ESCALA_1_5' | 'SIM_NAO' | 'TEXTO' | 'MULTIPLA_ESCOLHA'

interface Pergunta {
  id: string
  label: string
  tipo: Tipo
  obrigatoria?: boolean
  opcoes?: string[]
}

interface Pesquisa {
  id: string
  titulo: string
  descricao: string | null
  periodoInicio: string
  periodoFim: string | null
  ativa: boolean
  publicaResultados: boolean
  totalRespostas: number
  perguntas: Pergunta[]
}

export default function ResponderPesquisaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [pesquisa, setPesquisa] = useState<Pesquisa | null>(null)
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [enviada, setEnviada] = useState(false)
  const [respostas, setRespostas] = useState<Record<string, string | number>>({})

  useEffect(() => {
    fetch(`/api/pesquisas-satisfacao/${id}`)
      .then((r) => r.json())
      .then((j) => setPesquisa(j?.data || null))
      .catch(() => setPesquisa(null))
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pesquisa) return

    // valida obrigatorias
    for (const p of pesquisa.perguntas) {
      if (p.obrigatoria) {
        const v = respostas[p.id]
        if (v === undefined || v === '' || v === null) {
          toast.error(`Responda: ${p.label}`)
          return
        }
      }
    }

    setEnviando(true)
    try {
      const r = await fetch(`/api/pesquisas-satisfacao/${id}/respostas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respostas }),
      })
      if (r.ok) {
        setEnviada(true)
        toast.success('Resposta registrada. Obrigado!')
      } else {
        const j = await r.json().catch(() => ({}))
        toast.error(j?.message || j?.error || 'Erro ao enviar resposta')
      }
    } finally {
      setEnviando(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!pesquisa) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Pesquisa nao encontrada.</p>
        <Link href="/transparencia/pesquisas-satisfacao" className="text-camara-primary hover:underline mt-4 inline-block">
          Voltar
        </Link>
      </div>
    )
  }

  const agora = new Date()
  const inicio = new Date(pesquisa.periodoInicio)
  const fim = pesquisa.periodoFim ? new Date(pesquisa.periodoFim) : null
  const aceitando = pesquisa.ativa && inicio <= agora && (!fim || fim >= agora)

  if (enviada) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Resposta registrada!</h1>
              <p className="text-sm text-gray-700 mb-6">
                Sua participacao e fundamental para a melhoria continua dos
                servicos da Camara. Obrigado!
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Link
                  href="/transparencia/pesquisas-satisfacao"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Outras pesquisas
                </Link>
                {pesquisa.publicaResultados && (
                  <Link
                    href={`/transparencia/pesquisas-satisfacao/${pesquisa.id}/resultados`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-camara-primary text-white px-4 py-2 text-sm font-medium hover:opacity-90"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Ver resultados
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link
          href="/transparencia/pesquisas-satisfacao"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar para a lista
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{pesquisa.titulo}</h1>
          {pesquisa.descricao && (
            <p className="text-sm text-muted-foreground">{pesquisa.descricao}</p>
          )}
        </div>

        {!aceitando && (
          <Card className="border-l-4 border-l-amber-500 mb-4">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">
                Esta pesquisa nao esta aceitando novas respostas. Voce ainda pode
                consultar os resultados publicados.
              </p>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {pesquisa.perguntas.map((p, idx) => (
            <Card key={p.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {idx + 1}. {p.label}
                  {p.obrigatoria && <span className="text-red-600 ml-1">*</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {p.tipo === 'ESCALA_1_5' && (
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        type="button"
                        key={n}
                        onClick={() => setRespostas({ ...respostas, [p.id]: n })}
                        disabled={!aceitando}
                        className={`h-10 w-10 rounded-lg border text-sm font-semibold ${
                          respostas[p.id] === n
                            ? 'bg-camara-primary text-white border-camara-primary'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        } disabled:opacity-50`}
                      >
                        {n}
                      </button>
                    ))}
                    <div className="ml-2 text-xs text-muted-foreground self-center">
                      1 = pior &middot; 5 = excelente
                    </div>
                  </div>
                )}
                {p.tipo === 'SIM_NAO' && (
                  <div className="flex gap-2">
                    {['SIM', 'NAO'].map((v) => (
                      <button
                        type="button"
                        key={v}
                        onClick={() => setRespostas({ ...respostas, [p.id]: v })}
                        disabled={!aceitando}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium ${
                          respostas[p.id] === v
                            ? 'bg-camara-primary text-white border-camara-primary'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        } disabled:opacity-50`}
                      >
                        {v === 'SIM' ? 'Sim' : 'Nao'}
                      </button>
                    ))}
                  </div>
                )}
                {p.tipo === 'MULTIPLA_ESCOLHA' && p.opcoes && (
                  <div className="space-y-2">
                    {p.opcoes.map((opt) => (
                      <Label
                        key={opt}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={p.id}
                          value={opt}
                          checked={respostas[p.id] === opt}
                          onChange={() => setRespostas({ ...respostas, [p.id]: opt })}
                          disabled={!aceitando}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">{opt}</span>
                      </Label>
                    ))}
                  </div>
                )}
                {p.tipo === 'TEXTO' && (
                  <Textarea
                    value={(respostas[p.id] as string) ?? ''}
                    onChange={(e) => setRespostas({ ...respostas, [p.id]: e.target.value })}
                    disabled={!aceitando}
                    placeholder="Digite sua resposta..."
                    rows={3}
                  />
                )}
              </CardContent>
            </Card>
          ))}

          {aceitando && (
            <div className="flex justify-end">
              <Button type="submit" disabled={enviando} size="lg">
                {enviando ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Send className="h-4 w-4 mr-1" />
                )}
                Enviar resposta
              </Button>
            </div>
          )}
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Suas respostas sao anonimas e usadas apenas para fins estatisticos
          (LGPD - Lei nº 13.709/2018).
        </p>
      </div>
    </div>
  )
}
