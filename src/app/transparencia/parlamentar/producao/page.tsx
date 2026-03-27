'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from '@/components/ui/table'
import { FileText, Loader2, Search } from 'lucide-react'

interface Proposicao {
  id: string
  tipo: string
  numero: number
  ano: number
  ementa: string
  status: string
  autor?: { nome: string } | null
  autorNome?: string
  dataApresentacao?: string
}

interface Parlamentar {
  id: string
  nome: string
}

export default function ProducaoPage() {
  const [proposicoes, setProposicoes] = useState<Proposicao[]>([])
  const [parlamentares, setParlamentares] = useState<Parlamentar[]>([])
  const [loading, setLoading] = useState(true)
  const [autorId, setAutorId] = useState('todos')
  const [busca, setBusca] = useState('')

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
    const params = new URLSearchParams()
    if (autorId !== 'todos') params.set('autorId', autorId)

    fetch(`/api/dados-abertos/proposicoes?${params}`)
      .then((res) => res.json())
      .then((json) => {
        const data = json.success ? json.data : (Array.isArray(json) ? json : [])
        setProposicoes(data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [autorId])

  const filtered = busca
    ? proposicoes.filter((p) =>
        p.ementa?.toLowerCase().includes(busca.toLowerCase()) ||
        `${p.tipo} ${p.numero}`.toLowerCase().includes(busca.toLowerCase())
      )
    : proposicoes

  // Contagem por autor
  const contagemPorAutor = new Map<string, number>()
  proposicoes.forEach((p) => {
    const nome = p.autor?.nome || p.autorNome || 'Nao informado'
    contagemPorAutor.set(nome, (contagemPorAutor.get(nome) || 0) + 1)
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Producao Legislativa</h1>
          <p className="text-gray-600">Proposicoes de autoria dos parlamentares</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por ementa ou tipo..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={autorId} onValueChange={setAutorId}>
                <SelectTrigger className="w-full md:w-56">
                  <SelectValue placeholder="Autor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os autores</SelectItem>
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
              <FileText className="h-5 w-5" />
              Proposicoes ({filtered.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-camara-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhuma proposicao encontrada.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Numero</TableHead>
                      <TableHead>Ementa</TableHead>
                      <TableHead>Autor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.tipo}</TableCell>
                        <TableCell>{p.numero}/{p.ano}</TableCell>
                        <TableCell className="max-w-md truncate">{p.ementa}</TableCell>
                        <TableCell>{p.autor?.nome || p.autorNome || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{p.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
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
