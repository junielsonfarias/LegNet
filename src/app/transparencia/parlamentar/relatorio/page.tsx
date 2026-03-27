'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Loader2, User } from 'lucide-react'
import Link from 'next/link'

interface Parlamentar {
  id: string
  nome: string
  partido: string | null
  foto: string | null
  email: string | null
}

export default function RelatorioListaPage() {
  const [parlamentares, setParlamentares] = useState<Parlamentar[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dados-abertos/parlamentares')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setParlamentares(json.data)
        else if (Array.isArray(json.data)) setParlamentares(json.data)
        else if (Array.isArray(json)) setParlamentares(json)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-camara-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Relatorio Individual</h1>
          <p className="text-gray-600">Selecione um parlamentar para ver seu relatorio detalhado</p>
        </div>

        {parlamentares.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum parlamentar encontrado.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parlamentares.map((p) => (
              <Card key={p.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  {p.foto ? (
                    <img
                      src={p.foto}
                      alt={p.nome}
                      className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-camara-primary/10 flex items-center justify-center mx-auto mb-4">
                      <User className="h-10 w-10 text-camara-primary" />
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{p.nome}</h3>
                  {p.partido && (
                    <Badge variant="outline" className="mb-3">{p.partido}</Badge>
                  )}
                  <Link href={`/transparencia/parlamentar/relatorio/${p.id}`}>
                    <Button variant="outline" className="w-full mt-2">
                      Ver Relatorio
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
