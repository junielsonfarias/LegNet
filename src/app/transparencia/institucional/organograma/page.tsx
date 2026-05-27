'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Loader2, User, Mail, Phone } from 'lucide-react'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

interface Unidade {
  id: string
  nome: string
  sigla: string | null
  descricao: string | null
  responsavel: string | null
  cargo: string | null
  telefone: string | null
  email: string | null
  children: Unidade[]
}

function UnidadeNode({ unidade, level = 0 }: { unidade: Unidade; level?: number }) {
  return (
    <div className={`${level > 0 ? 'ml-6 border-l-2 border-camara-primary/20 pl-4' : ''}`}>
      <Card className="mb-3 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-4 w-4 text-camara-primary flex-shrink-0" />
                <h3 className="font-semibold text-gray-900">{unidade.nome}</h3>
                {unidade.sigla && (
                  <Badge variant="outline" className="text-xs">{unidade.sigla}</Badge>
                )}
              </div>
              {unidade.descricao && (
                <p className="text-sm text-gray-600 ml-6">{unidade.descricao}</p>
              )}
              {unidade.responsavel && (
                <div className="flex items-center gap-2 ml-6 mt-1 text-sm text-gray-500">
                  <User className="h-3 w-3" />
                  <span>{unidade.responsavel}{unidade.cargo ? ` - ${unidade.cargo}` : ''}</span>
                </div>
              )}
              <div className="flex gap-4 ml-6 mt-1">
                {unidade.telefone && (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Phone className="h-3 w-3" />
                    <span>{unidade.telefone}</span>
                  </div>
                )}
                {unidade.email && (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Mail className="h-3 w-3" />
                    <span>{unidade.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {unidade.children && unidade.children.length > 0 && (
        <div>
          {unidade.children.map((child) => (
            <UnidadeNode key={child.id} unidade={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function OrganogramaPage() {
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/organograma')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setUnidades(json.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <TransparenciaPageWrapper slug="estrutura-organizacional" nome="Estrutura Organizacional">
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="h-12 w-12 text-camara-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Organograma</h1>
          <p className="text-gray-600">Estrutura organizacional da Camara Municipal</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-camara-primary" />
          </div>
        ) : unidades.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Organograma nao disponivel no momento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-3xl mx-auto">
            {unidades.map((u) => (
              <UnidadeNode key={u.id} unidade={u} />
            ))}
          </div>
        )}
      </div>
    </div>
    </TransparenciaPageWrapper>
  )
}
