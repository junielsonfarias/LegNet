'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ClipboardList, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

interface ProgramaAcao {
  id: string
  codigo: string
  nome: string
  descricao: string | null
  tipo: string
  ano: number
  valorPrevisto: number | string | null
  valorExecutado: number | string | null
  unidadeResponsavel: string | null
  metaFisica: string | null
}

export default function ProgramasAcoesPage() {
  const [data, setData] = useState<ProgramaAcao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/programas-acoes?limit=200&ativo=true')
      .then(r => r.json())
      .then(j => setData(j?.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <TransparenciaPageWrapper slug="programas-acoes" nome="Programas e Acoes">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Link href="/transparencia" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Portal da Transparencia
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-100 text-blue-600"><ClipboardList className="h-6 w-6" /></div>
          <div>
            <h1 className="text-2xl font-bold">Programas e Acoes</h1>
            <p className="text-sm text-muted-foreground">Programas e acoes orcamentarias</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : data.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum programa cadastrado.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.map(p => (
              <Card key={p.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">{p.codigo}</p>
                      <h3 className="font-bold">{p.nome}</h3>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{p.tipo}</span>
                  </div>
                  {p.descricao && <p className="text-sm text-muted-foreground mb-3">{p.descricao}</p>}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {p.valorPrevisto != null && (
                      <div>
                        <span className="text-muted-foreground block">Previsto</span>
                        <span className="font-medium">{Number(p.valorPrevisto).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      </div>
                    )}
                    {p.valorExecutado != null && (
                      <div>
                        <span className="text-muted-foreground block">Executado</span>
                        <span className="font-medium">{Number(p.valorExecutado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      </div>
                    )}
                  </div>
                  {p.metaFisica && <p className="mt-3 text-xs text-muted-foreground"><strong>Meta:</strong> {p.metaFisica}</p>}
                  {p.unidadeResponsavel && <p className="mt-1 text-xs text-muted-foreground"><strong>Responsavel:</strong> {p.unidadeResponsavel}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </TransparenciaPageWrapper>
  )
}
