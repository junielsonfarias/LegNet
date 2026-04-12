'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, HardHat, Loader2, Search } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

interface Obra {
  id: string
  descricao: string
  endereco: string | null
  bairro: string | null
  valorEstimado: string | number | null
  valorContratado: string | number | null
  valorExecutado: string | number | null
  dataInicio: string | null
  dataPrevistaFim: string | null
  dataConclusao: string | null
  percentualExecucao: number | null
  situacao: string
  motivoParalisacao: string | null
}

const formatBRL = (v: number | string | null) =>
  v == null ? '-' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v))
const formatDate = (s: string | null) => (s ? new Date(s).toLocaleDateString('pt-BR') : '-')

const SITUACAO_LABELS: Record<string, string> = {
  PLANEJADA: 'Planejada',
  EM_ANDAMENTO: 'Em andamento',
  PARALISADA: 'Paralisada',
  CONCLUIDA: 'Concluida',
  CANCELADA: 'Cancelada'
}

export default function ObrasPage() {
  const searchParams = useSearchParams()
  const situacaoFiltro = searchParams?.get('situacao') || ''

  const [data, setData] = useState<Obra[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    const url = situacaoFiltro
      ? `/api/obras?limit=100&situacao=${situacaoFiltro}`
      : '/api/obras?limit=100'
    fetch(url)
      .then(r => r.json())
      .then(j => setData(j?.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [situacaoFiltro])

  const filtradas = busca
    ? data.filter(o => o.descricao.toLowerCase().includes(busca.toLowerCase()))
    : data

  const titulo = situacaoFiltro === 'PARALISADA' ? 'Obras Paralisadas' : 'Obras Publicas'

  return (
    <TransparenciaPageWrapper slug="obras" nome={titulo}>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Link href="/transparencia" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Portal da Transparencia
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
            <HardHat className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{titulo}</h1>
            <p className="text-sm text-muted-foreground">
              {situacaoFiltro === 'PARALISADA'
                ? 'Obras cuja execucao foi interrompida'
                : 'Obras planejadas, em andamento e concluidas'}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar obra..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtradas.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">Nenhuma obra cadastrada.</p>
            ) : (
              <div className="space-y-3">
                {filtradas.map(o => (
                  <div key={o.id} className="bg-white border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold">{o.descricao}</h3>
                        {o.endereco && (
                          <p className="text-sm text-muted-foreground">
                            {o.endereco}{o.bairro ? `, ${o.bairro}` : ''}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        o.situacao === 'PARALISADA'
                          ? 'bg-red-100 text-red-700'
                          : o.situacao === 'CONCLUIDA'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {SITUACAO_LABELS[o.situacao] || o.situacao}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground mt-3">
                      <div><span className="block">Estimado</span><span className="text-foreground font-medium">{formatBRL(o.valorEstimado)}</span></div>
                      <div><span className="block">Contratado</span><span className="text-foreground font-medium">{formatBRL(o.valorContratado)}</span></div>
                      <div><span className="block">Executado</span><span className="text-foreground font-medium">{formatBRL(o.valorExecutado)}</span></div>
                      <div><span className="block">Inicio / Previsao</span><span className="text-foreground font-medium">{formatDate(o.dataInicio)} / {formatDate(o.dataPrevistaFim)}</span></div>
                    </div>
                    {o.percentualExecucao != null && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Execucao</span>
                          <span className="font-medium">{o.percentualExecucao}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${o.percentualExecucao}%` }} />
                        </div>
                      </div>
                    )}
                    {o.motivoParalisacao && (
                      <p className="mt-3 text-xs bg-red-50 text-red-800 p-2 rounded">
                        <strong>Motivo:</strong> {o.motivoParalisacao}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TransparenciaPageWrapper>
  )
}
