"use client"

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  BookOpen,
  Search,
  Filter,
  Scale,
  Calendar,
  FileText,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

interface NormaJuridica {
  id: string
  tipo: string
  numero: string
  ano: number
  ementa: string
  situacao: string
  data: string
}

const TIPO_LABELS: Record<string, string> = {
  'LEI_ORDINARIA': 'Lei Ordinaria',
  'LEI_COMPLEMENTAR': 'Lei Complementar',
  'DECRETO_LEGISLATIVO': 'Decreto Legislativo',
  'RESOLUCAO': 'Resolucao',
  'EMENDA_LEI_ORGANICA': 'Emenda a Lei Organica',
  'LEI_ORGANICA': 'Lei Organica',
  'REGIMENTO_INTERNO': 'Regimento Interno'
}

const SITUACAO_LABELS: Record<string, string> = {
  'VIGENTE': 'Vigente',
  'REVOGADA': 'Revogada',
  'REVOGADA_PARCIALMENTE': 'Revogada Parcialmente',
  'COM_ALTERACOES': 'Com Alteracoes',
  'SUSPENSA': 'Suspensa'
}

const SITUACAO_COLORS: Record<string, string> = {
  'VIGENTE': 'bg-green-100 text-green-700',
  'REVOGADA': 'bg-red-100 text-red-700',
  'REVOGADA_PARCIALMENTE': 'bg-orange-100 text-orange-700',
  'COM_ALTERACOES': 'bg-yellow-100 text-yellow-700',
  'SUSPENSA': 'bg-gray-100 text-gray-700'
}

export default function NormasPublicPage() {
  const [normas, setNormas] = useState<NormaJuridica[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string>('all')
  const [filtroAno, setFiltroAno] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const carregarNormas = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '12')
      params.set('situacao', 'VIGENTE') // Por padrao, mostrar apenas vigentes

      if (busca) params.set('busca', busca)
      if (filtroTipo && filtroTipo !== 'all') params.set('tipo', filtroTipo)
      if (filtroAno && filtroAno !== 'all') params.set('ano', filtroAno)

      const response = await fetch(`/api/normas?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setNormas(data.data.normas)
        setTotalPages(data.data.totalPages)
      } else {
        toast.error(data.error || 'Erro ao carregar normas')
      }
    } catch (error) {
      console.error('Erro ao carregar normas:', error)
      toast.error('Erro ao carregar normas')
    } finally {
      setLoading(false)
    }
  }, [page, busca, filtroTipo, filtroAno])

  useEffect(() => {
    carregarNormas()
  }, [carregarNormas])

  // Gerar lista de anos
  const anos: number[] = []
  const anoAtual = new Date().getFullYear()
  for (let i = anoAtual; i >= anoAtual - 30; i--) {
    anos.push(i)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Scale className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Legislacao Municipal
              </h1>
              <p className="text-gray-600 mt-1">
                Consulte leis, decretos e resolucoes da Camara Municipal
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Busca e Filtros */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar por numero, ementa ou assunto..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-12 h-12 text-lg"
                  />
                </div>
              </div>

              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-[200px] h-12">
                  <SelectValue placeholder="Tipo de norma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="LEI_ORDINARIA">Lei Ordinaria</SelectItem>
                  <SelectItem value="LEI_COMPLEMENTAR">Lei Complementar</SelectItem>
                  <SelectItem value="DECRETO_LEGISLATIVO">Decreto Legislativo</SelectItem>
                  <SelectItem value="RESOLUCAO">Resolucao</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filtroAno} onValueChange={setFiltroAno}>
                <SelectTrigger className="w-[120px] h-12">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {anos.map(ano => (
                    <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                className="h-12"
                onClick={() => {
                  setBusca('')
                  setFiltroTipo('all')
                  setFiltroAno('all')
                  setPage(1)
                }}
              >
                <Filter className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Normas */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        ) : normas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma norma encontrada</p>
              <p className="text-sm mt-2">Tente ajustar os filtros de busca</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {normas.map((norma) => (
              <Card key={norma.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Badge variant="outline" className="mb-2">
                      {TIPO_LABELS[norma.tipo] || norma.tipo}
                    </Badge>
                    <Badge className={SITUACAO_COLORS[norma.situacao]}>
                      {SITUACAO_LABELS[norma.situacao]}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">
                    {TIPO_LABELS[norma.tipo]?.split(' ')[0]} {norma.numero}/{norma.ano}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                    {norma.ementa}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(norma.data).toLocaleDateString('pt-BR')}
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/legislativo/normas/${norma.id}`}>
                        <FileText className="mr-2 h-4 w-4" />
                        Ver texto
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Paginacao */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Anterior
            </Button>
            <span className="text-gray-600">
              Pagina {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Proxima
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
