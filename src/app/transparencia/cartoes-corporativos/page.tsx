'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CreditCard, Loader2, Search } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

interface Lancamento {
  id: string
  portador: string
  estabelecimento: string
  dataCompra: string
  valor: number | string
  descricao: string
  numeroFatura: string | null
}

export default function CartoesCorporativosPage() {
  const [data, setData] = useState<Lancamento[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    fetch('/api/cartoes-corporativos?limit=200')
      .then(r => r.json())
      .then(j => setData(j?.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  const filtrados = busca
    ? data.filter(l =>
        l.portador.toLowerCase().includes(busca.toLowerCase()) ||
        l.estabelecimento.toLowerCase().includes(busca.toLowerCase())
      )
    : data

  return (
    <TransparenciaPageWrapper slug="cartao-credito" nome="Gastos com Cartao de Credito">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Link href="/transparencia" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Portal da Transparencia
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-100 text-blue-600"><CreditCard className="h-6 w-6" /></div>
          <div>
            <h1 className="text-2xl font-bold">Gastos com Cartao de Credito Corporativo</h1>
            <p className="text-sm text-muted-foreground">Lancamentos de cartao corporativo</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por portador ou estabelecimento..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filtrados.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">Nenhum lancamento cadastrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-3 py-2">Data</th>
                      <th className="px-3 py-2">Portador</th>
                      <th className="px-3 py-2">Estabelecimento</th>
                      <th className="px-3 py-2">Descricao</th>
                      <th className="px-3 py-2 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map(l => (
                      <tr key={l.id} className="border-t">
                        <td className="px-3 py-2">{new Date(l.dataCompra).toLocaleDateString('pt-BR')}</td>
                        <td className="px-3 py-2">{l.portador}</td>
                        <td className="px-3 py-2">{l.estabelecimento}</td>
                        <td className="px-3 py-2 text-xs">{l.descricao}</td>
                        <td className="px-3 py-2 text-right">{Number(l.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TransparenciaPageWrapper>
  )
}
