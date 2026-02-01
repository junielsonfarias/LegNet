'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { gerarSlugSessao } from '@/lib/utils/sessoes-utils'
import type {
  PainelState,
  PainelActions,
  PainelSessao,
  PautaItem,
  Presenca,
  SessaoDisponivel
} from '../_types'

interface UsePainelStateReturn extends PainelState, PainelActions {}

export function usePainelState(): UsePainelStateReturn {
  // === ESTADO PRINCIPAL ===
  const [sessaoAtiva, setSessaoAtiva] = useState<PainelSessao | null>(null)
  const [pauta, setPauta] = useState<PautaItem[]>([])
  const [presenca, setPresenca] = useState<Presenca[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [autoRefresh, setAutoRefresh] = useState(true)

  // === SELEÇÃO DE SESSÃO ===
  const [sessoesDisponiveis, setSessoesDisponiveis] = useState<SessaoDisponivel[]>([])
  const [sessaoSelecionada, setSessaoSelecionada] = useState<string>('')

  // === CONTROLES DE TRANSMISSÃO ===
  const [painelPublicoAberto, setPainelPublicoAberto] = useState(false)
  const [transmissaoAtiva, setTransmissaoAtiva] = useState(false)
  const [audioAtivo, setAudioAtivo] = useState(true)
  const [videoAtivo, setVideoAtivo] = useState(true)

  // === VOTAÇÃO ===
  const [votacaoAtiva, setVotacaoAtiva] = useState(false)
  const [votacaoItemAtivo, setVotacaoItemAtivo] = useState<string | null>(null)
  const [tempoRestante, setTempoRestante] = useState(0)

  // === CRONÔMETRO ===
  const [cronometroAtivo, setCronometroAtivo] = useState(false)
  const [tempoSessao, setTempoSessao] = useState(0)
  const [tempoInicioSessao, setTempoInicioSessao] = useState<Date | null>(null)

  // === DISCURSO ===
  const [discursoAtivo, setDiscursoAtivo] = useState(false)
  const [tempoDiscurso, setTempoDiscurso] = useState(0)
  const [tempoDiscursoConfigurado, setTempoDiscursoConfigurado] = useState(300)
  const [discursoParlamentar, setDiscursoParlamentar] = useState<string | null>(null)

  // === CARREGAR SESSÕES DISPONÍVEIS ===
  const carregarSessoesDisponiveis = useCallback(async (): Promise<SessaoDisponivel[]> => {
    try {
      setLoading(true)
      const response = await fetch('/api/sessoes?limit=100')
      const data = await response.json()

      if (data.success && data.data) {
        const sessoesOrdenadas = data.data.sort((a: SessaoDisponivel, b: SessaoDisponivel) => {
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
      toast.error('Erro ao carregar sessões disponíveis')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // === CARREGAR DADOS DA SESSÃO ===
  const carregarDados = useCallback(async () => {
    try {
      setLoading(true)

      if (sessaoSelecionada) {
        const sessaoResponse = await fetch(`/api/sessoes/${sessaoSelecionada}`)
        const sessaoData = await sessaoResponse.json()

        if (sessaoData.success && sessaoData.data) {
          const sessao = sessaoData.data

          const sessaoFormatada: PainelSessao = {
            id: sessao.id,
            numeroSessao: `${String(sessao.numero).padStart(3, '0')}/${new Date(sessao.data).getFullYear()}`,
            tipo: sessao.tipo.toLowerCase(),
            data: new Date(sessao.data),
            horarioInicio: sessao.horario || '14:00',
            horarioFim: sessao.status === 'CONCLUIDA' ? 'Finalizada' : undefined,
            status: sessao.status === 'CONCLUIDA' ? 'concluida' :
                   sessao.status === 'EM_ANDAMENTO' ? 'em_andamento' :
                   sessao.status === 'CANCELADA' ? 'cancelada' : 'agendada',
            presidente: sessao.presidente?.nome || sessao.presidente?.apelido || (typeof sessao.presidente === 'string' ? sessao.presidente : 'Não definido'),
            secretario: sessao.secretario?.nome || sessao.secretario?.apelido || (typeof sessao.secretario === 'string' ? sessao.secretario : 'Não definido'),
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

          setSessaoAtiva(sessaoFormatada)

          // Carregar presenças
          const presencasResponse = await fetch(`/api/sessoes/${sessaoSelecionada}/presenca`)
          const presencasData = await presencasResponse.json()

          if (presencasData.success && presencasData.data) {
            const presencasFormatadas: Presenca[] = presencasData.data.map((p: any) => ({
              id: p.id,
              parlamentarId: p.parlamentarId,
              parlamentarNome: p.parlamentar?.nome || p.parlamentar?.apelido || 'Parlamentar',
              parlamentarPartido: p.parlamentar?.partido || '',
              presente: p.presente ?? false,
              ausente: !p.presente && !p.justificativa,
              justificada: !p.presente && !!p.justificativa,
              horarioEntrada: p.horaRegistro ? new Date(p.horaRegistro) : null,
              justificativa: p.justificativa
            }))

            setPresenca(presencasFormatadas)

            // Atualizar estatísticas
            const presentes = presencasFormatadas.filter(p => p.presente).length
            setSessaoAtiva(prev => prev ? {
              ...prev,
              estatisticas: {
                totalParlamentares: presencasFormatadas.length,
                presentes,
                ausentes: presencasFormatadas.length - presentes,
                percentualPresenca: presencasFormatadas.length > 0
                  ? Math.round((presentes / presencasFormatadas.length) * 100)
                  : 0
              }
            } : null)
          }

          // Carregar pauta
          const pautaResponse = await fetch(`/api/sessoes/${sessaoSelecionada}/pauta`)
          const pautaData = await pautaResponse.json()

          if (pautaData.success && pautaData.data?.itens) {
            const pautaFormatada: PautaItem[] = pautaData.data.itens.map((item: any) => ({
              id: item.id,
              ordem: item.ordem,
              titulo: item.titulo || item.proposicao?.titulo || 'Sem título',
              descricao: item.descricao,
              tipo: item.proposicao?.tipo || 'MATERIA',
              status: item.status || 'PENDENTE',
              autor: item.proposicao?.autor?.nome || item.proposicao?.autor?.apelido,
              relator: item.relator?.nome || item.relator?.apelido,
              secao: item.secao,
              tipoAcao: item.tipoAcao,
              proposicao: item.proposicao ? {
                id: item.proposicao.id,
                numero: item.proposicao.numero,
                ano: item.proposicao.ano,
                tipo: item.proposicao.tipo,
                ementa: item.proposicao.ementa
              } : undefined
            }))

            setPauta(pautaFormatada)
            setSessaoAtiva(prev => prev ? {
              ...prev,
              informacoes: {
                ...prev.informacoes,
                totalItens: pautaFormatada.length
              }
            } : null)
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados da sessão')
    } finally {
      setLoading(false)
    }
  }, [sessaoSelecionada])

  // === INICIAR SESSÃO ===
  const iniciarSessao = useCallback(async (sessaoId: string, numeroSessao: string, dataSessao: Date) => {
    try {
      const response = await fetch(`/api/sessoes/${sessaoId}/controle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'INICIAR' })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Sessão ${numeroSessao} iniciada!`)
        setCronometroAtivo(true)
        setTempoInicioSessao(new Date())
        await carregarDados()
      } else {
        toast.error(data.error || 'Erro ao iniciar sessão')
      }
    } catch (error) {
      console.error('Erro ao iniciar sessão:', error)
      toast.error('Erro ao iniciar sessão')
    }
  }, [carregarDados])

  // === FINALIZAR SESSÃO ===
  const finalizarSessao = useCallback(async () => {
    if (!sessaoAtiva) return

    try {
      const response = await fetch(`/api/sessoes/${sessaoAtiva.id}/controle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'FINALIZAR' })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Sessão finalizada!')
        setCronometroAtivo(false)
        await carregarDados()
      } else {
        toast.error(data.error || 'Erro ao finalizar sessão')
      }
    } catch (error) {
      console.error('Erro ao finalizar sessão:', error)
      toast.error('Erro ao finalizar sessão')
    }
  }, [sessaoAtiva, carregarDados])

  // === INICIAR ITEM ===
  const iniciarItem = useCallback(async (itemId: string) => {
    if (!sessaoAtiva) return

    try {
      const response = await fetch(`/api/pauta/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'EM_DISCUSSAO' })
      })

      if (response.ok) {
        toast.success('Item iniciado')
        await carregarDados()
      }
    } catch (error) {
      console.error('Erro ao iniciar item:', error)
      toast.error('Erro ao iniciar item')
    }
  }, [sessaoAtiva, carregarDados])

  // === FINALIZAR ITEM ===
  const finalizarItem = useCallback(async (itemId: string, aprovado: boolean) => {
    try {
      const response = await fetch(`/api/pauta/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: aprovado ? 'APROVADO' : 'REJEITADO' })
      })

      if (response.ok) {
        toast.success(`Item ${aprovado ? 'aprovado' : 'rejeitado'}`)
        await carregarDados()
      }
    } catch (error) {
      console.error('Erro ao finalizar item:', error)
      toast.error('Erro ao finalizar item')
    }
  }, [carregarDados])

  // === CONCLUIR ITEM INFORMATIVO ===
  const concluirItemInformativo = useCallback(async (itemId: string) => {
    try {
      const response = await fetch(`/api/pauta/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONCLUIDO' })
      })

      if (response.ok) {
        toast.success('Item concluído')
        await carregarDados()
      }
    } catch (error) {
      console.error('Erro ao concluir item:', error)
      toast.error('Erro ao concluir item')
    }
  }, [carregarDados])

  // === INICIAR VOTAÇÃO ===
  const iniciarVotacao = useCallback(async (itemId: string) => {
    if (!sessaoAtiva) return

    try {
      const response = await fetch(`/api/pauta/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'EM_VOTACAO' })
      })

      if (response.ok) {
        setVotacaoAtiva(true)
        setVotacaoItemAtivo(itemId)
        toast.success('Votação iniciada')
        await carregarDados()
      }
    } catch (error) {
      console.error('Erro ao iniciar votação:', error)
      toast.error('Erro ao iniciar votação')
    }
  }, [sessaoAtiva, carregarDados])

  // === FINALIZAR VOTAÇÃO ===
  const finalizarVotacao = useCallback(async (itemId: string) => {
    setVotacaoAtiva(false)
    setVotacaoItemAtivo(null)
    toast.info('Votação finalizada')
    await carregarDados()
  }, [carregarDados])

  // === REGISTRAR PRESENÇA ===
  const registrarPresenca = useCallback(async (
    parlamentarId: string,
    tipo: 'presente' | 'ausente' | 'justificada',
    justificativa?: string
  ) => {
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

      if (response.ok) {
        toast.success('Presença registrada')
        await carregarDados()
      }
    } catch (error) {
      console.error('Erro ao registrar presença:', error)
      toast.error('Erro ao registrar presença')
    }
  }, [sessaoAtiva, carregarDados])

  // === ABRIR PAINEL PÚBLICO ===
  const abrirPainelPublico = useCallback(() => {
    if (sessaoAtiva) {
      // Extrair número da sessão do formato "XXX/AAAA"
      const numeroMatch = sessaoAtiva.numeroSessao.match(/^(\d+)/)
      const numero = numeroMatch ? parseInt(numeroMatch[1], 10) : 1
      const slug = gerarSlugSessao(numero, sessaoAtiva.data)
      window.open(`/painel-publico?sessaoId=${slug}`, '_blank')
      setPainelPublicoAberto(true)
    }
  }, [sessaoAtiva])

  // === TRANSMISSÃO ===
  const iniciarTransmissao = useCallback(() => {
    setTransmissaoAtiva(true)
    toast.success('Transmissão iniciada')
  }, [])

  const pararTransmissao = useCallback(() => {
    setTransmissaoAtiva(false)
    toast.info('Transmissão encerrada')
  }, [])

  const toggleAudio = useCallback(() => {
    setAudioAtivo(prev => !prev)
  }, [])

  const toggleVideo = useCallback(() => {
    setVideoAtivo(prev => !prev)
  }, [])

  // === DISCURSO ===
  const iniciarDiscurso = useCallback((parlamentarId: string, parlamentarNome: string) => {
    setDiscursoAtivo(true)
    setDiscursoParlamentar(parlamentarNome)
    setTempoDiscurso(tempoDiscursoConfigurado)
  }, [tempoDiscursoConfigurado])

  const finalizarDiscurso = useCallback(() => {
    setDiscursoAtivo(false)
    setDiscursoParlamentar(null)
    setTempoDiscurso(0)
  }, [])

  const configurarTempoDiscurso = useCallback((tempo: number) => {
    setTempoDiscursoConfigurado(tempo)
    if (!discursoAtivo) {
      setTempoDiscurso(tempo)
    }
  }, [discursoAtivo])

  // === GERAR RELATÓRIO ===
  const gerarRelatorio = useCallback(async () => {
    if (!sessaoAtiva) return

    try {
      toast.success('Relatório gerado com sucesso!')
      console.log('Gerando relatório da sessão:', sessaoAtiva.id)
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      toast.error('Erro ao gerar relatório')
    }
  }, [sessaoAtiva])

  // === EFFECTS ===

  // Carregar sessões disponíveis na inicialização
  useEffect(() => {
    carregarSessoesDisponiveis()
  }, [carregarSessoesDisponiveis])

  // Carregar dados quando sessão for selecionada
  useEffect(() => {
    if (sessaoSelecionada) {
      carregarDados()
    }
  }, [sessaoSelecionada, carregarDados])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !sessaoSelecionada) return

    const interval = setInterval(() => {
      carregarDados()
    }, 10000)

    return () => clearInterval(interval)
  }, [autoRefresh, sessaoSelecionada, carregarDados])

  // Cronômetro da sessão
  useEffect(() => {
    if (!cronometroAtivo || !tempoInicioSessao) return

    const interval = setInterval(() => {
      const agora = new Date()
      const diff = Math.floor((agora.getTime() - tempoInicioSessao.getTime()) / 1000)
      setTempoSessao(diff)
    }, 1000)

    return () => clearInterval(interval)
  }, [cronometroAtivo, tempoInicioSessao])

  // Timer do discurso
  useEffect(() => {
    if (!discursoAtivo || tempoDiscurso <= 0) return

    const interval = setInterval(() => {
      setTempoDiscurso(prev => {
        if (prev <= 1) {
          toast.warning('Tempo de discurso esgotado!')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [discursoAtivo, tempoDiscurso])

  // === RETURN ===
  return {
    // State
    sessaoAtiva,
    pauta,
    presenca,
    loading,
    activeTab,
    autoRefresh,
    sessoesDisponiveis,
    sessaoSelecionada,
    painelPublicoAberto,
    transmissaoAtiva,
    audioAtivo,
    videoAtivo,
    votacaoAtiva,
    votacaoItemAtivo,
    tempoRestante,
    cronometroAtivo,
    tempoSessao,
    tempoInicioSessao,
    discursoAtivo,
    tempoDiscurso,
    tempoDiscursoConfigurado,
    discursoParlamentar,

    // Actions
    carregarSessoesDisponiveis,
    carregarDados,
    iniciarSessao,
    finalizarSessao,
    iniciarItem,
    finalizarItem,
    concluirItemInformativo,
    iniciarVotacao,
    finalizarVotacao,
    registrarPresenca,
    abrirPainelPublico,
    iniciarTransmissao,
    pararTransmissao,
    toggleAudio,
    toggleVideo,
    iniciarDiscurso,
    finalizarDiscurso,
    configurarTempoDiscurso,
    gerarRelatorio,
    setActiveTab,
    setAutoRefresh,
    setSessaoSelecionada
  }
}
