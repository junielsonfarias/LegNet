'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Banknote, Loader2, Search } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

interface Repasse {
  id: string
  orgaoOrigem: string
  programa: string | null
  valor: number | string
  data: string
  ano: number
  mes: number
  fonteRecurso: string | null
}

export default function RepassesPage() {
  const [data, setData] = useState<Repasse[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    fetch('/api/repasses?limit=100')
      .then(r => r.json())
      .then(j => setData(j?.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  const filtrados = busca
    ? data.filter(r => r.orgaoOrigem.toLowerCase().includes(busca.toLowerCase()))
    : data

  const total = filtrados.reduce((acc, r) => acc + Number(r.valor), 0)

  return (
    <TransparenciaPageWrapper slug="repasses" nome="Repasses Recebidos">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Link href="/transparencia" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Portal da Transparencia
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-100 text-blue-600"><Banknote className="h-6 w-6" /></div>
          <div>
            <h1 className="text-2xl font-bold">Repasses Recebidos</h1>
            <p className="text-sm text-muted-foreground">Recursos recebidos de outros entes (Uniao, Estado)</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por orgao..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filtrados.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">Nenhum repasse cadastrado.</p>
            ) : (
              <>
                <p className="mb-3 text-sm text-muted-foreground">Total: <strong className="text-foreground">{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left">
                      <tr>
                        <th className="px-3 py-2">Data</th>
                        <th className="px-3 py-2">Orgao de Origem</th>
                        <th className="px-3 py-2">Programa</th>
                        <th className="px-3 py-2">Fonte</th>
                        <th className="px-3 py-2 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtrados.map(r => (
                        <tr key={r.id} className="border-t">
                          <td className="px-3 py-2">{new Date(r.data).toLocaleDateString('pt-BR')}</td>
                          <td className="px-3 py-2">{r.orgaoOrigem}</td>
                          <td className="px-3 py-2 text-xs">{r.programa || '-'}</td>
                          <td className="px-3 py-2 text-xs">{r.fonteRecurso || '-'}</td>
                          <td className="px-3 py-2 text-right">{Number(r.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </TransparenciaPageWrapper>
  )
}
