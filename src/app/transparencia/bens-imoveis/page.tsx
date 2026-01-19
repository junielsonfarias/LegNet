'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Building2,
  Download,
  Calendar,
  FileText,
  Eye,
  DollarSign,
  Loader2,
  Search,
  MapPin,
  Ruler
} from 'lucide-react'
import { useBensPatrimoniais } from '@/lib/hooks/use-bens-patrimoniais'

const situacaoConfig: Record<string, { color: string }> = {
  BOM: { color: 'bg-green-100 text-green-800' },
  REGULAR: { color: 'bg-yellow-100 text-yellow-800' },
  RUIM: { color: 'bg-orange-100 text-orange-800' },
  INSERVIVEL: { color: 'bg-red-100 text-red-800' },
  BAIXADO: { color: 'bg-gray-100 text-gray-800' }
}

export default function BensImoveisPage() {
  const { bens, loading } = useBensPatrimoniais({ tipo: 'IMOVEL' })
  const [filtroSituacao, setFiltroSituacao] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const bensFiltrados = useMemo(() => {
    return bens.filter(b => {
      const matchSituacao = filtroSituacao === 'all' || b.situacao === filtroSituacao
      const matchSearch = !searchTerm ||
        b.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.tombamento?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (b.enderecoImovel?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (b.matriculaImovel?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
      return matchSituacao && matchSearch
    })
  }, [bens, filtroSituacao, searchTerm])

  const estatisticas = useMemo(() => ({
    total: bens.length,
    valorTotal: bens.reduce((acc, b) => acc + (Number(b.valorAtual) || Number(b.valorAquisicao) || 0), 0),
    areaTotal: bens.reduce((acc, b) => acc + (Number(b.areaImovel) || 0), 0)
  }), [bens])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          Bens Imoveis
        </h1>
        <p className="text-muted-foreground">
          Inventario de bens imoveis da Camara Municipal
        </p>
      </div>

      {/* Estatisticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Imoveis</p>
                <p className="text-2xl font-bold">{estatisticas.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Ruler className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Area Total</p>
                <p className="text-xl font-bold">{estatisticas.areaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} m2</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-xl font-bold">R$ {estatisticas.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <Input
                placeholder="Descricao, matricula ou endereco..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Situacao</label>
              <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
                <SelectTrigger><SelectValue placeholder="Todas as situacoes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as situacoes</SelectItem>
                  <SelectItem value="BOM">Bom</SelectItem>
                  <SelectItem value="REGULAR">Regular</SelectItem>
                  <SelectItem value="RUIM">Ruim</SelectItem>
                  <SelectItem value="INSERVIVEL">Inservivel</SelectItem>
                  <SelectItem value="BAIXADO">Baixado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Bens Imoveis */}
      <div className="space-y-4">
        {bensFiltrados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum bem imovel encontrado</p>
            </CardContent>
          </Card>
        ) : (
          bensFiltrados.map(bem => {
            const config = situacaoConfig[bem.situacao] || situacaoConfig.BOM
            return (
              <Card key={bem.id} className="hover:shadow-md transition-shadow border-l-4 border-l-orange-600">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Building2 className="h-5 w-5 text-orange-600" />
                        {bem.matriculaImovel && (
                          <span className="font-bold text-lg text-primary">Matricula: {bem.matriculaImovel}</span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-sm ${config.color}`}>
                          {bem.situacao}
                        </span>
                      </div>
                      <p className="text-foreground mb-4 font-medium">{bem.descricao}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {bem.enderecoImovel && (
                          <div className="flex items-center gap-2 md:col-span-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{bem.enderecoImovel}</span>
                          </div>
                        )}
                        {bem.areaImovel && (
                          <div className="flex items-center gap-2">
                            <Ruler className="h-4 w-4 text-muted-foreground" />
                            <span>{Number(bem.areaImovel).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} m2</span>
                          </div>
                        )}
                        {bem.dataAquisicao && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(bem.dataAquisicao).toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                        {bem.valorAquisicao && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-blue-600" />
                            <span className="text-blue-600">Aquisicao: R$ {Number(bem.valorAquisicao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                        {bem.valorAtual && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-green-600">Atual: R$ {Number(bem.valorAtual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                      </div>
                      {bem.responsavel && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <span>Responsavel: {bem.responsavel}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
