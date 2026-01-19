// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Monitor, 
  Play, 
  Pause, 
  Square, 
  Users, 
  Clock, 
  FileText,
  BarChart3,
  Settings,
  Download,
  RefreshCw,
  Wifi,
  WifiOff,
  Eye,
  MessageSquare,
  Vote,
  Calendar,
  CheckCircle,
  AlertCircle,
  Timer,
  ExternalLink,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Camera,
  CameraOff,
  Share2,
  Maximize,
  Minimize
} from 'lucide-react'
import { PainelSessao, PautaItem, Presenca } from '@/lib/types/painel-eletronico'
import { toast } from 'sonner'

export default function PainelEletronicoPage() {
  const [sessaoAtiva, setSessaoAtiva] = useState<PainelSessao | null>(null)
  const [pauta, setPauta] = useState<PautaItem[]>([])
  const [presenca, setPresenca] = useState<Presenca[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [sessoesDisponiveis, setSessoesDisponiveis] = useState<any[]>([])
  const [sessaoSelecionada, setSessaoSelecionada] = useState<string>('')
  const [painelPublicoAberto, setPainelPublicoAberto] = useState(false)
  const [transmissaoAtiva, setTransmissaoAtiva] = useState(false)
  const [audioAtivo, setAudioAtivo] = useState(true)
  const [videoAtivo, setVideoAtivo] = useState(true)
  const [votacaoAtiva, setVotacaoAtiva] = useState(false)
  const [tempoRestante, setTempoRestante] = useState(0)
  const [cronometroAtivo, setCronometroAtivo] = useState(false)
  const [tempoSessao, setTempoSessao] = useState(0) // tempo decorrido da sessão
  const [tempoInicioSessao, setTempoInicioSessao] = useState<Date | null>(null)
  const [votacaoItemAtivo, setVotacaoItemAtivo] = useState<string | null>(null)
  const [discursoAtivo, setDiscursoAtivo] = useState(false)
  const [tempoDiscurso, setTempoDiscurso] = useState(0) // tempo restante do discurso
  const [tempoDiscursoConfigurado, setTempoDiscursoConfigurado] = useState(300) // 5 minutos padrão
  const [discursoParlamentar, setDiscursoParlamentar] = useState<string | null>(null)

  // Carregar lista de sessões disponíveis (separado do carregamento de dados da sessão)
  const carregarSessoesDisponiveis = useCallback(async () => {
    try {
      const response = await fetch('/api/sessoes?limit=100')
      const data = await response.json()

      if (data.success && data.data) {
        // Ordenar por data decrescente (mais recentes primeiro)
        const sessoesOrdenadas = data.data.sort((a: any, b: any) => {
          const dataA = a.data ? new Date(a.data).getTime() : 0
          const dataB = b.data ? new Date(b.data).getTime() : 0
          return dataB - dataA
        })
        setSessoesDisponiveis(sessoesOrdenadas)
        return sessoesOrdenadas
      }
      return []
    } catch (error) {
      console.error('Erro ao carregar sessões disponíveis:', error)
      return []
    }
  }, [])

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true)

      // Se há uma sessão selecionada, carrega seus dados
      if (sessaoSelecionada) {
        // Buscar dados da sessão selecionada
        const sessaoResponse = await fetch(`/api/sessoes/${sessaoSelecionada}`)
        const sessaoData = await sessaoResponse.json()

        if (sessaoData.success && sessaoData.data) {
          const sessao = sessaoData.data

          // Converter para formato do painel
          const sessaoFormatada = {
            id: sessao.id,
            numeroSessao: `${String(sessao.numero).padStart(3, '0')}/${new Date(sessao.data).getFullYear()}`,
            tipo: sessao.tipo.toLowerCase(),
            data: new Date(sessao.data),
            horarioInicio: sessao.horario || '14:00',
            horarioFim: sessao.status === 'CONCLUIDA' ? 'Finalizada' : null,
            status: sessao.status === 'CONCLUIDA' ? 'concluida' :
                   sessao.status === 'EM_ANDAMENTO' ? 'em_andamento' :
                   sessao.status === 'CANCELADA' ? 'cancelada' : 'agendada',
            presidente: sessao.presidente || 'Não definido',
            secretario: sessao.secretario || 'Não definido',
            local: sessao.local || 'Plenário da Câmara Municipal',
            transmissao: {
              ativa: false,
              url: '',
              plataforma: 'youtube'
            },
            votacoes: [],
            estatisticas: {
              totalParlamentares: 0,
              presentes: 0,
              ausentes: 0,
              percentualPresenca: 0
            },
            informacoes: {
              totalItens: sessao.pautaSessao?.itens?.length || 0,
              itemAtual: 0,
              tempoEstimado: 180
            },
            descricao: sessao.descricao
          }

          setSessaoAtiva(sessaoFormatada as any)

          // Carregar presenças da sessão
          const presencasResponse = await fetch(`/api/sessoes/${sessaoSelecionada}/presenca`)
          const presencasData = await presencasResponse.json()

          if (presencasData.success && presencasData.data) {
            const presencasFormatadas = presencasData.data.map((p: any) => ({
              id: p.id,
              parlamentarId: p.parlamentarId,
              parlamentarNome: p.parlamentar?.nome || p.parlamentar?.apelido || 'Parlamentar',
              parlamentarPartido: p.parlamentar?.partido || '',
              presente: p.presente,
              ausente: !p.presente && !p.justificativa,
              justificada: !p.presente && !!p.justificativa,
              horarioEntrada: p.presente ? new Date() : null,
              justificativa: p.justificativa
            }))
            setPresenca(presencasFormatadas)

            // Atualizar estatísticas
            const presentes = presencasFormatadas.filter((p: any) => p.presente).length
            sessaoFormatada.estatisticas = {
              totalParlamentares: presencasFormatadas.length || 11,
              presentes: presentes,
              ausentes: (presencasFormatadas.length || 11) - presentes,
              percentualPresenca: presencasFormatadas.length > 0
                ? Math.round((presentes / presencasFormatadas.length) * 100)
                : 0
            }
            setSessaoAtiva(sessaoFormatada as any)
          } else {
            // Se não tem presenças, carregar parlamentares
            const parlResponse = await fetch('/api/parlamentares?ativo=true')
            const parlData = await parlResponse.json()

            if (parlData.success && parlData.data) {
              const presencasVazias = parlData.data.map((p: any) => ({
                id: `temp-${p.id}`,
                parlamentarId: p.id,
                parlamentarNome: p.apelido || p.nome,
                parlamentarPartido: p.partido || '',
                presente: false,
                ausente: true,
                justificada: false,
                horarioEntrada: null,
                justificativa: null
              }))
              setPresenca(presencasVazias)
            }
          }

          // Carregar pauta da sessão (se existir)
          const pautaResponse = await fetch(`/api/sessoes/${sessaoSelecionada}/pauta`)
          const pautaData = await pautaResponse.json()

          if (pautaData.success && pautaData.data && pautaData.data.itens) {
            const itensFormatados = pautaData.data.itens.map((item: any) => ({
              id: item.id,
              titulo: item.titulo,
              descricao: item.descricao || '',
              autor: item.autor || 'Mesa Diretora',
              ordem: item.ordem,
              status: item.status?.toLowerCase() || 'pendente',
              tempoEstimado: item.tempoEstimado || 15,
              prioridade: 'media',
              votacao: null
            }))
            setPauta(itensFormatados)

            // Atualizar informações da sessão
            sessaoFormatada.informacoes.totalItens = itensFormatados.length
            setSessaoAtiva(sessaoFormatada as any)
          } else {
            setPauta([])
          }
        }
      } else {
        setSessaoAtiva(null)
        setPauta([])
        setPresenca([])
      }
    } catch (error) {
      console.error('Erro ao carregar dados do painel:', error)
      toast.error('Erro ao carregar dados do painel')
    } finally {
      setLoading(false)
    }
  }, [sessaoSelecionada])

  // Carregar sessões disponíveis na montagem inicial (apenas uma vez)
  useEffect(() => {
    carregarSessoesDisponiveis()
  }, [carregarSessoesDisponiveis])

  // Carregar dados da sessão selecionada quando mudar
  useEffect(() => {
    carregarDados()

    if (autoRefresh && sessaoSelecionada) {
      const interval = setInterval(carregarDados, 30000) // Atualizar a cada 30 segundos
      return () => clearInterval(interval)
    }
  }, [autoRefresh, carregarDados, sessaoSelecionada])

  // Cronômetro da sessão
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (cronometroAtivo && tempoInicioSessao) {
      interval = setInterval(() => {
        const agora = new Date()
        const tempoDecorrido = Math.floor((agora.getTime() - tempoInicioSessao.getTime()) / 1000)
        setTempoSessao(tempoDecorrido)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [cronometroAtivo, tempoInicioSessao])

  // Cronômetro de tempo restante
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (tempoRestante > 0) {
      interval = setInterval(() => {
        setTempoRestante(prev => {
          if (prev <= 1) {
            toast.warning('Tempo esgotado!')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [tempoRestante])

  // Cronômetro de discurso
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (discursoAtivo && tempoDiscurso > 0) {
      interval = setInterval(() => {
        setTempoDiscurso(prev => {
          if (prev <= 1) {
            toast.warning('Tempo de discurso esgotado!')
            setDiscursoAtivo(false)
            setDiscursoParlamentar(null)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [discursoAtivo, tempoDiscurso])


  const iniciarSessao = async (sessaoId: string) => {
    try {
      // Atualizar status da sessão para EM_ANDAMENTO via API
      const response = await fetch(`/api/sessoes/${sessaoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'EM_ANDAMENTO' })
      })

      if (!response.ok) {
        throw new Error('Erro ao iniciar sessão')
      }

      setTempoInicioSessao(new Date())
      setCronometroAtivo(true)
      setTempoSessao(0)

      toast.success('Sessão iniciada com sucesso!')
      await carregarDados()

    } catch (error) {
      console.error('Erro ao iniciar sessão:', error)
      toast.error('Erro ao iniciar sessão')
    }
  }

  const finalizarSessao = async () => {
    if (!sessaoAtiva) return

    try {
      // Atualizar status da sessão para CONCLUIDA via API
      const response = await fetch(`/api/sessoes/${sessaoAtiva.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONCLUIDA' })
      })

      if (!response.ok) {
        throw new Error('Erro ao finalizar sessão')
      }

      setCronometroAtivo(false)
      setTempoInicioSessao(null)
      setTempoSessao(0)
      setVotacaoAtiva(false)
      setVotacaoItemAtivo(null)
      toast.success('Sessão finalizada com sucesso!')
      await carregarDados()
    } catch (error) {
      console.error('Erro ao finalizar sessão:', error)
      toast.error('Erro ao finalizar sessão')
    }
  }

  const iniciarItem = async (itemId: string) => {
    if (!sessaoAtiva) return

    try {
      const response = await fetch(`/api/sessoes/${sessaoAtiva.id}/pauta/${itemId}/controle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'iniciar' })
      })

      if (!response.ok) {
        throw new Error('Erro ao iniciar item')
      }

      toast.success('Item iniciado')
      await carregarDados()
    } catch (error) {
      console.error('Erro ao iniciar item:', error)
      toast.error('Erro ao iniciar item')
    }
  }

  const finalizarItem = async (itemId: string, aprovado: boolean) => {
    if (!sessaoAtiva) return

    try {
      const response = await fetch(`/api/sessoes/${sessaoAtiva.id}/pauta/${itemId}/controle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'finalizar',
          resultado: aprovado ? 'APROVADO' : 'REJEITADO'
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao finalizar item')
      }

      toast.success(`Item ${aprovado ? 'aprovado' : 'rejeitado'}`)
      await carregarDados()
    } catch (error) {
      console.error('Erro ao finalizar item:', error)
      toast.error('Erro ao finalizar item')
    }
  }

  const registrarPresenca = async (parlamentarId: string, tipo: 'presente' | 'ausente' | 'justificada', justificativa?: string) => {
    if (!sessaoAtiva) return

    try {
      const response = await fetch(`/api/sessoes/${sessaoAtiva.id}/presenca`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parlamentarId,
          presente: tipo === 'presente',
          justificativa: tipo === 'justificada' ? justificativa : undefined
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao registrar presença')
      }

      const mensagens = {
        presente: 'Presença registrada',
        ausente: 'Ausência registrada',
        justificada: 'Ausência justificada'
      }

      toast.success(mensagens[tipo])
      await carregarDados()
    } catch (error) {
      console.error('Erro ao registrar presença:', error)
      toast.error('Erro ao registrar presença')
    }
  }

  const gerarRelatorio = async () => {
    if (!sessaoAtiva) return

    try {
      // Abrir página de relatório da sessão em nova aba
      window.open(`/admin/sessoes/${sessaoAtiva.id}/relatorio`, '_blank')
      toast.success('Relatório aberto em nova aba')
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      toast.error('Erro ao gerar relatório')
    }
  }

  const abrirPainelPublico = () => {
    // Abrir painel público com a sessão selecionada
    const url = sessaoAtiva ? `/painel-publico?sessao=${sessaoAtiva.id}` : '/painel-publico'
    window.open(url, '_blank', 'width=1920,height=1080,scrollbars=yes,resizable=yes')
    setPainelPublicoAberto(true)
    toast.success('Painel público aberto em nova guia')
  }

  const iniciarTransmissao = () => {
    setTransmissaoAtiva(true)
    toast.success('Transmissão iniciada')
  }

  const pararTransmissao = () => {
    setTransmissaoAtiva(false)
    toast.success('Transmissão parada')
  }

  const iniciarVotacao = async (itemId: string) => {
    if (!sessaoAtiva) return

    try {
      // Colocar item em modo de votação via API
      const response = await fetch(`/api/sessoes/${sessaoAtiva.id}/pauta/${itemId}/controle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'votacao' })
      })

      if (!response.ok) {
        throw new Error('Erro ao iniciar votação')
      }

      setVotacaoAtiva(true)
      setVotacaoItemAtivo(itemId)
      // Definir tempo para votação (padrão 5 minutos)
      setTempoRestante(300) // 5 minutos em segundos
      toast.success('Votação iniciada - Tempo: 5 minutos')
      await carregarDados()
    } catch (error) {
      console.error('Erro ao iniciar votação:', error)
      toast.error('Erro ao iniciar votação')
    }
  }

  const finalizarVotacao = async (itemId: string) => {
    if (!sessaoAtiva) return

    try {
      setVotacaoAtiva(false)
      setVotacaoItemAtivo(null)
      setTempoRestante(0)
      toast.success('Votação finalizada')
      await carregarDados()
    } catch (error) {
      console.error('Erro ao finalizar votação:', error)
      toast.error('Erro ao finalizar votação')
    }
  }

  const iniciarDiscurso = (parlamentarId: string, parlamentarNome: string) => {
    setDiscursoAtivo(true)
    setDiscursoParlamentar(parlamentarId)
    setTempoDiscurso(tempoDiscursoConfigurado)
    toast.success(`Discurso iniciado para ${parlamentarNome} - ${tempoDiscursoConfigurado}s`)
  }

  const finalizarDiscurso = () => {
    setDiscursoAtivo(false)
    setDiscursoParlamentar(null)
    setTempoDiscurso(0)
    toast.success('Discurso finalizado')
  }

  const configurarTempoDiscurso = (tempo: number) => {
    setTempoDiscursoConfigurado(tempo)
    if (discursoAtivo) {
      setTempoDiscurso(tempo)
    }
    toast.success(`Tempo de discurso configurado para ${tempo}s`)
  }

  const toggleAudio = () => {
    setAudioAtivo(!audioAtivo)
    toast.success(`Áudio ${!audioAtivo ? 'ativado' : 'desativado'}`)
  }

  const toggleVideo = () => {
    setVideoAtivo(!videoAtivo)
    toast.success(`Vídeo ${!videoAtivo ? 'ativado' : 'desativado'}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendada': return 'bg-blue-100 text-blue-800'
      case 'em_andamento': return 'bg-green-100 text-green-800'
      case 'concluida': return 'bg-gray-100 text-gray-800'
      case 'cancelada': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getItemStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-gray-100 text-gray-800'
      case 'em_discussao': return 'bg-blue-100 text-blue-800'
      case 'aprovado': return 'bg-green-100 text-green-800'
      case 'rejeitado': return 'bg-red-100 text-red-800'
      case 'adiado': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return 'bg-red-100 text-red-800'
      case 'media': return 'bg-yellow-100 text-yellow-800'
      case 'baixa': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading && !sessaoAtiva) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-camara-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Monitor className="h-8 w-8 text-camara-primary" />
            Painel Eletrônico
          </h1>
          <p className="text-gray-600">
            Controle de sessões legislativas em tempo real
          </p>
        </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={sessaoSelecionada}
              onChange={(e) => setSessaoSelecionada(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-camara-primary min-w-[300px]"
            >
              <option value="">Selecione uma sessão ({sessoesDisponiveis.length} disponíveis)</option>
              {sessoesDisponiveis.map(sessao => {
                const dataFormatada = sessao.data
                  ? new Date(sessao.data).toLocaleDateString('pt-BR')
                  : 'Data não definida'
                const tipoLabel = sessao.tipo === 'ORDINARIA' ? 'Ordinária' :
                                  sessao.tipo === 'EXTRAORDINARIA' ? 'Extraordinária' :
                                  sessao.tipo === 'SOLENE' ? 'Solene' : 'Especial'
                const statusLabel = sessao.status === 'CONCLUIDA' ? 'Concluída' :
                                    sessao.status === 'AGENDADA' ? 'Agendada' :
                                    sessao.status === 'EM_ANDAMENTO' ? 'Em Andamento' :
                                    sessao.status || 'Sem status'
                return (
                  <option key={sessao.id} value={sessao.id}>
                    {sessao.numero}ª {tipoLabel} - {dataFormatada} ({statusLabel})
                  </option>
                )
              })}
            </select>
            
            <Button
              onClick={() => {
                carregarSessoesDisponiveis()
                if (sessaoSelecionada) carregarDados()
              }}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          
          {sessaoAtiva && (
            <>
              <Button onClick={abrirPainelPublico} className="bg-blue-600 hover:bg-blue-700">
                <ExternalLink className="h-4 w-4 mr-2" />
                Painel Público
              </Button>
              
              <Button 
                onClick={transmissaoAtiva ? pararTransmissao : iniciarTransmissao}
                variant={transmissaoAtiva ? "destructive" : "outline"}
                size="sm"
              >
                {transmissaoAtiva ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Parar Transmissão
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Iniciar Transmissão
                  </>
                )}
              </Button>

              <Button onClick={toggleAudio} variant="outline" size="sm">
                {audioAtivo ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>

              <Button onClick={toggleVideo} variant="outline" size="sm">
                {videoAtivo ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
              </Button>

              <Button onClick={gerarRelatorio} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Relatório
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status da Sessão */}
      {sessaoAtiva ? (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-green-600" />
                  Sessão Ativa
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {sessaoAtiva.numeroSessao} - {sessaoAtiva.tipo.toUpperCase()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(sessaoAtiva.status)}>
                  {sessaoAtiva.status.replace('_', ' ').toUpperCase()}
                </Badge>
                {sessaoAtiva.status !== 'concluida' && sessaoAtiva.status !== 'cancelada' && (
                  <Button onClick={finalizarSessao} variant="destructive" size="sm">
                    <Square className="h-4 w-4 mr-2" />
                    Finalizar Sessão
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{new Date(sessaoAtiva.data).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-500">
                    {sessaoAtiva.horarioInicio} - {
                      sessaoAtiva.horarioFim
                        ? sessaoAtiva.horarioFim
                        : sessaoAtiva.status === 'concluida'
                          ? 'Concluída'
                          : sessaoAtiva.status === 'cancelada'
                            ? 'Cancelada'
                            : sessaoAtiva.status === 'agendada'
                              ? 'Agendada'
                              : 'Em andamento'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{sessaoAtiva.presidente}</p>
                  <p className="text-xs text-gray-500">Presidente</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{sessaoAtiva.informacoes.totalItens}</p>
                  <p className="text-xs text-gray-500">Itens na Pauta</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{sessaoAtiva.informacoes.tempoEstimado}min</p>
                  <p className="text-xs text-gray-500">Tempo Estimado</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Pause className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma Sessão Selecionada
              </h3>
              <p className="text-gray-600 mb-4">
                Selecione uma sessão no menu acima para visualizar ou controlar
              </p>
              <p className="text-sm text-gray-500">
                {sessoesDisponiveis.length} sessões disponíveis no sistema
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {sessaoAtiva && (
        <>
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="pauta">Pauta</TabsTrigger>
              <TabsTrigger value="presenca">Presença</TabsTrigger>
              <TabsTrigger value="votacao">Votação</TabsTrigger>
              <TabsTrigger value="tempo">Tempo</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
              <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
            </TabsList>

            {/* Aba Visão Geral */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Estatísticas da Sessão */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Estatísticas da Sessão
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Total de Itens:</span>
                      <span className="font-semibold">{pauta.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Itens Aprovados:</span>
                      <span className="font-semibold text-green-600">
                        {pauta.filter(p => p.status === 'aprovado').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Itens Rejeitados:</span>
                      <span className="font-semibold text-red-600">
                        {pauta.filter(p => p.status === 'rejeitado').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Itens Pendentes:</span>
                      <span className="font-semibold text-gray-600">
                        {pauta.filter(p => p.status === 'pendente').length}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Presença */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Presença
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Total:</span>
                      <span className="font-semibold">{presenca.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Presentes:</span>
                      <span className="font-semibold text-green-600">
                        {presenca.filter(p => p.presente).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Ausentes:</span>
                      <span className="font-semibold text-red-600">
                        {presenca.filter(p => !p.presente).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Percentual:</span>
                      <span className="font-semibold">
                        {Math.round((presenca.filter(p => p.presente).length / presenca.length) * 100)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Status da Sessão */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Tempo da Sessão
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Status:</span>
                      <span className="font-semibold">
                        {sessaoAtiva?.status === 'concluida' ? 'Concluída' :
                         sessaoAtiva?.status === 'em_andamento' ? 'Em Andamento' :
                         sessaoAtiva?.status === 'agendada' ? 'Agendada' :
                         sessaoAtiva?.status === 'cancelada' ? 'Cancelada' : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Início:</span>
                      <span className="font-semibold">{sessaoAtiva?.horarioInicio || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Término:</span>
                      <span className="font-semibold">
                        {sessaoAtiva?.horarioFim ||
                         (sessaoAtiva?.status === 'concluida' ? 'Concluída' :
                          sessaoAtiva?.status === 'em_andamento' ? 'Em andamento' : '-')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Aba Pauta */}
            <TabsContent value="pauta" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Itens da Pauta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pauta.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{item.titulo}</h3>
                            <p className="text-sm text-gray-600 mt-1">{item.descricao}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-sm text-gray-500">Autor: {item.autor}</span>
                              <span className="text-sm text-gray-500">Ordem: {item.ordem}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getPrioridadeColor(item.prioridade)}>
                              {item.prioridade.toUpperCase()}
                            </Badge>
                            <Badge className={getItemStatusColor(item.status)}>
                              {item.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Timer className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              Tempo estimado: {item.tempoEstimado}min
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {item.status === 'pendente' && (
                              <Button 
                                onClick={() => iniciarItem(item.id)}
                                size="sm"
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Iniciar
                              </Button>
                            )}
                            {item.status === 'em_discussao' && (
                              <>
                                <Button 
                                  onClick={() => finalizarItem(item.id, true)}
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-600"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Aprovar
                                </Button>
                                <Button 
                                  onClick={() => finalizarItem(item.id, false)}
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-600"
                                >
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  Rejeitar
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Presença */}
            <TabsContent value="presenca" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Controle de Presença - Legislatura Ativa
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Todos os parlamentares da legislatura atual
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {presenca.map((p) => (
                      <div key={p.parlamentarId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-camara-primary rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {p.parlamentarNome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{p.parlamentarNome}</h3>
                            <p className="text-sm text-gray-500">{p.parlamentarPartido}</p>
                            {p.horarioEntrada && (
                              <p className="text-xs text-green-600">
                                Chegou: {p.horarioEntrada.toLocaleTimeString('pt-BR')}
                              </p>
                            )}
                            {p.justificativa && (
                              <p className="text-xs text-yellow-600">
                                Justificativa: {p.justificativa}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={
                            p.presente ? "default" : 
                            p.justificada ? "secondary" : 
                            "destructive"
                          }>
                            {p.presente ? "Presente" : 
                             p.justificada ? "Justificada" : 
                             "Ausente"}
                          </Badge>
                          
                          <div className="flex gap-1">
                            <Button
                              onClick={() => registrarPresenca(p.parlamentarId, 'presente')}
                              size="sm"
                              variant={p.presente ? "default" : "outline"}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              disabled={p.presente}
                            >
                              ✓ Presente
                            </Button>
                            
                            <Button
                              onClick={() => registrarPresenca(p.parlamentarId, 'ausente')}
                              size="sm"
                              variant={p.ausente ? "destructive" : "outline"}
                              className="bg-red-600 hover:bg-red-700 text-white"
                              disabled={p.ausente && !p.justificada}
                            >
                              ✗ Ausente
                            </Button>
                            
                            <Button
                              onClick={() => {
                                const justificativa = prompt('Digite a justificativa da ausência:')
                                if (justificativa) {
                                  registrarPresenca(p.parlamentarId, 'justificada', justificativa)
                                }
                              }}
                              size="sm"
                              variant={p.justificada ? "secondary" : "outline"}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white"
                              disabled={p.justificada}
                            >
                              📝 Justificar
                            </Button>
                          </div>
                          
                          {p.presente && (
                            <Button
                              onClick={() => iniciarDiscurso(p.parlamentarId, p.parlamentarNome)}
                              size="sm"
                              variant="outline"
                              className="bg-orange-100 text-orange-800 hover:bg-orange-200"
                              disabled={discursoAtivo && discursoParlamentar !== p.parlamentarId}
                            >
                              <Mic className="h-4 w-4 mr-1" />
                              Discurso
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Votação */}
            <TabsContent value="votacao" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Controle de Votação */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Vote className="h-5 w-5 text-blue-600" />
                      Controle de Votação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {pauta.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{item.titulo}</h3>
                            <p className="text-sm text-gray-600 mt-1">{item.descricao}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-sm text-gray-500">Autor: {item.autor}</span>
                              <Badge className={getItemStatusColor(item.status)}>
                                {item.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {item.status === 'em_discussao' && (
                            <Button 
                              onClick={() => iniciarVotacao(item.id)}
                              className="bg-green-600 hover:bg-green-700"
                              size="sm"
                            >
                              <Vote className="h-4 w-4 mr-1" />
                              Iniciar Votação
                            </Button>
                          )}
                          {item.status === 'votacao' && (
                            <Button 
                              onClick={() => finalizarVotacao(`votacao-${item.id}`)}
                              variant="destructive"
                              size="sm"
                            >
                              <Square className="h-4 w-4 mr-1" />
                              Finalizar Votação
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Resultados da Votação */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      Resultados da Votação
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {votacaoAtiva ? (
                      <div className="space-y-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <h3 className="text-lg font-semibold text-blue-900 mb-2">
                            Votação em Andamento
                          </h3>
                          <p className="text-blue-700">
                            Aguardando votos dos parlamentares...
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">8</div>
                            <div className="text-sm text-green-700">SIM</div>
                          </div>
                          <div className="text-center p-3 bg-red-50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">2</div>
                            <div className="text-sm text-red-700">NÃO</div>
                          </div>
                          <div className="text-center p-3 bg-yellow-50 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-600">1</div>
                            <div className="text-sm text-yellow-700">ABSTENÇÕES</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-900">Votos Registrados:</h4>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {presenca.filter(p => p.presente).map((p) => (
                              <div key={p.parlamentarId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm font-medium">{p.parlamentarNome}</span>
                                <Badge className="bg-blue-100 text-blue-800">SIM</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Vote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Nenhuma Votação Ativa
                        </h3>
                        <p className="text-gray-600">
                          Inicie uma votação para ver os resultados aqui
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Aba Controle de Tempo */}
            <TabsContent value="tempo" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cronômetro Principal */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Timer className="h-5 w-5 text-blue-600" />
                      Cronômetro da Sessão
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-6xl font-bold text-blue-600 mb-4">
                        {Math.floor(tempoRestante / 60)}:{(tempoRestante % 60).toString().padStart(2, '0')}
                      </div>
                      <div className="flex justify-center gap-2">
                        <Button onClick={() => setTempoRestante(prev => prev + 300)} variant="outline" size="sm">
                          +5min
                        </Button>
                        <Button onClick={() => setTempoRestante(prev => Math.max(0, prev - 300))} variant="outline" size="sm">
                          -5min
                        </Button>
                        <Button onClick={() => setTempoRestante(0)} variant="destructive" size="sm">
                          <Square className="h-4 w-4 mr-2" />
                          Reset
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600">Início</p>
                        <p className="font-semibold">{sessaoAtiva?.dataInicio ? new Date(sessaoAtiva.dataInicio).toLocaleTimeString() : '--:--'}</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600">Pausa</p>
                        <p className="font-semibold">16:00</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Controle de Tempo por Item */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      Tempo por Item da Pauta
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {pauta.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{item.titulo}</h4>
                            <p className="text-xs text-gray-600">Tempo estimado: {item.tempoEstimado}min</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={
                              item.tempoEstimado > 30 ? 'bg-red-100 text-red-800' :
                              item.tempoEstimado > 15 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }>
                              {item.tempoEstimado > 30 ? 'Longo' : item.tempoEstimado > 15 ? 'Médio' : 'Curto'}
                            </Badge>
                            <Button size="sm" variant="outline">
                              <Play className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Alertas de Tempo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      Alertas de Tempo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div>
                          <h4 className="font-semibold text-yellow-800">Aviso de Tempo</h4>
                          <p className="text-sm text-yellow-700">15 minutos restantes na sessão</p>
                        </div>
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                        <div>
                          <h4 className="font-semibold text-red-800">Tempo Esgotado</h4>
                          <p className="text-sm text-red-700">Item da pauta excedeu tempo estimado</p>
                        </div>
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div>
                          <h4 className="font-semibold text-green-800">No Prazo</h4>
                          <p className="text-sm text-green-700">Sessão dentro do tempo previsto</p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Configurações de Tempo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-blue-600" />
                      Configurações de Tempo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Alertas Automáticos</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Aviso 15min antes</span>
                          <Button variant="default" size="sm">ON</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Aviso 5min antes</span>
                          <Button variant="default" size="sm">ON</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Som de alerta</span>
                          <Button variant="outline" size="sm">OFF</Button>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Tempo da Sessão</h4>
                      <div className="bg-gray-50 p-4 rounded-lg mb-3">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600 mb-2">
                            {Math.floor(tempoSessao / 3600).toString().padStart(2, '0')}:
                            {Math.floor((tempoSessao % 3600) / 60).toString().padStart(2, '0')}:
                            {(tempoSessao % 60).toString().padStart(2, '0')}
                          </div>
                          <p className="text-sm text-gray-600">
                            {cronometroAtivo ? 'Cronômetro Ativo' : 'Cronômetro Parado'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm">2h</Button>
                        <Button variant="default" size="sm">3h</Button>
                        <Button variant="outline" size="sm">4h</Button>
                        <Button variant="outline" size="sm">5h</Button>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Tempo Restante da Votação</h4>
                      {votacaoAtiva && tempoRestante > 0 ? (
                        <div className="bg-red-50 p-4 rounded-lg mb-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600 mb-2">
                              {Math.floor(tempoRestante / 60).toString().padStart(2, '0')}:
                              {(tempoRestante % 60).toString().padStart(2, '0')}
                            </div>
                            <p className="text-sm text-red-600">Tempo Restante</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg mb-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-400 mb-2">
                              --:--
                            </div>
                            <p className="text-sm text-gray-500">Nenhuma Votação Ativa</p>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" onClick={() => configurarTempoDiscurso(60)}>1min</Button>
                        <Button variant="outline" size="sm" onClick={() => configurarTempoDiscurso(120)}>2min</Button>
                        <Button variant="outline" size="sm" onClick={() => configurarTempoDiscurso(180)}>3min</Button>
                        <Button variant="default" size="sm" onClick={() => configurarTempoDiscurso(300)}>5min</Button>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Tempo de Discurso</h4>
                      {discursoAtivo && tempoDiscurso > 0 ? (
                        <div className="bg-orange-50 p-4 rounded-lg mb-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600 mb-2">
                              {Math.floor(tempoDiscurso / 60).toString().padStart(2, '0')}:
                              {(tempoDiscurso % 60).toString().padStart(2, '0')}
                            </div>
                            <p className="text-sm text-orange-600">Discurso em andamento</p>
                            <p className="text-xs text-orange-500 mt-1">
                              Parlamentar: {discursoParlamentar ? presenca.find(p => p.parlamentarId === discursoParlamentar)?.parlamentarNome || 'N/A' : 'N/A'}
                            </p>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              className="mt-2"
                              onClick={finalizarDiscurso}
                            >
                              Finalizar Discurso
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg mb-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-400 mb-2">
                              {Math.floor(tempoDiscursoConfigurado / 60).toString().padStart(2, '0')}:
                              {(tempoDiscursoConfigurado % 60).toString().padStart(2, '0')}
                            </div>
                            <p className="text-sm text-gray-500">Tempo Configurado</p>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" onClick={() => configurarTempoDiscurso(60)}>1min</Button>
                        <Button variant="outline" size="sm" onClick={() => configurarTempoDiscurso(120)}>2min</Button>
                        <Button variant="outline" size="sm" onClick={() => configurarTempoDiscurso(180)}>3min</Button>
                        <Button variant="default" size="sm" onClick={() => configurarTempoDiscurso(300)}>5min</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Aba Sistema de Chat */}
            <TabsContent value="chat" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chat Principal */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                      Chat da Sessão
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Área de Mensagens */}
                      <div className="h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50 space-y-3">
                        {/* Mensagens Mock */}
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            P
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">Pantoja</span>
                              <span className="text-xs text-gray-500">14:30</span>
                            </div>
                            <p className="text-sm text-gray-700">Vamos iniciar a discussão do primeiro item da pauta.</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            D
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">Diego</span>
                              <span className="text-xs text-gray-500">14:32</span>
                            </div>
                            <p className="text-sm text-gray-700">Concordo, vamos começar.</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            M
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">Mickael</span>
                              <span className="text-xs text-gray-500">14:35</span>
                            </div>
                            <p className="text-sm text-gray-700">Tenho uma dúvida sobre o item 3 da pauta.</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Área de Envio */}
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Digite sua mensagem..."
                          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Button size="sm">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Controles de Moderação */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-blue-600" />
                      Controles de Moderação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Status do Chat</h4>
                      <Badge className="bg-green-100 text-green-800">ATIVO</Badge>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Ações Rápidas</h4>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <Pause className="h-4 w-4 mr-2" />
                          Pausar Chat
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Limpar Chat
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <Download className="h-4 w-4 mr-2" />
                          Exportar Chat
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Participantes Online</h4>
                      <div className="space-y-2">
                        {presenca.filter(p => p.presente).map((p) => (
                          <div key={p.parlamentarId} className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium">{p.parlamentarNome}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Configurações</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Moderação automática</span>
                          <Button variant="default" size="sm">ON</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Notificações sonoras</span>
                          <Button variant="outline" size="sm">OFF</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Histórico persistente</span>
                          <Button variant="default" size="sm">ON</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Aba Relatórios */}
            <TabsContent value="relatorios" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Relatório de Sessão */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      Relatório da Sessão
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <h4 className="text-2xl font-bold text-blue-600">{pauta.length}</h4>
                        <p className="text-sm text-gray-600">Total de Itens</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <h4 className="text-2xl font-bold text-green-600">{presenca.filter(p => p.presente).length}</h4>
                        <p className="text-sm text-gray-600">Parlamentares Presentes</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">Estatísticas da Pauta</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Itens Aprovados:</span>
                          <span className="font-semibold text-green-600">{pauta.filter(item => item.status === 'APROVADO').length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Itens Rejeitados:</span>
                          <span className="font-semibold text-red-600">{pauta.filter(item => item.status === 'REJEITADO').length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Itens Pendentes:</span>
                          <span className="font-semibold text-yellow-600">{pauta.filter(item => item.status === 'PENDENTE').length}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar PDF
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Share2 className="h-4 w-4 mr-2" />
                        Compartilhar
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Relatório de Presença */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Relatório de Presença
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <h4 className="text-2xl font-bold text-green-600">{presenca.filter(p => p.presente).length}</h4>
                        <p className="text-sm text-gray-600">Presentes</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <h4 className="text-2xl font-bold text-red-600">{presenca.filter(p => !p.presente).length}</h4>
                        <p className="text-sm text-gray-600">Ausentes</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">Lista de Presença</h4>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {presenca.map((p) => (
                          <div key={p.parlamentarId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium">{p.parlamentarNome}</span>
                            <Badge className={p.presente ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {p.presente ? 'Presente' : 'Ausente'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar Lista
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Relatório de Votação */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Vote className="h-5 w-5 text-blue-600" />
                      Relatório de Votação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Votações Realizadas</h4>
                      <div className="space-y-3">
                        {pauta.filter(item => item.votacao && item.votacao.resultado).map((item) => (
                          <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                            <h5 className="font-semibold text-sm">{item.titulo}</h5>
                            <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                              <div className="bg-green-100 p-2 rounded">
                                <p className="text-lg font-bold text-green-600">{item.votacao?.votos.sim || 0}</p>
                                <p className="text-xs text-gray-600">SIM</p>
                              </div>
                              <div className="bg-red-100 p-2 rounded">
                                <p className="text-lg font-bold text-red-600">{item.votacao?.votos.nao || 0}</p>
                                <p className="text-xs text-gray-600">NÃO</p>
                              </div>
                              <div className="bg-yellow-100 p-2 rounded">
                                <p className="text-lg font-bold text-yellow-600">{item.votacao?.votos.abstencoes || 0}</p>
                                <p className="text-xs text-gray-600">ABST.</p>
                              </div>
                            </div>
                            <div className="mt-2 text-center">
                              <Badge className={
                                item.votacao?.resultado === 'APROVADO' ? 'bg-green-100 text-green-800' :
                                item.votacao?.resultado === 'REJEITADO' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }>
                                {item.votacao?.resultado || 'PENDENTE'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar Votação
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Gráficos
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Relatório de Tempo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Timer className="h-5 w-5 text-blue-600" />
                      Relatório de Tempo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <h4 className="text-2xl font-bold text-blue-600">
                          {sessaoAtiva ? Math.floor((Date.now() - new Date(sessaoAtiva.dataInicio).getTime()) / (1000 * 60)) : 0}
                        </h4>
                        <p className="text-sm text-gray-600">Minutos Decorridos</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <h4 className="text-2xl font-bold text-orange-600">
                          {pauta.reduce((total, item) => total + item.tempoEstimado, 0)}
                        </h4>
                        <p className="text-sm text-gray-600">Tempo Estimado Total</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">Controle de Tempo por Item</h4>
                      <div className="space-y-1">
                        {pauta.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium truncate">{item.titulo}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">{item.tempoEstimado}min</span>
                              <Badge className={
                                item.tempoEstimado > 30 ? 'bg-red-100 text-red-800' :
                                item.tempoEstimado > 15 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }>
                                {item.tempoEstimado > 30 ? 'Longo' : item.tempoEstimado > 15 ? 'Médio' : 'Curto'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar Tempo
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Clock className="h-4 w-4 mr-2" />
                        Cronômetro
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Aba Configurações */}
            <TabsContent value="configuracoes" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Configurações Gerais */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-blue-600" />
                      Configurações Gerais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">Auto Refresh</h4>
                        <p className="text-sm text-gray-600">Atualizar dados automaticamente</p>
                      </div>
                      <Button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        variant={autoRefresh ? "default" : "outline"}
                        size="sm"
                      >
                        {autoRefresh ? "ON" : "OFF"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">Transmissão</h4>
                        <p className="text-sm text-gray-600">Status da transmissão ao vivo</p>
                      </div>
                      <Badge className={transmissaoAtiva ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {transmissaoAtiva ? 'ATIVA' : 'INATIVA'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">Áudio</h4>
                        <p className="text-sm text-gray-600">Controle de áudio da transmissão</p>
                      </div>
                      <Button
                        onClick={toggleAudio}
                        variant={audioAtivo ? "default" : "outline"}
                        size="sm"
                      >
                        {audioAtivo ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">Vídeo</h4>
                        <p className="text-sm text-gray-600">Controle de vídeo da transmissão</p>
                      </div>
                      <Button
                        onClick={toggleVideo}
                        variant={videoAtivo ? "default" : "outline"}
                        size="sm"
                      >
                        {videoAtivo ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">Painel Público</h4>
                        <p className="text-sm text-gray-600">Status do painel público</p>
                      </div>
                      <Badge className={painelPublicoAberto ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                        {painelPublicoAberto ? 'ABERTO' : 'FECHADO'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Configurações de Interface */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-blue-600" />
                      Interface do Painel
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Tema do Painel Público</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" size="sm" className="bg-white border-gray-300">
                          Claro
                        </Button>
                        <Button variant="outline" size="sm" className="bg-gray-800 text-white border-gray-600">
                          Escuro
                        </Button>
                        <Button variant="outline" size="sm" className="bg-blue-600 text-white border-blue-600">
                          Azul
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Elementos Visíveis</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Mostrar Presença</span>
                          <Button variant="default" size="sm">ON</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Mostrar Votação</span>
                          <Button variant="default" size="sm">ON</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Mostrar Cronômetro</span>
                          <Button variant="default" size="sm">ON</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Mostrar Estatísticas</span>
                          <Button variant="default" size="sm">ON</Button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Intervalo de Atualização</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" size="sm">5s</Button>
                        <Button variant="default" size="sm">10s</Button>
                        <Button variant="outline" size="sm">30s</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Configurações de Notificações */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                      Notificações
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">Alertas de Tempo</h4>
                        <p className="text-sm text-gray-600">Notificar sobre prazos</p>
                      </div>
                      <Button variant="default" size="sm">ON</Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">Notificações de Votação</h4>
                        <p className="text-sm text-gray-600">Alertar sobre votações</p>
                      </div>
                      <Button variant="default" size="sm">ON</Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">Som de Alertas</h4>
                        <p className="text-sm text-gray-600">Reproduzir sons</p>
                      </div>
                      <Button variant="outline" size="sm">OFF</Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">Notificações Push</h4>
                        <p className="text-sm text-gray-600">Notificações do navegador</p>
                      </div>
                      <Button variant="default" size="sm">ON</Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Configurações de Segurança */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                      Segurança
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">Log de Atividades</h4>
                        <p className="text-sm text-gray-600">Registrar todas as ações</p>
                      </div>
                      <Button variant="default" size="sm">ON</Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">Backup Automático</h4>
                        <p className="text-sm text-gray-600">Salvar dados automaticamente</p>
                      </div>
                      <Button variant="default" size="sm">ON</Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">Autenticação</h4>
                        <p className="text-sm text-gray-600">Requerir login</p>
                      </div>
                      <Button variant="default" size="sm">ON</Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">Criptografia</h4>
                        <p className="text-sm text-gray-600">Dados criptografados</p>
                      </div>
                      <Button variant="default" size="sm">ON</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
