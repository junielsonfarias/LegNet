'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  FileText,
  Vote,
  CheckCircle,
  XCircle,
  Minus,
  AlertCircle,
  Play,
  Square,
  History,
  Eye,
  Printer,
  Download
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
  legislatura?: {
    numero: number
    anoInicio: number
    anoFim: number
  }
  periodo?: {
    numero: number
  }
  presencas?: Array<{
    id: string
    presente: boolean
    justificativa: string | null
    parlamentar: {
      id: string
      nome: string
      apelido: string | null
      partido: string | null
    }
  }>
  pautaSessao?: {
    id: string
    status: string
    tempoTotalReal: number | null
    itens: Array<{
      id: string
      titulo: string
      descricao: string | null
      secao: string
      ordem: number
      status: string
      iniciadoEm: string | null
      finalizadoEm: string | null
      tempoAcumulado: number
      tempoReal: number | null
      proposicao?: {
        id: string
        numero: number
        ano: number
        tipo: string
        titulo: string
        status: string
        resultado: string | null
        votacoes?: Array<{
          id: string
          voto: string
          parlamentar: {
            id: string
            nome: string
            apelido: string | null
          }
        }>
      }
    }>
  }
}

const formatarTempo = (segundos: number) => {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = segundos % 60
  if (h > 0) {
    return `${h}h ${m}min ${s}s`
  }
  if (m > 0) {
    return `${m}min ${s}s`
  }
  return `${s}s`
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'APROVADO':
    case 'CONCLUIDO':
      return 'bg-green-100 text-green-700'
    case 'REJEITADO':
      return 'bg-red-100 text-red-700'
    case 'ADIADO':
      return 'bg-orange-100 text-orange-700'
    case 'RETIRADO':
      return 'bg-yellow-100 text-yellow-700'
    case 'VISTA':
      return 'bg-violet-100 text-violet-700'
    case 'EM_DISCUSSAO':
      return 'bg-blue-100 text-blue-700'
    case 'EM_VOTACAO':
      return 'bg-purple-100 text-purple-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'APROVADO':
      return 'Aprovado'
    case 'CONCLUIDO':
      return 'Concluído'
    case 'REJEITADO':
      return 'Rejeitado'
    case 'ADIADO':
      return 'Adiado'
    case 'RETIRADO':
      return 'Retirado'
    case 'VISTA':
      return 'Com Vista'
    case 'PENDENTE':
      return 'Pendente'
    case 'EM_DISCUSSAO':
      return 'Em Discussão'
    case 'EM_VOTACAO':
      return 'Em Votação'
    default:
      return status
  }
}

export default function HistoricoSessaoPage() {
  const params = useParams()
  const sessaoId = params?.id as string

  const [sessao, setSessao] = useState<Sessao | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessaoId) return

    const carregarDados = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/painel/sessao-completa?sessaoId=${sessaoId}`)
        const data = await response.json()

        if (data.success && data.data) {
          setSessao(data.data)
        } else {
          setError('Sessão não encontrada')
        }
      } catch (err) {
        console.error('Erro ao carregar histórico:', err)
        setError('Erro ao carregar dados da sessão')
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [sessaoId])

  const imprimirHistorico = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="text-gray-600">Carregando histórico...</p>
        </div>
      </div>
    )
  }

  if (error || !sessao) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <p className="mb-4 text-red-600">{error || 'Sessão não encontrada'}</p>
            <Button asChild>
              <Link href="/admin/sessoes-legislativas">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const tipoSessaoLabel = {
    'ORDINARIA': 'Ordinária',
    'EXTRAORDINARIA': 'Extraordinária',
    'SOLENE': 'Solene',
    'ESPECIAL': 'Especial'
  }[sessao.tipo] || sessao.tipo

  const presentes = sessao.presencas?.filter(p => p.presente) || []
  const ausentes = sessao.presencas?.filter(p => !p.presente) || []
  const itens = sessao.pautaSessao?.itens || []

  // Criar timeline de eventos
  const eventos: Array<{
    tipo: string
    data: Date
    descricao: string
    detalhes?: string
    cor: string
    icone: React.ReactNode
  }> = []

  // Início da sessão
  if (sessao.tempoInicio) {
    eventos.push({
      tipo: 'inicio',
      data: new Date(sessao.tempoInicio),
      descricao: 'Sessão iniciada',
      cor: 'bg-green-500',
      icone: <Play className="h-4 w-4 text-white" />
    })
  }

  // Eventos de cada item
  itens.forEach(item => {
    if (item.iniciadoEm) {
      eventos.push({
        tipo: 'item_inicio',
        data: new Date(item.iniciadoEm),
        descricao: `Item iniciado: ${item.titulo}`,
        detalhes: item.proposicao ? `${item.proposicao.tipo} ${item.proposicao.numero}/${item.proposicao.ano}` : undefined,
        cor: 'bg-blue-500',
        icone: <FileText className="h-4 w-4 text-white" />
      })
    }

    if (item.finalizadoEm) {
      eventos.push({
        tipo: 'item_fim',
        data: new Date(item.finalizadoEm),
        descricao: `Item ${getStatusLabel(item.status).toLowerCase()}: ${item.titulo}`,
        detalhes: item.tempoReal ? `Duração: ${formatarTempo(item.tempoReal)}` : undefined,
        cor: item.status === 'APROVADO' || item.status === 'CONCLUIDO'
          ? 'bg-green-500'
          : item.status === 'REJEITADO'
            ? 'bg-red-500'
            : 'bg-gray-500',
        icone: item.status === 'APROVADO' || item.status === 'CONCLUIDO'
          ? <CheckCircle className="h-4 w-4 text-white" />
          : item.status === 'REJEITADO'
            ? <XCircle className="h-4 w-4 text-white" />
            : <Minus className="h-4 w-4 text-white" />
      })
    }
  })

  // Ordenar eventos por data
  eventos.sort((a, b) => a.data.getTime() - b.data.getTime())

  return (
    <div className="min-h-screen bg-gray-50 p-6 print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 print:hidden">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline">
              <Link href="/admin/sessoes-legislativas">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold">
                <History className="h-6 w-6 text-blue-600" />
                Histórico da Sessão
              </h1>
              <p className="text-gray-600">
                {sessao.numero}ª Sessão {tipoSessaoLabel}
              </p>
            </div>
          </div>
          <Button onClick={imprimirHistorico} variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>

        {/* Info da Sessão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Informações da Sessão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Data</p>
                <p className="font-medium">
                  {new Date(sessao.data).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Horário</p>
                <p className="font-medium">{sessao.horario || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Local</p>
                <p className="font-medium">{sessao.local || 'Plenário'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Duração Total</p>
                <p className="font-medium">
                  {sessao.pautaSessao?.tempoTotalReal
                    ? formatarTempo(sessao.pautaSessao.tempoTotalReal)
                    : 'Não registrado'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Presenças */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Presenças ({presentes.length}/{sessao.presencas?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-green-700 mb-2 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Presentes ({presentes.length})
                </h3>
                <ul className="space-y-1">
                  {presentes.map(p => (
                    <li key={p.id} className="text-sm flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      {p.parlamentar.apelido || p.parlamentar.nome}
                      {p.parlamentar.partido && (
                        <span className="text-gray-500">({p.parlamentar.partido})</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-red-700 mb-2 flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  Ausentes ({ausentes.length})
                </h3>
                <ul className="space-y-1">
                  {ausentes.map(p => (
                    <li key={p.id} className="text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        {p.parlamentar.apelido || p.parlamentar.nome}
                      </div>
                      {p.justificativa && (
                        <p className="text-xs text-gray-500 ml-4">{p.justificativa}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline de Eventos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Timeline da Sessão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Linha vertical */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

              <div className="space-y-4">
                {eventos.map((evento, index) => (
                  <div key={index} className="relative flex items-start gap-4 pl-10">
                    {/* Marcador */}
                    <div className={`absolute left-2 w-5 h-5 rounded-full ${evento.cor} flex items-center justify-center`}>
                      {evento.icone}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{evento.descricao}</p>
                        <span className="text-xs text-gray-500">
                          {evento.data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {evento.detalhes && (
                        <p className="text-sm text-gray-600 mt-1">{evento.detalhes}</p>
                      )}
                    </div>
                  </div>
                ))}

                {eventos.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    Nenhum evento registrado para esta sessão
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Matérias e Votações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5 text-blue-600" />
              Matérias Apreciadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {itens.filter(item => item.proposicao).map((item, index) => {
              const votacoes = item.proposicao?.votacoes || []
              const votosSim = votacoes.filter(v => v.voto === 'SIM')
              const votosNao = votacoes.filter(v => v.voto === 'NAO')
              const votosAbstencao = votacoes.filter(v => v.voto === 'ABSTENCAO')

              return (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getStatusBadge(item.status)}>
                          {getStatusLabel(item.status)}
                        </Badge>
                        <span className="text-sm text-gray-500">Item {item.ordem}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        {item.proposicao?.tipo} Nº {item.proposicao?.numero}/{item.proposicao?.ano}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.proposicao?.titulo}
                      </p>
                    </div>
                    {item.tempoReal && (
                      <div className="text-right text-sm text-gray-500">
                        <Clock className="h-4 w-4 inline mr-1" />
                        {formatarTempo(item.tempoReal)}
                      </div>
                    )}
                  </div>

                  {/* Resultado da Votação */}
                  {votacoes.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Votação Nominal</h4>
                      <div className="grid grid-cols-3 gap-2 text-center mb-3">
                        <div className="bg-green-50 rounded p-2">
                          <div className="text-2xl font-bold text-green-700">{votosSim.length}</div>
                          <div className="text-xs text-green-600">SIM</div>
                        </div>
                        <div className="bg-red-50 rounded p-2">
                          <div className="text-2xl font-bold text-red-700">{votosNao.length}</div>
                          <div className="text-xs text-red-600">NÃO</div>
                        </div>
                        <div className="bg-yellow-50 rounded p-2">
                          <div className="text-2xl font-bold text-yellow-700">{votosAbstencao.length}</div>
                          <div className="text-xs text-yellow-600">ABSTENÇÃO</div>
                        </div>
                      </div>

                      <div className="text-xs space-y-1">
                        {votosSim.length > 0 && (
                          <p>
                            <span className="font-medium text-green-700">SIM:</span>{' '}
                            {votosSim.map(v => v.parlamentar.apelido || v.parlamentar.nome.split(' ')[0]).join(', ')}
                          </p>
                        )}
                        {votosNao.length > 0 && (
                          <p>
                            <span className="font-medium text-red-700">NÃO:</span>{' '}
                            {votosNao.map(v => v.parlamentar.apelido || v.parlamentar.nome.split(' ')[0]).join(', ')}
                          </p>
                        )}
                        {votosAbstencao.length > 0 && (
                          <p>
                            <span className="font-medium text-yellow-700">ABSTENÇÃO:</span>{' '}
                            {votosAbstencao.map(v => v.parlamentar.apelido || v.parlamentar.nome.split(' ')[0]).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {itens.filter(item => item.proposicao).length === 0 && (
              <p className="text-center text-gray-500 py-4">
                Nenhuma proposição vinculada aos itens desta sessão
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
