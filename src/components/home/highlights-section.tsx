/**
 * Highlights Section - Destaques legislativos recentes
 * Simplificado: sessao/countdown movidos para live-session-banner
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText,
  ArrowRight,
  TrendingUp,
  Star,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Proposicao {
  id: string
  numero: string
  ano: number
  tipo: string
  titulo: string
  status: string
  ementa?: string
  dataApresentacao: string
}

const tipoLabels: Record<string, string> = {
  'PROJETO_LEI': 'PL',
  'PROJETO_LEI_COMPLEMENTAR': 'PLC',
  'REQUERIMENTO': 'REQ',
  'INDICACAO': 'IND',
  'MOCAO': 'MOC',
  'DECRETO_LEGISLATIVO': 'DL',
}

const statusColors: Record<string, string> = {
  'APROVADA': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'REJEITADA': 'bg-red-50 text-red-700 border-red-200',
  'EM_TRAMITACAO': 'bg-blue-50 text-blue-700 border-blue-200',
  'EM_PAUTA': 'bg-amber-50 text-amber-700 border-amber-200',
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function HighlightsSection() {
  const [destaques, setDestaques] = useState<Proposicao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDestaques = async () => {
      try {
        const res = await fetch('/api/dados-abertos/proposicoes?limit=4')
        const data = await res.json()
        setDestaques(data.dados || [])
      } catch (e) { console.warn("Erro ao carregar dados:", e) } finally {
        setLoading(false)
      }
    }
    fetchDestaques()
  }, [])

  if (loading) {
    return (
      <section className="py-10 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (destaques.length === 0) return null

  return (
    <section className="py-10 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5" style={{ color: 'var(--municipal-primary)' }} />
            <h2 className="text-lg md:text-xl font-bold text-gray-900">Destaques Legislativos</h2>
          </div>
          <Link
            href="/legislativo/proposicoes"
            className="text-sm font-medium hover:underline flex items-center gap-1"
            style={{ color: 'var(--municipal-primary)' }}
          >
            Ver mais <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {destaques.map((prop) => (
            <Link
              key={prop.id}
              href={`/legislativo/proposicoes/${prop.id}`}
              className="group"
            >
              <Card className="border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 h-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">
                      {tipoLabels[prop.tipo] || prop.tipo} {prop.numero}/{prop.ano}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs px-2 py-0.5 ${statusColors[prop.status] || 'bg-gray-50 text-gray-600'}`}
                    >
                      {prop.status?.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2 group-hover:text-camara-primary transition-colors">
                    {prop.titulo || prop.ementa || 'Sem titulo'}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDateShort(prop.dataApresentacao)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HighlightsSection
