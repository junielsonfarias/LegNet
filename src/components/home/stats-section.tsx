'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Calendar, FileText, TrendingUp } from 'lucide-react'

export function StatsSection() {
  const [stats, setStats] = useState({
    vereadores: 0,
    sessoes: 0,
    materias: 0,
    transparencia: 100
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [parlamentaresRes, sessoesRes, proposicoesRes] = await Promise.all([
          fetch('/api/dados-abertos/parlamentares?ativo=true').catch(() => null),
          fetch('/api/sessoes?limit=1').catch(() => null),
          fetch('/api/dados-abertos/proposicoes?limit=1').catch(() => null)
        ])

        const newStats = { ...stats }

        if (parlamentaresRes?.ok) {
          const data = await parlamentaresRes.json()
          newStats.vereadores = data.dados?.length || data.data?.length || 0
        }

        if (sessoesRes?.ok) {
          const data = await sessoesRes.json()
          newStats.sessoes = data.pagination?.total || data.meta?.total || 0
        }

        if (proposicoesRes?.ok) {
          const data = await proposicoesRes.json()
          newStats.materias = data.dados?.total || data.pagination?.total || 0
        }

        setStats(newStats)
      } catch {
        // Mantém zeros
      }
    }

    fetchStats()
  }, [])

  const items = [
    {
      icon: Users,
      title: 'Vereadores Ativos',
      value: String(stats.vereadores),
      description: 'Parlamentares na legislatura atual',
      color: 'text-camara-primary'
    },
    {
      icon: Calendar,
      title: 'Sessões Realizadas',
      value: String(stats.sessoes),
      description: 'Sessões ordinárias e extraordinárias',
      color: 'text-green-600'
    },
    {
      icon: FileText,
      title: 'Matérias Processadas',
      value: String(stats.materias),
      description: 'Proposições, leis e decretos',
      color: 'text-purple-600'
    },
    {
      icon: TrendingUp,
      title: 'Transparência',
      value: '100%',
      description: 'Conformidade com a Lei de Acesso à Informação',
      color: 'text-orange-600'
    }
  ]

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Em Números
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Acompanhe as atividades da Câmara Municipal
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((stat, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <stat.icon className={`h-10 w-10 mx-auto mb-3 ${stat.color}`} />
                <p className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</p>
                <h3 className="font-semibold text-gray-900 mb-1">{stat.title}</h3>
                <p className="text-sm text-gray-500">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
