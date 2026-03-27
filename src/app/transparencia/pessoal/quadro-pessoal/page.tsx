'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from '@/components/ui/table'
import { Users, Search, Loader2 } from 'lucide-react'

interface Servidor {
  id: string
  nome: string
  cargo: string
  funcao: string | null
  unidade: string | null
  lotacao: string | null
  vinculo: string
  situacao: string
  cargaHoraria: number | null
  dataAdmissao: string
}

const vinculoLabels: Record<string, string> = {
  EFETIVO: 'Efetivo',
  COMISSIONADO: 'Comissionado',
  TEMPORARIO: 'Temporario',
  ESTAGIARIO: 'Estagiario',
  TERCEIRIZADO: 'Terceirizado',
}

export default function QuadroPessoalPage() {
  const [servidores, setServidores] = useState<Servidor[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [vinculo, setVinculo] = useState('todos')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (busca) params.set('busca', busca)
    if (vinculo !== 'todos') params.set('vinculo', vinculo)

    const timer = setTimeout(() => {
      fetch(`/api/publico/servidores?${params}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success) setServidores(json.data)
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }, 300)

    return () => clearTimeout(timer)
  }, [busca, vinculo])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quadro de Pessoal</h1>
          <p className="text-gray-600">Servidores da Camara Municipal</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, cargo ou lotacao..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={vinculo} onValueChange={setVinculo}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Tipo de Vinculo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="EFETIVO">Efetivo</SelectItem>
                  <SelectItem value="COMISSIONADO">Comissionado</SelectItem>
                  <SelectItem value="TEMPORARIO">Temporario</SelectItem>
                  <SelectItem value="ESTAGIARIO">Estagiario</SelectItem>
                  <SelectItem value="TERCEIRIZADO">Terceirizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Servidores ({servidores.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-camara-primary" />
              </div>
            ) : servidores.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhum servidor encontrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Lotacao</TableHead>
                      <TableHead>Vinculo</TableHead>
                      <TableHead>Situacao</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servidores.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.nome}</TableCell>
                        <TableCell>{s.cargo}{s.funcao ? ` / ${s.funcao}` : ''}</TableCell>
                        <TableCell>{s.lotacao || s.unidade || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{vinculoLabels[s.vinculo] || s.vinculo}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={s.situacao === 'ATIVO' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-gray-100 text-gray-800 hover:bg-gray-100'}>
                            {s.situacao}
                          </Badge>
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
