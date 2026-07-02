'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Download, Loader2, Calendar } from 'lucide-react'

interface Sessao {
  id: string
  titulo: string
  tipo: string
  dataInicio: string
  ata?: string | null
  ataUrl?: string | null
  status: string
}

export default function AtasPage() {
  const [todas, setTodas] = useState<Sessao[]>([])
  const [loading, setLoading] = useState(true)
  const [ano, setAno] = useState('')

  useEffect(() => {
    setLoading(true)
    // /api/dados-abertos/sessoes usa envelope { dados } e traz `numero/tipo/data/
    // arquivoAta` (sem `titulo`/`dataInicio`/`ataUrl`). Normaliza e busca tudo (271).
    fetch('/api/dados-abertos/sessoes?limit=500')
      .then((res) => res.json())
      .then((json) => {
        const raw = json.dados ?? json.data ?? (Array.isArray(json) ? json : [])
        const norm: Sessao[] = raw.map((s: {
          id: string; numero?: number; tipo: string; data?: string
          ata?: string | null; arquivoAta?: string | null; status: string
        }) => ({
          id: s.id,
          titulo: `Sessão nº ${s.numero ?? '—'}`,
          tipo: s.tipo,
          dataInicio: s.data ?? '',
          ata: null,
          ataUrl: s.arquivoAta ?? null,
          status: s.status,
        }))
        setTodas(norm)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const anoDe = (s: Sessao) => (s.dataInicio ? new Date(s.dataInicio).getFullYear() : undefined)
  const anos = Array.from(new Set(todas.map(anoDe).filter((a): a is number => !!a)))
    .sort((a, b) => b - a)
    .map(String)

  useEffect(() => {
    if (!ano && anos.length > 0) setAno(anos[0])
  }, [anos, ano])

  const sessoes = ano ? todas.filter((s) => String(anoDe(s)) === ano) : todas

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Atas de Sessoes</h1>
          <p className="text-gray-600">Atas das sessoes legislativas da Camara Municipal</p>
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
        ) : sessoes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma ata disponivel para o periodo selecionado.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessoes.map((s) => (
              <Card key={s.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-camara-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-camara-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{s.titulo}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(s.dataInicio).toLocaleDateString('pt-BR')}</span>
                        <Badge variant="outline" className="text-xs">{s.tipo}</Badge>
                      </div>
                    </div>
                  </div>
                  {(s.ata || s.ataUrl) ? (
                    <a href={s.ata || s.ataUrl || '#'} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Baixar Ata
                      </Button>
                    </a>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100">
                      Ata pendente
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
