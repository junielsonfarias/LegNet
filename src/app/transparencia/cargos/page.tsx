'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Briefcase, ArrowLeft, Loader2, Search } from 'lucide-react'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

interface Cargo {
  id: string
  denominacao: string
  tipo: string
  quantidadeVagas: number | null
  cargaHoraria: number | null
  salarioBase: number
  planoCargos: { id: string; nome: string; ano: number } | null
}

const tipoLabels: Record<string, string> = {
  EFETIVO: 'Efetivo',
  COMISSIONADO: 'Comissionado',
  FUNCAO_GRATIFICADA: 'Funcao Gratificada',
  ELETIVO: 'Eletivo'
}

const formatBRL = (v: number) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function CargosPublicPage() {
  return (
    <TransparenciaPageWrapper slug="cargos" nome="Relacao de Cargos">
      <CargosContent />
    </TransparenciaPageWrapper>
  )
}

function CargosContent() {
  const [data, setData] = useState<Cargo[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('all')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const r = await fetch('/api/cargos?limit=500')
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

  const tipos = useMemo(() => Array.from(new Set(data.map(c => c.tipo))), [data])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return data.filter(c => {
      const matchTipo = filtroTipo === 'all' || c.tipo === filtroTipo
      const matchBusca = !termo || c.denominacao.toLowerCase().includes(termo)
      return matchTipo && matchBusca
    })
  }, [data, filtroTipo, busca])

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
            <Briefcase className="h-8 w-8 text-primary" />
            Relacao de Cargos e Remuneracao
          </h1>
          <p className="text-muted-foreground">
            Cargos da Camara Municipal com a respectiva remuneracao base, conforme
            o Plano de Cargos vigente.
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
                <label className="text-sm font-medium mb-2 block">Buscar cargo</label>
                <input
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="Denominacao do cargo..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo</label>
                <select
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={filtroTipo}
                  onChange={e => setFiltroTipo(e.target.value)}
                >
                  <option value="all">Todos os tipos</option>
                  {tipos.map(t => (
                    <option key={t} value={t}>{tipoLabels[t] || t}</option>
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
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum cargo encontrado.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Cargo</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Tipo</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Plano</th>
                      <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Vagas</th>
                      <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Carga Horaria</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Salario Base</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map(c => (
                      <tr key={c.id} className="border-t hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium">{c.denominacao}</td>
                        <td className="px-4 py-3">{tipoLabels[c.tipo] || c.tipo}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {c.planoCargos?.nome || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">{c.quantidadeVagas ?? '-'}</td>
                        <td className="px-4 py-3 text-center">
                          {c.cargaHoraria ? `${c.cargaHoraria}h` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatBRL(c.salarioBase)}
                        </td>
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
