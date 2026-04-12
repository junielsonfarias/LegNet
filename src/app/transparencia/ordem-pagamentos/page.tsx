'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, Loader2, Search } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

interface Ordem {
  id: string
  numero: string
  ano: number
  mes: number
  data: string
  credor: string
  cnpjCpf: string
  valor: string | number
  dataVencimento: string | null
  dataPagamento: string | null
  ordemCronologica: number | null
  fonteRecurso: string | null
}

const formatBRL = (v: number | string) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v))
const formatDate = (s: string | null) => (s ? new Date(s).toLocaleDateString('pt-BR') : '-')

export default function OrdemPagamentosPage() {
  const [data, setData] = useState<Ordem[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    fetch('/api/ordem-pagamentos?limit=200')
      .then(r => r.json())
      .then(j => setData(j?.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  const filtradas = busca
    ? data.filter(o =>
        o.credor.toLowerCase().includes(busca.toLowerCase()) ||
        o.numero.includes(busca) ||
        o.cnpjCpf.includes(busca)
      )
    : data

  return (
    <TransparenciaPageWrapper slug="ordem-pagamentos" nome="Ordem Cronologica de Pagamentos">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Link href="/transparencia" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Portal da Transparencia
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Ordem Cronologica de Pagamentos</h1>
            <p className="text-sm text-muted-foreground">Fila de pagamentos a fornecedores (LRF / Lei 8.666 art. 5)</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por credor, numero ou CNPJ..."
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
              <p className="text-center py-12 text-muted-foreground">Nenhuma ordem cadastrada.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-3 py-2">Ordem</th>
                      <th className="px-3 py-2">Numero</th>
                      <th className="px-3 py-2">Credor</th>
                      <th className="px-3 py-2">Vencimento</th>
                      <th className="px-3 py-2">Pagamento</th>
                      <th className="px-3 py-2 text-right">Valor</th>
                      <th className="px-3 py-2">Fonte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtradas.map(o => (
                      <tr key={o.id} className="border-t">
                        <td className="px-3 py-2 font-bold">{o.ordemCronologica ?? '-'}</td>
                        <td className="px-3 py-2 font-mono text-xs">{o.numero}</td>
                        <td className="px-3 py-2">{o.credor}</td>
                        <td className="px-3 py-2">{formatDate(o.dataVencimento)}</td>
                        <td className="px-3 py-2">{formatDate(o.dataPagamento)}</td>
                        <td className="px-3 py-2 text-right">{formatBRL(o.valor)}</td>
                        <td className="px-3 py-2 text-xs">{o.fonteRecurso || '-'}</td>
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
