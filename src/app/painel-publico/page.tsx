'use client'

import { useState, useEffect } from 'react'
import { painelEletronicoService } from '@/lib/painel-eletronico-service'
import { PainelPublico } from '@/lib/types/painel-eletronico'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  Users, 
  FileText, 
  CheckCircle, 
  XCircle, 
  BarChart3, 
  Calendar,
  Monitor,
  Vote,
  Timer,
  Activity,
  User
} from 'lucide-react'

export default function PainelPublicoPage() {
  const [painelData, setPainelData] = useState<PainelPublico | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const sessaoId = '1' // Assumindo uma sessão ativa para demonstração

  useEffect(() => {
    const loadPainelData = async () => {
      setLoading(true)
      try {
        const data = painelEletronicoService.getPainelPublico(sessaoId)
        setPainelData(data)
      } catch (error) {
        console.error('Erro ao carregar dados do painel público:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPainelData()
    
    if (autoRefresh) {
      const interval = setInterval(loadPainelData, 10000) // Atualiza a cada 10 segundos
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timeInterval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Carregando painel público...</p>
        </div>
      </div>
    )
  }

  if (!painelData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="bg-white/10 backdrop-blur-lg border border-white/20 text-white p-8">
          <CardContent className="text-center">
            <Monitor className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">
              Nenhum painel público disponível
            </h2>
            <p className="text-blue-200 mb-6">
              Não há sessões em andamento no momento
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Dados mock dos parlamentares para demonstração
  const parlamentares = [
    { id: '1', nome: 'Francisco Pantoja', partido: 'MDB', presente: true, foto: '/avatars/pantoja.jpg' },
    { id: '2', nome: 'Diego Silva', partido: 'PTB', presente: true, foto: '/avatars/diego.jpg' },
    { id: '3', nome: 'Mickael Aguiar', partido: 'PSD', presente: true, foto: '/avatars/mickael.jpg' },
    { id: '4', nome: 'Jesanias Pessoa', partido: 'MDB', presente: true, foto: '/avatars/jesanias.jpg' },
    { id: '5', nome: 'Arnaldo Galvão', partido: 'PT', presente: true, foto: '/avatars/arnaldo.jpg' },
    { id: '6', nome: 'Clei do Povo', partido: 'PSDB', presente: true, foto: '/avatars/clei.jpg' },
    { id: '7', nome: 'Enfermeiro Frank', partido: 'DEM', presente: true, foto: '/avatars/frank.jpg' },
    { id: '8', nome: 'Everaldo Camilo', partido: 'PP', presente: true, foto: '/avatars/everaldo.jpg' },
    { id: '9', nome: 'Joilson Santa Júlia', partido: 'PCdoB', presente: false, foto: '/avatars/joilson.jpg' },
    { id: '10', nome: 'Reges Rabelo', partido: 'PSB', presente: false, foto: '/avatars/reges.jpg' },
    { id: '11', nome: 'Wallace Lalá', partido: 'PV', presente: false, foto: '/avatars/wallace.jpg' }
  ]

  const presentes = parlamentares.filter(p => p.presente)
  const ausentes = parlamentares.filter(p => !p.presente)
  const percentualPresenca = Math.round((presentes.length / parlamentares.length) * 100)

  return (
    <>
      {/* Header do Painel */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/20 shadow-2xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                  <Monitor className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">ORDINARIA - 001/2025</h1>
                <p className="text-blue-200">Câmara Municipal de Mojuí dos Campos</p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center rounded-full font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-primary/80 bg-green-500/20 text-green-300 text-base px-4 py-2 border border-green-400/30 mb-2">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                SESSÃO EM ANDAMENTO
              </div>
              <div className="flex items-center gap-4 text-sm text-blue-300">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  24/01/2025
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  09:00 - 12:00
                </div>
                <div className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  18:01:57
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Resultados da Votação */}
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20 text-white">
            <CardHeader>
              <CardTitle className="text-3xl font-bold flex items-center justify-center">
                <Vote className="h-8 w-8 mr-3 text-green-400" />
                Votação em Andamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Título da Proposição */}
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-6 rounded-xl border border-blue-400/30">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Projeto de Lei nº 001/2024
                </h2>
                <p className="text-lg text-blue-200">
                  Dispõe sobre a criação do programa de incentivo à agricultura familiar no município
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-300" />
                    <span className="text-white">Autor: <span className="font-semibold text-blue-300">Francisco Pantoja</span></span>
                  </div>
                </div>
              </div>

              {/* Resultados da Votação */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-6 bg-green-600/30 rounded-xl border border-green-400/30">
                  <div className="text-5xl font-extrabold text-green-300 mb-2">7</div>
                  <div className="text-xl text-green-200 font-semibold">SIM</div>
                  <div className="text-sm text-green-300 mt-2">63.6%</div>
                </div>
                <div className="p-6 bg-red-600/30 rounded-xl border border-red-400/30">
                  <div className="text-5xl font-extrabold text-red-300 mb-2">2</div>
                  <div className="text-xl text-red-200 font-semibold">NÃO</div>
                  <div className="text-sm text-red-300 mt-2">18.2%</div>
                </div>
                <div className="p-6 bg-yellow-600/30 rounded-xl border border-yellow-400/30">
                  <div className="text-5xl font-extrabold text-yellow-300 mb-2">2</div>
                  <div className="text-xl text-yellow-200 font-semibold">ABSTENÇÕES</div>
                  <div className="text-sm text-yellow-300 mt-2">18.2%</div>
                </div>
              </div>

              {/* Status da Votação */}
              <div className="text-center p-4 bg-green-500/20 rounded-lg border border-green-400/30">
                <Timer className="h-6 w-6 inline mr-2 text-green-400" />
                <span className="text-xl text-green-300 font-semibold">Votação Finalizada - APROVADO</span>
              </div>
            </CardContent>
          </Card>

          {/* Presença dos Parlamentares */}
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20 text-white">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center">
                <Users className="h-6 w-6 mr-2 text-blue-400" />
                Presença dos Parlamentares
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Estatísticas de Presença */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="text-center p-3 bg-green-500/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-300">{presentes.length}</div>
                  <div className="text-sm text-green-200">Presentes</div>
                </div>
                <div className="text-center p-3 bg-red-500/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-300">{ausentes.length}</div>
                  <div className="text-sm text-red-200">Ausentes</div>
                </div>
                <div className="text-center p-3 bg-blue-500/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-300">{percentualPresenca}%</div>
                  <div className="text-sm text-blue-200">Presença</div>
                </div>
              </div>

              {/* Lista de Parlamentares Presentes */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-green-300 mb-3 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Presentes ({presentes.length})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {presentes.map((parlamentar) => (
                      <div key={parlamentar.id} className="flex items-center gap-3 p-3 bg-green-500/20 rounded-lg border border-green-400/30">
                        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-white">{parlamentar.nome}</p>
                          <p className="text-sm text-green-300">{parlamentar.partido}</p>
                        </div>
                        <Badge className="bg-green-600/30 text-green-200 border-green-400/50">
                          Presente
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lista de Parlamentares Ausentes */}
                <div>
                  <h3 className="text-lg font-semibold text-red-300 mb-3 flex items-center">
                    <XCircle className="h-5 w-5 mr-2" />
                    Ausentes ({ausentes.length})
                  </h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {ausentes.map((parlamentar) => (
                      <div key={parlamentar.id} className="flex items-center gap-3 p-3 bg-red-500/20 rounded-lg border border-red-400/30">
                        <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-white">{parlamentar.nome}</p>
                          <p className="text-sm text-red-300">{parlamentar.partido}</p>
                        </div>
                        <Badge className="bg-red-600/30 text-red-200 border-red-400/50">
                          Ausente
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}