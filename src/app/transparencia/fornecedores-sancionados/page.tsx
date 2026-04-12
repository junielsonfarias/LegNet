'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Shield, Loader2, Search } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

interface Sancionado {
  id: string
  nome: string
  cnpjCpf: string
  tipoSancao: string
  motivo: string
  orgaoSancionador: string
  dataInicio: string
  dataFim: string | null
  ativo: boolean
}

const TIPO_LABELS: Record<string, string> = {
  ADVERTENCIA: 'Advertencia',
  MULTA: 'Multa',
  SUSPENSAO_TEMPORARIA: 'Suspensao temporaria',
  IMPEDIMENTO: 'Impedimento',
  DECLARACAO_INIDONEIDADE: 'Declaracao de inidoneidade'
}

export default function FornecedoresSancionadosPage() {
  const [data, setData] = useState<Sancionado[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    fetch('/api/fornecedores-sancionados?limit=100')
      .then(r => r.json())
      .then(j => setData(j?.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  const filtrados = busca
    ? data.filter(s =>
        s.nome.toLowerCase().includes(busca.toLowerCase()) ||
        s.cnpjCpf.includes(busca)
      )
    : data

  return (
    <TransparenciaPageWrapper slug="fornecedores-sancionados" nome="Fornecedores Sancionados">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Link href="/transparencia" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Portal da Transparencia
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-red-100 text-red-600"><Shield className="h-6 w-6" /></div>
          <div>
            <h1 className="text-2xl font-bold">Licitantes / Contratados Sancionados</h1>
            <p className="text-sm text-muted-foreground">Empresas e pessoas com sancoes administrativas vigentes</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou CNPJ/CPF..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filtrados.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">Nenhum fornecedor sancionado.</p>
            ) : (
              <div className="space-y-3">
                {filtrados.map(s => (
                  <div key={s.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{s.nome}</h3>
                        <p className="text-xs text-muted-foreground font-mono">{s.cnpjCpf}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.ativo ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>
                        {s.ativo ? 'Vigente' : 'Encerrada'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground mt-2">
                      <div><strong>Sancao:</strong> {TIPO_LABELS[s.tipoSancao] || s.tipoSancao}</div>
                      <div><strong>Orgao:</strong> {s.orgaoSancionador}</div>
                      <div>
                        <strong>Periodo:</strong> {new Date(s.dataInicio).toLocaleDateString('pt-BR')}
                        {s.dataFim ? ` - ${new Date(s.dataFim).toLocaleDateString('pt-BR')}` : ' - indeterminado'}
                      </div>
                    </div>
                    <p className="mt-2 text-sm"><strong>Motivo:</strong> {s.motivo}</p>
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
