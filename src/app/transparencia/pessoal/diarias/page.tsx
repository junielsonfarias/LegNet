'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from '@/components/ui/table'
import { Plane, Loader2 } from 'lucide-react'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

interface Diaria {
  id: string
  nome: string
  cargo: string
  destino: string
  motivo: string
  dataInicio: string
  dataFim: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
  mes: number
  ano: number
}

const meses = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export default function DiariasPage() {
  return (
    <TransparenciaPageWrapper slug="diarias" nome="Diarias">
      <DiariasPageContent />
    </TransparenciaPageWrapper>
  )
}

function DiariasPageContent() {
  const [diarias, setDiarias] = useState<Diaria[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [ano, setAno] = useState('2026')
  const [mes, setMes] = useState('todos')
  const [currentYear, setCurrentYear] = useState(2026)

  useEffect(() => {
    const year = new Date().getFullYear()
    setCurrentYear(year)
    setAno(year.toString())
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ ano })
    if (mes !== 'todos') params.set('mes', mes)

    fetch(`/api/diarias?${params}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setDiarias(json.data)
          setTotal(json.total)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [ano, mes])
  const anos = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString())

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Diarias e Passagens</h1>
          <p className="text-gray-600">Valores concedidos a servidores e parlamentares</p>
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Diarias ({diarias.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-camara-primary" />
              </div>
            ) : diarias.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhuma diaria encontrada para o periodo selecionado.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Destino</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Periodo</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {diarias.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium">{d.nome}</TableCell>
                          <TableCell>{d.cargo}</TableCell>
                          <TableCell>{d.destino}</TableCell>
                          <TableCell className="max-w-xs truncate">{d.motivo}</TableCell>
                          <TableCell>
                            {new Date(d.dataInicio).toLocaleDateString('pt-BR')} a{' '}
                            {new Date(d.dataFim).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right">{d.quantidade}</TableCell>
                          <TableCell className="text-right font-medium">
                            {Number(d.valorTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Total do Periodo</span>
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
