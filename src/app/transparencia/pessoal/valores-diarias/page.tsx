'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plane, ArrowLeft, Loader2, Search } from 'lucide-react'

interface ValorDiaria {
  id: string
  categoria: string
  abrangencia: string
  descricao: string | null
  valor: number
  ano: number
  ativo: boolean
}

const formatBRL = (v: number) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function ValoresDiariasPublicPage() {
  const [data, setData] = useState<ValorDiaria[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroAno, setFiltroAno] = useState('all')
  const [filtroAbrangencia, setFiltroAbrangencia] = useState('all')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const r = await fetch('/api/valores-diaria?limit=500')
        const j = await r.json()
        setData(j?.data || [])
      } catch {
        setData([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const anos = useMemo(
    () => Array.from(new Set(data.map(v => v.ano))).sort((a, b) => b - a),
    [data]
  )
  const abrangencias = useMemo(
    () => Array.from(new Set(data.map(v => v.abrangencia))),
    [data]
  )

  const filtrados = useMemo(() => {
    return data.filter(v => {
      const matchAno = filtroAno === 'all' || String(v.ano) === filtroAno
      const matchAbr = filtroAbrangencia === 'all' || v.abrangencia === filtroAbrangencia
      return matchAno && matchAbr
    })
  }, [data, filtroAno, filtroAbrangencia])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/transparencia"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar ao Portal da Transparencia
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Plane className="h-8 w-8 text-primary" />
            Tabela de Valores das Diarias
          </h1>
          <p className="text-muted-foreground">
            Valores de diaria por categoria e abrangencia, utilizados como referencia
            para a concessao de diarias.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Ano</label>
                <select
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={filtroAno}
                  onChange={e => setFiltroAno(e.target.value)}
                >
                  <option value="all">Todos os anos</option>
                  {anos.map(a => (
                    <option key={a} value={String(a)}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Abrangencia</label>
                <select
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={filtroAbrangencia}
                  onChange={e => setFiltroAbrangencia(e.target.value)}
                >
                  <option value="all">Todas as abrangencias</option>
                  {abrangencias.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtrados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Plane className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum valor de diaria cadastrado.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Categoria</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Abrangencia</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Descricao</th>
                      <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Ano</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Valor da Diaria</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map(v => (
                      <tr key={v.id} className="border-t hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium">{v.categoria}</td>
                        <td className="px-4 py-3">{v.abrangencia}</td>
                        <td className="px-4 py-3 text-muted-foreground">{v.descricao || '-'}</td>
                        <td className="px-4 py-3 text-center">{v.ano}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatBRL(v.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
