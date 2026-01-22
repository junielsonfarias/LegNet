'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Vote,
  CheckCircle,
  XCircle,
  MinusCircle,
  Loader2,
  AlertCircle,
  FileText,
  Clock,
  Users,
  Timer,
  ListOrdered,
  MessageSquare,
  BookOpen,
  User
} from 'lucide-react'
import { toast } from 'sonner'
import { sessoesApi } from '@/lib/api/sessoes-api'

interface PautaItem {
  id: string
  titulo: string
  descricao: string | null
  secao: string
  ordem: number
  status: string
  proposicao?: {
    id: string
    numero: number
    ano: number
    titulo: string
    tipo: string
    status: string
    ementa?: string
    autor?: {
      nome: string
      apelido: string | null
    }
  }
}

interface SessaoCompleta {
  id: string
  numero: number
  tipo: string
  data: string
  horario: string | null
  status: string
  tempoInicio: string | null
  pautaSessao?: {
    itens: PautaItem[]
  }
}

export default function VotacaoParlamentarPage() {
  const sessionData = useSession()
  const session = sessionData?.data
  const status = sessionData?.status ?? 'loading'

  const [sessaoAtiva, setSessaoAtiva] = useState<SessaoCompleta | null>(null)
  const [loading, setLoading] = useState(true)
  const [votando, setVotando] = useState(false)
  const [presencaConfirmada, setPresencaConfirmada] = useState(false)
  const [votoRegistrado, setVotoRegistrado] = useState<string | null>(null)
  const [tempoSessao, setTempoSessao] = useState(0)

  // Timer da sessão
  useEffect(() => {
    if (sessaoAtiva?.tempoInicio && sessaoAtiva.status === 'EM_ANDAMENTO') {
      const interval = setInterval(() => {
        const inicio = new Date(sessaoAtiva.tempoInicio!)
        const agora = new Date()
        const diff = Math.floor((agora.getTime() - inicio.getTime()) / 1000)
        setTempoSessao(diff > 0 ? diff : 0)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [sessaoAtiva?.tempoInicio, sessaoAtiva?.status])

  const formatarTempo = (segundos: number) => {
    const h = Math.floor(segundos / 3600)
    const m = Math.floor((segundos % 3600) / 60)
    const s = segundos % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const carregarDados = useCallback(async () => {
    try {
      // Buscar sessão em andamento
      const { data: sessoes } = await sessoesApi.getAll()
      const sessaoEmAndamento = sessoes.find(s => s.status === 'EM_ANDAMENTO')

      if (!sessaoEmAndamento) {
        setSessaoAtiva(null)
        setLoading(false)
        return
      }

      // Buscar dados completos da sessão incluindo pauta
      const sessaoResponse = await fetch(`/api/sessoes/${sessaoEmAndamento.id}`)
      const sessaoData = await sessaoResponse.json()

      if (sessaoData.success && sessaoData.data) {
        setSessaoAtiva(sessaoData.data)
      }

      // Verificar presença do parlamentar
      const parlamentarId = (session?.user as any)?.parlamentarId
      if (parlamentarId) {
        const presencaResponse = await fetch(`/api/sessoes/${sessaoEmAndamento.id}/presenca`)
        if (presencaResponse.ok) {
          const { data: presencas } = await presencaResponse.json()
          const presenca = presencas.find((p: any) => p.parlamentarId === parlamentarId)
          setPresencaConfirmada(presenca?.presente || false)
        }

        // Verificar se já votou na proposição em votação
        const itemEmVotacao = sessaoData.data?.pautaSessao?.itens?.find(
          (item: PautaItem) => item.status === 'EM_VOTACAO' && item.proposicao
        )

        if (itemEmVotacao?.proposicao) {
          const votacaoResponse = await fetch(`/api/sessoes/${sessaoEmAndamento.id}/votacao`)
          if (votacaoResponse.ok) {
            const { data: proposicoesVotacao } = await votacaoResponse.json()
            const proposicaoComVotos = proposicoesVotacao.find(
              (p: any) => p.id === itemEmVotacao.proposicao!.id
            )
            if (proposicaoComVotos) {
              const voto = proposicaoComVotos.votacoes?.find(
                (v: any) => v.parlamentarId === parlamentarId
              )
              setVotoRegistrado(voto?.voto || null)
            } else {
              setVotoRegistrado(null)
            }
          }
        } else {
          setVotoRegistrado(null)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados da sessão')
    } finally {
      setLoading(false)
    }
  }, [session?.user])

  // Carregar dados inicialmente e atualizar a cada 5 segundos
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      carregarDados()
      const interval = setInterval(carregarDados, 5000)
      return () => clearInterval(interval)
    }
  }, [carregarDados, session?.user, status])

  const registrarVoto = async (voto: 'SIM' | 'NAO' | 'ABSTENCAO') => {
    const itemEmVotacao = sessaoAtiva?.pautaSessao?.itens?.find(
      item => item.status === 'EM_VOTACAO' && item.proposicao
    )

    if (!sessaoAtiva || !itemEmVotacao?.proposicao) return

    try {
      setVotando(true)

      const parlamentarId = (session?.user as any)?.parlamentarId

      if (!parlamentarId) {
        toast.error('Parlamentar não identificado. Verifique se seu usuário está vinculado a um parlamentar.')
        return
      }

      const response = await fetch(`/api/sessoes/${sessaoAtiva.id}/votacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposicaoId: itemEmVotacao.proposicao.id,
          parlamentarId,
          voto
        })
      })

      if (response.ok) {
        setVotoRegistrado(voto)
        toast.success('Voto registrado com sucesso!')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao registrar voto')
      }
    } catch (error) {
      console.error('Erro ao registrar voto:', error)
      toast.error('Erro ao registrar voto')
    } finally {
      setVotando(false)
    }
  }

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // Não autenticado
  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Você precisa estar logado para acessar esta página</p>
            <Button asChild>
              <a href="/admin/login">Fazer Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Nenhuma sessão em andamento
  if (!sessaoAtiva) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhuma Sessão em Andamento
            </h3>
            <p className="text-gray-600">
              Não há sessões legislativas em andamento no momento.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Presença não confirmada
  if (!presencaConfirmada) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Users className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Presença Não Confirmada
            </h3>
            <p className="text-gray-600 mb-4">
              Sua presença ainda não foi confirmada pelo operador da sessão.
            </p>
            <p className="text-sm text-gray-500">
              Aguarde a confirmação de presença para acessar a pauta e votar nas proposições.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Aguardando confirmação...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Dados da pauta
  const itens = sessaoAtiva.pautaSessao?.itens || []
  const itemEmAndamento = itens.find(
    item => item.status === 'EM_DISCUSSAO' || item.status === 'EM_VOTACAO'
  )

  // Tela de espera escura quando não há item em andamento
  if (!itemEmAndamento) {
    const itensRestantes = itens.filter(item => item.status === 'PENDENTE').length
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-lg">
          <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mx-auto">
            <Clock className="h-12 w-12 text-slate-400 animate-pulse" />
          </div>
          <h1 className="text-white text-3xl md:text-4xl font-semibold">
            Aguardando Matéria
          </h1>
          <p className="text-slate-400 text-lg">
            Nenhuma matéria em votação no momento.
          </p>
          <div className="pt-4 border-t border-slate-800">
            <p className="text-slate-500 text-sm">
              {sessaoAtiva.numero}ª Sessão {
                { ORDINARIA: 'Ordinária', EXTRAORDINARIA: 'Extraordinária', SOLENE: 'Solene', ESPECIAL: 'Especial' }[sessaoAtiva.tipo] || sessaoAtiva.tipo
              }
            </p>
            {itensRestantes > 0 && (
              <p className="text-slate-500 text-sm mt-2">
                {itensRestantes} {itensRestantes === 1 ? 'item restante' : 'itens restantes'} na pauta
              </p>
            )}
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm pt-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Atualizando automaticamente...
          </div>
        </div>
      </div>
    )
  }

  // Formatar tipo de sessão
  const tipoSessaoLabel = {
    'ORDINARIA': 'Ordinária',
    'EXTRAORDINARIA': 'Extraordinária',
    'SOLENE': 'Solene',
    'ESPECIAL': 'Especial'
  }[sessaoAtiva.tipo] || sessaoAtiva.tipo

  // Função para obter ícone do status
  const getStatusIcon = (itemStatus: string) => {
    switch (itemStatus) {
      case 'APROVADO':
      case 'CONCLUIDO':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'REJEITADO':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'EM_VOTACAO':
        return <Vote className="h-4 w-4 text-orange-500" />
      case 'EM_DISCUSSAO':
        return <MessageSquare className="h-4 w-4 text-yellow-500" />
      case 'ADIADO':
        return <Clock className="h-4 w-4 text-gray-500" />
      default:
        return <BookOpen className="h-4 w-4 text-gray-400" />
    }
  }

  // Função para obter cor do badge de status
  const getStatusBadgeClass = (itemStatus: string) => {
    switch (itemStatus) {
      case 'APROVADO':
      case 'CONCLUIDO':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'REJEITADO':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'EM_VOTACAO':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'EM_DISCUSSAO':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'ADIADO':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      default:
        return 'bg-slate-100 text-slate-600 border-slate-300'
    }
  }

  // Função para formatar label do status
  const getStatusLabel = (itemStatus: string) => {
    const labels: Record<string, string> = {
      'PENDENTE': 'Aguardando',
      'EM_DISCUSSAO': 'Em Discussão',
      'EM_VOTACAO': 'Em Votação',
      'APROVADO': 'Aprovado',
      'REJEITADO': 'Rejeitado',
      'CONCLUIDO': 'Concluído',
      'ADIADO': 'Adiado',
      'RETIRADO': 'Retirado'
    }
    return labels[itemStatus] || itemStatus
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header da Sessão */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Vote className="h-6 w-6 text-blue-600" />
                {sessaoAtiva.numero}ª Sessão {tipoSessaoLabel}
              </CardTitle>
              <Badge className="bg-green-100 text-green-800 border border-green-300">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Em Andamento
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {new Date(sessaoAtiva.data).toLocaleDateString('pt-BR')}
                  {sessaoAtiva.horario && ` às ${sessaoAtiva.horario}`}
                </span>
              </div>
              {sessaoAtiva.tempoInicio && (
                <div className="flex items-center gap-1 text-blue-600 font-mono font-medium">
                  <Timer className="h-4 w-4" />
                  {formatarTempo(tempoSessao)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card de Votação (quando há item em votação) */}
        {itemEmAndamento?.status === 'EM_VOTACAO' && itemEmAndamento.proposicao && (
          <Card className="border-2 border-orange-400 bg-orange-50">
            <CardHeader className="bg-orange-100 border-b border-orange-200">
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Vote className="h-6 w-6" />
                VOTAÇÃO EM ANDAMENTO
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-blue-600 text-white">
                    {itemEmAndamento.proposicao.tipo.replace('_', ' ')}
                  </Badge>
                  <span className="font-bold text-lg">
                    nº {itemEmAndamento.proposicao.numero}/{itemEmAndamento.proposicao.ano}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {itemEmAndamento.proposicao.titulo}
                </h3>
                {itemEmAndamento.proposicao.ementa && (
                  <p className="text-gray-700 mb-3">
                    {itemEmAndamento.proposicao.ementa}
                  </p>
                )}
                {itemEmAndamento.proposicao.autor && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <strong>Autor:</strong>
                    {itemEmAndamento.proposicao.autor.apelido || itemEmAndamento.proposicao.autor.nome}
                  </div>
                )}
              </div>

              {/* Opções de Voto */}
              {votoRegistrado ? (
                <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    Voto Registrado
                  </h3>
                  <Badge className={`text-lg px-4 py-2 ${
                    votoRegistrado === 'SIM' ? 'bg-green-600' :
                    votoRegistrado === 'NAO' ? 'bg-red-600' :
                    'bg-yellow-600'
                  } text-white`}>
                    {votoRegistrado === 'SIM' && <CheckCircle className="h-5 w-5 mr-2 inline" />}
                    {votoRegistrado === 'NAO' && <XCircle className="h-5 w-5 mr-2 inline" />}
                    {votoRegistrado === 'ABSTENCAO' && <MinusCircle className="h-5 w-5 mr-2 inline" />}
                    {votoRegistrado === 'NAO' ? 'NÃO' : votoRegistrado === 'ABSTENCAO' ? 'ABSTENÇÃO' : votoRegistrado}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-3">
                    Você pode alterar seu voto antes do encerramento da votação.
                  </p>
                  <Button
                    onClick={() => setVotoRegistrado(null)}
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    disabled={votando}
                  >
                    Alterar Voto
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-center font-semibold text-gray-700">
                    Selecione sua opção de voto:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      onClick={() => registrarVoto('SIM')}
                      disabled={votando}
                      className="bg-green-600 hover:bg-green-700 text-white h-20 text-lg"
                      size="lg"
                    >
                      <CheckCircle className="h-6 w-6 mr-2" />
                      SIM
                    </Button>
                    <Button
                      onClick={() => registrarVoto('NAO')}
                      disabled={votando}
                      className="bg-red-600 hover:bg-red-700 text-white h-20 text-lg"
                      size="lg"
                    >
                      <XCircle className="h-6 w-6 mr-2" />
                      NÃO
                    </Button>
                    <Button
                      onClick={() => registrarVoto('ABSTENCAO')}
                      disabled={votando}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white h-20 text-lg"
                      size="lg"
                    >
                      <MinusCircle className="h-6 w-6 mr-2" />
                      ABSTENÇÃO
                    </Button>
                  </div>
                  {votando && (
                    <div className="text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
                      <p className="text-sm text-gray-600 mt-2">Registrando voto...</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Card de Discussão (quando há item em discussão) */}
        {itemEmAndamento?.status === 'EM_DISCUSSAO' && (
          <Card className="border-2 border-yellow-400 bg-yellow-50">
            <CardHeader className="bg-yellow-100 border-b border-yellow-200">
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <MessageSquare className="h-6 w-6" />
                ITEM EM DISCUSSÃO
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="bg-white p-4 rounded-lg border border-yellow-200">
                {itemEmAndamento.proposicao ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-blue-600 text-white">
                        {itemEmAndamento.proposicao.tipo.replace('_', ' ')}
                      </Badge>
                      <span className="font-bold text-lg">
                        nº {itemEmAndamento.proposicao.numero}/{itemEmAndamento.proposicao.ano}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {itemEmAndamento.proposicao.titulo}
                    </h3>
                    {itemEmAndamento.proposicao.ementa && (
                      <p className="text-gray-700 mb-3">
                        {itemEmAndamento.proposicao.ementa}
                      </p>
                    )}
                    {itemEmAndamento.proposicao.autor && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <strong>Autor:</strong>
                        {itemEmAndamento.proposicao.autor.apelido || itemEmAndamento.proposicao.autor.nome}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {itemEmAndamento.titulo}
                    </h3>
                    {itemEmAndamento.descricao && (
                      <p className="text-gray-700">
                        {itemEmAndamento.descricao}
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className="mt-4 p-3 bg-yellow-100 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800 text-center">
                  <MessageSquare className="h-4 w-4 inline mr-1" />
                  Aguarde o início da votação para registrar seu voto
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ordem do Dia - Lista Completa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListOrdered className="h-5 w-5 text-blue-600" />
              Ordem do Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {itens.length > 0 ? (
              <div className="space-y-2">
                {itens.map((item, index) => {
                  const isAtivo = item.status === 'EM_DISCUSSAO' || item.status === 'EM_VOTACAO'
                  return (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                        isAtivo
                          ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                          : item.status === 'APROVADO' || item.status === 'CONCLUIDO'
                            ? 'bg-green-50 border-green-200'
                            : item.status === 'REJEITADO'
                              ? 'bg-red-50 border-red-200'
                              : 'bg-white border-gray-200'
                      }`}
                    >
                      {/* Número do item */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        isAtivo ? 'bg-blue-600 text-white' :
                        item.status === 'APROVADO' || item.status === 'CONCLUIDO' ? 'bg-green-600 text-white' :
                        item.status === 'REJEITADO' ? 'bg-red-600 text-white' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {item.status === 'APROVADO' || item.status === 'CONCLUIDO'
                          ? <CheckCircle className="h-4 w-4" />
                          : item.status === 'REJEITADO'
                            ? <XCircle className="h-4 w-4" />
                            : index + 1
                        }
                      </div>

                      {/* Conteúdo do item */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className={`font-medium ${isAtivo ? 'text-blue-900' : 'text-gray-900'}`}>
                              {item.proposicao
                                ? `${item.proposicao.tipo} nº ${item.proposicao.numero}/${item.proposicao.ano}`
                                : item.titulo
                              }
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {item.proposicao?.titulo || item.descricao || '-'}
                            </p>
                            {item.proposicao?.autor && (
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {item.proposicao.autor.apelido || item.proposicao.autor.nome}
                              </p>
                            )}
                          </div>
                          <Badge className={`flex-shrink-0 border ${getStatusBadgeClass(item.status)}`}>
                            {getStatusIcon(item.status)}
                            <span className="ml-1">{getStatusLabel(item.status)}</span>
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{item.secao}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum item na pauta desta sessão</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações */}
        <Card>
          <CardContent className="pt-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                <strong>Acompanhamento em tempo real:</strong> Esta página atualiza automaticamente a cada 5 segundos.
                Quando uma proposição entrar em votação, os botões de voto serão exibidos automaticamente.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
