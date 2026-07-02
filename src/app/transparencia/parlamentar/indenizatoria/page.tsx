'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from '@/components/ui/table'
import { DollarSign, Loader2 } from 'lucide-react'

interface VerbaIndenizatoria {
  id: string
  parlamentarId: string
  nomeParlamentar: string | null
  descricao: string
  tipo: string
  valor: number
  mes: number
  ano: number
}

interface Parlamentar {
  id: string
  nome: string
}

const meses = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export default function IndenizatoriaPage() {
  const [verbas, setVerbas] = useState<VerbaIndenizatoria[]>([])
  const [total, setTotal] = useState(0)
  const [parlamentares, setParlamentares] = useState<Parlamentar[]>([])
  const [loading, setLoading] = useState(true)
  const [ano, setAno] = useState('2026')
  const [mes, setMes] = useState('todos')
  const [parlamentarId, setParlamentarId] = useState('todos')
  const [currentYear, setCurrentYear] = useState(2026)

  useEffect(() => {
    const year = new Date().getFullYear()
    setCurrentYear(year)
    setAno(year.toString())
  }, [])

  useEffect(() => {
    fetch('/api/dados-abertos/parlamentares')
      .then((res) => res.json())
      .then((json) => {
        const data = json.dados ?? json.data ?? (Array.isArray(json) ? json : [])
        setParlamentares(data)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ ano })
    if (mes !== 'todos') params.set('mes', mes)
    if (parlamentarId !== 'todos') params.set('parlamentarId', parlamentarId)

    fetch(`/api/verbas-indenizatorias?${params}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setVerbas(json.data)
          setTotal(json.total)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [ano, mes, parlamentarId])

  const anos = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString())

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verbas Indenizatorias</h1>
          <p className="text-gray-600">Gastos com verbas indenizatorias dos parlamentares</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
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
              <Select value={mes} onValueChange={setMes}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os meses</SelectItem>
                  {meses.map((m, idx) => (
                    <SelectItem key={idx} value={(idx + 1).toString()}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={parlamentarId} onValueChange={setParlamentarId}>
                <SelectTrigger className="w-full md:w-56">
                  <SelectValue placeholder="Parlamentar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os parlamentares</SelectItem>
                  {parlamentares.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Verbas Indenizatorias ({verbas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-camara-primary" />
              </div>
            ) : verbas.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhuma verba indenizatoria encontrada.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parlamentar</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descricao</TableHead>
                        <TableHead>Mes/Ano</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {verbas.map((v) => (
                        <TableRow key={v.id}>
                          <TableCell className="font-medium">{v.nomeParlamentar || '-'}</TableCell>
                          <TableCell className="capitalize">{v.tipo}</TableCell>
                          <TableCell className="max-w-xs truncate">{v.descricao}</TableCell>
                          <TableCell>{String(v.mes).padStart(2, '0')}/{v.ano}</TableCell>
                          <TableCell className="text-right font-medium">
                            {Number(v.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Total</span>
                  <span className="text-xl font-bold text-camara-primary">
                    {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
