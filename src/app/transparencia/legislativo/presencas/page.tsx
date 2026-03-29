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
  parlamentar?: { nome: string }
  parlamentarNome?: string
  sessao?: { titulo: string; dataInicio: string; tipo?: string }
  sessaoTitulo?: string
  sessaoData?: string
  status: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  PRESENTE: { label: 'Presente', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  AUSENTE: { label: 'Ausente', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
  JUSTIFICADO: { label: 'Justificado', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
  AUSENTE_JUSTIFICADO: { label: 'Justificado', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
}

export default function PresencasLegislativoPage() {
  const [presencas, setPresencas] = useState<Presenca[]>([])
  const [loading, setLoading] = useState(true)
  const [ano, setAno] = useState('2026')
  const [currentYear, setCurrentYear] = useState(2026)

  useEffect(() => {
    const year = new Date().getFullYear()
    setCurrentYear(year)
    setAno(year.toString())
  }, [])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/dados-abertos/presencas?ano=${ano}`)
      .then((res) => res.json())
      .then((json) => {
        const data = json.success ? json.data : (Array.isArray(json) ? json : [])
        setPresencas(data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [ano])
  const anos = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString())

  // Agrupar por sessao
  const sessoes = new Map<string, { titulo: string; data: string; presencas: Presenca[] }>()
  presencas.forEach((p) => {
    const sessaoKey = p.sessao?.titulo || p.sessaoTitulo || 'Sessao'
    if (!sessoes.has(sessaoKey)) {
      sessoes.set(sessaoKey, {
        titulo: sessaoKey,
        data: p.sessao?.dataInicio || p.sessaoData || '',
        presencas: [],
      })
    }
    sessoes.get(sessaoKey)!.presencas.push(p)
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Presenca em Sessoes</h1>
          <p className="text-gray-600">Registro de presenca organizado por sessao legislativa</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
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
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-camara-primary" />
          </div>
        ) : sessoes.size === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ClipboardCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum registro de presenca encontrado.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Array.from(sessoes.values()).map((sessao, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-base">{sessao.titulo}</span>
                    {sessao.data && (
                      <Badge variant="outline">
                        {new Date(sessao.data).toLocaleDateString('pt-BR')}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parlamentar</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessao.presencas.map((p) => {
                        const cfg = statusConfig[p.status] || statusConfig.AUSENTE
                        return (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">
                              {p.parlamentar?.nome || p.parlamentarNome || '-'}
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
