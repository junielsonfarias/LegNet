'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Receipt, Loader2, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

interface NotaFiscal {
  id: string
  numero: string
  serie: string | null
  fornecedor: string
  cnpjCpf: string
  dataEmissao: string
  dataLiquidacao: string | null
  dataPagamento: string | null
  valor: string | number
  situacao: string
  ano: number
  mes: number
}

const formatBRL = (v: number | string) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v))

const formatDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('pt-BR') : '-'

export default function NotasFiscaisPage() {
  const [data, setData] = useState<NotaFiscal[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    fetch('/api/notas-fiscais?limit=100')
      .then(r => r.json())
      .then(j => setData(j?.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  const filtradas = busca
    ? data.filter(n =>
        n.fornecedor.toLowerCase().includes(busca.toLowerCase()) ||
        n.numero.includes(busca) ||
        n.cnpjCpf.includes(busca)
      )
    : data

  return (
    <TransparenciaPageWrapper slug="notas-fiscais" nome="Notas Fiscais Liquidadas">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Link href="/transparencia" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Portal da Transparencia
        </Link>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Notas Fiscais Liquidadas</h1>
            <p className="text-sm text-muted-foreground">Documentos fiscais emitidos por fornecedores</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por fornecedor, numero ou CNPJ..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtradas.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">Nenhuma nota fiscal encontrada.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-3 py-2">Numero</th>
                      <th className="px-3 py-2">Fornecedor</th>
                      <th className="px-3 py-2">CNPJ/CPF</th>
                      <th className="px-3 py-2">Emissao</th>
                      <th className="px-3 py-2">Liquidacao</th>
                      <th className="px-3 py-2 text-right">Valor</th>
                      <th className="px-3 py-2">Situacao</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtradas.map(n => (
                      <tr key={n.id} className="border-t">
                        <td className="px-3 py-2 font-mono text-xs">{n.numero}{n.serie ? `-${n.serie}` : ''}</td>
                        <td className="px-3 py-2">{n.fornecedor}</td>
                        <td className="px-3 py-2 font-mono text-xs">{n.cnpjCpf}</td>
                        <td className="px-3 py-2">{formatDate(n.dataEmissao)}</td>
                        <td className="px-3 py-2">{formatDate(n.dataLiquidacao)}</td>
                        <td className="px-3 py-2 text-right">{formatBRL(n.valor)}</td>
                        <td className="px-3 py-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{n.situacao}</span>
                        </td>
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
