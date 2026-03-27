'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from '@/components/ui/table'
import { ClipboardCheck, Loader2 } from 'lucide-react'

interface Presenca {
  id: string
  parlamentarId: string
  parlamentarNome?: string
  parlamentar?: { nome: string }
  sessaoId: string
  sessao?: { titulo: string; dataInicio: string }
  sessaoTitulo?: string
  sessaoData?: string
  status: string
}

interface Parlamentar {
  id: string
  nome: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  PRESENTE: { label: 'Presente', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  AUSENTE: { label: 'Ausente', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
  JUSTIFICADO: { label: 'Justificado', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
  AUSENTE_JUSTIFICADO: { label: 'Justificado', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
}

export default function PresencasPage() {
  const [presencas, setPresencas] = useState<Presenca[]>([])
  const [parlamentares, setParlamentares] = useState<Parlamentar[]>([])
  const [loading, setLoading] = useState(true)
  const [ano, setAno] = useState(new Date().getFullYear().toString())
  const [parlamentarId, setParlamentarId] = useState('todos')

  useEffect(() => {
    fetch('/api/dados-abertos/parlamentares')
      .then((res) => res.json())
      .then((json) => {
        const data = json.success ? json.data : (Array.isArray(json) ? json : [])
        setParlamentares(data)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ ano })
    if (parlamentarId !== 'todos') params.set('parlamentarId', parlamentarId)

    fetch(`/api/dados-abertos/presencas?${params}`)
      .then((res) => res.json())
      .then((json) => {
        const data = json.success ? json.data : (Array.isArray(json) ? json : [])
        setPresencas(data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [ano, parlamentarId])

  const currentYear = new Date().getFullYear()
  const anos = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString())

  // Resumo por parlamentar
  const resumo = new Map<string, { presente: number; ausente: number; justificado: number; total: number }>()
  presencas.forEach((p) => {
    const nome = p.parlamentar?.nome || p.parlamentarNome || p.parlamentarId
    if (!resumo.has(nome)) resumo.set(nome, { presente: 0, ausente: 0, justificado: 0, total: 0 })
    const r = resumo.get(nome)!
    r.total++
    if (p.status === 'PRESENTE') r.presente++
    else if (p.status === 'AUSENTE') r.ausente++
    else r.justificado++
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Presenca em Sessoes</h1>
          <p className="text-gray-600">Registro de presenca dos parlamentares</p>
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
              <Select value={parlamentarId} onValueChange={setParlamentarId}>
                <SelectTrigger className="w-full md:w-56">
                  <SelectValue placeholder="Parlamentar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {parlamentares.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {resumo.size > 0 && parlamentarId === 'todos' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Resumo por Parlamentar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parlamentar</TableHead>
                      <TableHead className="text-center">Presente</TableHead>
                      <TableHead className="text-center">Ausente</TableHead>
                      <TableHead className="text-center">Justificado</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from(resumo.entries()).map(([nome, r]) => (
                      <TableRow key={nome}>
                        <TableCell className="font-medium">{nome}</TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{r.presente}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{r.ausente}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{r.justificado}</Badge>
                        </TableCell>
                        <TableCell className="text-center">{r.total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Registros de Presenca ({presencas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-camara-primary" />
              </div>
            ) : presencas.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhum registro de presenca encontrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parlamentar</TableHead>
                      <TableHead>Sessao</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {presencas.map((p) => {
                      const cfg = statusConfig[p.status] || statusConfig.AUSENTE
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">
                            {p.parlamentar?.nome || p.parlamentarNome || '-'}
                          </TableCell>
                          <TableCell>{p.sessao?.titulo || p.sessaoTitulo || '-'}</TableCell>
                          <TableCell>
                            {p.sessao?.dataInicio
                              ? new Date(p.sessao.dataInicio).toLocaleDateString('pt-BR')
                              : p.sessaoData
                              ? new Date(p.sessaoData).toLocaleDateString('pt-BR')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge className={cfg.className}>{cfg.label}</Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
