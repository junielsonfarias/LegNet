'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Truck, Loader2, Search } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

interface Veiculo {
  id: string
  placa: string
  marca: string
  modelo: string
  anoFabricacao: number
  anoModelo: number
  cor: string | null
  combustivel: string | null
  dataAquisicao: string
  valorAquisicao: string | number
  responsavel: string | null
  lotacao: string | null
  situacao: string
}

const formatBRL = (v: number | string) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v))

export default function VeiculosPage() {
  const [data, setData] = useState<Veiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    fetch('/api/veiculos?limit=100')
      .then(r => r.json())
      .then(j => setData(j?.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  const filtrados = busca
    ? data.filter(v =>
        v.placa.toLowerCase().includes(busca.toLowerCase()) ||
        v.modelo.toLowerCase().includes(busca.toLowerCase()) ||
        v.marca.toLowerCase().includes(busca.toLowerCase())
      )
    : data

  return (
    <TransparenciaPageWrapper slug="veiculos" nome="Veiculos">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Link href="/transparencia" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Portal da Transparencia
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Frota de Veiculos</h1>
            <p className="text-sm text-muted-foreground">Veiculos oficiais da Camara Municipal</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por placa, modelo ou marca..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtrados.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">Nenhum veiculo cadastrado.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtrados.map(v => (
                  <div key={v.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-lg">{v.marca} {v.modelo}</p>
                        <p className="font-mono text-sm text-muted-foreground">{v.placa}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{v.situacao}</span>
                    </div>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <p>Ano: {v.anoFabricacao}/{v.anoModelo}</p>
                      {v.cor && <p>Cor: {v.cor}</p>}
                      {v.combustivel && <p>Combustivel: {v.combustivel}</p>}
                      {v.lotacao && <p>Lotacao: {v.lotacao}</p>}
                      <p className="pt-1 font-medium text-foreground">{formatBRL(v.valorAquisicao)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TransparenciaPageWrapper>
  )
}
