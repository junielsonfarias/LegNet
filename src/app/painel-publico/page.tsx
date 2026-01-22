'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Clock,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Calendar,
  Monitor,
  Vote,
  Timer,
  User,
  AlertCircle,
  Minus,
  ListOrdered,
  ChevronLeft,
  ChevronRight,
  Flag,
  History
} from 'lucide-react'

interface Sessao {
  id: string
  numero: number
  tipo: string
  data: string
  horario: string | null
  local: string | null
  status: string
  descricao: string | null
  tempoInicio: string | null
  pautaSessao?: {
    itens: PautaItem[]
  }
  presencas?: Presenca[]
  quorum?: {
    total: number
    presentes: number
    ausentes: number
    percentual: number
  }
}

interface PautaItem {
  id: string
  titulo: string
  descricao: string | null
  secao: string
  ordem: number
  status: string
  tipoAcao?: 'LEITURA' | 'DISCUSSAO' | 'VOTACAO' | 'COMUNICADO' | 'HOMENAGEM' | null
  iniciadoEm?: string | null
  finalizadoEm?: string | null
  proposicao?: {
    id: string
    numero: number
    ano: number
    titulo: string
    tipo: string
    status: string
    votacoes?: VotacaoRegistro[]
    autor?: {
      id: string
      nome: string
      apelido: string | null
    }
  }
}

interface Presenca {
  id: string
  presente: boolean
  justificativa: string | null
  parlamentar: {
    id: string
    nome: string
    apelido: string | null
    partido: string | null
  }
}

interface VotacaoRegistro {
  id: string
  voto: 'SIM' | 'NAO' | 'ABSTENCAO' | 'AUSENTE'
  parlamentar: {
    id: string
    nome: string
    apelido: string | null
  }
}

function PainelPublicoContent() {
  const searchParams = useSearchParams()
  const sessaoIdParam = searchParams.get('sessaoId')

  const [sessao, setSessao] = useState<Sessao | null>(null)
  const [presencas, setPresencas] = useState<Presenca[]>([])
  const [votacoes, setVotacoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [tempoSessao, setTempoSessao] = useState(0)
  const [itemAtualIndex, setItemAtualIndex] = useState(0) // Índice do item sendo visualizado

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Calcular tempo da sessão (apenas se em andamento)
  useEffect(() => {
    if (sessao?.tempoInicio && sessao.status === 'EM_ANDAMENTO') {
      const interval = setInterval(() => {
        const inicio = new Date(sessao.tempoInicio!)
        const agora = new Date()
        const diff = Math.floor((agora.getTime() - inicio.getTime()) / 1000)
        setTempoSessao(diff > 0 ? diff : 0)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [sessao?.tempoInicio, sessao?.status])

  // Carregar dados da sessão
  const carregarDados = useCallback(async (isInitialLoad = false) => {
    try {
      // Só mostrar loading na carga inicial
      if (isInitialLoad) {
        setLoading(true)
      }
      setError(null)

      let sessaoId = sessaoIdParam

      // Se não tem sessaoId, buscar sessão em andamento ou a mais recente via API pública
      if (!sessaoId) {
        // Usar dados-abertos que é público
        const response = await fetch('/api/dados-abertos/sessoes')
        const data = await response.json()

        if (data.dados && data.dados.length > 0) {
          // Primeiro tenta encontrar sessão em andamento
          const sessaoEmAndamento = data.dados.find((s: any) => s.status === 'EM_ANDAMENTO')
          if (sessaoEmAndamento) {
            sessaoId = sessaoEmAndamento.id
          } else {
            // Senão usa a primeira (mais recente)
            sessaoId = data.dados[0].id
          }
        }
      }

      if (!sessaoId) {
        setError('Nenhuma sessão disponível')
        setLoading(false)
        return
      }

      // Carregar dados da sessão usando endpoints públicos
      const [sessaoRes, presencaRes, votacaoRes] = await Promise.all([
        fetch(`/api/painel/sessao-completa?sessaoId=${sessaoId}`),
        fetch(`/api/sessoes/${sessaoId}/presenca`),
        fetch(`/api/sessoes/${sessaoId}/votacao`)
      ])

      const sessaoData = await sessaoRes.json()
      const presencaData = await presencaRes.json()
      const votacaoData = await votacaoRes.json()

      if (sessaoData.success && sessaoData.data) {
        setSessao(sessaoData.data)
        // Extrair presenças da sessão completa (já vem incluído com todos os parlamentares)
        if (sessaoData.data.presencas && sessaoData.data.presencas.length > 0) {
          setPresencas(sessaoData.data.presencas)
        } else if (presencaData.success && presencaData.data && presencaData.data.length > 0) {
          // Fallback para API de presença se sessão-completa não tiver presenças
          setPresencas(presencaData.data)
        }
      }

      if (votacaoData.success && votacaoData.data) {
        setVotacoes(votacaoData.data)
      }

    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      if (!initialLoadDone) {
        setError('Erro ao carregar dados do painel')
      }
    } finally {
      if (!initialLoadDone) {
        setLoading(false)
        setInitialLoadDone(true)
      }
    }
  }, [sessaoIdParam, initialLoadDone])

  // Carregar dados inicialmente e atualizar a cada 10 segundos
  useEffect(() => {
    // Carga inicial com loading
    carregarDados(true)
    // Atualizações periódicas sem loading (silent refresh)
    const interval = setInterval(() => carregarDados(false), 10000)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Formatar tempo
  const formatarTempo = (segundos: number) => {
    const h = Math.floor(segundos / 3600)
    const m = Math.floor((segundos % 3600) / 60)
    const s = segundos % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Obter votações de uma proposição específica
  // Primeiro tenta do estado de votações carregado, depois dos dados embutidos na sessão
  const getVotacoesProposicao = (proposicaoId: string, itemProposicao?: PautaItem['proposicao']) => {
    // Tentar do estado de votações carregado separadamente
    const prop = votacoes.find(v => v.id === proposicaoId)
    if (prop?.votacoes && prop.votacoes.length > 0) {
      return prop.votacoes
    }
    // Se não encontrou, usar votações embutidas na proposição do item
    if (itemProposicao?.votacoes && itemProposicao.votacoes.length > 0) {
      return itemProposicao.votacoes
    }
    return []
  }

  // Calcular estatísticas de votação
  const calcularVotacao = (votos: VotacaoRegistro[] = []) => {
    const sim = votos.filter(v => v.voto === 'SIM').length
    const nao = votos.filter(v => v.voto === 'NAO').length
    const abstencao = votos.filter(v => v.voto === 'ABSTENCAO').length
    const ausente = votos.filter(v => v.voto === 'AUSENTE').length
    const total = sim + nao + abstencao + ausente
    const aprovado = total > 0 && sim > (nao + abstencao)
    return { sim, nao, abstencao, ausente, total, aprovado }
  }

  // Navegação entre itens
  const irParaAnterior = () => {
    if (itemAtualIndex > 0) {
      setItemAtualIndex(itemAtualIndex - 1)
    }
  }

  const irParaProximo = () => {
    const itens = sessao?.pautaSessao?.itens || []
    if (itemAtualIndex < itens.length - 1) {
      setItemAtualIndex(itemAtualIndex + 1)
    }
  }

  // Loading state
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

  // Error state
  if (error || !sessao) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="bg-white/10 backdrop-blur-lg border border-white/20 text-white p-8 max-w-md">
          <CardContent className="text-center">
            <Monitor className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">
              {error || 'Nenhuma sessão disponível'}
            </h2>
            <p className="text-blue-200 mb-6">
              Não há sessões disponíveis no momento.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Dados da sessão
  const itens = sessao.pautaSessao?.itens || []
  const itemAtual = itens[itemAtualIndex] || null
  const totalItens = itens.length
  const sessaoConcluida = sessao.status === 'CONCLUIDA'
  const sessaoEmAndamento = sessao.status === 'EM_ANDAMENTO'

  // Calcular presenças - usar dados do quórum se disponível
  const presentes = presencas.filter(p => p.presente)
  const ausentes = presencas.filter(p => !p.presente)
  const totalParlamentares = sessao.quorum?.total || presencas.length
  const percentualPresenca = sessao.quorum?.percentual ?? (
    totalParlamentares > 0
      ? Math.round((presentes.length / totalParlamentares) * 100)
      : 0
  )

  // Formatar tipo de sessão
  const tipoSessaoLabel = {
    'ORDINARIA': 'Ordinária',
    'EXTRAORDINARIA': 'Extraordinária',
    'SOLENE': 'Solene',
    'ESPECIAL': 'Especial'
  }[sessao.tipo] || sessao.tipo

  // Status da sessão
  const statusConfig = {
    'AGENDADA': { label: 'Agendada', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30', icon: Clock },
    'EM_ANDAMENTO': { label: 'Em Andamento', color: 'bg-green-500/20 text-green-300 border-green-400/30', icon: Timer },
    'CONCLUIDA': { label: 'Sessão Finalizada', color: 'bg-blue-500/20 text-blue-300 border-blue-400/30', icon: Flag },
    'CANCELADA': { label: 'Cancelada', color: 'bg-red-500/20 text-red-300 border-red-400/30', icon: XCircle }
  }[sessao.status] || { label: sessao.status, color: 'bg-gray-500/20 text-gray-300', icon: AlertCircle }

  // Votações do item atual
  const votacoesItemAtual = itemAtual?.proposicao
    ? getVotacoesProposicao(itemAtual.proposicao.id, itemAtual.proposicao)
    : []
  const estatisticasVotacao = calcularVotacao(votacoesItemAtual)

  return (
    <>
      {/* Header do Painel */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/20 shadow-2xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                  <Monitor className="h-6 w-6 text-white" />
                </div>
                {sessaoEmAndamento && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                )}
                {sessaoConcluida && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full"></div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {sessao.numero}ª Sessão {tipoSessaoLabel} - {new Date(sessao.data).getFullYear()}
                </h1>
                <p className="text-blue-200">Câmara Municipal de Mojuí dos Campos</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center rounded-full font-semibold text-base px-4 py-2 border mb-2 ${statusConfig.color}`}>
                {sessaoEmAndamento && (
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                )}
                {sessaoConcluida && (
                  <Flag className="h-4 w-4 mr-2" />
                )}
                {statusConfig.label.toUpperCase()}
              </div>
              <div className="flex items-center gap-4 text-sm text-blue-300 flex-wrap justify-end">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(sessao.data).toLocaleDateString('pt-BR')}
                </div>
                {sessao.horario && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {sessao.horario}
                  </div>
                )}
                {sessaoEmAndamento && (
                  <div className="flex items-center gap-1 text-green-300 font-mono text-lg">
                    <Timer className="h-5 w-5" />
                    {formatarTempo(tempoSessao)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Banner de Votação em Andamento */}
      {sessaoEmAndamento && itemAtual?.status === 'EM_VOTACAO' && (
        <div className="bg-gradient-to-r from-orange-600/40 to-red-600/40 border-b border-orange-400/50 px-6 py-6 animate-pulse">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <Vote className="h-8 w-8 text-orange-300" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
              </div>
              <h2 className="text-3xl font-bold text-white tracking-wider">
                VOTAÇÃO EM ANDAMENTO
              </h2>
              <div className="relative">
                <Vote className="h-8 w-8 text-orange-300" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
              </div>
            </div>

            {/* Matéria em votação */}
            <div className="text-center mb-4">
              <p className="text-lg text-orange-200">
                {itemAtual.proposicao
                  ? `${itemAtual.proposicao.tipo} nº ${itemAtual.proposicao.numero}/${itemAtual.proposicao.ano}`
                  : itemAtual.titulo
                }
              </p>
              <p className="text-sm text-orange-300 mt-1">
                {itemAtual.proposicao?.titulo || itemAtual.descricao || ''}
              </p>
            </div>

            {/* Contagem de votos em tempo real */}
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-4">
              <div className="bg-green-600/50 rounded-xl p-4 text-center border border-green-400/50">
                <div className="text-4xl font-extrabold text-green-200">{estatisticasVotacao.sim}</div>
                <div className="text-green-300 font-semibold">SIM</div>
              </div>
              <div className="bg-red-600/50 rounded-xl p-4 text-center border border-red-400/50">
                <div className="text-4xl font-extrabold text-red-200">{estatisticasVotacao.nao}</div>
                <div className="text-red-300 font-semibold">NÃO</div>
              </div>
              <div className="bg-yellow-600/50 rounded-xl p-4 text-center border border-yellow-400/50">
                <div className="text-4xl font-extrabold text-yellow-200">{estatisticasVotacao.abstencao}</div>
                <div className="text-yellow-300 font-semibold">ABSTENÇÃO</div>
              </div>
            </div>

            {/* Barra de progresso de quem votou */}
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between text-sm text-orange-200 mb-2">
                <span>Parlamentares que votaram</span>
                <span className="font-bold">{estatisticasVotacao.total} / {presentes.length}</span>
              </div>
              <div className="h-3 bg-gray-700/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-500 relative"
                  style={{ width: `${presentes.length > 0 ? (estatisticasVotacao.total / presentes.length) * 100 : 0}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              {presentes.length > 0 && estatisticasVotacao.total < presentes.length && (
                <p className="text-center text-sm text-orange-300 mt-2">
                  Aguardando {presentes.length - estatisticasVotacao.total} voto(s)...
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Banner de Sessão Concluída com Resumo */}
      {sessaoConcluida && (
        <div className="bg-blue-600/30 border-b border-blue-400/30 px-6 py-4">
          <div className="flex items-center justify-center gap-3 text-blue-200 mb-3">
            <History className="h-5 w-5" />
            <span className="font-medium">
              Esta sessão foi finalizada. Você está visualizando o histórico de votações.
            </span>
          </div>
          {/* Resumo da Sessão */}
          {(() => {
            const itensVotados = itens.filter(i =>
              i.status === 'APROVADO' || i.status === 'REJEITADO' || i.status === 'CONCLUIDO'
            )
            const aprovados = itens.filter(i => i.status === 'APROVADO' || i.status === 'CONCLUIDO').length
            const rejeitados = itens.filter(i => i.status === 'REJEITADO').length
            const adiados = itens.filter(i => i.status === 'ADIADO').length
            const retirados = itens.filter(i => i.status === 'RETIRADO').length
            const vistas = itens.filter(i => i.status === 'VISTA').length

            return (
              <div className="flex items-center justify-center gap-6 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-blue-300">Total na Pauta:</span>
                  <span className="font-bold text-white">{totalItens}</span>
                </div>
                {aprovados > 0 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-green-300">{aprovados} aprovado(s)</span>
                  </div>
                )}
                {rejeitados > 0 && (
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-400" />
                    <span className="text-red-300">{rejeitados} rejeitado(s)</span>
                  </div>
                )}
                {adiados > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-400" />
                    <span className="text-yellow-300">{adiados} adiado(s)</span>
                  </div>
                )}
                {retirados > 0 && (
                  <div className="flex items-center gap-2">
                    <Minus className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">{retirados} retirado(s)</span>
                  </div>
                )}
                {vistas > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-purple-400" />
                    <span className="text-purple-300">{vistas} com vista</span>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Coluna 1: Item Atual / Votação */}
          <div className="xl:col-span-2 space-y-6">

            {/* Navegação entre Itens da Pauta */}
            {totalItens > 0 && (
              <Card className="bg-white/10 backdrop-blur-lg border border-white/20 text-white">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <Button
                      onClick={irParaAnterior}
                      disabled={itemAtualIndex === 0}
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-5 w-5 mr-1" />
                      Anterior
                    </Button>

                    <div className="text-center">
                      <p className="text-sm text-blue-300">Item da Pauta</p>
                      <p className="text-2xl font-bold text-white">
                        {itemAtualIndex + 1} <span className="text-blue-400">de</span> {totalItens}
                      </p>
                    </div>

                    <Button
                      onClick={irParaProximo}
                      disabled={itemAtualIndex >= totalItens - 1}
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
                    >
                      Próximo
                      <ChevronRight className="h-5 w-5 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Item Atual da Pauta */}
            {itemAtual ? (
              <Card className="bg-white/10 backdrop-blur-lg border border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-6 w-6 mr-2 text-blue-400" />
                      Matéria em Pauta
                    </div>
                    <Badge className={
                      itemAtual.status === 'APROVADO' || itemAtual.status === 'CONCLUIDO'
                        ? 'bg-green-600/30 text-green-200 border-green-400/50' :
                      itemAtual.status === 'REJEITADO'
                        ? 'bg-red-600/30 text-red-200 border-red-400/50' :
                      itemAtual.status === 'EM_VOTACAO'
                        ? 'bg-orange-600/30 text-orange-200 border-orange-400/50' :
                      itemAtual.status === 'EM_DISCUSSAO'
                        ? 'bg-yellow-600/30 text-yellow-200 border-yellow-400/50' :
                      itemAtual.status === 'VISTA'
                        ? 'bg-purple-600/30 text-purple-200 border-purple-400/50' :
                      'bg-gray-600/30 text-gray-200 border-gray-400/50'
                    }>
                      {itemAtual.status === 'APROVADO' || itemAtual.status === 'CONCLUIDO' ? 'Aprovado' :
                       itemAtual.status === 'REJEITADO' ? 'Rejeitado' :
                       itemAtual.status === 'EM_VOTACAO' ? 'Em Votação' :
                       itemAtual.status === 'EM_DISCUSSAO' ? 'Em Discussão' :
                       itemAtual.status === 'PENDENTE' ? 'Pendente' :
                       itemAtual.status === 'VISTA' ? 'Vista' :
                       itemAtual.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-6 rounded-xl border border-blue-400/30">
                    <div className="flex items-start justify-between mb-3">
                      <Badge className="bg-blue-600/30 text-blue-200 border-blue-400/50">
                        {itemAtual.secao}
                      </Badge>
                      <span className="text-sm text-blue-300">Item #{itemAtual.ordem}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {itemAtual.proposicao
                        ? `${itemAtual.proposicao.tipo} nº ${itemAtual.proposicao.numero}/${itemAtual.proposicao.ano}`
                        : itemAtual.titulo
                      }
                    </h2>
                    <p className="text-lg text-blue-200">
                      {itemAtual.proposicao?.titulo || itemAtual.descricao || 'Sem descrição'}
                    </p>
                    {itemAtual.proposicao?.autor && (
                      <div className="flex items-center gap-2 mt-4">
                        <User className="h-4 w-4 text-blue-300" />
                        <span className="text-white">
                          Autor: <span className="font-semibold text-blue-300">
                            {itemAtual.proposicao.autor.apelido || itemAtual.proposicao.autor.nome}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/10 backdrop-blur-lg border border-white/20 text-white">
                <CardContent className="py-12 text-center">
                  <ListOrdered className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                  <p className="text-xl text-blue-200">Nenhum item na pauta</p>
                </CardContent>
              </Card>
            )}

            {/* Resultado da Votação do Item */}
            {itemAtual && votacoesItemAtual.length > 0 && (
              <Card className="bg-white/10 backdrop-blur-lg border border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center justify-center">
                    <Vote className="h-6 w-6 mr-2 text-green-400" />
                    Resultado da Votação
                    {estatisticasVotacao.total > 0 && (
                      <Badge className={`ml-3 ${
                        estatisticasVotacao.aprovado
                          ? 'bg-green-600/30 text-green-200 border-green-400/50'
                          : 'bg-red-600/30 text-red-200 border-red-400/50'
                      }`}>
                        {estatisticasVotacao.aprovado ? 'APROVADO' : 'REJEITADO'}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Resultados */}
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="p-4 bg-green-600/30 rounded-xl border border-green-400/30">
                      <div className="text-4xl font-extrabold text-green-300 mb-1">{estatisticasVotacao.sim}</div>
                      <div className="text-lg text-green-200 font-semibold">SIM</div>
                      {estatisticasVotacao.total > 0 && (
                        <div className="text-sm text-green-300 mt-1">
                          {Math.round((estatisticasVotacao.sim / estatisticasVotacao.total) * 100)}%
                        </div>
                      )}
                    </div>
                    <div className="p-4 bg-red-600/30 rounded-xl border border-red-400/30">
                      <div className="text-4xl font-extrabold text-red-300 mb-1">{estatisticasVotacao.nao}</div>
                      <div className="text-lg text-red-200 font-semibold">NÃO</div>
                      {estatisticasVotacao.total > 0 && (
                        <div className="text-sm text-red-300 mt-1">
                          {Math.round((estatisticasVotacao.nao / estatisticasVotacao.total) * 100)}%
                        </div>
                      )}
                    </div>
                    <div className="p-4 bg-yellow-600/30 rounded-xl border border-yellow-400/30">
                      <div className="text-4xl font-extrabold text-yellow-300 mb-1">{estatisticasVotacao.abstencao}</div>
                      <div className="text-lg text-yellow-200 font-semibold">ABST.</div>
                      {estatisticasVotacao.total > 0 && (
                        <div className="text-sm text-yellow-300 mt-1">
                          {Math.round((estatisticasVotacao.abstencao / estatisticasVotacao.total) * 100)}%
                        </div>
                      )}
                    </div>
                    <div className="p-4 bg-gray-600/30 rounded-xl border border-gray-400/30">
                      <div className="text-4xl font-extrabold text-gray-300 mb-1">{estatisticasVotacao.ausente}</div>
                      <div className="text-lg text-gray-200 font-semibold">AUS.</div>
                      {estatisticasVotacao.total > 0 && (
                        <div className="text-sm text-gray-300 mt-1">
                          {Math.round((estatisticasVotacao.ausente / estatisticasVotacao.total) * 100)}%
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Votos Individuais */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <Users className="h-5 w-5 mr-2 text-blue-400" />
                      Votos Individuais
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {votacoesItemAtual.map((voto: VotacaoRegistro) => (
                        <div
                          key={voto.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border ${
                            voto.voto === 'SIM' ? 'bg-green-500/20 border-green-400/30' :
                            voto.voto === 'NAO' ? 'bg-red-500/20 border-red-400/30' :
                            voto.voto === 'ABSTENCAO' ? 'bg-yellow-500/20 border-yellow-400/30' :
                            'bg-gray-500/20 border-gray-400/30'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            voto.voto === 'SIM' ? 'bg-green-600' :
                            voto.voto === 'NAO' ? 'bg-red-600' :
                            voto.voto === 'ABSTENCAO' ? 'bg-yellow-600' :
                            'bg-gray-600'
                          }`}>
                            {voto.voto === 'SIM' && <CheckCircle className="h-4 w-4 text-white" />}
                            {voto.voto === 'NAO' && <XCircle className="h-4 w-4 text-white" />}
                            {voto.voto === 'ABSTENCAO' && <Minus className="h-4 w-4 text-white" />}
                            {voto.voto === 'AUSENTE' && <AlertCircle className="h-4 w-4 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">
                              {voto.parlamentar.apelido || voto.parlamentar.nome.split(' ')[0]}
                            </p>
                            <p className="text-xs text-blue-300">{voto.voto}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mensagem quando não há votação registrada */}
            {itemAtual && votacoesItemAtual.length === 0 && (
              <Card className="bg-white/10 backdrop-blur-lg border border-white/20 text-white">
                <CardContent className="py-8 text-center">
                  <Vote className="h-12 w-12 text-blue-400 mx-auto mb-4 opacity-50" />
                  <p className="text-lg text-blue-200">
                    {itemAtual.proposicao
                      ? 'Nenhuma votação registrada para esta proposição'
                      : 'Este item não possui proposição vinculada para votação'
                    }
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Lista Completa da Pauta */}
            <Card className="bg-white/10 backdrop-blur-lg border border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center">
                  <ListOrdered className="h-6 w-6 mr-2 text-blue-400" />
                  Pauta Completa da Sessão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {itens.length > 0 ? (
                    itens.map((item, index) => (
                      <div
                        key={item.id}
                        onClick={() => setItemAtualIndex(index)}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-white/10 ${
                          index === itemAtualIndex
                            ? 'bg-blue-500/30 border-blue-400/50 ring-2 ring-blue-400/50'
                            : item.status === 'APROVADO' || item.status === 'CONCLUIDO'
                              ? 'bg-green-500/10 border-green-400/30'
                              : item.status === 'REJEITADO'
                                ? 'bg-red-500/10 border-red-400/30'
                                : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          item.status === 'APROVADO' || item.status === 'CONCLUIDO' ? 'bg-green-600 text-white' :
                          item.status === 'REJEITADO' ? 'bg-red-600 text-white' :
                          index === itemAtualIndex ? 'bg-blue-600 text-white' :
                          'bg-white/20 text-white'
                        }`}>
                          {item.status === 'APROVADO' || item.status === 'CONCLUIDO' ? <CheckCircle className="h-4 w-4" /> :
                           item.status === 'REJEITADO' ? <XCircle className="h-4 w-4" /> :
                           index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{item.titulo}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-blue-300">{item.secao}</span>
                            {item.tipoAcao && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                item.tipoAcao === 'VOTACAO' ? 'bg-purple-500/40 text-purple-200' :
                                item.tipoAcao === 'LEITURA' ? 'bg-sky-500/40 text-sky-200' :
                                item.tipoAcao === 'HOMENAGEM' ? 'bg-pink-500/40 text-pink-200' :
                                'bg-gray-500/40 text-gray-200'
                              }`}>
                                {item.tipoAcao === 'VOTACAO' ? '🗳️' : item.tipoAcao === 'LEITURA' ? '📖' : item.tipoAcao === 'HOMENAGEM' ? '🏆' : '📢'} {item.tipoAcao}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge className={`text-xs flex-shrink-0 ${
                          item.status === 'APROVADO' || item.status === 'CONCLUIDO' ? 'bg-green-600/30 text-green-200' :
                          item.status === 'REJEITADO' ? 'bg-red-600/30 text-red-200' :
                          item.status === 'EM_VOTACAO' ? 'bg-orange-600/30 text-orange-200' :
                          item.status === 'EM_DISCUSSAO' ? 'bg-yellow-600/30 text-yellow-200' :
                          item.status === 'VISTA' ? 'bg-purple-600/30 text-purple-200' :
                          'bg-gray-600/30 text-gray-200'
                        }`}>
                          {item.status === 'VISTA' ? 'Vista' : item.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-blue-300 py-8">
                      Nenhum item na pauta
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna 2: Presença e Info */}
          <div className="space-y-6">
            {/* Card de Presença */}
            <Card className="bg-white/10 backdrop-blur-lg border border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center">
                  <Users className="h-6 w-6 mr-2 text-blue-400" />
                  Presença dos Parlamentares
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Estatísticas */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="text-center p-3 bg-green-500/20 rounded-lg border border-green-400/30">
                    <div className="text-2xl font-bold text-green-300">{presentes.length}</div>
                    <div className="text-xs text-green-200">Presentes</div>
                  </div>
                  <div className="text-center p-3 bg-red-500/20 rounded-lg border border-red-400/30">
                    <div className="text-2xl font-bold text-red-300">{ausentes.length}</div>
                    <div className="text-xs text-red-200">Ausentes</div>
                  </div>
                  <div className="text-center p-3 bg-blue-500/20 rounded-lg border border-blue-400/30">
                    <div className="text-2xl font-bold text-blue-300">{percentualPresenca}%</div>
                    <div className="text-xs text-blue-200">Presença</div>
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div className="mb-6">
                  <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                      style={{ width: `${percentualPresenca}%` }}
                    />
                  </div>
                  <p className="text-xs text-center text-blue-300 mt-1">
                    Quórum: {presentes.length}/{totalParlamentares} parlamentares
                  </p>
                </div>

                {/* Lista */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-green-300 mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Presentes ({presentes.length})
                    </h3>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {presentes.map((p) => (
                        <div key={p.id} className="flex items-center gap-2 p-2 bg-green-500/10 rounded border border-green-400/20">
                          <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-3.5 w-3.5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {p.parlamentar.apelido || p.parlamentar.nome}
                            </p>
                            <p className="text-xs text-green-300">{p.parlamentar.partido || '-'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {ausentes.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-red-300 mb-2 flex items-center">
                        <XCircle className="h-4 w-4 mr-1" />
                        Ausentes ({ausentes.length})
                      </h3>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {ausentes.map((p) => (
                          <div key={p.id} className="flex items-center gap-2 p-2 bg-red-500/10 rounded border border-red-400/20">
                            <div className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="h-3.5 w-3.5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {p.parlamentar.apelido || p.parlamentar.nome}
                              </p>
                              <p className="text-xs text-red-300">
                                {p.justificativa || p.parlamentar.partido || '-'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Informações da Sessão */}
            <Card className="bg-white/10 backdrop-blur-lg border border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-400" />
                  Informações da Sessão
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-blue-300">Status</span>
                  <Badge className={statusConfig.color}>
                    {statusConfig.label}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-blue-300">Tipo</span>
                  <span className="font-medium">{tipoSessaoLabel}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-blue-300">Data</span>
                  <span className="font-medium">{new Date(sessao.data).toLocaleDateString('pt-BR')}</span>
                </div>
                {sessao.horario && (
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-blue-300">Horário</span>
                    <span className="font-medium">{sessao.horario}</span>
                  </div>
                )}
                {sessao.local && (
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-blue-300">Local</span>
                    <span className="font-medium text-sm">{sessao.local}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-blue-300">Itens na Pauta</span>
                  <span className="font-medium">{totalItens}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-blue-300">Hora Atual</span>
                  <span className="font-mono font-medium">
                    {currentTime.toLocaleTimeString('pt-BR')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

// Loading fallback para o Suspense
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-xl">Carregando painel público...</p>
      </div>
    </div>
  )
}

// Componente principal com Suspense boundary
export default function PainelPublicoPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PainelPublicoContent />
    </Suspense>
  )
}
