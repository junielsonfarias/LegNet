'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Banknote, ArrowLeft, Search } from 'lucide-react'

export interface RestoPagarPublico {
  id: string
  ano: number
  credor: string
  cnpjCpf: string | null
  numeroEmpenho: string | null
  tipo: string
  valorInscrito: number
  valorPago: number
  valorCancelado: number
}

const tipoLabels: Record<string, string> = {
  PROCESSADO: 'Processado',
  NAO_PROCESSADO: 'Nao Processado',
}

const formatBRL = (v: number) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function RestosPagarCliente({ data }: { data: RestoPagarPublico[] }) {
  const [filtroAno, setFiltroAno] = useState('all')
  const [busca, setBusca] = useState('')

  const anos = useMemo(
    () => Array.from(new Set(data.map((r) => r.ano))).sort((a, b) => b - a),
    [data]
  )

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return data.filter((r) => {
      const matchAno = filtroAno === 'all' || String(r.ano) === filtroAno
      const matchBusca =
        !termo ||
        r.credor.toLowerCase().includes(termo) ||
        (r.numeroEmpenho || '').toLowerCase().includes(termo)
      return matchAno && matchBusca
    })
  }, [data, filtroAno, busca])

  const totais = useMemo(() => {
    return filtrados.reduce(
      (acc, r) => {
        acc.inscrito += r.valorInscrito
        acc.pago += r.valorPago
        acc.cancelado += r.valorCancelado
        return acc
      },
      { inscrito: 0, pago: 0, cancelado: 0 }
    )
  }, [filtrados])

  const saldoTotal = totais.inscrito - totais.pago - totais.cancelado

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
            <Banknote className="h-8 w-8 text-primary" />
            Restos a Pagar
          </h1>
          <p className="text-muted-foreground">
            Despesas empenhadas e nao pagas dentro do exercicio, inscritas em
            restos a pagar. O CPF de credores pessoa fisica e exibido de forma
            mascarada (LGPD).
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
                <label className="text-sm font-medium mb-2 block">Buscar</label>
                <input
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="Credor ou numero do empenho..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Ano</label>
                <select
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={filtroAno}
                  onChange={(e) => setFiltroAno(e.target.value)}
                >
                  <option value="all">Todos os anos</option>
                  {anos.map((a) => (
                    <option key={a} value={String(a)}>{a}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {filtrados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Banknote className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum resto a pagar encontrado.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Ano</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Credor</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">CNPJ/CPF</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Empenho</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Tipo</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Inscrito</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Pago</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((r) => (
                      <tr key={r.id} className="border-t hover:bg-gray-50/50">
                        <td className="px-4 py-3">{r.ano}</td>
                        <td className="px-4 py-3 font-medium">{r.credor}</td>
                        <td className="px-4 py-3">{r.cnpjCpf || '-'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.numeroEmpenho || '-'}</td>
                        <td className="px-4 py-3">{tipoLabels[r.tipo] || r.tipo}</td>
                        <td className="px-4 py-3 text-right">{formatBRL(r.valorInscrito)}</td>
                        <td className="px-4 py-3 text-right">{formatBRL(r.valorPago)}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatBRL(r.valorInscrito - r.valorPago - r.valorCancelado)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 bg-gray-50 font-semibold">
                      <td className="px-4 py-3" colSpan={5}>Total ({filtrados.length})</td>
                      <td className="px-4 py-3 text-right">{formatBRL(totais.inscrito)}</td>
                      <td className="px-4 py-3 text-right">{formatBRL(totais.pago)}</td>
                      <td className="px-4 py-3 text-right">{formatBRL(saldoTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
