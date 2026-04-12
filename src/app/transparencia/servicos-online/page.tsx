'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Globe, Loader2, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

interface Servico {
  id: string
  nome: string
  descricao: string | null
  url: string
  categoria: string | null
  publicoAlvo: string | null
}

export default function ServicosOnlinePage() {
  const [data, setData] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/servicos-online?limit=200&ativo=true')
      .then(r => r.json())
      .then(j => setData(j?.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  const porCategoria = data.reduce<Record<string, Servico[]>>((acc, s) => {
    const cat = s.categoria || 'Outros'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  return (
    <TransparenciaPageWrapper slug="servicos-online" nome="Servicos Online">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Link href="/transparencia" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Portal da Transparencia
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-100 text-blue-600"><Globe className="h-6 w-6" /></div>
          <div>
            <h1 className="text-2xl font-bold">Carta de Servicos Online</h1>
            <p className="text-sm text-muted-foreground">Servicos digitais oferecidos ao cidadao</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : data.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum servico cadastrado.</CardContent></Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(porCategoria).map(([cat, servicos]) => (
              <div key={cat}>
                <h2 className="font-bold text-lg mb-3">{cat}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {servicos.map(s => (
                    <a
                      key={s.id}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-white border rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                          <Globe className="h-5 w-5" />
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold text-sm">{s.nome}</h3>
                      {s.descricao && <p className="text-xs text-muted-foreground mt-1">{s.descricao}</p>}
                      {s.publicoAlvo && <p className="text-xs text-muted-foreground mt-2"><strong>Para:</strong> {s.publicoAlvo}</p>}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TransparenciaPageWrapper>
  )
}
