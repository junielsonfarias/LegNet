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
  const [todas, setTodas] = useState<Presenca[]>([])
  const [loading, setLoading] = useState(true)
  const [ano, setAno] = useState('')

  useEffect(() => {
    setLoading(true)
    // /api/dados-abertos/presencas devolve { dados } com 1 registro por presença
    // (campos `presente:boolean`, `sessao:{numero,tipo,data}`). Normaliza para o
    // shape da tela e busca tudo (cap 5000) p/ derivar os anos com dados.
    fetch('/api/dados-abertos/presencas?limit=5000')
      .then((res) => res.json())
      .then((json) => {
        const raw = json.dados ?? json.data ?? (Array.isArray(json) ? json : [])
        const norm: Presenca[] = raw.map((p: {
          id: string
          presente?: boolean
          justificativa?: string | null
          parlamentar?: { nome?: string }
          sessao?: { numero?: number; tipo?: string; data?: string }
        }) => ({
          id: p.id,
          parlamentarNome: p.parlamentar?.nome,
          sessao: p.sessao
            ? { titulo: `Sessão nº ${p.sessao.numero ?? '—'}`, dataInicio: p.sessao.data ?? '', tipo: p.sessao.tipo }
            : undefined,
          status: p.presente ? 'PRESENTE' : (p.justificativa ? 'AUSENTE_JUSTIFICADO' : 'AUSENTE'),
        }))
        setTodas(norm)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const anoDe = (p: Presenca) => (p.sessao?.dataInicio ? new Date(p.sessao.dataInicio).getFullYear() : undefined)
  const anos = Array.from(new Set(todas.map(anoDe).filter((a): a is number => !!a)))
    .sort((a, b) => b - a)
    .map(String)

  useEffect(() => {
    if (!ano && anos.length > 0) setAno(anos[0])
  }, [anos, ano])

  const presencas = ano ? todas.filter((p) => String(anoDe(p)) === ano) : todas

  // Agrupar por sessao (chave = título + data, para não fundir sessões de anos diferentes)
  const sessoes = new Map<string, { titulo: string; data: string; presencas: Presenca[] }>()
  presencas.forEach((p) => {
    const sessaoKey = `${p.sessao?.titulo || 'Sessão'}|${p.sessao?.dataInicio || ''}`
    if (!sessoes.has(sessaoKey)) {
      sessoes.set(sessaoKey, {
        titulo: p.sessao?.titulo || 'Sessão',
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
