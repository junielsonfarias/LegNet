'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Crown, Shield, User, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useParlamentares } from '@/lib/hooks/use-parlamentares'

// Interface para estatísticas
interface EstatisticaParlamentar {
  id: string
  nome: string
  cargo: string
  partido: string | null
  sessoes: number
  materias: number
}

export function ParliamentariansSection() {
  const { parlamentares, loading: loadingParlamentares } = useParlamentares({ ativo: true })
  const [estatisticas, setEstatisticas] = useState<EstatisticaParlamentar[]>([])
  const [loadingStats, setLoadingStats] = useState(true)

  // Buscar estatísticas dos parlamentares
  useEffect(() => {
    const fetchEstatisticas = async () => {
      try {
        setLoadingStats(true)
        const response = await fetch('/api/dados-abertos/parlamentares/estatisticas')
        const result = await response.json()
        if (result.dados) {
          setEstatisticas(result.dados)
        }
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error)
      } finally {
        setLoadingStats(false)
      }
    }
    fetchEstatisticas()
  }, [])

  // Função para obter estatísticas de um parlamentar
  const getStats = (parlamentarId: string) => {
    const stats = estatisticas.find(e => e.id === parlamentarId)
    return {
      sessions: stats?.sessoes || 0,
      matters: stats?.materias || 0
    }
  }

  // Separar mesa diretora e vereadores
  const { mesaDiretora, vereadores } = useMemo(() => {
    const mesa = parlamentares
      .filter(p => p.cargo !== 'VEREADOR')
      .map(p => {
        const roleMap: Record<string, { role: string; icon: typeof Crown; color: string }> = {
          'PRESIDENTE': { role: 'Presidente', icon: Crown, color: 'bg-camara-gold' },
          'VICE_PRESIDENTE': { role: 'Vice-presidente', icon: Shield, color: 'bg-camara-primary' },
          'PRIMEIRO_SECRETARIO': { role: '1º Secretário', icon: User, color: 'bg-camara-secondary' },
          'SEGUNDO_SECRETARIO': { role: '2º Secretário', icon: User, color: 'bg-camara-accent' }
        }
        const roleInfo = roleMap[p.cargo] || { role: p.cargo, icon: User, color: 'bg-gray-500' }
        const stats = getStats(p.id)
        return {
          id: p.id,
          name: p.nome,
          role: roleInfo.role,
          icon: roleInfo.icon,
          sessions: stats.sessions,
          matters: stats.matters,
          color: roleInfo.color
        }
      })

    const vereadoresList = parlamentares
      .filter(p => p.cargo === 'VEREADOR')
      .map(p => {
        const stats = getStats(p.id)
        return {
          id: p.id,
          name: p.nome,
          sessions: stats.sessions,
          matters: stats.matters
        }
      })

    return { mesaDiretora: mesa, vereadores: vereadoresList }
  }, [parlamentares, estatisticas])

  const loading = loadingParlamentares || loadingStats

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Parlamentares
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Conheça os vereadores eleitos para a legislatura 2025/2028 e
            acompanhe sua atuação na Câmara Municipal
          </p>
        </div>

        {loading ? (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="camara-card animate-pulse">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="camara-card animate-pulse p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Mesa Diretora */}
            {mesaDiretora.length > 0 && (
              <div className="mb-12">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                  Mesa Diretora
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {mesaDiretora.map((membro) => (
                    <Card key={membro.id} className="camara-card hover:scale-105 transition-transform duration-200">
                      <CardHeader className="text-center pb-3">
                        <div className={`w-16 h-16 ${membro.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                          <membro.icon className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {membro.name}
                        </CardTitle>
                        <p className="text-sm text-camara-primary font-medium">
                          {membro.role}
                        </p>
                      </CardHeader>
                      <CardContent className="text-center">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-semibold text-camara-primary">{membro.sessions}</div>
                            <div className="text-gray-600">Sessões</div>
                          </div>
                          <div>
                            <div className="font-semibold text-camara-secondary">{membro.matters}</div>
                            <div className="text-gray-600">Matérias</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Vereadores */}
            {vereadores.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                  Vereadores
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {vereadores.map((vereador, index) => (
                    <Card key={vereador.id} className="camara-card hover:shadow-lg transition-shadow duration-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-camara-primary rounded-full flex items-center justify-center text-white font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {vereador.name}
                            </h4>
                            <div className="flex items-center space-x-4 text-xs text-gray-600">
                              <span>{vereador.sessions} sessões</span>
                              <span>•</span>
                              <span>{vereador.matters} matérias</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Botões de ação */}
        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="camara-button">
              <Link href="/parlamentares">
                <Users className="h-5 w-5 mr-2" />
                Ver Todos os Parlamentares
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-camara-primary text-camara-primary hover:bg-camara-primary hover:text-white">
              <Link href="/parlamentares/mesa-diretora">
                Mesa Diretora Completa
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
